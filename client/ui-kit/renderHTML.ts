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
    case "Grid":
      return `<div style="${style}; border:1px dashed rgba(255,255,255,0.08)"></div>`
    case "Header":
      return `<div style="${style}; border-bottom:1px solid ${props.color}33; justify-content:space-between; padding:0 14px; font-weight:600">${text}<span>⋯</span></div>`
    case "Footer":
      return `<div style="${style}; border-top:1px solid ${props.color}33; justify-content:space-around">${["◆", "◈", "◉", "◇"].map((i) => `<span>${i}</span>`).join("")}</div>`
    case "Text":
      return `<div style="${style}; background:transparent; justify-content:flex-start; padding:0 4px">${text}</div>`
    case "Button":
    case "Bubble":
    case "QuickReply":
    case "Prompt":
      return `<button style="${style}; border:none; cursor:pointer">${text}</button>`
    case "TextField":
      return `<div style="${style}; justify-content:flex-start; padding:0 8px; opacity:0.4">${text || "Ввод..."}</div>`
    case "TextArea":
      return `<div style="${style}; justify-content:flex-start; align-items:flex-start; padding:8px; opacity:0.4">${text || "Ввод..."}</div>`
    case "Checkbox":
      return `<div style="${style}; justify-content:flex-start; gap:8px; padding:0 10px"><span style="width:16px;height:16px;background:${props.color};display:grid;place-items:center;font-size:10px;color:${props.bg};border-radius:${Math.min(props.radius, 4)}px">✓</span><span>${text}</span></div>`
    case "Radio":
      return `<div style="${style}; justify-content:flex-start; gap:8px; padding:0 10px"><span style="width:16px;height:16px;border:2px solid ${props.color};border-radius:50%;display:grid;place-items:center"><span style="width:8px;height:8px;background:${props.color};border-radius:50%"></span></span><span>${text}</span></div>`
    case "Avatar": {
      const size = Math.min(props.w, props.h)
      return `<div style="${style}; border:none"><div style="width:80%;height:80%;border-radius:50%;background:${props.color};display:grid;place-items:center;font-size:${Math.round(size / 3)}px;color:${props.bg}">${text}</div></div>`
    }
    case "Image":
      return `<div style="${style}; border:1px dashed ${props.color}55; font-size:28px">${text || "🖼"}</div>`
    case "Icon":
      return `<div style="${style}; font-size:20px">${text || "★"}</div>`
    case "Alert":
      return `<div style="${style}; border:1px solid ${props.color}55; justify-content:flex-start; gap:8px; padding:0 12px"><span>▲</span><span>${text}</span></div>`
    case "List":
      return `<div style="${style}; border:1px solid ${props.color}33; flex-direction:column; align-items:flex-start; justify-content:center; padding:8px 10px; gap:6px">${[0, 1, 2].map(() => `<div style="display:flex;align-items:center;gap:8px;width:100%"><span style="width:6px;height:6px;border-radius:50%;background:${props.color}"></span><span style="flex:1;height:6px;background:${props.color};opacity:0.2;border-radius:2px"></span></div>`).join("")}</div>`
    case "Card":
      return `<div style="${style}; border:1px solid ${props.color}33; flex-direction:column; align-items:flex-start; padding:12px; gap:8px"><div style="width:60%;height:10px;background:${props.color};opacity:0.2;border-radius:2px"></div><div style="width:90%;height:8px;background:${props.color};opacity:0.15;border-radius:2px"></div><div style="width:75%;height:8px;background:${props.color};opacity:0.15;border-radius:2px"></div><div style="margin-top:auto;width:60px;height:24px;background:${props.color};border-radius:2px"></div></div>`
    case "Modal":
      return `<div style="${style}; border:1px solid ${props.color}33; flex-direction:column; padding:12px; gap:8px; box-shadow:0 8px 32px rgba(0,0,0,.5)"><div style="width:100%;display:flex;justify-content:space-between;align-items:center;font-weight:600"><span>${text}</span><span>✕</span></div><div style="flex:1;width:100%;display:flex;flex-direction:column;gap:6px;justify-content:center"><div style="height:8px;background:${props.color};opacity:0.15;border-radius:2px"></div><div style="height:8px;width:80%;background:${props.color};opacity:0.15;border-radius:2px"></div></div><div style="width:100%;display:flex;justify-content:flex-end;gap:6px"><div style="width:60px;height:22px;background:${props.color};opacity:0.25;border-radius:2px"></div><div style="width:60px;height:22px;background:${props.color};border-radius:2px"></div></div></div>`
    case "Snackbar":
      return `<div style="${style}; justify-content:space-between; padding:0 12px; box-shadow:0 4px 16px rgba(0,0,0,.4)"><span>${text}</span><span style="font-weight:600">OK</span></div>`
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
