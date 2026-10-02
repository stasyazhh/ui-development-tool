"""OpenCode AI streaming/non-streaming client."""
import asyncio
import json
import uuid
from typing import Any, AsyncGenerator, Optional

import httpx
from fastapi import HTTPException
from fastapi.responses import StreamingResponse

from server.config import AI_API_KEY, AI_BASE_URL, AI_MODEL


async def stream_chat(
    messages: list[dict[str, str]],
    session_id: Optional[str] = None,
    api_key: Optional[str] = None,
) -> StreamingResponse:
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

    async def event_generator() -> AsyncGenerator[str, None]:
        for attempt in range(3):
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
                            error_msg = (
                                f"Ошибка сервера OpenCode: Статус {response.status_code}"
                            )
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
                        return
            except httpx.HTTPError as exc:
                if attempt < 2:
                    await asyncio.sleep(2 ** attempt)
                    continue
                error_msg = f"Не удалось подключиться к ИИ-серверу ({AI_BASE_URL}): {exc}"
                yield f"data: {json.dumps({'error': error_msg})}\n\n"
            except Exception as exc:
                error_msg = f"Внутренняя ошибка при запросе к ИИ: {exc}"
                yield f"data: {json.dumps({'error': error_msg})}\n\n"
                return

    return StreamingResponse(
        event_generator(), media_type="text/event-stream"
    )


async def call_llm(
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

    for attempt in range(3):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url, headers=headers, json=body, timeout=120
                )
                if response.status_code != 200:
                    error_text = response.text or ""
                    error_msg = (
                        f"Ошибка сервера OpenCode: Статус {response.status_code}"
                    )
                    if error_text:
                        error_msg += f" — {error_text}"
                    raise HTTPException(status_code=502, detail=error_msg)
                data = response.json()
                choices = data.get("choices", [])
                if not choices:
                    raise HTTPException(status_code=502, detail="Пустой ответ от ИИ")
                return choices[0].get("message", {}).get("content", "")
        except httpx.HTTPError as exc:
            if attempt < 2:
                await asyncio.sleep(2 ** attempt)
                continue
            raise HTTPException(
                status_code=502,
                detail=f"Не удалось подключиться к ИИ-серверу ({AI_BASE_URL}): {exc}",
            )

    # Fallback: should never reach here because call_llm either returns or raises.
    raise HTTPException(status_code=502, detail="Не удалось получить ответ от ИИ")
