from datetime import datetime, timezone
from typing import Optional
import uuid

from boto3.dynamodb.conditions import Key

from app.db.table import get_table


def _pk(app_id: str) -> dict:
    return {"PK": f"APPLICATION#{app_id}", "SK": "METADATA"}


def get_application(app_id: str) -> Optional[dict]:
    resp = get_table().get_item(Key=_pk(app_id))
    return resp.get("Item")


def get_applications_by_user(email: str) -> list[dict]:
    resp = get_table().query(
        IndexName="GSI1",
        KeyConditionExpression=Key("GSI1PK").eq(f"USER#{email}"),
    )
    return resp.get("Items", [])


def get_applications_by_window(window_id: str) -> list[dict]:
    resp = get_table().query(
        IndexName="GSI2",
        KeyConditionExpression=Key("GSI2PK").eq(f"WINDOW#{window_id}"),
    )
    return resp.get("Items", [])


def create_application(owner_email: str, window_id: str, scholarship_type: str) -> dict:
    app_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    item = {
        **_pk(app_id),
        "GSI1PK": f"USER#{owner_email}",
        "GSI1SK": f"APPLICATION#{app_id}",
        "GSI2PK": f"WINDOW#{window_id}",
        "GSI2SK": f"APPLICATION#{app_id}",
        "app_id": app_id,
        "owner_email": owner_email,
        "window_id": window_id,
        "scholarship_type": scholarship_type,
        "status": "draft",
        "data": {},
        "created_at": now,
        "updated_at": now,
    }
    get_table().put_item(Item=item)
    return item


def update_application_data(app_id: str, data: dict) -> None:
    get_table().update_item(
        Key=_pk(app_id),
        UpdateExpression="SET #d = :data, updated_at = :ts",
        ExpressionAttributeNames={"#d": "data"},
        ExpressionAttributeValues={
            ":data": data,
            ":ts": datetime.now(timezone.utc).isoformat(),
        },
    )


def update_application_status(app_id: str, status: str) -> None:
    get_table().update_item(
        Key=_pk(app_id),
        UpdateExpression="SET #s = :status, updated_at = :ts",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={
            ":status": status,
            ":ts": datetime.now(timezone.utc).isoformat(),
        },
    )


def get_comments(app_id: str) -> list[dict]:
    resp = get_table().query(
        KeyConditionExpression=Key("PK").eq(f"APPLICATION#{app_id}")
        & Key("SK").begins_with("COMMENT#"),
    )
    return resp.get("Items", [])


def add_file_record(
    app_id: str,
    file_id: str,
    filename: str,
    s3_key: str,
    content_type: str,
    uploader: str,
) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    item = {
        "PK": f"APPLICATION#{app_id}",
        "SK": f"FILE#{file_id}",
        "app_id": app_id,
        "file_id": file_id,
        "filename": filename,
        "s3_key": s3_key,
        "content_type": content_type,
        "uploaded_by": uploader,
        "uploaded_at": now,
    }
    get_table().put_item(Item=item)
    return item


def get_files(app_id: str) -> list[dict]:
    resp = get_table().query(
        KeyConditionExpression=Key("PK").eq(f"APPLICATION#{app_id}")
        & Key("SK").begins_with("FILE#"),
    )
    return resp.get("Items", [])


def add_comment(app_id: str, author_email: str, content: str) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    item = {
        "PK": f"APPLICATION#{app_id}",
        "SK": f"COMMENT#{now}#{author_email}",
        "app_id": app_id,
        "author_email": author_email,
        "content": content,
        "created_at": now,
    }
    get_table().put_item(Item=item)
    return item
