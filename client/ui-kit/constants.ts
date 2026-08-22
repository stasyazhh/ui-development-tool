import { C } from "@/theme"

export const PALETTE_GROUPS = [
  {
    group: "Layout",
    items: ["Container", "Row", "Column", "Divider", "Spacer"],
  },
  {
    group: "Input",
    items: ["TextField", "Select", "Toggle", "Slider", "Button"],
  },
  { group: "Display", items: ["Text", "Avatar", "Badge", "Progress", "Card"] },
  { group: "Dialog", items: ["Bubble", "Typing", "QuickReply", "Prompt"] },
]

export interface Point {
  x: number
  y: number
}

export interface PlacedComp {
  id: string
  type: string
  x: number
  y: number
}

export interface CompMeta {
  w: number
  h: number
  color: string
}

export const COMP_META: Record<string, CompMeta> = {
  Container: { w: 240, h: 140, color: C.t3 },
  Row: { w: 240, h: 48, color: C.t3 },
  Column: { w: 100, h: 200, color: C.t3 },
  Divider: { w: 240, h: 20, color: C.t3 },
  Spacer: { w: 120, h: 48, color: C.t3 },
  TextField: { w: 220, h: 40, color: C.acc },
  Select: { w: 180, h: 36, color: C.acc },
  Toggle: { w: 64, h: 32, color: C.acc },
  Slider: { w: 220, h: 36, color: C.acc },
  Button: { w: 120, h: 36, color: C.acc },
  Text: { w: 200, h: 28, color: C.t2 },
  Avatar: { w: 48, h: 48, color: C.pur },
  Badge: { w: 72, h: 24, color: C.pur },
  Progress: { w: 220, h: 20, color: C.pur },
  Card: { w: 240, h: 160, color: C.t2 },
  Bubble: { w: 220, h: 56, color: C.grn },
  Typing: { w: 80, h: 36, color: C.grn },
  QuickReply: { w: 180, h: 36, color: C.grn },
  Prompt: { w: 280, h: 48, color: C.grn },
}

export const SNAP = 20

export function snapTo(v: number) {
  return Math.round(v / SNAP) * SNAP
}

export const AB = { x: 160, y: 80, w: 390, h: 720 }

export interface Origin {
  id: string
  x: number
  y: number
}

export interface MoveDragCtx {
  kind: "move"
  mx0: number
  my0: number
  origins: Origin[]
}

export interface RubberDragCtx {
  kind: "rubber"
  x0: number
  y0: number
  x1: number
  y1: number
}

export type DragCtx = MoveDragCtx | RubberDragCtx
