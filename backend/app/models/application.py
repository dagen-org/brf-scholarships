from enum import Enum
from pydantic import BaseModel
from typing import Any


class ScholarshipType(str, Enum):
    academic = "academic"
    academic_renewal = "academic_renewal"
    ceyp = "ceyp"
    vocational = "vocational"


class ApplicationStatus(str, Enum):
    draft = "draft"
    submitted = "submitted"
    under_review = "under_review"
    awarded = "awarded"
    declined = "declined"


class ApplicationCreate(BaseModel):
    window_id: str
    scholarship_type: ScholarshipType


class ApplicationDataUpdate(BaseModel):
    data: dict[str, Any]


class ApplicationPublic(BaseModel):
    app_id: str
    owner_email: str
    window_id: str
    scholarship_type: ScholarshipType
    status: ApplicationStatus
    data: dict[str, Any]
    created_at: str
    updated_at: str


class CommentCreate(BaseModel):
    content: str


class CommentPublic(BaseModel):
    app_id: str
    author_email: str
    content: str
    created_at: str
