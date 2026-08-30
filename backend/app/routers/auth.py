import secrets

from fastapi import APIRouter, HTTPException, status

from app.core.security import create_access_token, hash_password, verify_password
from app.db import users as users_db
from app.models.user import (
    AcceptInviteRequest,
    ConfirmResetRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UserRole,
    VerifyEmailRequest,
)
from app.services.email import send_password_reset_email, send_verification_email

router = APIRouter()


@router.post("/bootstrap", status_code=201)
def bootstrap_admin(body: RegisterRequest):
    """Create the first admin user. Fails if any admin already exists."""
    if users_db.admin_exists():
        raise HTTPException(status_code=409, detail="Admin already exists")
    users_db.create_user(
        {
            "email": body.email,
            "hashed_password": hash_password(body.password),
            "role": UserRole.admin,
            "email_verified": True,
            "verification_code": None,
        }
    )
    return {"message": "Admin account created"}


@router.post("/register", status_code=201)
def register(body: RegisterRequest):
    if users_db.get_user(body.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    code = f"{secrets.randbelow(900000) + 100000}"
    users_db.create_user(
        {
            "email": body.email,
            "hashed_password": hash_password(body.password),
            "role": UserRole.applicant,
            "email_verified": False,
            "verification_code": code,
        }
    )
    send_verification_email(body.email, code)
    return {"message": "Verification code sent to your email"}


@router.post("/verify-email")
def verify_email(body: VerifyEmailRequest):
    user = users_db.get_user(body.email)
    if not user or user.get("verification_code") != body.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    users_db.update_user(
        body.email, {"email_verified": True, "verification_code": None}
    )
    return {"message": "Email verified"}


@router.post("/login")
def login(body: LoginRequest):
    user = users_db.get_user(body.email)
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    if not user.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified"
        )
    token = create_access_token(user["email"], user["role"])
    return {"access_token": token, "token_type": "bearer", "role": user["role"]}


@router.post("/reset-password")
def request_password_reset(body: ResetPasswordRequest):
    user = users_db.get_user(body.email)
    if user:
        code = f"{secrets.randbelow(900000) + 100000}"
        users_db.update_user(body.email, {"reset_code": code})
        send_password_reset_email(body.email, code)
    # Always return success to avoid email enumeration
    return {"message": "If that email exists, a reset code has been sent"}


@router.post("/reset-password/confirm")
def confirm_password_reset(body: ConfirmResetRequest):
    user = users_db.get_user(body.email)
    if not user or user.get("reset_code") != body.code:
        raise HTTPException(status_code=400, detail="Invalid reset code")
    users_db.update_user(
        body.email,
        {
            "hashed_password": hash_password(body.new_password),
            "reset_code": None,
        },
    )
    return {"message": "Password updated"}


@router.post("/accept-invite")
def accept_invite(body: AcceptInviteRequest):
    """Reviewer accepts their invitation token and sets a password."""
    user = users_db.get_user_by_invite_token(body.token)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired invite token")
    users_db.update_user(
        user["email"],
        {
            "hashed_password": hash_password(body.password),
            "email_verified": True,
            "invite_token": None,
        },
    )
    token = create_access_token(user["email"], user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user["role"],
        "email": user["email"],
    }
