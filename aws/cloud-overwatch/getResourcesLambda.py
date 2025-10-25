import json
import boto3
from boto3.dynamodb.conditions import Attr

def lambda_handler(event, context):
    try:
        # Parse request body
        body = event.get("body")
        if isinstance(body, str):
            body = json.loads(body)
        elif body is None:
            body = {}

        account_id = body.get("accountId")

        dynamo = boto3.resource("dynamodb", region_name="ap-south-1")
        table = dynamo.Table("AccountScanResults")

        # Fetch only active resources
        if account_id:
            print(f"Fetching ACTIVE resources for account {account_id}")
            response = table.scan(
                FilterExpression=Attr("accountId").eq(account_id) & Attr("state").eq("active")
            )
        else:
            print("Fetching all ACTIVE resources (no account filter)")
            response = table.scan(
                FilterExpression=Attr("state").eq("active")
            )

        items = response.get("Items", [])

        # Format for frontend
        formatted = [
            {
                "resourceId": i.get("resourceId"),
                "arn": i.get("arn"),
                "deleteAfter": i.get("deleteAfter"),
                "region": i.get("region"),
                "resourceType": i.get("resourceType"),
                "scannedAt": i.get("scannedAt"),
            }
            for i in items
        ]

        print(f"Found {len(formatted)} active resources for account {account_id or 'ALL'}")

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "message": "Fetched active AWS resources successfully",
                "count": len(formatted),
                "resources": formatted
            }),
        }

    except Exception as e:
        print(f"Error fetching resources: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
        }
