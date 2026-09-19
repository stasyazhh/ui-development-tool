import { useState, useRef, useEffect } from "react"
import { C } from "@/theme"
import type { Device } from "@/types"
import { uiStateApi } from "@/api"
import type { PlacedComp } from "../ui-kit/constants"
import { AB, effectiveProps } from "../ui-kit/constants"
import CompPreview from "../ui-kit/CompPreview"

export default function PreviewPanel({ projectId }: { projectId: number | null }) {
  const [device, setDevice] = useState<Device>("mobile")
  const [placed, setPlaced] = useState<PlacedComp[]>([])
  const [loading, setLoading] = useState(false)
  const [scale, setScale] = useState(1)
  const canvasRef = useRef<HTMLDivElement>(null)

  async function load() {
    if (projectId === null) {
      setPlaced([])
      return
    }
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
                  fontFamily: C.sans,
                  color: C.t2,
                  textAlign: "center",
                }}
              >
                Выберите проект, чтобы увидеть его интерфейс.
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
                    <span style={{ fontSize: 10, fontFamily: C.mono, color: C.t3 }}>
                      9:41
                    </span>
                    <span style={{ fontSize: 10, fontFamily: C.mono, color: C.t3 }}>
                      ▮▮▮
                    </span>
                  </div>
                  {placed.map((comp) => {
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
              </div>
            )}
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
