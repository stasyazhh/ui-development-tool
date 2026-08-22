import { useState } from "react"
import { C } from "@/theme"
import type { Device } from "@/types"

export default function PreviewPanel() {
  const [device, setDevice] = useState<Device>("mobile")

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: C.bg,
        borderTop: `1px solid ${C.b1}`,
        overflow: "hidden",
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
          fontFamily: C.sans,
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
          ПРЕДПРОСМОТР
        </span>
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
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, fontFamily: C.mono, color: C.grn }}>
          ● live
        </span>
        <button
          style={{
            background: "none",
            border: `1px solid ${C.b2}`,
            borderRadius: 2,
            padding: "2px 9px",
            fontSize: 10,
            fontFamily: C.mono,
            color: C.t2,
            cursor: "pointer",
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
            style={{
              flex: 1,
              padding: 10,
              display: "flex",
              flexDirection: "column",
              gap: 7,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                alignSelf: "flex-start",
                background: C.s1,
                border: `1px solid ${C.b1}`,
                padding: "5px 9px",
                fontSize: 10,
                color: C.t1,
                maxWidth: "85%",
                lineHeight: 1.45,
              }}
            >
              Что изучаем сегодня?
            </div>
            <div
              style={{
                alignSelf: "flex-end",
                background: C.acc,
                padding: "5px 9px",
                fontSize: 10,
                color: "#fff",
                maxWidth: "80%",
                lineHeight: 1.45,
              }}
            >
              Тригонометрия
            </div>
            <div
              style={{
                alignSelf: "flex-start",
                background: C.s1,
                border: `1px solid ${C.b1}`,
                padding: "5px 9px",
                fontSize: 10,
                color: C.t1,
                maxWidth: "85%",
                lineHeight: 1.45,
              }}
            >
              Начнём с единичной окружности...
            </div>
          </div>
          <div
            style={{
              padding: "6px 10px",
              borderTop: `1px solid ${C.b1}`,
              display: "flex",
              gap: 5,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                flex: 1,
                background: C.s1,
                border: `1px solid ${C.b2}`,
                padding: "4px 8px",
                fontSize: 9,
                color: C.t3,
              }}
            >
              Введите сообщение...
            </div>
            <div
              style={{
                background: C.acc,
                padding: "4px 9px",
                fontSize: 9,
                color: "#fff",
              }}
            >
              →
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
