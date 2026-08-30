from enum import Enum

from pydantic import BaseModel


class WindowType(str, Enum):
    testing = "testing"
    live = "live"


class WindowCreate(BaseModel):
    name: str
    window_type: WindowType
    start_date: str  # ISO date string
    end_date: str
    writing_prompt: str | None = None


class WindowPublic(BaseModel):
    window_id: str
    name: str
    window_type: WindowType
    start_date: str
    end_date: str
    writing_prompt: str | None = None
    created_at: str
