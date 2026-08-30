from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import decode_token
from app.models.user import UserRole

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    payload = decode_token(credentials.credentials)
    return {"email": payload["sub"], "role": payload["role"]}


def require_reviewer_or_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["role"] not in (UserRole.admin, UserRole.reviewer):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Reviewer access required"
        )
    return current_user
