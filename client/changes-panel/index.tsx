import { useState } from "react"
import { C } from "@/theme"
import { UIChange } from "@/types"

export type ChangesPanelProps = {
  projectId: number | null
  changes: UIChange[]
  loading?: boolean
  onRestore?: (change: UIChange) => void
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("ru", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function ChangesPanel({
  projectId,
  changes,
  loading,
  onRestore,
}: ChangesPanelProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

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
          ИСТОРИЯ ИЗМЕНЕНИЙ
        </span>
        <div style={{ flex: 1 }} />
        {loading && (
          <span style={{ fontSize: 10, fontFamily: C.mono, color: C.t3 }}>
            загрузка…
          </span>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {projectId == null && (
          <div
            style={{
              padding: "12px 14px",
              fontSize: 11,
              color: C.t2,
              lineHeight: 1.5,
            }}
          >
            Выберите проект, чтобы увидеть историю изменений интерфейса.
          </div>
        )}

        {projectId != null && changes.length === 0 && !loading && (
          <div
            style={{
              padding: "12px 14px",
              fontSize: 11,
              color: C.t2,
              lineHeight: 1.5,
            }}
          >
            Пока нет сохранённых изменений. Нажмите «Сохранить изменение» в
            конструкторе, чтобы зафиксировать текущий HTML.
          </div>
        )}

        {changes.map((change, index) => {
          const expanded = expandedId === change.id
          const number = changes.length - index

          return (
            <div
              key={change.id}
              style={{
                padding: "6px 14px",
                marginBottom: 2,
                background: expanded ? C.accA : "transparent",
                borderLeft: `2px solid ${expanded ? C.acc : "transparent"}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                }}
              >
                <button
                  onClick={() => setExpandedId(expanded ? null : change.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flex: 1,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: C.mono,
                      fontWeight: 600,
                      color: expanded ? C.acc : C.t2,
                      minWidth: 28,
                    }}
                  >
                    #{number}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: C.mono,
                      color: C.t3,
                    }}
                  >
                    {formatTime(change.created_at)}
                  </span>
                  <span style={{ flex: 1 }} />
                  <span
                    style={{
                      fontSize: 10,
                      color: C.t3,
                      transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform .12s",
                    }}
                  >
                    ▾
                  </span>
                </button>

                {onRestore && change.ui_state != null && (
                  <button
                    onClick={() => onRestore(change)}
                    title="Восстановить эту версию на канвасе"
                    style={{
                      background: "none",
                      border: "none",
                      color: C.acc,
                      fontSize: 10,
                      fontFamily: C.mono,
                      cursor: "pointer",
                      padding: "0 4px",
                    }}
                  >
                    восстановить
                  </button>
                )}
              </div>

              {expanded && (
                <pre
                  style={{
                    margin: "8px 0 4px",
                    padding: 8,
                    background: C.s2,
                    border: `1px solid ${C.b2}`,
                    borderRadius: 4,
                    fontSize: 10,
                    fontFamily: C.mono,
                    color: C.t1,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    maxHeight: 240,
                    overflowY: "auto",
                  }}
                >
                  {String(change.html_code)}
                </pre>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
