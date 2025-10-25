import boto3
import json
import datetime

# Predefined India & Nearby AWS Regions
TARGET_REGIONS = ["ap-south-1", "ap-south-2", "ap-southeast-1", "ap-northeast-1"]

def lambda_handler(event, context):
    # --- Parse Input ---
    body = event.get("body") if isinstance(event, dict) else event
    if isinstance(body, str):
        try:
            body = json.loads(body)
        except Exception:
            body = {}
    elif not body:
        body = {}

    dynamo = boto3.resource("dynamodb", region_name="ap-south-1")  # primary region for DB access
    accounts_table = dynamo.Table("ConnectedAccounts")
    results_table = dynamo.Table("AccountScanResults")

    # --- CASE 1: Auto Scan for All Connected Accounts ---
    if not body.get("accountId"):
        print("⚙️ No accountId found — running regional scan for all connected accounts.")
        try:
            accounts = accounts_table.scan().get("Items", [])
            print(f"🔍 Found {len(accounts)} connected accounts to scan.")

            summary = {"accounts_scanned": 0, "total_resources": 0, "failed": []}

            for acc in accounts:
                account_id = acc["accountId"]
                email = acc.get("email")
                try:
                    print(f"➡️ Scanning account: {account_id}")
                    result = scan_across_regions(account_id, email, results_table)
                    result_body = json.loads(result["body"])
                    summary["accounts_scanned"] += 1
                    summary["total_resources"] += result_body.get("tagged_resources_stored", 0)
                except Exception as e:
                    print(f"❌ Failed scan for {account_id}: {e}")
                    summary["failed"].append(account_id)

            print(f"✅ Auto-scan completed: {summary}")
            return {"statusCode": 200, "body": json.dumps(summary)}

        except Exception as e:
            print(f"❌ Error fetching accounts: {e}")
            return {"statusCode": 500, "body": json.dumps({"error": "Failed to fetch connected accounts"})}

    # --- CASE 2: Manual Scan for One Account ---
    account_id = body.get("accountId")
    email = body.get("email")
    return scan_across_regions(account_id, email, results_table)


# --------------------------------------------------------------------------- #
# Helper: Scan Account Across Selected Regions
# --------------------------------------------------------------------------- #
def scan_across_regions(account_id, email, results_table):
    print(f"🌎 Scanning {account_id} across India and nearby regions: {TARGET_REGIONS}")

    stored_total = 0

    for region in TARGET_REGIONS:
        try:
            result = scan_single_account(account_id, email, region, results_table)
            body = json.loads(result["body"])
            stored_total += body.get("tagged_resources_stored", 0)
        except Exception as e:
            print(f"⚠️ Region {region} scan failed: {e}")

    print(f"✅ [{account_id}] Stored {stored_total} tagged resources across {len(TARGET_REGIONS)} regions.")
    return {
        "statusCode": 200,
        "body": json.dumps({
            "accountId": account_id,
            "tagged_resources_stored": stored_total,
            "regions_scanned": TARGET_REGIONS,
            "scannedAt": datetime.datetime.utcnow().isoformat() + "Z"
        })
    }


# --------------------------------------------------------------------------- #
# Single-Region Scan Logic (Same as Before)
# --------------------------------------------------------------------------- #
def scan_single_account(account_id, email, region, results_table):
    print(f"🔹 Scanning region: {region} for account: {account_id}")

    dynamo = boto3.resource("dynamodb", region_name="ap-south-1")
    accounts_table = dynamo.Table("ConnectedAccounts")

    acc = accounts_table.get_item(Key={"accountId": account_id}).get("Item")
    if not acc:
        return {"statusCode": 404, "body": json.dumps({"error": f"Account {account_id} not found"})}

    sts = boto3.client("sts")
    creds = sts.assume_role(
        RoleArn=acc["roleArn"],
        RoleSessionName="scan-session",
        ExternalId=acc["externalId"]
    )["Credentials"]

    tag_client = boto3.client(
        "resourcegroupstaggingapi",
        aws_access_key_id=creds["AccessKeyId"],
        aws_secret_access_key=creds["SecretAccessKey"],
        aws_session_token=creds["SessionToken"],
        region_name=region
    )

    # Fetch tagged resources
    all_tagged = []
    token = None
    while True:
        params = {"TagFilters": [{"Key": "overwatch-delete-after"}], "ResourcesPerPage": 50}
        if token:
            params["PaginationToken"] = token
        resp = tag_client.get_resources(**params)
        all_tagged.extend(resp.get("ResourceTagMappingList", []))
        token = resp.get("PaginationToken")
        if not token:
            break

    print(f"📦 [{account_id}] Found {len(all_tagged)} tagged resources in {region}")

    clients = {
        "ec2": boto3.client("ec2", region_name=region, **_session(creds)),
        "s3": boto3.client("s3", region_name=region, **_session(creds)),
        "rds": boto3.client("rds", region_name=region, **_session(creds)),
        "dynamodb": boto3.client("dynamodb", region_name=region, **_session(creds)),
        "lambda": boto3.client("lambda", region_name=region, **_session(creds)),
        "cloudformation": boto3.client("cloudformation", region_name=region, **_session(creds)),
        "ecr": boto3.client("ecr", region_name=region, **_session(creds))
    }

    now = datetime.datetime.utcnow().isoformat() + "Z"
    stored_count = 0

    for res in all_tagged:
        arn = res["ResourceARN"]
        tags = {t["Key"]: t["Value"] for t in res.get("Tags", [])}
        delete_after = tags.get("overwatch-delete-after")
        service = arn.split(":")[2] if len(arn.split(":")) > 2 else "unknown"
        resource_id = arn.split("/")[-1] if "/" in arn else arn.split(":")[-1]

        if not delete_after:
            continue

        active = is_resource_active(service, resource_id, clients)
        if not active:
            continue

        try:
            results_table.put_item(Item={
                "accountId": account_id,
                "email": email,
                "region": region,
                "resourceId": resource_id,
                "resourceType": service,
                "arn": arn,
                "tags": tags,
                "deleteAfter": delete_after,
                "state": "active",
                "scannedAt": now
            })
            stored_count += 1
        except Exception as e:
            print(f"Failed to store {arn}: {e}")

    print(f"✅ {region}: stored {stored_count} active tagged resources.")
    return {
        "statusCode": 200,
        "body": json.dumps({
            "accountId": account_id,
            "region": region,
            "tagged_resources_stored": stored_count,
            "scannedAt": now
        })
    }


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _session(creds):
    return {
        "aws_access_key_id": creds["AccessKeyId"],
        "aws_secret_access_key": creds["SecretAccessKey"],
        "aws_session_token": creds["SessionToken"]
    }


def is_resource_active(service, resource_id, clients):
    """Check if resource is in active/available/running state."""
    try:
        if service == "ec2":
            resp = clients["ec2"].describe_instances(InstanceIds=[resource_id])
            state = resp["Reservations"][0]["Instances"][0]["State"]["Name"]
            return state in ["running", "pending"]
        elif service == "s3":
            clients["s3"].head_bucket(Bucket=resource_id)
            return True
        elif service == "rds":
            dbs = clients["rds"].describe_db_instances(DBInstanceIdentifier=resource_id)
            status = dbs["DBInstances"][0]["DBInstanceStatus"]
            return status not in ["deleting", "deleted"]
        elif service == "dynamodb":
            table = clients["dynamodb"].describe_table(TableName=resource_id)
            status = table["Table"]["TableStatus"]
            return status == "ACTIVE"
        elif service == "lambda":
            clients["lambda"].get_function(FunctionName=resource_id)
            return True
        elif service == "cloudformation":
            stacks = clients["cloudformation"].describe_stacks(StackName=resource_id)
            status = stacks["Stacks"][0]["StackStatus"]
            return not status.startswith("DELETE_")
        elif service == "ecr":
            repos = clients["ecr"].describe_repositories(repositoryNames=[resource_id])
            return len(repos["repositories"]) > 0
        else:
            return True
    except Exception:
        return False
