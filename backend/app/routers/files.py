import uuid
import boto3
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config import settings
from app.core.deps import get_current_user
from app.db import applications as apps_db
from app.models.user import UserRole

router = APIRouter()

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}


class PresignedUrlRequest(BaseModel):
    app_id: str
    filename: str
    content_type: str


def _s3_client():
    kwargs: dict = {}
    if settings.s3_endpoint_url:
        kwargs["endpoint_url"] = settings.s3_endpoint_url
    return boto3.client(
        "s3",
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        **kwargs,
    )


@router.post("/upload-url")
def get_upload_url(body: PresignedUrlRequest, current_user: dict = Depends(get_current_user)):
    if body.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="File type not allowed. Use PDF, DOCX, or TXT.")

    app = apps_db.get_application(body.app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if current_user["role"] == UserRole.applicant and app["owner_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Access denied")

    file_id = str(uuid.uuid4())
    s3_key = f"applications/{body.app_id}/{file_id}/{body.filename}"

    presigned_url = _s3_client().generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.s3_bucket_name,
            "Key": s3_key,
            "ContentType": body.content_type,
        },
        ExpiresIn=300,
    )

    # Record the file attachment in DynamoDB
    apps_db.add_file_record(body.app_id, file_id, body.filename, s3_key, body.content_type, current_user["email"])

    return {"upload_url": presigned_url, "file_id": file_id, "s3_key": s3_key}


@router.get("/{app_id}")
def list_files(app_id: str, current_user: dict = Depends(get_current_user)):
    app = apps_db.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if current_user["role"] == UserRole.applicant and app["owner_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return apps_db.get_files(app_id)
