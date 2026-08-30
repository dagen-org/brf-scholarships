from enum import Enum

from pydantic import BaseModel, EmailStr


class UserRole(str, Enum):
    admin = "admin"
    applicant = "applicant"
    reviewer = "reviewer"


class UserProfile(BaseModel):
    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    home_address: str | None = None


class UserPublic(BaseModel):
    email: str
    role: UserRole
    email_verified: bool
    profile: UserProfile = UserProfile()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr


class ConfirmResetRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str


class InviteReviewerRequest(BaseModel):
    email: EmailStr


class AcceptInviteRequest(BaseModel):
    token: str
    password: str


class ReviewerProfileUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    home_address: str | None = None


class AdminSetPasswordRequest(BaseModel):
    new_password: str


class ApplicantProfileUpdate(BaseModel):
    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    home_address: str | None = None
