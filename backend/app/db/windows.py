from datetime import datetime, timezone
from typing import Optional
import uuid

from boto3.dynamodb.conditions import Key

from app.db.table import get_table
from app.models.window import WindowType


def _pk(window_id: str) -> dict:
    return {"PK": f"WINDOW#{window_id}", "SK": "METADATA"}


def get_window(window_id: str) -> Optional[dict]:
    resp = get_table().get_item(Key=_pk(window_id))
    return resp.get("Item")


def _gsi1pk(window_type: str) -> str:
    return f"WINDOWTYPE#{window_type}"


def list_windows(window_type: Optional[WindowType] = None) -> list[dict]:
    types = [window_type.value] if window_type else [wt.value for wt in WindowType]
    results = []
    for wt in types:
        resp = get_table().query(
            IndexName="GSI1",
            KeyConditionExpression=Key("GSI1PK").eq(_gsi1pk(wt)),
        )
        results.extend(item for item in resp.get("Items", []) if not item.get("archived"))
    return results


def list_archived_windows() -> list[dict]:
    results = []
    for wt in WindowType:
        resp = get_table().query(
            IndexName="GSI1",
            KeyConditionExpression=Key("GSI1PK").eq(_gsi1pk(wt.value)),
        )
        results.extend(item for item in resp.get("Items", []) if item.get("archived"))
    return results


def create_window(data: dict) -> dict:
    window_id = str(uuid.uuid4())
    item = {
        **_pk(window_id),
        "GSI1PK": _gsi1pk(data["window_type"]),
        "GSI1SK": f"WINDOW#{window_id}",
        "window_id": window_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        **data,
    }
    get_table().put_item(Item=item)
    return item


def update_window(window_id: str, data: dict) -> Optional[dict]:
    existing = get_window(window_id)
    if not existing:
        return None
    item = {
        **existing,
        **data,
        "GSI1PK": _gsi1pk(data["window_type"]),
        "GSI1SK": f"WINDOW#{window_id}",
    }
    get_table().put_item(Item=item)
    return item


def delete_window(window_id: str) -> None:
    get_table().delete_item(Key=_pk(window_id))


def archive_window(window_id: str) -> None:
    get_table().update_item(
        Key=_pk(window_id),
        UpdateExpression="SET archived = :v",
        ExpressionAttributeValues={":v": True},
    )


def unarchive_window(window_id: str) -> None:
    get_table().update_item(
        Key=_pk(window_id),
        UpdateExpression="SET archived = :v",
        ExpressionAttributeValues={":v": False},
    )


def get_active_live_window() -> Optional[dict]:
    today = datetime.now(timezone.utc).date().isoformat()
    resp = get_table().query(
        IndexName="GSI1",
        KeyConditionExpression=Key("GSI1PK").eq(_gsi1pk(WindowType.live.value)),
    )
    for item in resp.get("Items", []):
        if item.get("start_date", "") <= today <= item.get("end_date", "") and not item.get("archived"):
            return item
    return None
