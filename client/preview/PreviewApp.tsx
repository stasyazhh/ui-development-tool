import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { C } from "@/theme"
import type { Device, Msg } from "@/types"
import { uiStateApi } from "@/api"
import type { PlacedComp } from "../ui-kit/constants"
import { AB, effectiveProps } from "../ui-kit/constants"
import CompPreview from "../ui-kit/CompPreview"

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api"

function parseProjectId(): number | null {
  const match = window.location.pathname.match(/\/preview\/(\d+)/)
  if (!match) return null
  const id = parseInt(match[1], 10)
  return isNaN(id) ? null : id
}

export default function PreviewApp() {
  const [projectId] = useState<number | null>(parseProjectId)
  const [device, setDevice] = useState<Device>("mobile")
  const [placed, setPlaced] = useState<PlacedComp[]>([])
  const [loading, setLoading] = useState(false)
  const [scale, setScale] = useState(1)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const sessionId = useRef<string>(`preview-session-${Date.now()}`)

  const dialogTypes = new Set(["Bubble", "Typing", "QuickReply", "Prompt"])

  const visiblePlaced = placed.filter((c) => !dialogTypes.has(c.type))

  const bubbleComp = placed.find((c) => c.type === "Bubble")
  const bubbleProps = bubbleComp ? effectiveProps(bubbleComp) : null
  const buttonComp = placed.find((c) => c.type === "Button")
  const buttonProps = buttonComp ? effectiveProps(buttonComp) : null
  const promptComp = placed.find((c) => c.type === "Prompt")
  const promptProps = promptComp ? effectiveProps(promptComp) : null

  const assistantBg = bubbleProps?.bg ?? C.s2
  const assistantColor = bubbleProps?.color ?? C.t1
  const assistantBorder = bubbleProps?.color
    ? `${bubbleProps.color}55`
    : C.b1
  const userBg = buttonProps?.bg ?? C.acc
  const userColor = buttonProps?.color ?? "#fff"
  const inputBg = promptProps?.bg ?? C.s1
  const inputColor = promptProps?.color ?? C.t1
  const inputBorder = promptProps?.color ? `${promptProps.color}55` : C.b2

  async function load() {
    if (projectId === null) return
    setLoading(true)
    try {
      const { ui_state } = await uiStateApi.get(projectId)
      setPlaced(ui_state ?? [])
    } catch {
      setPlaced([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [projectId])

  useEffect(() => {
    function updateScale() {
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const s = Math.min(rect.width / AB.w, rect.height / AB.h)
      setScale(Math.max(0.1, Math.min(s, 2)))
    }
    updateScale()
    window.addEventListener("resize", updateScale)
    return () => window.removeEventListener("resize", updateScale)
  }, [device, placed])

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
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        background: C.bg,
        overflow: "hidden",
        fontFamily: C.sans,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "5px 16px",
          borderBottom: `1px solid ${C.b1}`,
          flexShrink: 0,
          background: C.s1,
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
          ПРЕВЬЮ
        </span>
        <span style={{ fontSize: 11, color: C.t1 }}>
          {projectId !== null ? `проект #${projectId}` : "—"}
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 2 }}>
          {(["mobile", "desktop"] as Device[]).map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              style={{
                background: device === d ? C.s2 : "transparent",
                border: `1px solid ${device === d ? C.b2 : "transparent"}`,
                borderRadius: 2,
                padding: "2px 9px",
                fontSize: 10,
                fontFamily: C.mono,
                color: device === d ? C.t1 : C.t2,
                cursor: "pointer",
              }}
            >
              {d}
            </button>
          ))}
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            background: "none",
            border: `1px solid ${C.b2}`,
            borderRadius: 2,
            padding: "2px 9px",
            fontSize: 10,
            fontFamily: C.mono,
            color: loading ? C.t3 : C.t2,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          ⟳ обновить
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px 16px",
        }}
      >
        <div
          style={{
            height: "100%",
            width: device === "mobile" ? 188 : "100%",
            maxWidth: device === "desktop" ? 520 : 188,
            border: `1px solid ${C.b2}`,
            borderRadius: device === "mobile" ? 10 : 0,
            background: C.s2,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "7px 12px",
              borderBottom: `1px solid ${C.b1}`,
              display: "flex",
              alignItems: "center",
              gap: 7,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: C.accA,
                display: "grid",
                placeItems: "center",
                fontSize: 9,
                color: C.acc,
              }}
            >
              E
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>
              Куратор
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 8,
                color: C.grn,
                fontFamily: C.mono,
              }}
            >
              ● онлайн
            </span>
          </div>

          <div
            ref={canvasRef}
            style={{
              flex: 1,
              position: "relative",
              overflow: "hidden",
              background: C.bg,
            }}
          >
            {projectId === null ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16,
                  fontSize: 11,
                  color: C.t2,
                  textAlign: "center",
                }}
              >
                Не указан ID проекта в URL.
              </div>
            ) : (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: AB.w * scale,
                  height: AB.h * scale,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  style={{
                    width: AB.w,
                    height: AB.h,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    background: "#1a1a1f",
                    border: `1px solid ${C.b2}`,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: 28,
                      background: "#141417",
                      borderBottom: `1px solid ${C.b1}`,
                      display: "flex",
                      alignItems: "center",
                      padding: "0 16px",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: C.mono,
                        color: C.t3,
                      }}
                    >
                      9:41
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: C.mono,
                        color: C.t3,
                      }}
                    >
                      ▮▮▮
                    </span>
                  </div>
                  {visiblePlaced.map((comp) => {
                    const props = effectiveProps(comp)
                    return (
                      <div
                        key={comp.id}
                        style={{
                          position: "absolute",
                          left: comp.x,
                          top: comp.y,
                          width: props.w,
                          height: props.h,
                          background: props.bg,
                          borderRadius: props.radius,
                          overflow: "hidden",
                        }}
                      >
                        <CompPreview type={comp.type} props={comp} />
                      </div>
                    )
                  })}
                </div>

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    overflowY: "auto",
                    padding: 10,
                    gap: 7,
                  }}
                >
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        alignSelf:
                          m.role === "user" ? "flex-end" : "flex-start",
                        background: m.role === "user" ? userBg : assistantBg,
                        border:
                          m.role === "user" ? "none" : `1px solid ${assistantBorder}`,
                        borderRadius: 2,
                        padding: "6px 10px",
                        fontSize: 11,
                        color: m.role === "user" ? userColor : assistantColor,
                        fontFamily: C.sans,
                        maxWidth: m.role === "user" ? "80%" : "85%",
                        lineHeight: 1.45,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {m.text}
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div
              style={{
                padding: "6px 10px",
                fontSize: 10,
                color: "#ff6b6b",
                fontFamily: C.mono,
                borderTop: `1px solid ${C.b1}`,
                flexShrink: 0,
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              padding: "6px 10px",
              borderTop: `1px solid ${C.b1}`,
              display: "flex",
              gap: 5,
              flexShrink: 0,
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Введите сообщение..."
              rows={1}
              disabled={busy}
              style={{
                flex: 1,
                resize: "none",
                background: inputBg,
                border: `1px solid ${inputBorder}`,
                padding: "5px 8px",
                fontSize: 10,
                fontFamily: C.sans,
                color: inputColor,
                lineHeight: 1.45,
                outline: "none",
              }}
            />
              <button
              onClick={send}
              disabled={busy}
              style={{
                background: userBg,
                border: "none",
                borderRadius: 2,
                padding: "4px 9px",
                fontSize: 10,
                color: userColor,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.6 : 1,
              }}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
