#!/usr/bin/env python3
"""
Initialize local development infrastructure:
  - Creates DynamoDB table with GSI indexes
  - Creates S3 bucket in MinIO

Run: python scripts/setup_local.py
"""
import os
import sys
import time

import boto3
from botocore.exceptions import ClientError

DYNAMO_ENDPOINT = os.getenv("DYNAMODB_ENDPOINT_URL", "http://localhost:8000")
S3_ENDPOINT = os.getenv("S3_ENDPOINT_URL", "http://localhost:9000")
TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "brf-scholarships")
BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "brf-uploads")


def wait_for_dynamo(client, retries=10) -> None:
    print("Waiting for DynamoDB Local...", end="", flush=True)
    for _ in range(retries):
        try:
            client.list_tables()
            print(" ready.")
            return
        except Exception:
            print(".", end="", flush=True)
            time.sleep(1)
    print("\nERROR: DynamoDB Local not reachable. Is docker compose running?")
    sys.exit(1)


def create_table(client) -> None:
    try:
        client.create_table(
            TableName=TABLE_NAME,
            BillingMode="PAY_PER_REQUEST",
            AttributeDefinitions=[
                {"AttributeName": "PK",     "AttributeType": "S"},
                {"AttributeName": "SK",     "AttributeType": "S"},
                {"AttributeName": "GSI1PK", "AttributeType": "S"},
                {"AttributeName": "GSI1SK", "AttributeType": "S"},
                {"AttributeName": "GSI2PK", "AttributeType": "S"},
                {"AttributeName": "GSI2SK", "AttributeType": "S"},
            ],
            KeySchema=[
                {"AttributeName": "PK", "KeyType": "HASH"},
                {"AttributeName": "SK", "KeyType": "RANGE"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "GSI1",
                    "KeySchema": [
                        {"AttributeName": "GSI1PK", "KeyType": "HASH"},
                        {"AttributeName": "GSI1SK", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
                {
                    "IndexName": "GSI2",
                    "KeySchema": [
                        {"AttributeName": "GSI2PK", "KeyType": "HASH"},
                        {"AttributeName": "GSI2SK", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
            ],
        )
        print(f"✓ DynamoDB table '{TABLE_NAME}' created.")
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceInUseException":
            print(f"  DynamoDB table '{TABLE_NAME}' already exists.")
        else:
            raise


def create_s3_bucket() -> None:
    s3 = boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "minioadmin"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "minioadmin"),
        region_name="us-east-1",
    )
    try:
        s3.create_bucket(Bucket=BUCKET_NAME)
        print(f"✓ S3 bucket '{BUCKET_NAME}' created.")
    except ClientError as e:
        code = e.response["Error"]["Code"]
        if code in ("BucketAlreadyOwnedByYou", "BucketAlreadyExists"):
            print(f"  S3 bucket '{BUCKET_NAME}' already exists.")
        else:
            raise


if __name__ == "__main__":
    dynamo = boto3.client(
        "dynamodb",
        endpoint_url=DYNAMO_ENDPOINT,
        region_name="us-west-2",
        aws_access_key_id="local",
        aws_secret_access_key="local",
    )
    wait_for_dynamo(dynamo)
    create_table(dynamo)
    create_s3_bucket()
    print("\nLocal environment ready.")
    print(f"  DynamoDB console: (use NoSQL Workbench or AWS CLI with --endpoint-url {DYNAMO_ENDPOINT})")
    print(f"  MinIO console:    http://localhost:9001  (minioadmin / minioadmin)")
    print(f"  MailHog UI:       http://localhost:8025")
    print(f"  API docs:         http://localhost:8080/docs  (after make dev-backend)")
