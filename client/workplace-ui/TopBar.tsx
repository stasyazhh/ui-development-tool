import { C } from "@/theme"
import type { RunState } from "@/types"
import TbBtn from "./TbBtn"

export default function TopBar({
  activeFile,
  runState,
  settingsOpen,
  previewOpen,
  onCheck,
  onRun,
  onSettings,
  onPreviewToggle,
}: {
  activeFile: string
  runState: RunState
  settingsOpen: boolean
  previewOpen: boolean
  onCheck: () => void
  onRun: () => void
  onSettings: () => void
  onPreviewToggle: () => void
}) {
  return (
    <div
      style={{
        gridArea: "top",
        display: "flex",
        alignItems: "center",
        height: 44,
        background: C.s1,
        borderBottom: `1px solid ${C.b1}`,
        padding: "0 16px",
        fontFamily: C.sans,
      }}
    >
      <div style={{ flex: 1 }} />

      {runState === "checking" && (
        <span
          style={{
            fontSize: 11,
            fontFamily: C.mono,
            color: C.ora,
            marginRight: 12,
          }}
        >
          ⏳ проверка...
        </span>
      )}
      {runState === "running" && (
        <span
          style={{
            fontSize: 11,
            fontFamily: C.mono,
            color: C.grn,
            marginRight: 12,
          }}
        >
          ● сборка...
        </span>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <TbBtn
          label="Проверить"
          active={runState === "checking"}
          onClick={onCheck}
        />
        <TbBtn
          label={runState === "running" ? "◼  Стоп" : "▷  Запуск"}
          accent
          active={runState === "running"}
          onClick={onRun}
        />
        <div
          style={{ width: 1, height: 18, background: C.b2, margin: "0 2px" }}
        />
        <TbBtn
          label={previewOpen ? "Превью" : "Превью"}
          active={previewOpen}
          onClick={onPreviewToggle}
        />
        <div
          style={{ width: 1, height: 18, background: C.b2, margin: "0 2px" }}
        />
        <TbBtn label="⚙" active={settingsOpen} onClick={onSettings} />
      </div>
    </div>
  )
}
