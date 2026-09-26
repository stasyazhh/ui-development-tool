import { useState, useRef, useEffect } from "react"
import { C } from "@/theme"
import {
  EXT_MARK,
  type Toast,
  type UIChange,
  type Msg,
  initMessages,
} from "@/types"
import { changesApi, uiStateApi } from "@/api"
import type { PlacedComp } from "../ui-kit/constants"
import { renderPlacedHTML } from "../ui-kit/renderHTML"
import ToastBanner from "./ToastBanner"
import TopBar from "./TopBar"
import SettingsPanel from "./SettingsPanel"
import Sidebar from "../projects-browser"
import VisualConstructor from "../ui-kit"
import LLMPanel from "../llm-communicator"

import ChangesPanel from "../changes-panel"

export default function WorkplaceUI() {
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null)
  const [activeFile, setActiveFile] = useState("chat-tutor.ui")
  const [toast, setToast] = useState<Toast>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [changes, setChanges] = useState<UIChange[]>([])
  const [changesLoading, setChangesLoading] = useState(false)
  const [restoredState, setRestoredState] = useState<PlacedComp[] | null>(null)
  const [placedState, setPlacedState] = useState<PlacedComp[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [msgs, setMsgs] = useState<Msg[]>(initMessages)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(t: Toast) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(t)
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }

  function handleCheck() {
    showToast({
      text: "Проверка завершена: 4 компонента, 0 ошибок, 1 предупреждение (Typing.visible не привязан)",
      kind: "warn",
    })
  }

  function handleRun() {
    if (activeProjectId === null) {
      showToast({ text: "Выберите проект для запуска", kind: "warn" })
      return
    }
    window.open(`http://localhost:8000/preview/${activeProjectId}`, "_blank")
  }

  async function handleApplyState(state: PlacedComp[]) {
    setRestoredState(state)
    if (activeProjectId === null) return
    try {
      await uiStateApi.update(activeProjectId, state)
      const html = renderPlacedHTML(state)
      await changesApi.create(activeProjectId, html, state)
      const { changes: list } = await changesApi.list(activeProjectId)
      setChanges(list)
      showToast({ text: "Интерфейс обновлён ассистентом", kind: "ok" })
    } catch (e) {
      showToast({
        text: e instanceof Error ? e.message : "Ошибка сохранения изменений",
        kind: "err",
      })
    }
  }

  useEffect(() => {
    if (activeProjectId === null) {
      setChanges([])
      return
    }
    setChangesLoading(true)
    changesApi
      .list(activeProjectId)
      .then(({ changes: list }) => setChanges(list))
      .catch(() => setChanges([]))
      .finally(() => setChangesLoading(false))
  }, [activeProjectId])

  return (
    <div
      style={{
        display: "grid",
        gridTemplateAreas: '"top top top" "sidebar center dialog"',
        gridTemplateColumns: "220px 1fr 300px",
        gridTemplateRows: "44px 1fr",
        height: "100dvh",
        background: C.bg,
        overflow: "hidden",
      }}
    >
      <ToastBanner toast={toast} />
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      <TopBar
        settingsOpen={settingsOpen}
        historyOpen={historyOpen}
        onCheck={handleCheck}
        onRun={handleRun}
        onSettings={() => setSettingsOpen((o) => !o)}
        onHistoryToggle={() => setHistoryOpen((o) => !o)}
      />
      <Sidebar
        selected={activeFile}
        onSelect={setActiveFile}
        onProjectChange={(id) => setActiveProjectId(id)}
      />

      <div
        style={{
          gridArea: "center",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: C.s1,
            borderBottom: `1px solid ${C.b1}`,
            height: 36,
            padding: "0 16px",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 10, color: C.grn, fontFamily: C.mono }}>
            {EXT_MARK["ui"]}
          </span>
          <span
            style={{
              fontSize: 12,
              fontFamily: C.mono,
              color: C.t1,
              marginLeft: 6,
            }}
          >
            {activeFile}
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 10, fontFamily: C.mono, color: C.t3 }}>
            Конструктор интерфейса
          </span>
        </div>

        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
            <VisualConstructor
              projectId={activeProjectId}
              restoredState={restoredState}
              onStateChange={setPlacedState}
              onSelectionChange={setSelectedIds}
              onSave={async () => {
                if (activeProjectId === null) return
                setChangesLoading(true)
                try {
                  const { changes: list } =
                    await changesApi.list(activeProjectId)
                  setChanges(list)
                  showToast({
                    text: "Сохранение добавлено в историю",
                    kind: "ok",
                  })
                } catch (e) {
                  showToast({
                    text:
                      e instanceof Error
                        ? e.message
                        : "Ошибка обновления истории",
                    kind: "err",
                  })
                } finally {
                  setChangesLoading(false)
                }
              }}
            />
          </div>
        </div>
      </div>

      {historyOpen ? (
        <ChangesPanel
          projectId={activeProjectId}
          changes={changes}
          loading={changesLoading}
          onRestore={(change) => {
            const state = change.ui_state as PlacedComp[] | null
            if (state) {
              setRestoredState(state)
              showToast({ text: "Версия восстановлена на канвасе", kind: "ok" })
            }
          }}
        />
      ) : (
        <LLMPanel
          projectId={activeProjectId}
          messages={msgs}
          setMessages={setMsgs}
          currentState={placedState}
          onApplyState={handleApplyState}
          selectedIds={selectedIds}
        />
      )}
    </div>
  )
}
