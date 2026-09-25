import { C } from "@/theme"
import TbBtn from "./TbBtn"

export default function TopBar({
  settingsOpen,
  historyOpen,
  onCheck,
  onRun,
  onSettings,
  onHistoryToggle,
}: {
  settingsOpen: boolean
  historyOpen: boolean
  onCheck: () => void
  onRun: () => void
  onSettings: () => void
  onHistoryToggle: () => void
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

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <TbBtn label="Проверить" onClick={onCheck} />
        <TbBtn label="▷  Запуск" accent onClick={onRun} />
        <div
          style={{ width: 1, height: 18, background: C.b2, margin: "0 2px" }}
        />
        <TbBtn label="История" active={historyOpen} onClick={onHistoryToggle} />
        <div
          style={{ width: 1, height: 18, background: C.b2, margin: "0 2px" }}
        />
        <TbBtn label="⚙" active={settingsOpen} onClick={onSettings} />
      </div>
    </div>
  )
}
