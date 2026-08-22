import { useState } from "react"
import { C } from "@/theme"

export default function TbBtn({
  label,
  accent,
  onClick,
  active,
}: {
  label: string
  accent?: boolean
  onClick?: () => void
  active?: boolean
}) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: accent
          ? active
            ? "#3a5fd0"
            : h
              ? "#4d70f0"
              : C.acc
          : h || active
            ? C.s3
            : "transparent",
        border: accent
          ? "none"
          : `1px solid ${h || active ? C.b2 : "transparent"}`,
        borderRadius: 3,
        padding: "4px 11px",
        fontSize: 12,
        fontFamily: C.sans,
        fontWeight: 500,
        color: accent ? "#fff" : C.t1,
        transition: "background .1s",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  )
}
