"""Pydantic request/response schemas."""
from typing import Any, Optional

from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str


class ProjectRename(BaseModel):
    name: str


class FileCreate(BaseModel):
    name: str
    type: str
    parent_id: Optional[int] = None
    modified: bool = False
    sort_order: int = 0


class FileUpdate(BaseModel):
    name: Optional[str] = None
    modified: Optional[bool] = None
    sort_order: Optional[int] = None


class UIChangeCreate(BaseModel):
    html_code: str = ""
    ui_state: Any = None


class ProjectUIState(BaseModel):
    ui_state: Any


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    session_id: Optional[str] = None
    current_state: Any = None


class UIApplyRequest(BaseModel):
    request: str
    current_state: list[dict] = []
    selected_ids: list[str] = []
    messages: list[ChatMessage] = []
