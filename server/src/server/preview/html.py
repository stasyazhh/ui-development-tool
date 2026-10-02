"""Generate the interactive preview HTML page for a project."""
import json

from fastapi.responses import HTMLResponse

from server.preview.constants import AB_H, AB_W, AB_X, AB_Y
from server.preview.layout import find_chat_input_ids, find_content_bounds
from server.preview.render import color_prop, esc, render_component
from server.projects_manager.models import Project


SCRIPT_TEMPLATE = """
const sessionId = "preview-" + Math.random().toString(36).slice(2);
const projectId = "{project_id}";
const initialUiState = {preview_ui_state_json};
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
    const res = await fetch(`/api/preview/${{projectId}}/chat`, {{
      method: "POST",
      headers: {{"Content-Type":"application/json"}},
      body: JSON.stringify({{messages: messages, session_id: sessionId, current_state: initialUiState}})
    }});
    if (!res.ok) throw new Error("Ошибка сети " + res.status);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    const reply = data.reply || "";
    assistantEl.innerHTML = formatMarkdown(reply);
    container.scrollTop = container.scrollHeight;
    messages.push({{role:"assistant", content: reply}});
    if (data.state_changed) {{
      addMessage("Интерфейс обновлён. Перезагрузка...", "system");
      setTimeout(() => window.location.reload(), 1200);
      return;
    }}
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

addMessage("Ассистент готов к диалогу.", "system");
if (input) input.focus();
"""


def preview_html(project: Project, ui_state: list[dict]) -> HTMLResponse:
    dialog_types = {"Bubble", "Typing", "QuickReply", "Prompt"}
    chat_input_ids = find_chat_input_ids(ui_state)
    static_elements = [
        render_component(c, offset_x=AB_X, offset_y=AB_Y)
        for c in ui_state
        if c.get("type") not in dialog_types and c.get("id") not in chat_input_ids
    ]

    preview_ui_state_json = json.dumps(ui_state, ensure_ascii=False)
    header_bottom, footer_top = find_content_bounds(ui_state)
    messages_top = max(0, header_bottom)
    messages_bottom = max(56, AB_H - footer_top)

    assistant_bg = color_prop(ui_state, ("Bubble",), "bg", "rgba(255,255,255,0.08)")
    assistant_color = color_prop(ui_state, ("Bubble",), "color", "#ffffff")
    user_bg = color_prop(ui_state, ("Button",), "bg", "#5b7fff")
    user_color = color_prop(ui_state, ("Button",), "color", "#ffffff")
    input_bg = color_prop(ui_state, ("Prompt", "TextField"), "bg", "#111113")
    input_color = color_prop(ui_state, ("Prompt", "TextField"), "color", "#ccccd8")

    script = SCRIPT_TEMPLATE.format(
        project_id=project.id,
        preview_ui_state_json=preview_ui_state_json,
    )

    html = f"""<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{esc(project.name)} · Превью</title>
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
  <script>{script}</script>
</body>
</html>"""
    return HTMLResponse(content=html)
