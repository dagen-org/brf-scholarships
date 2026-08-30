from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import decode_token
from app.models.user import UserRole

security = HTTPBearer()

BearerCredentials = Annotated[HTTPAuthorizationCredentials, Depends(security)]


def get_current_user(credentials: BearerCredentials) -> dict:
    payload = decode_token(credentials.credentials)
    return {"email": payload["sub"], "role": payload["role"]}


CurrentUser = Annotated[dict, Depends(get_current_user)]


def require_reviewer_or_admin(current_user: CurrentUser) -> dict:
    if current_user["role"] not in (UserRole.admin, UserRole.reviewer):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Reviewer access required"
        )
    return current_user
