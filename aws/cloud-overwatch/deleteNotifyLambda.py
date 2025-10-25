import boto3
import json
import datetime
import os
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError

# AWS Clients
dynamo = boto3.resource("dynamodb", region_name="ap-south-1")
sts = boto3.client("sts")
sns = boto3.client("sns", region_name="ap-south-1")

# Environment variables
RESULTS_TABLE = os.getenv("RESULTS_TABLE", "AccountScanResults")
ACCOUNTS_TABLE = os.getenv("ACCOUNTS_TABLE", "ConnectedAccounts")
SNS_TOPIC_ARN = os.getenv("SNS_TOPIC_ARN")

results_table = dynamo.Table(RESULTS_TABLE)
accounts_table = dynamo.Table(ACCOUNTS_TABLE)


# --------------------------------------------------------------------------- #
# Helper: Ensure Email Subscription
# --------------------------------------------------------------------------- #
def ensure_subscription(email: str):
    """Subscribe email to SNS topic if not already subscribed."""
    try:
        paginator = sns.get_paginator("list_subscriptions_by_topic")
        for page in paginator.paginate(TopicArn=SNS_TOPIC_ARN):
            for sub in page["Subscriptions"]:
                if sub["Protocol"] == "email" and sub["Endpoint"].lower() == email.lower():
                    return  # already subscribed
        sns.subscribe(TopicArn=SNS_TOPIC_ARN, Protocol="email", Endpoint=email)
        print(f"Sent SNS subscription confirmation to {email}")
    except Exception as e:
        print(f"Failed SNS subscription check for {email}: {e}")


# --------------------------------------------------------------------------- #
# Helper: Delete Resource (Multi-Service)
# --------------------------------------------------------------------------- #
def delete_resource(service, region, resource_id, creds):
    """Deletes AWS resource by service type using assumed credentials."""
    try:
        client = boto3.client(
            service,
            region_name=region,
            aws_access_key_id=creds["AccessKeyId"],
            aws_secret_access_key=creds["SecretAccessKey"],
            aws_session_token=creds["SessionToken"]
        )

        if service == "ec2":
            client.terminate_instances(InstanceIds=[resource_id])
        elif service == "s3":
            s3 = boto3.resource(
                "s3",
                region_name=region,
                aws_access_key_id=creds["AccessKeyId"],
                aws_secret_access_key=creds["SecretAccessKey"],
                aws_session_token=creds["SessionToken"]
            )
            bucket = s3.Bucket(resource_id)
            bucket.objects.all().delete()
            bucket.delete()
        elif service == "rds":
            client.delete_db_instance(DBInstanceIdentifier=resource_id, SkipFinalSnapshot=True, DeleteAutomatedBackups=True)
        elif service == "dynamodb":
            client.delete_table(TableName=resource_id)
        elif service == "lambda":
            client.delete_function(FunctionName=resource_id)
        elif service == "ecr":
            client.delete_repository(repositoryName=resource_id, force=True)
        elif service == "cloudformation":
            client.delete_stack(StackName=resource_id)
        elif service == "ec2-volume":
            ec2_client = boto3.client("ec2", region_name=region, **_session(creds))
            ec2_client.delete_volume(VolumeId=resource_id)
        else:
            print(f"Unsupported service type: {service}")
            return False

        print(f"Deleted {service} resource: {resource_id}")
        return True

    except ClientError as e:
        print(f"ClientError deleting {service} {resource_id}: {e.response['Error']['Message']}")
    except Exception as e:
        print(f"Error deleting {service} {resource_id}: {e}")
    return False


# --------------------------------------------------------------------------- #
# Helper: Session Builder
# --------------------------------------------------------------------------- #
def _session(creds):
    return {
        "aws_access_key_id": creds["AccessKeyId"],
        "aws_secret_access_key": creds["SecretAccessKey"],
        "aws_session_token": creds["SessionToken"]
    }


# --------------------------------------------------------------------------- #
# Helper: Delete Expired Resources for One Account
# --------------------------------------------------------------------------- #
def delete_expired_for_account(account_id):
    today = datetime.date.today().isoformat()
    print(f"Checking expired resources for account {account_id} on {today}...")

    try:
        scan_response = results_table.scan(
            FilterExpression=Attr("accountId").eq(account_id) &
                             Attr("deleteAfter").lte(today) &
                             Attr("state").ne("deleted")
        )
        expired_resources = scan_response.get("Items", [])
        print(f"Found {len(expired_resources)} expired resources in {account_id}.")
    except Exception as e:
        print(f"Failed DynamoDB scan for {account_id}: {e}")
        return {"accountId": account_id, "error": "Scan failed", "deleted": [], "failed": []}

    deleted, failed = [], []

    for item in expired_resources:
        resource_id = item.get("resourceId")
        service = item.get("resourceType", "unknown").lower()
        region = item.get("region", "ap-south-1")
        email = item.get("email")
        delete_after = item.get("deleteAfter")

        try:
            acc = accounts_table.get_item(Key={"accountId": account_id}).get("Item")
            if not acc:
                failed.append(resource_id)
                continue

            if email:
                ensure_subscription(email)

            creds = sts.assume_role(
                RoleArn=acc["roleArn"],
                RoleSessionName="cloudoverwatch-delete-session",
                ExternalId=acc["externalId"]
            )["Credentials"]

            if delete_resource(service, region, resource_id, creds):
                results_table.update_item(
                    Key={"accountId": account_id, "resourceId": resource_id},
                    UpdateExpression="SET #s=:state, deletedAt=:t",
                    ExpressionAttributeNames={"#s": "state"},
                    ExpressionAttributeValues={":state": "deleted", ":t": datetime.datetime.utcnow().isoformat() + "Z"}
                )

                sns.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject=f"CloudOverwatch: {service.upper()} Resource Deleted",
                    Message=(
                        f"The following resource has been automatically deleted:\n"
                        f"- Resource ID: {resource_id}\n"
                        f"- Account ID: {account_id}\n"
                        f"- Type: {service}\n"
                        f"- Region: {region}\n"
                        f"- Deleted On: {today}\n"
                        f"- Tag: overwatch-delete-after = {delete_after}"
                    )
                )

                deleted.append(resource_id)
            else:
                failed.append(resource_id)

        except Exception as e:
            print(f"Error processing resource {resource_id}: {e}")
            failed.append(resource_id)

    return {"accountId": account_id, "deleted": deleted, "failed": failed}


# --------------------------------------------------------------------------- #
# Lambda Handler
# --------------------------------------------------------------------------- #
def lambda_handler(event, context):
    print("DeleteAndNotifyLambda invoked.")
    today = datetime.date.today().isoformat()

    # Parse input
    body = event.get("body") if isinstance(event, dict) else event
    if isinstance(body, str):
        try:
            body = json.loads(body)
        except Exception:
            body = {}
    elif not body:
        body = {}

    account_id = body.get("accountId")

    # --- CASE 1: Specific Account ---
    if account_id:
        print(f"Running deletion for account {account_id} only.")
        result = delete_expired_for_account(account_id)
        return {"statusCode": 200, "body": json.dumps(result)}

    # --- CASE 2: All Connected Accounts ---
    print("No accountId provided — deleting expired resources across all accounts.")
    try:
        accounts = accounts_table.scan().get("Items", [])
        print(f"Found {len(accounts)} connected accounts.")
    except Exception as e:
        print(f"Error fetching accounts: {e}")
        return {"statusCode": 500, "body": json.dumps({"error": "Failed to fetch connected accounts"})}

    overall_summary = {"totalAccounts": len(accounts), "processed": []}

    for acc in accounts:
        acc_id = acc["accountId"]
        result = delete_expired_for_account(acc_id)
        overall_summary["processed"].append(result)

    return {"statusCode": 200, "body": json.dumps(overall_summary)}
