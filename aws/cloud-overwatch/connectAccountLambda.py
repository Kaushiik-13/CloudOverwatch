import json
import boto3
from botocore.exceptions import ClientError
import datetime
import os

# AWS clients
dynamo = boto3.resource('dynamodb', region_name='ap-south-1')
sts = boto3.client("sts")
sns = boto3.client('sns')

# Environment variables
TABLE_NAME = os.environ.get('CONNECTED_ACCOUNTS_TABLE', 'ConnectedAccounts')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')

table = dynamo.Table(TABLE_NAME)

def lambda_handler(event, context):
    try:
        # Universal body parsing (works for both API Gateway & direct invokes)
        raw_body = event.get("body", event)
        if isinstance(raw_body, str):
            body = json.loads(raw_body)
        elif isinstance(raw_body, dict):
            body = raw_body
        else:
            body = {}

        # Extract parameters
        role_arn = body.get("roleArn")
        external_id = body.get("externalId")
        user_email = body.get("email")

        if not role_arn or not external_id or not user_email:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "error": "roleArn, externalId, and email are required"
                })
            }

        # Step 1: Assume the user’s role (to verify connection)
        response = sts.assume_role(
            RoleArn=role_arn,
            RoleSessionName="cloud-overwatch-connection",
            ExternalId=external_id
        )

        creds = response["Credentials"]

        # Step 2: Verify connection identity
        assumed_sts = boto3.client(
            "sts",
            aws_access_key_id=creds["AccessKeyId"],
            aws_secret_access_key=creds["SecretAccessKey"],
            aws_session_token=creds["SessionToken"]
        )
        identity = assumed_sts.get_caller_identity()
        account_id = identity["Account"]

        # Step 3: Prepare connection record
        record = {
            "accountId": account_id,
            "roleArn": role_arn,
            "externalId": external_id,
            "connectedAt": datetime.datetime.utcnow().isoformat() + "Z",
            "email": user_email
        }

        # Step 4: Store connection in DynamoDB
        table.put_item(Item=record)

        # Step 5: Subscribe user's email to SNS topic
        try:
            sns_response = sns.subscribe(
                TopicArn=SNS_TOPIC_ARN,
                Protocol='email',
                Endpoint=user_email
            )
            print("SNS subscription request sent:", sns_response)
            record["subscriptionStatus"] = "pending confirmation"
        except Exception as sns_err:
            print("SNS subscription error:", sns_err)
            record["subscriptionStatus"] = "failed"

        # Return clean success response
        return {
            "statusCode": 200,
            "body": json.dumps({
                "status": "connected",
                "data": record,
                "message": "Connection verified and SNS confirmation email sent to user."
            })
        }

    except ClientError as e:
        print("ClientError:", e)
        return {
            "statusCode": 403,
            "body": json.dumps({"error": e.response['Error']['Message']})
        }

    except Exception as e:
        print("Error:", e)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
