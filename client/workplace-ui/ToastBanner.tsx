import { C } from "@/theme"
import type { Toast } from "@/types"

export default function ToastBanner({ toast }: { toast: Toast }) {
  if (!toast) return null
  const bg =
    toast.kind === "ok" ? C.grn : toast.kind === "warn" ? C.ora : "#e05555"
  return (
    <div
      style={{
        position: "fixed",
        top: 52,
        right: 16,
        zIndex: 100,
        background: C.s2,
        border: `1px solid ${bg}`,
        borderLeft: `3px solid ${bg}`,
        padding: "9px 14px",
        fontFamily: C.sans,
        fontSize: 12,
        color: C.t1,
        maxWidth: 340,
        boxShadow: "0 4px 20px rgba(0,0,0,.4)",
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
      }}
    >
      <span
        style={{
          color: bg,
          fontFamily: C.mono,
          fontSize: 11,
          marginTop: 1,
          flexShrink: 0,
        }}
      >
        {toast.kind === "ok" ? "✓" : toast.kind === "warn" ? "!" : "✕"}
      </span>
      <span style={{ lineHeight: 1.5 }}>{toast.text}</span>
    </div>
  )
}
