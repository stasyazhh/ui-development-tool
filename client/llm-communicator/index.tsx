import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { C } from "@/theme"
import type { Msg } from "@/types"
import type { PlacedComp } from "../ui-kit/constants"

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api"

function renderText(text: string) {
  const tokens: Array<{ type: "text" | "bold" | "code"; content: string }> = []
  const regex = /\*\*(.+?)\*\*|`([^`]+)`/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", content: text.slice(lastIndex, match.index) })
    }
    if (match[1] !== undefined) {
      tokens.push({ type: "bold", content: match[1] })
    } else if (match[2] !== undefined) {
      tokens.push({ type: "code", content: match[2] })
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) {
    tokens.push({ type: "text", content: text.slice(lastIndex) })
  }

  return tokens.map((token, i) => {
    if (token.type === "bold") {
      return (
        <b key={i} style={{ fontWeight: 700 }}>
          {token.content}
        </b>
      )
    }
    if (token.type === "code") {
      return (
        <code
          key={i}
          style={{
            fontFamily: C.mono,
            fontSize: 11,
            color: C.acc,
            background: C.accA,
            padding: "1px 4px",
            borderRadius: 2,
          }}
        >
          {token.content}
        </code>
      )
    }
    return <span key={i}>{token.content}</span>
  })
}

const SUGGESTIONS = [
  "Измени цвет сообщений ассистента на синий",
  "Сделай кнопки отправки зелеными и круглыми",
  "Поменяй фон чата на темно-серый",
  "Увеличь радиус пузырей сообщений",
]

export default function LLMPanel({
  projectId,
  messages,
  setMessages,
  currentState,
  onApplyState,
  selectedIds = [],
}: {
  projectId: number | null
  messages: Msg[]
  setMessages: React.Dispatch<React.SetStateAction<Msg[]>>
  currentState?: PlacedComp[]
  onApplyState?: (state: PlacedComp[]) => void
  selectedIds?: string[]
}) {
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const sessionId = useRef<string>(`session-${Date.now()}`)
  const recognitionRef = useRef<any>(null)
  const voiceFinalRef = useRef("")

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function send() {
    if (isRecording) stopRecording()
    const text = input.trim()
    if (!text || busy) return
    const time = new Date().toLocaleTimeString("ru", {
      hour: "2-digit",
      minute: "2-digit",
    })

    const userMsg: Msg = { role: "user", text, time }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setBusy(true)
    setError(null)

    const assistantPlaceholder: Msg = {
      role: "assistant",
      text: "Обрабатываю запрос...",
      time,
    }
    setMessages((m) => [...m, assistantPlaceholder])

    try {
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.text,
      }))

      const response = await fetch(`${API_BASE}/ui/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: text,
          current_state: currentState ?? [],
          selected_ids: selectedIds,
          messages: apiMessages,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.detail || `Ошибка ${response.status}`)
      }

      const result = await response.json()
      const reply = result.reply || "Готово"
      const state = result.state as PlacedComp[] | undefined

      setMessages((m) => {
        const next = [...m]
        next[next.length - 1] = {
          role: "assistant",
          text: reply.trim() || "Готово",
          time,
        }
        return next
      })

      if (state && state.length > 0 && onApplyState) {
        onApplyState(state)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка сети"
      setError(msg)
      setMessages((m) => {
        const next = [...m]
        next[next.length - 1] = {
          role: "assistant",
          text: `Ошибка: ${msg}`,
          time,
        }
        return next
      })
    } finally {
      setBusy(false)
    }
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const speechSupported =
    typeof window !== "undefined" &&
    ((window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition)

  function stopRecording() {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
    }
  }

  function startRecording() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    const rec = new SpeechRecognition()
    rec.lang = "ru-RU"
    rec.continuous = false
    rec.interimResults = true

    rec.onstart = () => {
      setIsRecording(true)
      voiceFinalRef.current = ""
      setInput("")
    }

    rec.onend = () => {
      setIsRecording(false)
      if (voiceFinalRef.current) {
        setInput(voiceFinalRef.current)
      }
    }

    rec.onerror = (e: any) => {
      console.error("Speech recognition error", e)
      setIsRecording(false)
      const err = e.error || "unknown"
      if (err === "aborted") return
      let detail = err
      if (err === "not-allowed") {
        detail =
          "нет разрешения на микрофон. Разрешите доступ к микрофону в адресной строке браузера и попробуйте снова"
      }
      if (err === "no-speech") detail = "речь не распознана"
      if (err === "network") {
        detail =
          "нет связи с сервером распознавания речи. Проверьте подключение и доступность Google-сервисов в вашем регионе"
      }
      if (err === "service-not-allowed") {
        detail = "сервис распознавания речи недоступен в этом браузере/регионе"
      }
      const time = new Date().toLocaleTimeString("ru", {
        hour: "2-digit",
        minute: "2-digit",
      })
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: `Ошибка голосового ввода: ${detail}`,
          time,
        },
      ])
    }

    rec.onresult = (e: any) => {
      let interim = ""
      let final = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }
      voiceFinalRef.current += final
      setInput(voiceFinalRef.current + interim)
    }

    recognitionRef.current = rec
    rec.start()
  }

  function toggleRecording() {
    if (isRecording) stopRecording()
    else startRecording()
  }

  return (
    <div
      style={{
        gridArea: "dialog",
        display: "flex",
        flexDirection: "column",
        background: C.s1,
        borderLeft: `1px solid ${C.b1}`,
        fontFamily: C.sans,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 14px",
          borderBottom: `1px solid ${C.b1}`,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontFamily: C.mono,
            color: C.t2,
            letterSpacing: "0.08em",
          }}
        >
          АССИСТЕНТ
        </span>
        <div style={{ flex: 1 }} />
        {busy && (
          <span style={{ fontSize: 10, color: C.acc, fontFamily: C.mono }}>
            ●
          </span>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: "8px 14px",
            fontSize: 11,
            color: "#ff6b6b",
            fontFamily: C.mono,
            borderBottom: `1px solid ${C.b1}`,
          }}
        >
          {error}
        </div>
      )}

      {messages.length <= 2 && !busy && (
        <div
          style={{
            padding: "10px 14px 0",
            borderBottom: `1px solid ${C.b1}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontFamily: C.mono,
              color: C.t2,
              marginBottom: 6,
              letterSpacing: "0.05em",
            }}
          >
            ПОПРОБУЙТЕ ЗАПРОС
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => !busy && setInput(s)}
                style={{
                  background: C.s2,
                  border: `1px solid ${C.b2}`,
                  borderRadius: 2,
                  padding: "4px 8px",
                  fontSize: 10.5,
                  fontFamily: C.sans,
                  color: C.t1,
                  cursor: busy ? "not-allowed" : "pointer",
                  textAlign: "left",
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <div
            style={{
              marginTop: 8,
              paddingBottom: 10,
              fontSize: 10,
              fontFamily: C.sans,
              color: C.t3,
              lineHeight: 1.5,
            }}
          >
            Выделите компоненты на канвасе, чтобы ассистент применял изменения
            только к ним.
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              padding: "5px 14px",
              marginBottom: 2,
              background: m.role === "user" ? C.accA : "transparent",
              borderLeft: `2px solid ${
                m.role === "user" ? C.acc : "transparent"
              }`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                marginBottom: 3,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontFamily: C.mono,
                  fontWeight: 600,
                  color: m.role === "user" ? C.acc : C.t2,
                }}
              >
                {m.role === "user" ? "Вы" : "Ассистент"}
              </span>
              <span style={{ fontSize: 9, fontFamily: C.mono, color: C.t3 }}>
                {m.time}
              </span>
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: C.t1,
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
              }}
            >
              {renderText(m.text)}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div
        style={{
          padding: "6px 14px",
          borderTop: `1px solid ${C.b1}`,
          display: "flex",
          gap: 4,
          flexWrap: "wrap",
          flexShrink: 0,
        }}
      >
        {["chat-tutor.ui", "onboarding.flow"].map((ctx) => (
          <span
            key={ctx}
            style={{
              fontSize: 10,
              fontFamily: C.mono,
              color: C.t2,
              background: C.s2,
              border: `1px solid ${C.b2}`,
              padding: "2px 6px",
              borderRadius: 2,
            }}
          >
            {ctx}
          </span>
        ))}
      </div>

      <div
        style={{
          padding: "10px 14px",
          borderTop: `1px solid ${C.b1}`,
          flexShrink: 0,
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Например: измени цвет сообщений ассистента на синий"
          rows={3}
          disabled={busy}
          style={{
            width: "100%",
            background: C.s2,
            border: `1px solid ${C.b2}`,
            padding: "8px 10px",
            fontSize: 12.5,
            fontFamily: C.sans,
            color: C.t1,
            lineHeight: 1.55,
            boxSizing: "border-box",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 6,
          }}
        >
          <span style={{ fontSize: 10, fontFamily: C.mono, color: C.t3 }}>
            Shift+Enter — новая строка
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {speechSupported && (
              <button
                onClick={toggleRecording}
                title={isRecording ? "Остановить запись" : "Голосовой ввод"}
                style={{
                  background: isRecording ? "#e05555" : "transparent",
                  border: `1px solid ${isRecording ? "#e05555" : C.b2}`,
                  borderRadius: 2,
                  padding: "4px 10px",
                  fontSize: 12,
                  color: isRecording ? "#fff" : C.t2,
                  cursor: "pointer",
                }}
              >
                {isRecording ? "⏹" : "🎤"}
              </button>
            )}
            <button
              onClick={send}
              disabled={busy}
              style={{
                background: C.acc,
                border: "none",
                borderRadius: 2,
                padding: "5px 14px",
                fontSize: 12,
                fontFamily: C.sans,
                color: "#fff",
                fontWeight: 500,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.6 : 1,
              }}
            >
              Отправить ↵
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
