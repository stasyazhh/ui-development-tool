import json
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Optional

import httpx
from dotenv import load_dotenv

load_dotenv()
from dotenv import load_dotenv 
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from projects_manager12.projects_manager import ProjectsManager

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME", "ui_projects_db"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "password"),
}

load_dotenv()

AI_BASE_URL = os.getenv("AI_BASE_URL", "https://opencode.ai/zen/go/v1/responses")
AI_MODEL = os.getenv("AI_MODEL", "grok-4.6")
AI_API_KEY = os.getenv("AI_API_KEY")

manager = ProjectsManager(DB_CONFIG)

SCHEMA_PATH = Path(__file__).parent / "projects_manager12" / "schema.sql"


@asynccontextmanager
async def lifespan(app: FastAPI):
    manager.connect()
    try:
        if SCHEMA_PATH.exists():
            with manager.connection.cursor() as cur:
                cur.execute(SCHEMA_PATH.read_text())
                manager.connection.commit()
        manager.seed_default_project()
    except Exception as e:
        manager.connection.rollback()
        raise RuntimeError(f"Не удалось инициализировать БД: {e}")
    yield
    manager.disconnect()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    html_code: str
    ui_state: Any = None


class ProjectUIState(BaseModel):
    ui_state: Any


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@app.get("/api/projects")
def list_projects():
    projects = manager.get_all_projects()
    return {"projects": [p.to_dict() for p in projects]}


@app.post("/api/projects")
def create_project(payload: ProjectCreate):
    try:
        project = manager.create_project(payload.name)
        return project.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/projects/{project_id}")
def get_project(project_id: int):
    project = manager.get_project_with_files(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return project


@app.patch("/api/projects/{project_id}")
def rename_project(project_id: int, payload: ProjectRename):
    project = manager.update_project(project_id, payload.name)
    if project is None:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return project.to_dict()


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: int):
    deleted = manager.delete_project(project_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return {"ok": True}


@app.get("/api/projects/{project_id}/files")
def list_files(project_id: int):
    project = manager.get_project_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return {"files": manager.get_project_files(project_id)}


@app.post("/api/projects/{project_id}/files")
def create_file(project_id: int, payload: FileCreate):
    project = manager.get_project_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Проект не найден")
    try:
        return manager.create_file_node(
            project_id=project_id,
            name=payload.name,
            type=payload.type,
            parent_id=payload.parent_id,
            modified=payload.modified,
            sort_order=payload.sort_order,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.patch("/api/files/{file_id}")
def update_file(file_id: int, payload: FileUpdate):
    updated = manager.update_file_node(
        file_id,
        new_name=payload.name,
        modified=payload.modified,
        sort_order=payload.sort_order,
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Файл не найден")
    return updated


@app.delete("/api/files/{file_id}")
def delete_file(file_id: int):
    deleted = manager.delete_file_node(file_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Файл не найден")
    return {"ok": True}


@app.get("/api/projects/{project_id}/ui-changes")
def list_ui_changes(project_id: int):
    project = manager.get_project_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return {"changes": manager.get_ui_changes(project_id)}


@app.post("/api/projects/{project_id}/ui-changes")
def create_ui_change(project_id: int, payload: UIChangeCreate):
    project = manager.get_project_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Проект не найден")
    try:
        return manager.record_ui_change(
            project_id,
            payload.html_code,
            payload.ui_state,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/projects/{project_id}/ui-state")
def get_project_ui_state(project_id: int):
    project = manager.get_project_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return {"ui_state": manager.get_project_ui_state(project_id)}


@app.patch("/api/projects/{project_id}/ui-state")
def update_project_ui_state(project_id: int, payload: ProjectUIState):
    project = manager.get_project_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Проект не найден")
    try:
        updated = manager.update_project_ui_state(project_id, payload.ui_state)
        if not updated:
            raise HTTPException(status_code=404, detail="Проект не найден")
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка сохранения ui_state: {e}")


async def _stream_chat(messages: list[dict[str, str]]):
    if not AI_API_KEY:
        raise HTTPException(status_code=500, detail="AI_API_KEY не настроен")

    url = f"{AI_BASE_URL.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {AI_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
    }
    body = {
        "model": AI_MODEL,
        "messages": messages,
        "stream": True,
    }

    async def event_generator():
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST", url, headers=headers, json=body, timeout=120
            ) as response:
                if response.status_code != 200:
                    error_msg = f"Ошибка сервера OpenCode: Статус {response.status_code}"
                    yield f"data: {json.dumps({'error': error_msg})}\n\n"
                    return
                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                        choices = chunk.get("choices", [])
                        if choices and len(choices) > 0:
                            delta = choices[0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield f"data: {json.dumps({'content': content})}\n\n"
                    except json.JSONDecodeError:
                        continue
                yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(), media_type="text/event-stream"
    )


@app.post("/api/chat")
async def chat(payload: ChatRequest):
    messages = [{"role": m.role, "content": m.content} for m in payload.messages]
    return await _stream_chat(messages)
