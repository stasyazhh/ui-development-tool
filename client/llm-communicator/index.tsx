import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { C } from "@/theme"
import { initMessages, type Msg } from "@/types"

function renderText(text: string) {
  return text.split("`").map((part, i) =>
    i % 2 === 1 ? (
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
        {part}
      </code>
    ) : (
      part
    ),
  )
}

export default function LLMPanel() {
  const [msgs, setMsgs] = useState<Msg[]>(initMessages)
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [msgs])

  function send() {
    const text = input.trim()
    if (!text) return
    const time = new Date().toLocaleTimeString("ru", {
      hour: "2-digit",
      minute: "2-digit",
    })
    setMsgs((m) => [...m, { role: "user", text, time }])
    setInput("")
    setTimeout(() => {
      setMsgs((m) => [
        ...m,
        { role: "assistant", text: "Обрабатываю запрос...", time },
      ])
    }, 700)
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: C.s2,
            border: `1px solid ${C.b2}`,
            borderRadius: 2,
            padding: "3px 8px",
            fontSize: 10.5,
            color: C.t2,
            fontFamily: C.mono,
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {msgs.map((m, i) => (
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
            style={{
              background: C.acc,
              border: "none",
              borderRadius: 2,
              padding: "5px 14px",
              fontSize: 12,
              fontFamily: C.sans,
              color: "#fff",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Отправить ↵
          </button>
        </div>
      </div>
    </div>
  )
}
