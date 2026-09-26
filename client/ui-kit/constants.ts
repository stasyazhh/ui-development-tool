import { C } from "@/theme"

export const PALETTE_GROUPS = [
  {
    group: "Layout",
    items: ["Container", "Row", "Column", "Divider", "Spacer", "Header", "Footer", "Grid"],
  },
  {
    group: "Input",
    items: ["TextField", "TextArea", "Select", "Toggle", "Slider", "Button", "Checkbox", "Radio"],
  },
  { group: "Display", items: ["Text", "Avatar", "Badge", "Progress", "Card", "Image", "Icon", "Alert", "List"] },
  { group: "Dialog", items: ["Bubble", "Typing", "QuickReply", "Prompt", "Modal", "Snackbar"] },
]

export interface Point {
  x: number
  y: number
}

export interface CompProps {
  w?: number
  h?: number
  color?: string
  bg?: string
  radius?: number
  text?: string
}

export interface PlacedComp extends CompProps {
  id: string
  type: string
  x: number
  y: number
}

export interface CompMeta {
  w: number
  h: number
  color: string
  bg?: string
  radius?: number
  text?: string
}

export const COMP_META: Record<string, CompMeta> = {
  // Layout
  Container: { w: 240, h: 140, color: C.t3, bg: "transparent", radius: 0 },
  Row: { w: 240, h: 48, color: C.t3, bg: "transparent", radius: 0 },
  Column: { w: 100, h: 200, color: C.t3, bg: "transparent", radius: 0 },
  Divider: { w: 240, h: 20, color: C.b2, bg: "transparent", radius: 0 },
  Spacer: { w: 120, h: 48, color: C.t3, bg: "transparent", radius: 0 },
  Header: { w: 320, h: 56, color: C.t1, bg: C.s2, radius: 0, text: "Заголовок" },
  Footer: { w: 320, h: 48, color: C.t2, bg: C.s1, radius: 0 },
  Grid: { w: 200, h: 200, color: C.t3, bg: "transparent", radius: 0 },
  // Input
  TextField: { w: 220, h: 40, color: C.t3, bg: C.s2, radius: 2, text: "Введите текст..." },
  TextArea: { w: 220, h: 80, color: C.t3, bg: C.s2, radius: 2, text: "Многострочный текст..." },
  Select: { w: 180, h: 36, color: C.t3, bg: C.s2, radius: 2, text: "Выбрать..." },
  Toggle: { w: 64, h: 32, color: "#fff", bg: C.acc, radius: 10 },
  Slider: { w: 220, h: 36, color: C.acc, bg: C.b2, radius: 2 },
  Button: { w: 120, h: 36, color: "#fff", bg: C.acc, radius: 2, text: "Кнопка" },
  Checkbox: { w: 120, h: 32, color: C.t1, bg: C.s2, radius: 2, text: "Вариант" },
  Radio: { w: 120, h: 32, color: C.t1, bg: C.s2, radius: 2, text: "Вариант" },
  // Display
  Text: { w: 200, h: 28, color: C.t1, bg: "transparent", radius: 0, text: "Текстовый элемент" },
  Avatar: { w: 48, h: 48, color: C.acc, bg: C.accA, radius: 0 },
  Badge: { w: 72, h: 24, color: C.pur, bg: `${C.pur}22`, radius: 10, text: "badge" },
  Progress: { w: 220, h: 20, color: C.pur, bg: C.b2, radius: 2 },
  Card: { w: 240, h: 160, color: C.t2, bg: C.s2, radius: 4 },
  Image: { w: 160, h: 120, color: C.t2, bg: C.s2, radius: 4, text: "🖼" },
  Icon: { w: 40, h: 40, color: C.acc, bg: "transparent", radius: 0, text: "★" },
  Alert: { w: 280, h: 56, color: C.ora, bg: `${C.ora}22`, radius: 4, text: "Важное сообщение" },
  List: { w: 240, h: 140, color: C.t2, bg: C.s2, radius: 4 },
  // Dialog
  Bubble: { w: 220, h: 56, color: C.t1, bg: C.s2, radius: 2, text: "Сообщение ассистента..." },
  Typing: { w: 80, h: 36, color: C.t2, bg: C.s2, radius: 2 },
  QuickReply: { w: 180, h: 36, color: C.t1, bg: C.s2, radius: 2 },
  Prompt: { w: 280, h: 48, color: C.acc, bg: C.s2, radius: 2, text: "Задайте вопрос..." },
  Modal: { w: 280, h: 180, color: C.t1, bg: C.s1, radius: 6, text: "Заголовок модалки" },
  Snackbar: { w: 300, h: 44, color: C.t1, bg: C.s2, radius: 2, text: "Уведомление" },
}

export const SNAP = 20

export function snapTo(v: number) {
  return Math.round(v / SNAP) * SNAP
}

export function defaultProps(type: string): Required<CompProps> {
  const meta = COMP_META[type] ?? { w: 120, h: 40, color: C.t2 }
  return {
    w: meta.w,
    h: meta.h,
    color: meta.color,
    bg: meta.bg ?? "transparent",
    radius: meta.radius ?? 0,
    text: meta.text ?? "",
  }
}

export function effectiveProps(comp: PlacedComp): Required<CompProps> {
  const defaults = defaultProps(comp.type)
  return {
    w: comp.w ?? defaults.w,
    h: comp.h ?? defaults.h,
    color: comp.color ?? defaults.color,
    bg: comp.bg ?? defaults.bg,
    radius: comp.radius ?? defaults.radius,
    text: comp.text ?? defaults.text,
  }
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
