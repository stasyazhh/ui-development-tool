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
  onProjectChange?: (projectId: number | null) => void
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
  const [hoveredId, setHoveredId] = useState<number | null>(null)

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
    filesApi
      .list(activeProjectId)
      .then(({ files }) => setFiles(files))
      .catch((e) => {
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

  async function handleRenameProject(project: ApiProject) {
    const name = prompt("Новое название проекта:", project.name)
    if (!name?.trim() || name.trim() === project.name) return
    try {
      const updated = await projectsApi.update(project.id, name.trim())
      setProjects((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка переименования проекта")
    }
  }

  async function handleDeleteProject(project: ApiProject) {
    if (!confirm(`Удалить проект «${project.name}»?`)) return
    try {
      await projectsApi.remove(project.id)
      setProjects((prev) => {
        const next = prev.filter((p) => p.id !== project.id)
        if (activeProjectId === project.id) {
          const fallback = next[0] ?? null
          setActiveProjectId(fallback?.id ?? null)
          onProjectChange?.(fallback?.id ?? null)
        }
        return next
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка удаления проекта")
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
        {projects.map((project) => {
          const isActive = activeProjectId === project.id
          const showActions = isActive || hoveredId === project.id

          return (
            <div
              key={project.id}
              onMouseEnter={() => setHoveredId(project.id)}
              onMouseLeave={() =>
                setHoveredId((id) => (id === project.id ? null : id))
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                width: "100%",
                background: isActive ? C.accA : "transparent",
                borderLeft: `2px solid ${isActive ? C.acc : "transparent"}`,
                padding: "4px 6px 4px 14px",
              }}
            >
              <button
                onClick={() => {
                  setActiveProjectId(project.id)
                  onProjectChange?.(project.id)
                }}
                title={project.name}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  background: "none",
                  border: "none",
                  padding: "2px 0",
                  fontSize: 12,
                  fontWeight: 600,
                  color: isActive ? C.t1 : C.t2,
                  fontFamily: C.sans,
                  textAlign: "left",
                  cursor: "pointer",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {project.name}
              </button>

              {showActions && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRenameProject(project)
                    }}
                    title="Переименовать"
                    style={{
                      background: "none",
                      border: "none",
                      color: isActive ? C.t1 : C.t2,
                      fontSize: 11,
                      padding: "2px 4px",
                      cursor: "pointer",
                      lineHeight: 1,
                      opacity: 0.8,
                    }}
                  >
                    ✎
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteProject(project)
                    }}
                    title="Удалить"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#e05555",
                      fontSize: 11,
                      padding: "2px 4px",
                      cursor: "pointer",
                      lineHeight: 1,
                      opacity: 0.8,
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )
        })}

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
                        background:
                          selected === file.id ? C.accA : "transparent",
                        padding: "3px 14px 3px 22px",
                        fontSize: 12,
                        fontFamily: C.sans,
                        color: selected === file.id ? C.t1 : C.t2,
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{ fontSize: 10, color: EXT_COLOR[file.type] }}
                      >
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
