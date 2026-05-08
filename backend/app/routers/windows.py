from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import require_admin
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


@router.get("/{window_id}")
def get_window(window_id: str):
    window = windows_db.get_window(window_id)
    if not window:
        raise HTTPException(status_code=404, detail="Window not found")
    return window


@router.put("/{window_id}", dependencies=[Depends(require_admin)])
def update_window(window_id: str, body: WindowCreate):
    updated = windows_db.update_window(window_id, body.model_dump(mode="json"))
    if not updated:
        raise HTTPException(status_code=404, detail="Window not found")
    return updated


@router.delete("/{window_id}", dependencies=[Depends(require_admin)], status_code=204)
def delete_window(window_id: str):
    if not windows_db.get_window(window_id):
        raise HTTPException(status_code=404, detail="Window not found")
    windows_db.delete_window(window_id)
