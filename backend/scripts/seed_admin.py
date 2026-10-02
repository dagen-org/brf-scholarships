#!/usr/bin/env python3
"""
Creates the initial admin user in production DynamoDB.
Uses AWS credentials from the environment or ~/.aws/credentials.

Usage:
    python scripts/seed_admin.py --email admin@example.com --password 'secret'
"""
import argparse
import sys
from datetime import datetime, timezone

import boto3
import bcrypt


def main():
    parser = argparse.ArgumentParser(description="Seed initial admin user")
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--table", default="brf-scholarships")
    parser.add_argument("--region", default="us-west-2")
    args = parser.parse_args()

    table = boto3.resource("dynamodb", region_name=args.region).Table(args.table)

    # Abort if user already exists
    existing = table.get_item(Key={"PK": f"USER#{args.email}", "SK": "PROFILE"}).get("Item")
    if existing:
        print(f"User {args.email} already exists — aborting.")
        sys.exit(1)

    hashed = bcrypt.hashpw(args.password.encode(), bcrypt.gensalt()).decode()

    item = {
        "PK": f"USER#{args.email}",
        "SK": "PROFILE",
        "GSI1PK": "ROLE#admin",
        "GSI1SK": f"USER#{args.email}",
        "email": args.email,
        "role": "admin",
        "hashed_password": hashed,
        "email_verified": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    table.put_item(Item=item)
    print(f"Admin user {args.email} created successfully.")


if __name__ == "__main__":
    main()
