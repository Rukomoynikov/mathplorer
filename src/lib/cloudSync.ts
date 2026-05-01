import type { Notebook } from '@mathplorer/notebook'

const API_BASE_URL =
  import.meta.env.VITE_MATHPLORER_API_BASE_URL ?? 'http://localhost:8787'

export type AuthUser = {
  email: string
  emailVerified: boolean
  id: string
}

export type SyncedNotebookSummary = {
  id: string
  revision: number
  title: string
  updatedAt: string
}

export type SyncedNotebook = {
  notebook: Notebook
  revision: number
  updatedAt: string
}

export class ApiError extends Error {
  code: string
  payload: unknown
  status: number

  constructor(status: number, code: string, payload: unknown) {
    super(code)
    this.code = code
    this.payload = payload
    this.status = status
  }
}

function apiUrl(path: string) {
  return `${API_BASE_URL.replace(/\/$/, '')}${path}`
}

async function apiRequest<T>(
  path: string,
  options: {
    body?: unknown
    method?: string
    token?: string | null
  } = {},
) {
  const response = await fetch(apiUrl(path), {
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    method: options.method ?? 'GET',
  })
  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const code =
      payload && typeof payload === 'object' && 'error' in payload
        ? String(payload.error)
        : `HTTP_${response.status}`

    throw new ApiError(response.status, code, payload)
  }

  return payload as T
}

export function getCurrentUser(token: string | null) {
  return apiRequest<{ user: AuthUser | null }>('/api/auth/me', { token })
}

export function signUp(email: string, password: string) {
  return apiRequest<{ sessionToken: string; user: AuthUser }>('/api/auth/signup', {
    body: {
      email,
      password,
    },
    method: 'POST',
  })
}

export function signIn(email: string, password: string) {
  return apiRequest<{ sessionToken: string; user: AuthUser }>('/api/auth/login', {
    body: {
      email,
      password,
    },
    method: 'POST',
  })
}

export function signOut(token: string | null) {
  return apiRequest<{ ok: true }>('/api/auth/logout', {
    method: 'POST',
    token,
  })
}

export function resendVerification(token: string | null) {
  return apiRequest<{ ok: true }>('/api/auth/resend-verification', {
    method: 'POST',
    token,
  })
}

export function requestPasswordReset(email: string) {
  return apiRequest<{ ok: true }>('/api/auth/request-password-reset', {
    body: {
      email,
    },
    method: 'POST',
  })
}

export function resetPassword(token: string, password: string) {
  return apiRequest<{ ok: true }>('/api/auth/reset-password', {
    body: {
      password,
      token,
    },
    method: 'POST',
  })
}

export function listSyncedNotebooks(token: string | null) {
  return apiRequest<{ notebooks: SyncedNotebookSummary[] }>('/api/notebooks', {
    token,
  })
}

export function getSyncedNotebook(id: string, token: string | null) {
  return apiRequest<SyncedNotebook>(`/api/notebooks/${encodeURIComponent(id)}`, {
    token,
  })
}

export function putSyncedNotebook(
  id: string,
  notebook: Notebook,
  baseRevision: number | null,
  token: string | null,
  force = false,
) {
  return apiRequest<SyncedNotebook>(`/api/notebooks/${encodeURIComponent(id)}`, {
    body: {
      baseRevision,
      force,
      notebook,
    },
    method: 'PUT',
    token,
  })
}

export function deleteSyncedNotebook(id: string, token: string | null) {
  return apiRequest<{ ok: true }>(`/api/notebooks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
}
