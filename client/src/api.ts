import { FileNode, UIChange } from "./types"
import type { PlacedComp } from "../ui-kit/constants"

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api"

export type ApiProject = {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export type ApiProjectWithFiles = ApiProject & {
  files: FileNode[]
}

export type ApiFile = FileNode & {
  parent_id?: number | null
  sort_order?: number
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`
    try {
      const body = await response.json()
      if (body.detail) detail = body.detail
    } catch {
      // ignore parse error
    }
    throw new Error(detail)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const projectsApi = {
  list(): Promise<{ projects: ApiProject[] }> {
    return api<{ projects: ApiProject[] }>("/projects")
  },

  get(id: number): Promise<ApiProjectWithFiles> {
    return api<ApiProjectWithFiles>(`/projects/${id}`)
  },

  create(name: string): Promise<ApiProject> {
    return api<ApiProject>("/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
    })
  },

  update(id: number, name: string): Promise<ApiProject> {
    return api<ApiProject>(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    })
  },

  remove(id: number): Promise<{ ok: boolean }> {
    return api<{ ok: boolean }>(`/projects/${id}`, {
      method: "DELETE",
    })
  },
}

export const filesApi = {
  list(projectId: number): Promise<{ files: FileNode[] }> {
    return api<{ files: FileNode[] }>(`/projects/${projectId}/files`)
  },

  create(
    projectId: number,
    file: {
      name: string
      type: string
      parent_id?: number | null
      modified?: boolean
      sort_order?: number
    },
  ): Promise<ApiFile> {
    return api<ApiFile>(`/projects/${projectId}/files`, {
      method: "POST",
      body: JSON.stringify(file),
    })
  },

  update(
    fileId: string,
    patch: {
      name?: string
      modified?: boolean
      sort_order?: number
    },
  ): Promise<ApiFile> {
    return api<ApiFile>(`/files/${fileId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    })
  },

  remove(fileId: string): Promise<{ ok: boolean }> {
    return api<{ ok: boolean }>(`/files/${fileId}`, {
      method: "DELETE",
    })
  },
}

export const changesApi = {
  list(projectId: number): Promise<{ changes: UIChange[] }> {
    return api<{ changes: UIChange[] }>(`/projects/${projectId}/ui-changes`)
  },

  create(
    projectId: number,
    htmlCode: string,
    uiState?: PlacedComp[],
  ): Promise<UIChange> {
    return api<UIChange>(`/projects/${projectId}/ui-changes`, {
      method: "POST",
      body: JSON.stringify({ html_code: htmlCode, ui_state: uiState }),
    })
  },
}

export const uiStateApi = {
  get(projectId: number): Promise<{ ui_state: PlacedComp[] | null }> {
    return api<{ ui_state: PlacedComp[] | null }>(`/projects/${projectId}/ui-state`)
  },

  update(projectId: number, state: PlacedComp[]): Promise<{ ok: boolean }> {
    return api<{ ok: boolean }>(`/projects/${projectId}/ui-state`, {
      method: "PATCH",
      body: JSON.stringify({ ui_state: state }),
    })
  },
}
