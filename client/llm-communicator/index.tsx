import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { C } from "@/theme"
import type { Msg } from "@/types"

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api"

function renderText(text: string) {
  const tokens: Array<{ type: "text" | "bold" | "code" content: string }> = []
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

export default function LLMPanel({
  projectId,
  messages,
  setMessages,
}: {
  projectId: number | null
  messages: Msg[]
  setMessages: React.Dispatch<React.SetStateAction<Msg[]>>
}) {
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const sessionId = useRef<string>(`session-${Date.now()}`)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function send() {
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

      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          session_id: sessionId.current,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.detail || `Ошибка ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("Нет ответа от сервера")

      let reply = ""
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6)
          if (data === "[DONE]") continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.content) reply += parsed.content
          } catch {
            // ignore malformed lines
          }
        }
      }

      setMessages((m) => {
        const next = [...m]
        next[next.length - 1] = {
          role: "assistant",
          text: reply.trim() || "Готово",
          time,
        }
        return next
      })
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
          placeholder="Поставьте задачу... (Enter для отправки)"
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
  )
}
