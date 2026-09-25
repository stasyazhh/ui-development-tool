import { PlacedComp, effectiveProps } from "./constants"

const AB = { x: 160, y: 80, w: 390, h: 720 }

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function renderComponent(c: PlacedComp, offsetX = 0, offsetY = 0): string {
  const props = effectiveProps(c)
  const x = c.x - offsetX
  const y = c.y - offsetY
  const style = [
    "position:absolute",
    `left:${x}px`,
    `top:${y}px`,
    `width:${props.w}px`,
    `height:${props.h}px`,
    `background:${props.bg}`,
    `color:${props.color}`,
    `border-radius:${props.radius}px`,
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "font-size:12px",
    "font-family:system-ui,sans-serif",
    "overflow:hidden",
    "box-sizing:border-box",
  ].join(";")

  const text = esc(props.text)

  switch (c.type) {
    case "Container":
      return `<div style="${style}; border:1px dashed rgba(255,255,255,0.08)"></div>`
    case "Text":
      return `<div style="${style}; background:transparent; justify-content:flex-start; padding:0 4px">${text}</div>`
    case "Button":
    case "Bubble":
    case "QuickReply":
    case "Prompt":
      return `<button style="${style}; border:none; cursor:pointer">${text}</button>`
    case "TextField":
      return `<div style="${style}; justify-content:flex-start; padding:0 8px; opacity:0.4">${text || "Ввод..."}</div>`
    case "Avatar": {
      const size = Math.min(props.w, props.h)
      return `<div style="${style}; border:none"><div style="width:80%;height:80%;border-radius:50%;background:${props.color};display:grid;place-items:center;font-size:${Math.round(size / 3)}px;color:${props.bg}">${text}</div></div>`
    }
    default:
      return `<div style="${style}; border:1px dashed rgba(255,255,255,0.08)">${text}</div>`
  }
}

export function renderPlacedHTML(placed: PlacedComp[]): string {
  if (placed.length === 0) {
    return `<div style="position:relative;width:${AB.w}px;height:${AB.h}px;background:#1a1a1f;overflow:hidden;"></div>`
  }
  const elements = placed.map((c) => renderComponent(c, AB.x, AB.y))
  return `<div style="position:relative;width:${AB.w}px;height:${AB.h}px;background:#1a1a1f;overflow:hidden;">\n  ${elements.join("\n  ")}\n</div>`
}
