import json
import os
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from projects_manager12.projects_manager import ProjectsManager

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME", "ui_projects_db"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "password"),
}

AI_BASE_URL = os.getenv("AI_BASE_URL", "https://opencode.ai/zen/go/v1")
AI_MODEL = os.getenv("AI_MODEL", "kimi-k2.7-code")
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
    session_id: Optional[str] = None


class UIApplyRequest(BaseModel):
    request: str
    current_state: list[dict] = []
    selected_ids: list[str] = []
    messages: list[ChatMessage] = []


UI_COMPONENT_TYPES = [
    "Container", "Row", "Column", "Divider", "Spacer",
    "TextField", "Select", "Toggle", "Slider", "Button",
    "Text", "Avatar", "Badge", "Progress", "Card",
    "Bubble", "Typing", "QuickReply", "Prompt",
]

UI_SYSTEM_PROMPT = """Ты — ассистент визуального UI-конструктора. Пользователь редактирует мобильный интерфейс на темном фоне.

Текущее состояние интерфейса передано в поле current_state. Идентификаторы выбранных пользователем компонентов — в поле selected_ids. Запрос пользователя — в поле request.

Твоя задача — понять запрос и вернуть строго JSON без пояснений вне блока кода.

Формат ответа:
{
  "reply": "краткий текстовый ответ пользователю на русском языке",
  "action": "replace",
  "state": [
    {"id": "Button-1", "type": "Button", "x": 200, "y": 200, "w": 120, "h": 36, "bg": "#3ecf8e", "color": "#ffffff", "radius": 2, "text": "Кнопка 1"}
  ]
}

Правила:
- action всегда "replace" — возвращаешь полное новое состояние интерфейса.
- Если запрос не касается изменения интерфейса, верни action: "none" и пустой state: [].
- Доступные type: Container, Row, Column, Divider, Spacer, TextField, Select, Toggle, Slider, Button, Text, Avatar, Badge, Progress, Card, Bubble, Typing, QuickReply, Prompt.
- Координаты: канвас 2000x1600. Основная область (артборд) начинается в (160, 80) и имеет размер 390x720. Размещай компоненты внутри артборда, x и y — левый верхний угол.
- w и h — ширина и высота. color — цвет текста/иконки. bg — цвет фона. radius — радиус скругления. text — текст на компоненте.
- id должен быть уникальным, используй формат "<Type>-<номер>". Сохраняй id существующих компонентов, если они не удаляются.
- Если selected_ids не пусто, пользователь обращается к выбранным компонентам. Запросы вроде "перекрась выбранные", "удали их", "измени их" или просто "перекрась в красный" при наличии selected_ids должны применяться именно к этим компонентам.
- Компоненты, перечисленные в selected_ids, должны присутствовать в возвращаемом state, если пользователь не просил их удалить. Если просил удалить — исключи их из state.
- Отвечай только JSON, без markdown-разметки вне JSON."""


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


async def _stream_chat(
    messages: list[dict[str, str]],
    session_id: Optional[str] = None,
    api_key: Optional[str] = None,
):
    key = api_key or AI_API_KEY
    if not key:
        raise HTTPException(status_code=500, detail="AI_API_KEY не настроен")

    url = f"{AI_BASE_URL.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
        "User-Agent": "ui-development-tool/1.0",
        "x-opencode-session": session_id or str(uuid.uuid4()),
    }
    body = {
        "model": AI_MODEL,
        "messages": messages,
        "stream": True,
    }

    async def event_generator():
        try:
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST", url, headers=headers, json=body, timeout=120
                ) as response:
                    if response.status_code != 200:
                        error_text = ""
                        try:
                            error_text = await response.aread()
                        except Exception:
                            pass
                        error_msg = f"Ошибка сервера OpenCode: Статус {response.status_code}"
                        if error_text:
                            error_msg += f" — {error_text.decode('utf-8', errors='replace')}"
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
        except httpx.HTTPError as exc:
            error_msg = f"Не удалось подключиться к ИИ-серверу ({AI_BASE_URL}): {exc}"
            yield f"data: {json.dumps({'error': error_msg})}\n\n"
        except Exception as exc:
            error_msg = f"Внутренняя ошибка при запросе к ИИ: {exc}"
            yield f"data: {json.dumps({'error': error_msg})}\n\n"

    return StreamingResponse(
        event_generator(), media_type="text/event-stream"
    )


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("{") and text.endswith("}"):
        return json.loads(text)
    start = text.find("```json")
    if start != -1:
        start += 7
        end = text.find("```", start)
        if end != -1:
            return json.loads(text[start:end].strip())
    start = text.find("```")
    if start != -1:
        start += 3
        end = text.find("```", start)
        if end != -1:
            return json.loads(text[start:end].strip())
    raise ValueError("JSON не найден в ответе")


def _normalize_ui_state(state: Any) -> list[dict]:
    if not isinstance(state, list):
        return []
    normalized = []
    for item in state:
        if not isinstance(item, dict):
            continue
        comp_type = item.get("type")
        if comp_type not in UI_COMPONENT_TYPES:
            continue
        comp = {
            "id": str(item.get("id") or f"{comp_type}-{len(normalized) + 1}"),
            "type": comp_type,
            "x": max(0, int(item.get("x", 0))),
            "y": max(0, int(item.get("y", 0))),
            "w": max(20, int(item.get("w", 120))),
            "h": max(20, int(item.get("h", 40))),
        }
        if "color" in item:
            comp["color"] = str(item["color"])
        if "bg" in item:
            comp["bg"] = str(item["bg"])
        if "radius" in item:
            comp["radius"] = max(0, int(item["radius"]))
        if "text" in item:
            comp["text"] = str(item["text"])
        normalized.append(comp)
    return normalized


async def _call_llm(
    messages: list[dict[str, str]],
    session_id: Optional[str] = None,
    api_key: Optional[str] = None,
) -> str:
    key = api_key or AI_API_KEY
    if not key:
        raise HTTPException(status_code=500, detail="AI_API_KEY не настроен")

    url = f"{AI_BASE_URL.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "User-Agent": "ui-development-tool/1.0",
        "x-opencode-session": session_id or str(uuid.uuid4()),
    }
    body = {
        "model": AI_MODEL,
        "messages": messages,
        "stream": False,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=body, timeout=120)
        if response.status_code != 200:
            error_text = response.text or ""
            error_msg = f"Ошибка сервера OpenCode: Статус {response.status_code}"
            if error_text:
                error_msg += f" — {error_text}"
            raise HTTPException(status_code=502, detail=error_msg)
        data = response.json()
        choices = data.get("choices", [])
        if not choices:
            raise HTTPException(status_code=502, detail="Пустой ответ от ИИ")
        return choices[0].get("message", {}).get("content", "")


async def _apply_ui(
    payload: UIApplyRequest,
    session_id: Optional[str] = None,
    api_key: Optional[str] = None,
) -> dict:
    conversation = [{"role": m.role, "content": m.content} for m in payload.messages]
    conversation.append({
        "role": "user",
        "content": json.dumps({
            "current_state": payload.current_state,
            "selected_ids": payload.selected_ids,
            "request": payload.request,
        }, ensure_ascii=False),
    })

    messages = [
        {"role": "system", "content": UI_SYSTEM_PROMPT},
        *conversation,
    ]

    try:
        content = await _call_llm(messages, session_id, api_key)
        parsed = _extract_json(content)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail=f"ИИ вернул некорректный JSON: {exc}")
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise
        raise HTTPException(status_code=502, detail=f"Ошибка обработки ответа ИИ: {exc}")

    action = parsed.get("action", "none")
    reply = parsed.get("reply", "")
    state = _normalize_ui_state(parsed.get("state"))

    return {
        "reply": reply or ("Изменения применены" if state else "Готово"),
        "action": action if action in ("replace", "add", "remove", "update", "none") else "none",
        "state": state,
    }


@app.post("/api/chat")
async def chat(payload: ChatRequest, request: Request):
    messages = [{"role": m.role, "content": m.content} for m in payload.messages]
    api_key = request.headers.get("x-api-key") or AI_API_KEY
    return await _stream_chat(messages, payload.session_id, api_key)


@app.post("/api/ui/apply")
async def apply_ui(payload: UIApplyRequest, request: Request):
    api_key = request.headers.get("x-api-key") or AI_API_KEY
    session_id = str(uuid.uuid4())
    return await _apply_ui(payload, session_id, api_key)
