from datetime import datetime, timezone
from typing import Optional

from boto3.dynamodb.conditions import Key

from app.db.table import get_table
from app.models.user import UserRole


def _pk(email: str) -> dict:
    return {"PK": f"USER#{email}", "SK": "PROFILE"}


def get_user(email: str) -> Optional[dict]:
    resp = get_table().get_item(Key=_pk(email))
    return resp.get("Item")


def _role_str(role) -> str:
    return role.value if hasattr(role, "value") else str(role)


def create_user(data: dict) -> dict:
    item = {
        **_pk(data["email"]),
        "GSI1PK": f"ROLE#{_role_str(data['role'])}",
        "GSI1SK": f"USER#{data['email']}",
        "created_at": datetime.now(timezone.utc).isoformat(),
        **data,
    }
    get_table().put_item(Item=item)
    return item


def update_user(email: str, updates: dict) -> None:
    names: dict = {}
    values: dict = {}
    parts: list[str] = []
    for i, (k, v) in enumerate(updates.items()):
        names[f"#a{i}"] = k
        values[f":v{i}"] = v
        parts.append(f"#a{i} = :v{i}")

    get_table().update_item(
        Key=_pk(email),
        UpdateExpression="SET " + ", ".join(parts),
        ExpressionAttributeNames=names,
        ExpressionAttributeValues=values,
    )


def list_users_by_role(role) -> list[dict]:
    resp = get_table().query(
        IndexName="GSI1",
        KeyConditionExpression=Key("GSI1PK").eq(f"ROLE#{_role_str(role)}"),
    )
    return resp.get("Items", [])


def delete_user(email: str) -> None:
    get_table().delete_item(Key=_pk(email))


def get_user_by_invite_token(token: str) -> Optional[dict]:
    resp = get_table().scan(
        FilterExpression="invite_token = :t",
        ExpressionAttributeValues={":t": token},
    )
    items = resp.get("Items", [])
    return items[0] if items else None


def admin_exists() -> bool:
    resp = get_table().query(
        IndexName="GSI1",
        KeyConditionExpression=Key("GSI1PK").eq(f"ROLE#{_role_str(UserRole.admin)}"),
        Limit=1,
    )
    return resp["Count"] > 0
