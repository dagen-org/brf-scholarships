from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user, require_admin, require_reviewer_or_admin
from app.db import applications as apps_db
from app.db import windows as windows_db
from app.models.application import (
    ApplicationCreate,
    ApplicationDataUpdate,
    CommentCreate,
    CommentUpdate,
)
from app.models.user import UserRole

router = APIRouter()


@router.post("/", status_code=201)
def create_application(
    body: ApplicationCreate, current_user: dict = Depends(get_current_user)
):
    window = windows_db.get_window(body.window_id)
    if not window:
        raise HTTPException(status_code=404, detail="Application window not found")

    is_applicant = current_user["role"] == UserRole.applicant
    is_test_window = window.get("window_type") == "testing"

    if window.get("archived"):
        raise HTTPException(status_code=409, detail="Application window is archived")

    if not is_applicant and not is_test_window:
        raise HTTPException(
            status_code=403,
            detail="Only applicants can create applications in live windows",
        )

    existing = apps_db.get_applications_by_user(current_user["email"])
    if not is_test_window and any(
        a["status"] in ("draft", "submitted") for a in existing
    ):
        raise HTTPException(
            status_code=409, detail="You already have an active application"
        )

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


@router.post(
    "/window/{window_id}/close",
    dependencies=[Depends(require_admin)],
)
def close_window_applications(window_id: str):
    """Auto-submit all draft applications for a closed window."""
    window = windows_db.get_window(window_id)
    if not window:
        raise HTTPException(status_code=404, detail="Window not found")
    today = date_type.today().isoformat()
    if window["end_date"] >= today:
        raise HTTPException(status_code=400, detail="Window has not yet closed")
    apps = apps_db.get_applications_by_window(window_id)
    count = 0
    for app in apps:
        if app["status"] == "draft":
            apps_db.update_application_status(app["app_id"], "submitted")
            count += 1
    return {"auto_submitted": count}


@router.get("/{app_id}")
def get_application(app_id: str, current_user: dict = Depends(get_current_user)):
    app = apps_db.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
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
    window = windows_db.get_window(app["window_id"])
    if window and window.get("archived"):
        raise HTTPException(status_code=400, detail="Application window is archived")
    if (
        window
        and window.get("window_type") != "testing"
        and date_type.today().isoformat() > window["end_date"]
    ):
        raise HTTPException(status_code=400, detail="Application window has closed")
    apps_db.update_application_data(app_id, body.data)
    return {"message": "Saved"}


@router.delete("/{app_id}", status_code=204)
def delete_application(app_id: str, current_user: dict = Depends(get_current_user)):
    app = apps_db.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app["owner_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Access denied")
    window = windows_db.get_window(app["window_id"])
    if window and window.get("archived"):
        raise HTTPException(
            status_code=409, detail="Cannot delete an application in an archived window"
        )
    apps_db.delete_application(app_id)


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
    window = windows_db.get_window(app["window_id"])
    if window and window.get("archived"):
        raise HTTPException(status_code=400, detail="Application window is archived")
    apps_db.update_application_status(app_id, "submitted")
    return {"message": "Application submitted"}


@router.get("/{app_id}/comments", dependencies=[Depends(require_reviewer_or_admin)])
def get_comments(app_id: str):
    app = apps_db.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
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
    return apps_db.add_comment(
        app_id, current_user["email"], body.content, body.category
    )


@router.put(
    "/{app_id}/comments/{comment_id}",
    dependencies=[Depends(require_reviewer_or_admin)],
)
def update_comment(
    app_id: str,
    comment_id: str,
    body: CommentUpdate,
    current_user: dict = Depends(get_current_user),
):
    comment = apps_db.get_comment(app_id, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Note not found")
    if comment["author_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="You can only edit your own notes")
    apps_db.update_comment(app_id, comment_id, body.content)
    return {**comment, "content": body.content}


@router.delete(
    "/{app_id}/comments/{comment_id}",
    dependencies=[Depends(require_reviewer_or_admin)],
    status_code=204,
)
def delete_comment(
    app_id: str,
    comment_id: str,
    current_user: dict = Depends(get_current_user),
):
    comment = apps_db.get_comment(app_id, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Note not found")
    if comment["author_email"] != current_user["email"]:
        raise HTTPException(
            status_code=403, detail="You can only delete your own notes"
        )
    apps_db.delete_comment(app_id, comment_id)
