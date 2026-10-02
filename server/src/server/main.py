"""FastAPI application with all API routes."""
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from server.ai.client import stream_chat
from server.ai.ui import apply_ui
from server.config import DB_CONFIG, SCHEMA_PATH
from server.preview.html import preview_html
from server.projects_manager.manager import ProjectsManager
from server.schemas import (
    ChatRequest,
    FileCreate,
    FileUpdate,
    ProjectCreate,
    ProjectRename,
    ProjectUIState,
    UIApplyRequest,
    UIChangeCreate,
)

manager = ProjectsManager(DB_CONFIG)


@asynccontextmanager
async def lifespan(app: FastAPI):
    manager.connect()
    try:
        if SCHEMA_PATH.exists():
            with manager.db.cursor() as cur:
                cur.execute(SCHEMA_PATH.read_text())
                manager.db.commit()
        manager.seed_default_project()
    except Exception as e:
        manager.db.rollback()
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


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# Files
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# UI state / UI changes
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# Chat / UI apply
# ---------------------------------------------------------------------------
@app.post("/api/chat")
async def chat(payload: ChatRequest, request: Request):
    messages = [{"role": m.role, "content": m.content} for m in payload.messages]
    api_key = request.headers.get("x-api-key")
    return await stream_chat(messages, payload.session_id, api_key)


@app.post("/api/ui/apply")
async def apply_ui_endpoint(payload: UIApplyRequest, request: Request):
    api_key = request.headers.get("x-api-key")
    session_id = str(uuid.uuid4())
    return await apply_ui(payload, session_id, api_key)


# ---------------------------------------------------------------------------
# Preview
# ---------------------------------------------------------------------------
@app.get("/preview/{project_id}")
def preview_project(project_id: int):
    project = manager.get_project_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Проект не найден")
    ui_state = manager.get_project_ui_state(project_id) or []
    return preview_html(project, ui_state)


@app.post("/api/preview/{project_id}/chat")
async def preview_chat(project_id: int, payload: ChatRequest, request: Request):
    """Chat endpoint used by the runtime preview.

    It reuses the UI assistant so users can ask the running assistant to adapt
    its own interface. When a UI change is returned it is persisted and the
    caller can reload the preview to see the result.
    """
    project = manager.get_project_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Проект не найден")

    ui_state = manager.get_project_ui_state(project_id) or []
    api_key = request.headers.get("x-api-key")
    session_id = payload.session_id or str(uuid.uuid4())

    request_text = ""
    if payload.messages:
        for m in reversed(payload.messages):
            if m.role == "user":
                request_text = m.content
                break

    apply_payload = UIApplyRequest(
        request=request_text,
        current_state=payload.current_state if payload.current_state is not None else ui_state,
        selected_ids=[],
        messages=[*payload.messages],
    )

    result = await apply_ui(apply_payload, session_id, api_key)
    state = result.get("state")
    state_changed = bool(state)

    if state_changed:
        try:
            manager.update_project_ui_state(project_id, state)
            manager.record_ui_change(project_id, "", state)
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Не удалось сохранить изменения интерфейса: {e}"
            )

    return {"reply": result.get("reply", "Готово"), "state_changed": state_changed}
