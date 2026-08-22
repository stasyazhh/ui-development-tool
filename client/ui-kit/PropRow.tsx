import { C } from "@/theme"

export default function PropRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "4px 12px",
        borderBottom: `1px solid ${C.b1}`,
        fontSize: 11,
        fontFamily: C.mono,
      }}
    >
      <span style={{ color: C.t2, flexShrink: 0, minWidth: 68 }}>{label}</span>
      <span
        style={{
          color: C.t1,
          flex: 1,
          textAlign: "right",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  )
}
