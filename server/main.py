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
from fastapi.responses import StreamingResponse, HTMLResponse
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


AB_X = 160
AB_Y = 80
AB_W = 390
AB_H = 720


def _render_component(c: dict, offset_x: int = 0, offset_y: int = 0) -> str:
    comp_type = c.get("type", "")
    x = c.get("x", 0) - offset_x
    y = c.get("y", 0) - offset_y
    w = c.get("w", 100)
    h = c.get("h", 40)
    bg = c.get("bg", "transparent")
    color = c.get("color", "#ffffff")
    radius = c.get("radius", 0)
    text = c.get("text", "")
    style = (
        f"position:absolute;"
        f"left:{x}px;"
        f"top:{y}px;"
        f"width:{w}px;"
        f"height:{h}px;"
        f"background:{bg};"
        f"color:{color};"
        f"border-radius:{radius}px;"
        f"display:flex;"
        f"align-items:center;"
        f"justify-content:center;"
        f"font-size:12px;"
        f"font-family:system-ui,sans-serif;"
        f"overflow:hidden;"
        f"box-sizing:border-box;"
    )
    if comp_type == "Container":
        return f'<div class="ui-static" style="{style} border:1px dashed rgba(255,255,255,0.08);"></div>'
    if comp_type == "Text":
        return f'<div class="ui-static" style="{style} background:transparent; justify-content:flex-start; padding:0 4px;">{_esc(text)}</div>'
    if comp_type in ("Button", "Bubble", "QuickReply", "Prompt"):
        return f'<button class="ui-static quick-reply" data-text="{_esc(text)}" style="{style} border:none; cursor:pointer;">{_esc(text)}</button>'
    if comp_type == "TextField":
        return f'<div class="ui-static" style="{style} justify-content:flex-start; padding:0 8px; opacity:0.4;">{_esc(text or "Ввод...")}</div>'
    if comp_type == "Avatar":
        return f'<div class="ui-static" style="{style} border:none;"><div style="width:80%;height:80%;border-radius:50%;background:{color};display:grid;place-items:center;font-size:{min(w,h)//3}px;color:{bg};">{_esc(text or "")}</div></div>'
    return f'<div class="ui-static" style="{style} border:1px dashed rgba(255,255,255,0.08);">{_esc(text)}</div>'


def _esc(s: str) -> str:
    return (
        str(s)
        .replace("&", "&amp;")
        .replace('"', "&quot;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def _color_prop(state: list, types: tuple, prop: str, default: str) -> str:
    for c in state:
        if c.get("type") in types and prop in c:
            val = str(c[prop]).strip().lower()
            if val and val != "transparent":
                return str(c[prop])
    return default


def _find_chat_input_ids(state: list) -> set:
    ids = set()
    text_fields = [c for c in state if c.get("type") == "TextField"]
    if text_fields:
        input_field = max(text_fields, key=lambda c: c.get("y", 0))
        ids.add(input_field.get("id"))

        ix, iy, iw, ih = (
            input_field.get("x", 0),
            input_field.get("y", 0),
            input_field.get("w", 0),
            input_field.get("h", 0),
        )
        icy = iy + ih / 2

        send_candidates = []
        for b in [c for c in state if c.get("type") == "Button"]:
            bx, by, bw, bh = b.get("x", 0), b.get("y", 0), b.get("w", 0), b.get("h", 0)
            bcy = by + bh / 2
            if bx > ix + iw * 0.5 and abs(bcy - icy) <= max(ih, bh) * 0.8:
                send_candidates.append(b)

        if send_candidates:
            send_candidates.sort(key=lambda b: b.get("x", 0))
            ids.add(send_candidates[0].get("id"))
    return ids


def _is_large_background(c: dict) -> bool:
    if c.get("type") not in ("Container", "Row", "Column", "Card"):
        return False
    w = int(c.get("w", 0))
    h = int(c.get("h", 0))
    return w >= AB_W * 0.85 and h >= AB_H * 0.4


def _find_content_bounds(state: list) -> tuple[int, int]:
    """Return (header_bottom, footer_top) in device-relative coordinates."""
    dialog_types = {"Bubble", "Typing", "QuickReply", "Prompt"}
    chat_input_ids = _find_chat_input_ids(state)
    static = [
        c for c in state
        if c.get("type") not in dialog_types and c.get("id") not in chat_input_ids
    ]
    if not static:
        return (0, AB_H)

    boxes = []
    for c in static:
        y = int(c.get("y", 0)) - AB_Y
        h = max(20, int(c.get("h", 40)))
        # Ignore full-screen or large content-background containers.
        if _is_large_background(c):
            continue
        boxes.append((y, y + h))

    if not boxes:
        return (0, AB_H)

    boxes.sort(key=lambda b: b[0])
    header_bottom = boxes[0][1]
    for y, bottom in boxes[1:]:
        if y - header_bottom <= 20:
            header_bottom = max(header_bottom, bottom)
        else:
            break

    # Cap the header so tall nearby content cards are not treated as header.
    max_header_bottom = AB_H // 4
    header_bottom = min(header_bottom, max_header_bottom)

    boxes_by_bottom = sorted(boxes, key=lambda b: b[1], reverse=True)
    footer_top = boxes_by_bottom[0][0]
    for y, bottom in boxes_by_bottom[1:]:
        if footer_top - bottom <= 20:
            footer_top = min(footer_top, y)
        else:
            break

    if header_bottom >= footer_top:
        return (0, AB_H)

    return (max(0, header_bottom), min(AB_H, footer_top))


@app.get("/preview/{project_id}")
def preview_project(project_id: int):
    project = manager.get_project_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Проект не найден")

    ui_state = manager.get_project_ui_state(project_id) or []

    dialog_types = {"Bubble", "Typing", "QuickReply", "Prompt"}
    chat_input_ids = _find_chat_input_ids(ui_state)
    static_elements = [
        _render_component(c, offset_x=AB_X, offset_y=AB_Y)
        for c in ui_state
        if c.get("type") not in dialog_types and c.get("id") not in chat_input_ids
    ]

    header_bottom, footer_top = _find_content_bounds(ui_state)
    messages_top = max(0, header_bottom)
    messages_bottom = max(56, AB_H - footer_top)

    assistant_bg = _color_prop(ui_state, ("Bubble",), "bg", "rgba(255,255,255,0.08)")
    assistant_color = _color_prop(ui_state, ("Bubble",), "color", "#ffffff")
    user_bg = _color_prop(ui_state, ("Button",), "bg", "#5b7fff")
    user_color = _color_prop(ui_state, ("Button",), "color", "#ffffff")
    input_bg = _color_prop(ui_state, ("Prompt", "TextField"), "bg", "#111113")
    input_color = _color_prop(ui_state, ("Prompt", "TextField"), "color", "#ccccd8")

    html = f'''<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{_esc(project.name)} · Превью</title>
  <style>
    * {{ box-sizing: border-box; }}
    body {{ margin:0; background:#0c0c0e; font-family:system-ui,sans-serif; height:100vh; overflow:hidden; display:flex; align-items:center; justify-content:center; }}
    #device {{ width:{AB_W}px; height:{AB_H}px; background:#1a1a1f; border:1px solid #272730; border-radius:12px; position:relative; overflow:hidden; display:flex; flex-direction:column; }}
    #ui-layer {{ position:absolute; inset:0; overflow:hidden; z-index:1; }}
    .ui-static {{ position:absolute; display:flex; align-items:center; justify-content:center; font-size:12px; overflow:hidden; }}
    #messages-layer {{ position:absolute; top:{messages_top}px; left:0; right:0; bottom:{messages_bottom}px; overflow-y:auto; display:flex; flex-direction:column; justify-content:flex-end; padding:12px; gap:8px; z-index:2; pointer-events:none; }}
    .msg {{ max-width:85%; padding:8px 12px; border-radius:12px; font-size:12px; line-height:1.45; white-space:pre-wrap; pointer-events:auto; }}
    .msg-user {{ align-self:flex-end; background:{user_bg}; color:{user_color}; border-radius:12px 12px 2px 12px; }}
    .msg-assistant {{ align-self:flex-start; background:{assistant_bg}; color:{assistant_color}; border-radius:12px 12px 12px 2px; }}
    .msg-system {{ align-self:center; color:#888; font-size:11px; padding:4px 0; }}
    #chat-form {{ position:absolute; bottom:0; left:0; right:0; height:56px; background:#141417; border-top:1px solid #1c1c22; display:flex; align-items:center; gap:8px; padding:0 12px; z-index:3; }}
    #chat-input {{ flex:1; background:{input_bg}; border:1px solid #272730; border-radius:8px; padding:0 12px; height:36px; color:{input_color}; outline:none; font-size:13px; }}
    #chat-send {{ background:{user_bg}; border:none; border-radius:8px; width:36px; height:36px; color:{user_color}; cursor:pointer; font-size:14px; }}
    #chat-send:disabled {{ opacity:0.5; cursor:not-allowed; }}
    #chat-mic {{ background:#1c1c22; border:1px solid #272730; border-radius:8px; width:36px; height:36px; color:#ccccd8; cursor:pointer; font-size:14px; display:none; }}
    #chat-mic.recording {{ background:#e05555; color:#fff; border-color:#e05555; }}
    #chat-mic:disabled {{ opacity:0.5; cursor:not-allowed; }}
  </style>
</head>
<body>
  <div id="device">
    <div id="ui-layer">{''.join(static_elements)}</div>
    <div id="messages-layer"></div>
    <form id="chat-form" style="position:absolute; bottom:0; left:0; right:0; height:56px; background:#141417; border-top:1px solid #1c1c22; display:flex; align-items:center; gap:8px; padding:0 12px; z-index:3; margin:0;">
      <input id="chat-input" type="text" placeholder="Введите сообщение..." autocomplete="off" />
      <button id="chat-send" type="submit">→</button>
      <button id="chat-mic" type="button" title="Голосовой ввод">🎤</button>
    </form>
  </div>
  <script>
    const sessionId = "preview-" + Math.random().toString(36).slice(2);
    const messages = [];
    const container = document.getElementById("messages-layer");
    const input = document.getElementById("chat-input");
    const sendBtn = document.getElementById("chat-send");

    function formatMarkdown(text) {{
      return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\\*\\*(.+?)\\*\\*/g, "<b>$1</b>");
    }}

    function addMessage(text, role) {{
      const div = document.createElement("div");
      div.className = role === "user" ? "msg msg-user" : role === "assistant" ? "msg msg-assistant" : "msg msg-system";
      div.innerHTML = formatMarkdown(text);
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
      return div;
    }}

    function setInput(enabled) {{
      if (input) input.disabled = !enabled;
      if (sendBtn) sendBtn.disabled = !enabled;
    }}

    async function sendMessage(text) {{
      if (!text.trim()) return;
      addMessage(text, "user");
      messages.push({{role:"user", content:text}});
      if (input) input.value = "";
      setInput(false);
      const assistantEl = addMessage("Обрабатываю запрос...", "assistant");

      try {{
        const res = await fetch("/api/chat", {{
          method: "POST",
          headers: {{"Content-Type":"application/json"}},
          body: JSON.stringify({{messages: messages, session_id: sessionId}})
        }});
        if (!res.ok) throw new Error("Ошибка сети " + res.status);
        if (!res.body) throw new Error("Пустое тело ответа");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let reply = "";
        while (true) {{
          const {{done, value}} = await reader.read();
          if (done) break;
          const lines = decoder.decode(value, {{stream:true}}).split("\\n");
          for (const line of lines) {{
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {{
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.content) {{
                reply += parsed.content;
                assistantEl.innerHTML = formatMarkdown(reply);
                container.scrollTop = container.scrollHeight;
              }}
            }} catch {{}}
          }}
        }}
        messages.push({{role:"assistant", content: reply}});
      }} catch (e) {{
        const msg = e && e.message ? e.message : String(e);
        console.error("sendMessage failed", e);
        assistantEl.textContent = "Ошибка: " + msg;
      }} finally {{
        setInput(true);
        if (input) input.focus();
      }}
    }}

    const form = document.getElementById("chat-form");
    if (form) {{
      form.addEventListener("submit", (e) => {{
        e.preventDefault();
        if (isRecording) stopRecording();
        sendMessage(input ? input.value : "");
      }});
    }}

    document.querySelectorAll(".quick-reply").forEach(btn => {{
      btn.addEventListener("click", () => sendMessage(btn.dataset.text || btn.textContent));
    }});

    const micBtn = document.getElementById("chat-mic");
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isRecording = false;
    let voiceFinalTranscript = "";

    function updateMicButton() {{
      if (!micBtn) return;
      micBtn.textContent = isRecording ? "⏹" : "🎤";
      micBtn.classList.toggle("recording", isRecording);
      micBtn.title = isRecording ? "Остановить запись" : "Голосовой ввод";
    }}

    function stopRecording() {{
      if (recognition && isRecording) recognition.stop();
    }}

    function startRecording() {{
      if (!recognition || !input) return;
      voiceFinalTranscript = "";
      input.value = "";
      recognition.start();
    }}

    if (SpeechRecognitionAPI && micBtn) {{
      recognition = new SpeechRecognitionAPI();
      recognition.lang = "ru-RU";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {{
        isRecording = true;
        updateMicButton();
        if (input) input.placeholder = "Слушаю...";
      }};

      recognition.onend = () => {{
        isRecording = false;
        updateMicButton();
        if (input) input.placeholder = "Введите сообщение...";
        if (voiceFinalTranscript && input) {{
          input.value = voiceFinalTranscript;
          input.focus();
        }}
      }};

      recognition.onerror = (e) => {{
        console.error("Speech recognition error", e);
        isRecording = false;
        updateMicButton();
        if (input) input.placeholder = "Введите сообщение...";
        const err = e.error || "unknown";
        if (err === "aborted") return;
        let detail = err;
        if (detail === "not-allowed") detail = "нет разрешения на микрофон. Разрешите доступ к микрофону в адресной строке браузера и попробуйте снова";
        if (detail === "no-speech") detail = "речь не распознана";
        if (detail === "network") {{
          detail = "нет связи с сервером распознавания речи. Проверьте подключение и доступность Google-сервисов в вашем регионе";
        }}
        if (detail === "service-not-allowed") {{
          detail = "сервис распознавания речи недоступен в этом браузере/регионе";
        }}
        addMessage("Ошибка голосового ввода: " + detail, "system");
      }};

      recognition.onresult = (e) => {{
        let interim = "";
        let final = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {{
          const transcript = e.results[i][0].transcript;
          if (e.results[i].isFinal) {{
            final += transcript;
          }} else {{
            interim += transcript;
          }}
        }}
        voiceFinalTranscript += final;
        if (input) input.value = voiceFinalTranscript + interim;
      }};

      micBtn.style.display = "block";
      micBtn.addEventListener("click", () => {{
        if (isRecording) stopRecording();
        else startRecording();
      }});
    }}

    window.addEventListener("error", (e) => {{
      addMessage("JS ошибка: " + (e.message || "unknown"), "system");
    }});

    addMessage("Ассистент готов к диалогу", "system");
    if (input) input.focus();
  </script>
</body>
</html>'''
    return HTMLResponse(content=html)
