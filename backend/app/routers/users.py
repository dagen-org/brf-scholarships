import secrets
from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user, require_reviewer_or_admin
from app.core.security import hash_password, verify_password
from app.db import users as users_db
from app.models.user import (
    UserProfile,
    ChangePasswordRequest,
    InviteReviewerRequest,
    ReviewerProfileUpdate,
    ApplicantProfileUpdate,
    AdminSetPasswordRequest,
    UserRole,
)
from app.services.email import send_reviewer_invite_email

router = APIRouter()


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    user = users_db.get_user(current_user["email"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "email": user["email"],
        "role": user["role"],
        "email_verified": user.get("email_verified", False),
        "profile": {
            "first_name": user.get("first_name"),
            "middle_name": user.get("middle_name"),
            "last_name": user.get("last_name"),
            "phone": user.get("phone"),
            "home_address": user.get("home_address"),
        },
    }


@router.put("/me/profile")
def update_profile(body: UserProfile, current_user: dict = Depends(get_current_user)):
    users_db.update_user(current_user["email"], body.model_dump(exclude_none=True))
    return {"message": "Profile updated"}


@router.post("/me/change-password")
def change_password(
    body: ChangePasswordRequest, current_user: dict = Depends(get_current_user)
):
    user = users_db.get_user(current_user["email"])
    if not verify_password(body.current_password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    users_db.update_user(
        current_user["email"], {"hashed_password": hash_password(body.new_password)}
    )
    return {"message": "Password changed"}


@router.post(
    "/invite-reviewer",
    dependencies=[Depends(require_reviewer_or_admin)],
    status_code=201,
)
def invite_reviewer(body: InviteReviewerRequest):
    if users_db.get_user(body.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    token = secrets.token_urlsafe(32)
    users_db.create_user(
        {
            "email": body.email,
            "hashed_password": "",
            "role": UserRole.reviewer,
            "email_verified": False,
            "invite_token": token,
        }
    )
    try:
        send_reviewer_invite_email(body.email, token)
    except Exception as exc:
        users_db.delete_user(body.email)
        raise HTTPException(
            status_code=502, detail=f"Failed to send invitation email: {exc}"
        )
    return {"message": "Invitation sent"}


@router.get("/reviewers", dependencies=[Depends(require_reviewer_or_admin)])
def list_reviewers():
    return users_db.list_users_by_role(UserRole.reviewer)


def _get_reviewer_or_404(email: str) -> dict:
    user = users_db.get_user(email)
    if not user or user.get("role") != UserRole.reviewer:
        raise HTTPException(status_code=404, detail="Reviewer not found")
    return user


@router.put("/reviewers/{email}", dependencies=[Depends(require_reviewer_or_admin)])
def update_reviewer(email: str, body: ReviewerProfileUpdate):
    _get_reviewer_or_404(email)
    users_db.update_user(email, body.model_dump(exclude_none=True))
    return {"message": "Reviewer updated"}


@router.post(
    "/reviewers/{email}/set-password", dependencies=[Depends(require_reviewer_or_admin)]
)
def admin_set_reviewer_password(email: str, body: AdminSetPasswordRequest):
    _get_reviewer_or_404(email)
    users_db.update_user(email, {"hashed_password": hash_password(body.new_password)})
    return {"message": "Password updated"}


@router.delete(
    "/reviewers/{email}",
    dependencies=[Depends(require_reviewer_or_admin)],
    status_code=204,
)
def delete_reviewer(email: str):
    _get_reviewer_or_404(email)
    users_db.delete_user(email)


@router.get("/applicants", dependencies=[Depends(require_reviewer_or_admin)])
def list_applicants():
    return users_db.list_users_by_role(UserRole.applicant)


def _get_applicant_or_404(email: str) -> dict:
    user = users_db.get_user(email)
    if not user or user.get("role") != UserRole.applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return user


@router.put("/applicants/{email}", dependencies=[Depends(require_reviewer_or_admin)])
def update_applicant(email: str, body: ApplicantProfileUpdate):
    _get_applicant_or_404(email)
    users_db.update_user(email, body.model_dump(exclude_none=True))
    return {"message": "Applicant updated"}


@router.post(
    "/applicants/{email}/set-password",
    dependencies=[Depends(require_reviewer_or_admin)],
)
def admin_set_applicant_password(email: str, body: AdminSetPasswordRequest):
    _get_applicant_or_404(email)
    users_db.update_user(email, {"hashed_password": hash_password(body.new_password)})
    return {"message": "Password updated"}


@router.delete(
    "/applicants/{email}",
    dependencies=[Depends(require_reviewer_or_admin)],
    status_code=204,
)
def delete_applicant(email: str):
    _get_applicant_or_404(email)
    users_db.delete_user(email)
