from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user, require_reviewer_or_admin
from app.db import applications as apps_db
from app.db import windows as windows_db
from app.models.application import (
    ApplicationCreate,
    ApplicationDataUpdate,
    CommentCreate,
)
from app.models.user import UserRole

router = APIRouter()


@router.post("/", status_code=201)
def create_application(
    body: ApplicationCreate, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != UserRole.applicant:
        raise HTTPException(
            status_code=403, detail="Only applicants can create applications"
        )

    # Enforce one active application per applicant
    existing = apps_db.get_applications_by_user(current_user["email"])
    if any(a["status"] in ("draft", "submitted") for a in existing):
        raise HTTPException(
            status_code=409, detail="You already have an active application"
        )

    window = windows_db.get_window(body.window_id)
    if not window:
        raise HTTPException(status_code=404, detail="Application window not found")

    app = apps_db.create_application(
        current_user["email"], body.window_id, body.scholarship_type
    )
    return app


@router.get("/mine")
def get_my_applications(current_user: dict = Depends(get_current_user)):
    return apps_db.get_applications_by_user(current_user["email"])


@router.get("/window/{window_id}", dependencies=[Depends(require_reviewer_or_admin)])
def get_applications_for_window(window_id: str):
    return apps_db.get_applications_by_window(window_id)


@router.get("/{app_id}")
def get_application(app_id: str, current_user: dict = Depends(get_current_user)):
    app = apps_db.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    # Applicants can only see their own
    if (
        current_user["role"] == UserRole.applicant
        and app["owner_email"] != current_user["email"]
    ):
        raise HTTPException(status_code=403, detail="Access denied")
    return app


@router.put("/{app_id}/data")
def save_application_data(
    app_id: str,
    body: ApplicationDataUpdate,
    current_user: dict = Depends(get_current_user),
):
    app = apps_db.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app["owner_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if app["status"] == "submitted":
        raise HTTPException(
            status_code=400, detail="Cannot edit a submitted application"
        )
    apps_db.update_application_data(app_id, body.data)
    return {"message": "Saved"}


@router.post("/{app_id}/submit")
def submit_application(app_id: str, current_user: dict = Depends(get_current_user)):
    app = apps_db.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app["owner_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if app["status"] != "draft":
        raise HTTPException(
            status_code=400, detail="Application is not in draft status"
        )
    apps_db.update_application_status(app_id, "submitted")
    return {"message": "Application submitted"}


@router.get("/{app_id}/comments")
def get_comments(app_id: str, current_user: dict = Depends(get_current_user)):
    app = apps_db.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if (
        current_user["role"] == UserRole.applicant
        and app["owner_email"] != current_user["email"]
    ):
        raise HTTPException(status_code=403, detail="Access denied")
    return apps_db.get_comments(app_id)


@router.post(
    "/{app_id}/comments",
    dependencies=[Depends(require_reviewer_or_admin)],
    status_code=201,
)
def add_comment(
    app_id: str, body: CommentCreate, current_user: dict = Depends(get_current_user)
):
    app = apps_db.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return apps_db.add_comment(app_id, current_user["email"], body.content)
