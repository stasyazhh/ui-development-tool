import { useState, useRef, useEffect } from "react"
import { C } from "@/theme"
import {
  PALETTE_GROUPS,
  COMP_META,
  SNAP,
  snapTo,
  AB,
  type Point,
  type PlacedComp,
  type DragCtx,
} from "./constants"
import CompPreview from "./CompPreview"
import PropRow from "./PropRow"

export default function VisualConstructor() {
  const [paletteSel, setPaletteSel] = useState<string | null>(null)
  const [placed, setPlaced] = useState<PlacedComp[]>([])
  const [selIds, setSelIds] = useState<string[]>([])
  const [drag, setDrag] = useState<DragCtx | null>(null)
  const [moved, setMoved] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const uidRef = useRef(0)

  const selSet = new Set(selIds)
  const firstSel = placed.find((p) => selIds[0] === p.id) ?? null

  function canvasCoords(e: React.MouseEvent): Point {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scroll = canvasRef.current!.parentElement!
    return {
      x: e.clientX - rect.left + scroll.scrollLeft,
      y: e.clientY - rect.top + scroll.scrollTop,
    }
  }

  function handlePaletteClick(item: string) {
    setPaletteSel((s) => (s === item ? null : item))
    setSelIds([])
  }

  function handleCanvasDblClick(e: React.MouseEvent) {
    if (!paletteSel) return
    e.stopPropagation()
    const { x, y } = canvasCoords(e)
    const meta = COMP_META[paletteSel] ?? { w: 120, h: 40 }
    const cx = snapTo(x - meta.w / 2)
    const cy = snapTo(y - meta.h / 2)
    const id = `${paletteSel}-${++uidRef.current}`
    setPlaced((p) => [
      ...p,
      { id, type: paletteSel, x: Math.max(0, cx), y: Math.max(0, cy) },
    ])
    setSelIds([id])
  }

  function handleCanvasMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    const { x, y } = canvasCoords(e)
    setDrag({ kind: "rubber", x0: x, y0: y, x1: x, y1: y })
    setMoved(false)
  }

  function handleCompMouseDown(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (e.button !== 0) return
    let nextSel: string[]
    if (e.shiftKey) {
      nextSel = selSet.has(id)
        ? selIds.filter((s) => s !== id)
        : [...selIds, id]
    } else {
      nextSel = selSet.has(id) ? selIds : [id]
    }
    setSelIds(nextSel)
    const selSet2 = new Set(nextSel)
    const origins = placed
      .filter((p) => selSet2.has(p.id))
      .map((p) => ({ id: p.id, x: p.x, y: p.y }))
    setDrag({ kind: "move", mx0: e.clientX, my0: e.clientY, origins })
    setMoved(false)
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!drag) return
    setMoved(true)

    if (drag.kind === "move") {
      const dx = snapTo(e.clientX - drag.mx0)
      const dy = snapTo(e.clientY - drag.my0)
      setPlaced((p) =>
        p.map((c) => {
          const orig = drag.origins.find((o) => o.id === c.id)
          if (!orig) return c
          return {
            ...c,
            x: Math.max(0, orig.x + dx),
            y: Math.max(0, orig.y + dy),
          }
        }),
      )
    }

    if (drag.kind === "rubber") {
      const { x, y } = canvasCoords(e)
      setDrag({ ...drag, x1: x, y1: y })
    }
  }

  function handleMouseUp(e: React.MouseEvent) {
    if (drag?.kind === "rubber" && moved) {
      const rx0 = Math.min(drag.x0, drag.x1)
      const ry0 = Math.min(drag.y0, drag.y1)
      const rx1 = Math.max(drag.x0, drag.x1)
      const ry1 = Math.max(drag.y0, drag.y1)
      const hit = placed.filter((c) => {
        const meta = COMP_META[c.type] ?? { w: 80, h: 40 }
        return (
          c.x < rx1 && c.x + meta.w > rx0 && c.y < ry1 && c.y + meta.h > ry0
        )
      })
      setSelIds(hit.map((c) => c.id))
    } else if (drag?.kind === "rubber" && !moved) {
      setSelIds([])
    }
    setDrag(null)
  }

  function deleteSelected() {
    if (!selIds.length) return
    setPlaced((p) => p.filter((c) => !selSet.has(c.id)))
    setSelIds([])
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Delete" && e.key !== "Backspace") return
      const active = document.activeElement
      if (
        active &&
        (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
      )
        return
      deleteSelected()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selIds, placed])

  const rubber = drag?.kind === "rubber" ? drag : null

  return (
    <div
      style={{ flex: 1, display: "flex", overflow: "hidden", background: C.bg }}
    >
      {/* Palette */}
      <div
        style={{
          width: 148,
          borderRight: `1px solid ${C.b1}`,
          background: C.s1,
          overflowY: "auto",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "9px 12px 5px",
            fontSize: 10,
            fontFamily: C.mono,
            color: C.t2,
            letterSpacing: "0.08em",
          }}
        >
          КОМПОНЕНТЫ
        </div>
        {PALETTE_GROUPS.map((g) => (
          <div key={g.group} style={{ marginBottom: 4 }}>
            <div
              style={{
                padding: "6px 12px 2px",
                fontSize: 9,
                color: C.t3,
                fontFamily: C.mono,
                letterSpacing: "0.08em",
              }}
            >
              {g.group.toUpperCase()}
            </div>
            {g.items.map((item) => (
              <button
                key={item}
                onClick={() => handlePaletteClick(item)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "4px 12px",
                  border: "none",
                  borderLeft: `2px solid ${
                    paletteSel === item ? C.acc : "transparent"
                  }`,
                  background: paletteSel === item ? C.accA : "transparent",
                  fontSize: 11.5,
                  fontFamily: C.mono,
                  color: paletteSel === item ? C.acc : C.t2,
                  cursor: "pointer",
                }}
              >
                {item}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Canvas area */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          position: "relative",
          background: C.bg,
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 14px",
            background: `${C.bg}f0`,
            borderBottom: `1px solid ${C.b1}`,
            fontSize: 11,
            fontFamily: C.sans,
            color: C.t2,
          }}
        >
          <span style={{ fontFamily: C.mono, color: C.t1, fontSize: 11 }}>
            chat-tutor.ui
          </span>
          <span style={{ color: C.t3 }}>·</span>
          <span
            style={{
              fontFamily: C.mono,
              fontSize: 10,
              color: paletteSel ? C.acc : C.t3,
            }}
          >
            {paletteSel
              ? `двойной клик → разместить ${paletteSel}`
              : `${placed.length} эл.`}
          </span>
          {selIds.length > 1 && (
            <span style={{ fontFamily: C.mono, fontSize: 10, color: C.ora }}>
              выбрано: {selIds.length}
            </span>
          )}
          <div style={{ flex: 1 }} />
          {selIds.length > 0 && (
            <button
              onClick={deleteSelected}
              style={{
                background: "none",
                border: `1px solid ${C.b2}`,
                borderRadius: 2,
                padding: "2px 8px",
                fontSize: 10,
                fontFamily: C.mono,
                color: "#e05555",
                cursor: "pointer",
              }}
            >
              удалить ({selIds.length}) ✕
            </button>
          )}
          {paletteSel && (
            <button
              onClick={() => setPaletteSel(null)}
              style={{
                background: "none",
                border: `1px solid ${C.b2}`,
                borderRadius: 2,
                padding: "2px 8px",
                fontSize: 10,
                fontFamily: C.mono,
                color: C.t2,
                cursor: "pointer",
              }}
            >
              ✕ отмена
            </button>
          )}
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          onDoubleClick={handleCanvasDblClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setDrag(null)}
          style={{
            position: "relative",
            width: 2000,
            height: 1600,
            backgroundImage: `radial-gradient(circle, ${C.b2} 1px, transparent 1px)`,
            backgroundSize: `${SNAP}px ${SNAP}px`,
            cursor: paletteSel
              ? "crosshair"
              : drag?.kind === "move"
                ? "grabbing"
                : "default",
            userSelect: "none",
          }}
        >
          {/* Artboard */}
          <div
            style={{
              position: "absolute",
              left: AB.x,
              top: AB.y,
              width: AB.w,
              height: AB.h,
              background: "#1a1a1f",
              border: `1px solid ${C.b2}`,
              boxShadow: "0 8px 40px rgba(0,0,0,.6)",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -22,
                left: 0,
                fontSize: 10,
                fontFamily: C.mono,
                color: C.t3,
                whiteSpace: "nowrap",
              }}
            >
              chat-tutor.ui · 390 × 720
            </div>
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
          </div>

          {/* Rubber-band selection rect */}
          {rubber && moved && (
            <div
              style={{
                position: "absolute",
                left: Math.min(rubber.x0, rubber.x1),
                top: Math.min(rubber.y0, rubber.y1),
                width: Math.abs(rubber.x1 - rubber.x0),
                height: Math.abs(rubber.y1 - rubber.y0),
                border: `1px solid ${C.acc}`,
                background: C.accA,
                pointerEvents: "none",
                zIndex: 20,
              }}
            />
          )}

          {/* Placed components */}
          {placed.map((comp) => {
            const meta = COMP_META[comp.type] ?? { w: 120, h: 40, color: C.t2 }
            const isSel = selSet.has(comp.id)
            return (
              <div
                key={comp.id}
                onMouseDown={(e) => handleCompMouseDown(e, comp.id)}
                style={{
                  position: "absolute",
                  left: comp.x,
                  top: comp.y,
                  width: meta.w,
                  height: meta.h,
                  cursor: drag?.kind === "move" && isSel ? "grabbing" : "grab",
                  boxShadow: isSel
                    ? `0 0 0 2px ${C.acc}, 0 4px 16px rgba(0,0,0,.4)`
                    : "0 2px 8px rgba(0,0,0,.3)",
                  zIndex: isSel ? 5 : 2,
                }}
              >
                <CompPreview type={comp.type} />
                {isSel && (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        top: -18,
                        left: 0,
                        fontSize: 9,
                        fontFamily: C.mono,
                        color: C.acc,
                        whiteSpace: "nowrap",
                        background: C.bg,
                        padding: "1px 4px",
                        pointerEvents: "none",
                      }}
                    >
                      {comp.type} · {comp.x},{comp.y}
                    </div>
                    {[
                      [-3, -3],
                      ["auto", -3],
                      [-3, "auto"],
                      ["auto", "auto"],
                    ].map((pos, i) => (
                      <div
                        key={i}
                        style={{
                          position: "absolute",
                          top: pos[1] as number | "auto",
                          bottom: pos[1] === "auto" ? -3 : undefined,
                          left: pos[0] as number | "auto",
                          right: pos[0] === "auto" ? -3 : undefined,
                          width: 6,
                          height: 6,
                          background: C.acc,
                          pointerEvents: "none",
                        }}
                      />
                    ))}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Properties */}
      <div
        style={{
          width: 172,
          borderLeft: `1px solid ${C.b1}`,
          background: C.s1,
          flexShrink: 0,
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: "9px 12px 5px",
            fontSize: 10,
            fontFamily: C.mono,
            color: C.t2,
            letterSpacing: "0.08em",
          }}
        >
          СВОЙСТВА
        </div>
        {selIds.length > 1 ? (
          <>
            <PropRow label="выбрано" value={`${selIds.length} эл.`} />
            <div
              style={{
                padding: "8px 12px",
                fontSize: 10.5,
                fontFamily: C.sans,
                color: C.t3,
                lineHeight: 1.5,
              }}
            >
              Перетащите для перемещения всех. Del — удалить.
            </div>
          </>
        ) : firstSel ? (
          <>
            <PropRow label="type" value={firstSel.type} />
            <PropRow label="x" value={`${firstSel.x}px`} />
            <PropRow label="y" value={`${firstSel.y}px`} />
            <PropRow
              label="width"
              value={`${COMP_META[firstSel.type]?.w ?? "—"}px`}
            />
            <PropRow
              label="height"
              value={`${COMP_META[firstSel.type]?.h ?? "—"}px`}
            />
          </>
        ) : paletteSel ? (
          <>
            <PropRow label="type" value={paletteSel} />
            <PropRow
              label="width"
              value={`${COMP_META[paletteSel]?.w ?? "—"}px`}
            />
            <PropRow
              label="height"
              value={`${COMP_META[paletteSel]?.h ?? "—"}px`}
            />
            <div
              style={{
                padding: "8px 12px",
                fontSize: 10.5,
                fontFamily: C.sans,
                color: C.t3,
                lineHeight: 1.5,
              }}
            >
              Двойной клик на канвасе — разместить
            </div>
          </>
        ) : (
          <div
            style={{
              padding: "10px 12px",
              fontSize: 10.5,
              fontFamily: C.sans,
              color: C.t3,
              lineHeight: 1.5,
            }}
          >
            Выберите компонент в палитре или кликните на объект
          </div>
        )}
      </div>
    </div>
  )
}
