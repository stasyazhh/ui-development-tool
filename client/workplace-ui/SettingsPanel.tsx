import { useState, type ReactNode, type CSSProperties } from "react"
import { C } from "@/theme"

const inputStyle: CSSProperties = {
  background: C.s2,
  border: `1px solid ${C.b2}`,
  borderRadius: 2,
  padding: "4px 8px",
  fontSize: 11,
  fontFamily: C.mono,
  color: C.t1,
  outline: "none",
}
const selectStyle: CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
}

interface SectionProps {
  label: string
  children: ReactNode
}

function Section({ label, children }: SectionProps) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          padding: "8px 16px 4px",
          fontSize: 10,
          fontFamily: C.mono,
          color: C.t2,
          letterSpacing: "0.08em",
        }}
      >
        {label.toUpperCase()}
      </div>
      {children}
    </div>
  )
}

function SettingRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 16px",
        borderBottom: `1px solid ${C.b1}`,
        fontSize: 12,
        color: C.t1,
      }}
    >
      <span style={{ color: C.t2 }}>{label}</span>
      {children}
    </div>
  )
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 32,
        height: 18,
        borderRadius: 9,
        background: value ? C.acc : C.b2,
        position: "relative",
        cursor: "pointer",
        transition: "background .15s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: value ? 16 : 2,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#fff",
          transition: "left .15s",
        }}
      />
    </div>
  )
}

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [model, setModel] = useState("claude-sonnet-5")
  const [temp, setTemp] = useState("0.7")
  const [locale, setLocale] = useState("ru-RU")
  const [stream, setStream] = useState(true)

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 90,
          background: "rgba(0,0,0,.5)",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 91,
          width: 320,
          background: C.s1,
          borderLeft: `1px solid ${C.b2}`,
          display: "flex",
          flexDirection: "column",
          fontFamily: C.sans,
          boxShadow: "-8px 0 32px rgba(0,0,0,.4)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: `1px solid ${C.b1}`,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>
            Настройки проекта
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: C.t2,
              fontSize: 16,
              cursor: "pointer",
              padding: 0,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
          <Section label="Интерфейс">
            <SettingRow label="Язык">
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                style={selectStyle}
              >
                <option value="ru-RU">ru-RU</option>
                <option value="en-US">en-US</option>
                <option value="zh-CN">zh-CN</option>
              </select>
            </SettingRow>
            <SettingRow label="Тема">
              <select style={selectStyle} defaultValue="dark">
                <option value="dark">dark</option>
                <option value="light">light (soon)</option>
              </select>
            </SettingRow>
          </Section>
        </div>

        <div
          style={{
            padding: "12px 16px",
            borderTop: `1px solid ${C.b1}`,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: "100%",
              background: C.acc,
              border: "none",
              borderRadius: 3,
              padding: "8px",
              fontSize: 12,
              fontFamily: C.sans,
              color: "#fff",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </>
  )
}
