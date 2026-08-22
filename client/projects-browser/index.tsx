import { useState } from "react"
import { C } from "@/theme"
import { FILES, EXT_MARK, EXT_COLOR } from "@/types"

export default function Sidebar({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    models: true,
    interfaces: true,
    tests: false,
  })

  return (
    <div
      style={{
        gridArea: "sidebar",
        background: C.s1,
        borderRight: `1px solid ${C.b1}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: C.sans,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px 8px",
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
          ПРОЕКТЫ
        </span>
        <button
          style={{
            background: "none",
            border: "none",
            color: C.t2,
            fontSize: 14,
            padding: 0,
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          +
        </button>
      </div>

      <div
        style={{
          padding: "8px 14px 6px",
          fontSize: 12,
          fontWeight: 600,
          color: C.t1,
          flexShrink: 0,
        }}
      >
        EduAssistant
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
        {FILES.map((folder) => (
          <div key={folder.id}>
            <button
              onClick={() =>
                setOpen((o) => ({ ...o, [folder.id]: !o[folder.id] }))
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                width: "100%",
                background: "none",
                border: "none",
                padding: "4px 14px",
                fontSize: 11.5,
                color: C.t2,
                fontFamily: C.sans,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  display: "inline-block",
                  transition: "transform .12s",
                  transform: open[folder.id]
                    ? "rotate(0deg)"
                    : "rotate(-90deg)",
                  color: C.t3,
                }}
              >
                ▾
              </span>
              <span>{folder.name}</span>
            </button>

            {open[folder.id] &&
              folder.children?.map((file) => (
                <button
                  key={file.id}
                  onClick={() => onSelect(file.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    borderLeft: `2px solid ${
                      selected === file.id ? C.acc : "transparent"
                    }`,
                    background: selected === file.id ? C.accA : "transparent",
                    padding: "3px 14px 3px 22px",
                    fontSize: 12,
                    fontFamily: C.sans,
                    color: selected === file.id ? C.t1 : C.t2,
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 10, color: EXT_COLOR[file.type] }}>
                    {EXT_MARK[file.type]}
                  </span>
                  <span style={{ flex: 1 }}>{file.name}</span>
                  {file.modified && (
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: C.ora,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </button>
              ))}
          </div>
        ))}
      </div>

      <div
        style={{
          padding: "10px 14px",
          borderTop: `1px solid ${C.b1}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10,
            fontFamily: C.mono,
            color: C.t3,
          }}
        >
          <span style={{ color: C.grn, fontSize: 8 }}>●</span>
          <span>2 интерфейса · 1 тест</span>
        </div>
      </div>
    </div>
  )
}
