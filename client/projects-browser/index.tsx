import { useState, useEffect, useCallback } from "react"
import { C } from "@/theme"
import { FILES, EXT_MARK, EXT_COLOR, type FileNode } from "@/types"
import { projectsApi, filesApi, type ApiProject } from "@/api"

export default function Sidebar({
  selected,
  onSelect,
  onProjectChange,
}: {
  selected: string
  onSelect: (id: string) => void
  onProjectChange?: (projectId: number) => void
}) {
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null)
  const [files, setFiles] = useState<FileNode[]>(FILES)
  const [open, setOpen] = useState<Record<string, boolean>>({
    models: true,
    interfaces: true,
    tests: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { projects: list } = await projectsApi.list()
      setProjects(list)
      if (list.length > 0 && activeProjectId === null) {
        const edu = list.find((p) => p.name === "EduAssistant") || list[0]
        setActiveProjectId(edu.id)
        onProjectChange?.(edu.id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки проектов")
    } finally {
      setLoading(false)
    }
  }, [activeProjectId, onProjectChange])

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (activeProjectId === null) return
    filesApi.list(activeProjectId).then(({ files }) => setFiles(files)).catch((e) => {
      setError(e instanceof Error ? e.message : "Ошибка загрузки файлов")
    })
  }, [activeProjectId])

  async function handleCreateProject() {
    const name = prompt("Название проекта:")
    if (!name?.trim()) return
    try {
      const project = await projectsApi.create(name.trim())
      setProjects((prev) => [project, ...prev])
      setActiveProjectId(project.id)
      onProjectChange?.(project.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка создания проекта")
    }
  }

  return (
    <div
      style={{
        gridArea: "sidebar",
        background: C.s1,
        borderRight: `1px solid ${C.b1}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: C.sans,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px 8px",
          borderBottom: `1px solid ${C.b1}`,
          flexShrink: 0,
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
          ПРОЕКТЫ
        </span>
        <button
          onClick={handleCreateProject}
          style={{
            background: "none",
            border: "none",
            color: C.t2,
            fontSize: 14,
            padding: 0,
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          +
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "8px 14px",
            fontSize: 11,
            color: "#ff6b6b",
            fontFamily: C.mono,
            borderBottom: `1px solid ${C.b1}`,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => {
              setActiveProjectId(project.id)
              onProjectChange?.(project.id)
            }}
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              background:
                activeProjectId === project.id ? C.accA : "transparent",
              border: "none",
              borderLeft: `2px solid ${
                activeProjectId === project.id ? C.acc : "transparent"
              }`,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              color: activeProjectId === project.id ? C.t1 : C.t2,
              fontFamily: C.sans,
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            {project.name}
          </button>
        ))}

        {activeProjectId !== null && files.length > 0 && (
          <div
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: `1px solid ${C.b1}`,
            }}
          >
            {files.map((folder) => (
          <div key={folder.id}>
            <button
              onClick={() =>
                setOpen((o) => ({ ...o, [folder.id]: !o[folder.id] }))
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                width: "100%",
                background: "none",
                border: "none",
                padding: "4px 14px",
                fontSize: 11.5,
                color: C.t2,
                fontFamily: C.sans,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  display: "inline-block",
                  transition: "transform .12s",
                  transform: open[folder.id]
                    ? "rotate(0deg)"
                    : "rotate(-90deg)",
                  color: C.t3,
                }}
              >
                ▾
              </span>
              <span>{folder.name}</span>
            </button>

            {open[folder.id] &&
              folder.children?.map((file) => (
                <button
                  key={file.id}
                  onClick={() => onSelect(file.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    borderLeft: `2px solid ${
                      selected === file.id ? C.acc : "transparent"
                    }`,
                    background: selected === file.id ? C.accA : "transparent",
                    padding: "3px 14px 3px 22px",
                    fontSize: 12,
                    fontFamily: C.sans,
                    color: selected === file.id ? C.t1 : C.t2,
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 10, color: EXT_COLOR[file.type] }}>
                    {EXT_MARK[file.type]}
                  </span>
                  <span style={{ flex: 1 }}>{file.name}</span>
                  {file.modified && (
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: C.ora,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </button>
              ))}
          </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          padding: "10px 14px",
          borderTop: `1px solid ${C.b1}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10,
            fontFamily: C.mono,
            color: C.t3,
          }}
        >
          <span style={{ color: C.grn, fontSize: 8 }}>●</span>
          <span>2 интерфейса · 1 тест</span>
        </div>
      </div>
    </div>
  )
}
