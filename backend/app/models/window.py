from enum import Enum
from pydantic import BaseModel
from typing import Optional


class WindowType(str, Enum):
    testing = "testing"
    live = "live"


class WindowCreate(BaseModel):
    name: str
    window_type: WindowType
    start_date: str  # ISO date string
    end_date: str
    writing_prompt: Optional[str] = None


class WindowPublic(BaseModel):
    window_id: str
    name: str
    window_type: WindowType
    start_date: str
    end_date: str
    writing_prompt: Optional[str] = None
    created_at: str
