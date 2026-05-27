from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import require_admin, require_reviewer_or_admin
from app.db import windows as windows_db
from app.models.window import WindowCreate, WindowType

router = APIRouter()


@router.post("/", dependencies=[Depends(require_admin)], status_code=201)
def create_window(body: WindowCreate):
    window = windows_db.create_window(body.model_dump(mode="json"))
    return window


@router.get("/")
def list_windows(window_type: WindowType | None = None):
    return windows_db.list_windows(window_type)


@router.get("/active")
def get_active_window():
    """Returns the currently active live window, if any."""
    window = windows_db.get_active_live_window()
    if not window:
        raise HTTPException(status_code=404, detail="No active application window")
    return window


@router.get("/archived", dependencies=[Depends(require_reviewer_or_admin)])
def list_archived_windows():
    return windows_db.list_archived_windows()


@router.get("/{window_id}")
def get_window(window_id: str):
    window = windows_db.get_window(window_id)
    if not window:
        raise HTTPException(status_code=404, detail="Window not found")
    return window


@router.put("/{window_id}", dependencies=[Depends(require_admin)])
def update_window(window_id: str, body: WindowCreate):
    existing = windows_db.get_window(window_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Window not found")
    if existing.get("archived"):
        raise HTTPException(status_code=409, detail="Cannot edit an archived window")
    updated = windows_db.update_window(window_id, body.model_dump(mode="json"))
    return updated


@router.delete("/{window_id}", dependencies=[Depends(require_admin)], status_code=204)
def delete_window(window_id: str):
    window = windows_db.get_window(window_id)
    if not window:
        raise HTTPException(status_code=404, detail="Window not found")
    if window.get("archived"):
        raise HTTPException(status_code=409, detail="Cannot delete an archived window")
    windows_db.delete_window(window_id)


@router.post("/{window_id}/archive", dependencies=[Depends(require_admin)])
def archive_window(window_id: str):
    window = windows_db.get_window(window_id)
    if not window:
        raise HTTPException(status_code=404, detail="Window not found")
    if window.get("archived"):
        raise HTTPException(status_code=409, detail="Window is already archived")
    windows_db.archive_window(window_id)
    return {**window, "archived": True}


@router.post("/{window_id}/unarchive", dependencies=[Depends(require_admin)])
def unarchive_window(window_id: str):
    window = windows_db.get_window(window_id)
    if not window:
        raise HTTPException(status_code=404, detail="Window not found")
    if not window.get("archived"):
        raise HTTPException(status_code=409, detail="Window is not archived")
    windows_db.unarchive_window(window_id)
    return {**window, "archived": False}
