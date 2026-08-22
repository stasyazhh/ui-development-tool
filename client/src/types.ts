import { C } from "./theme"

export type FileNode = {
  id: string
  name: string
  type: "folder" | "model" | "ui" | "flow" | "test"
  modified?: boolean
  children?: FileNode[]
}

export interface Msg {
  role: "user" | "assistant"
  text: string
  time: string
}

export type Device = "mobile" | "desktop"
export type RunState = "idle" | "checking" | "running"

export interface ToastValue {
  text: string
  kind: "ok" | "warn" | "err"
}
export type Toast = ToastValue | null

export const FILES: FileNode[] = [
  {
    id: "models",
    name: "models",
    type: "folder",
    children: [
      {
        id: "student.model",
        name: "student.model",
        type: "model",
        modified: true,
      },
      { id: "curriculum.model", name: "curriculum.model", type: "model" },
      { id: "session.model", name: "session.model", type: "model" },
    ],
  },
  {
    id: "interfaces",
    name: "interfaces",
    type: "folder",
    children: [
      { id: "chat-tutor.ui", name: "chat-tutor.ui", type: "ui" },
      { id: "quiz-flow.ui", name: "quiz-flow.ui", type: "ui" },
    ],
  },
  {
    id: "tests",
    name: "tests",
    type: "folder",
    children: [
      { id: "tutor-eval.test", name: "tutor-eval.test", type: "test" },
    ],
  },
]

export function initMessages(): Msg[] {
  return [
    {
      role: "user",
      text: "Добавь индикатор набора текста под последним сообщением",
      time: "14:23",
    },
    {
      role: "assistant",
      text: "Добавляю компонент `Typing` в конец диалога. Анимация — три точки с задержкой 150 мс.\n\nНастроить цвет и размер под текущую тему?",
      time: "14:23",
    },
  ]
}

export const EXT_MARK: Record<string, string> = {
  model: "⬡",
  ui: "◧",
  flow: "⤳",
  test: "◈",
  folder: "▾",
}

export const EXT_COLOR: Record<string, string> = {
  model: C.acc,
  ui: C.grn,
  flow: C.ora,
  test: C.pur,
  folder: C.t2,
}
