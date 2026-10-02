"""UI assistant logic: prompt building, JSON extraction, state normalization."""
import json
from typing import Any

from fastapi import HTTPException

from server.ai.client import call_llm
from server.ai.constants import UI_COMPONENT_TYPES, UI_SYSTEM_PROMPT
from server.schemas import UIApplyRequest


VALID_ACTIONS = {"replace", "add", "remove", "update", "none"}


def extract_json(text: str) -> dict:
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


def normalize_ui_state(state: Any) -> list[dict]:
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


async def apply_ui(
    payload: UIApplyRequest,
    session_id: str | None = None,
    api_key: str | None = None,
) -> dict:
    conversation = [
        {"role": message.role, "content": message.content}
        for message in payload.messages
    ]
    conversation.append(
        {
            "role": "user",
            "content": json.dumps(
                {
                    "current_state": payload.current_state,
                    "selected_ids": payload.selected_ids,
                    "request": payload.request,
                },
                ensure_ascii=False,
            ),
        }
    )

    messages = [
        {"role": "system", "content": UI_SYSTEM_PROMPT},
        *conversation,
    ]

    try:
        content = await call_llm(messages, session_id, api_key)
        parsed = extract_json(content)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502, detail=f"ИИ вернул некорректный JSON: {exc}"
        )
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise
        raise HTTPException(
            status_code=502, detail=f"Ошибка обработки ответа ИИ: {exc}"
        )

    action = parsed.get("action", "none")
    reply = parsed.get("reply", "")
    state = normalize_ui_state(parsed.get("state"))

    return {
        "reply": reply or ("Изменения применены" if state else "Готово"),
        "action": action if action in VALID_ACTIONS else "none",
        "state": state,
    }
