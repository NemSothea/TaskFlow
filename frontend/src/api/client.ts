import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

/**
 * Single Axios instance for the whole app.
 *
 * Token model:
 * - Access token lives only in this module's memory (never in localStorage).
 * - Refresh token is an httpOnly cookie the browser sends to /api/v1/auth/*.
 *   JavaScript cannot read it, so XSS cannot steal it.
 * - Refresh/logout are CSRF-protected; Axios copies the `csrftoken` cookie
 *   into the X-CSRFToken header for same-origin requests.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  timeout: 15_000,
})

let accessToken: string | null = null
let onSessionExpired: (() => void) | null = null
let refreshInFlight: Promise<string> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

/** Called once by AuthProvider so the client can signal a dead session. */
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler
}

/**
 * Exchange the refresh cookie for a new access token.
 *
 * Concurrent callers share one request: the server rotates and blacklists the
 * refresh token on every use, so two parallel refreshes would invalidate each
 * other and log the user out.
 */
export function refreshAccessToken(): Promise<string> {
  refreshInFlight ??= api
    .post<{ access: string }>('/auth/refresh/', null, { skipAuthRefresh: true })
    .then(({ data }) => {
      setAccessToken(data.access)
      return data.access
    })
    .finally(() => {
      refreshInFlight = null
    })
  return refreshInFlight
}

api.interceptors.request.use((config) => {
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const original = error.config as RetriableConfig | undefined
  if (
    error.response?.status !== 401 ||
    !original ||
    original.skipAuthRefresh ||
    original._retried
  ) {
    throw error
  }

  original._retried = true
  try {
    const token = await refreshAccessToken()
    original.headers.Authorization = `Bearer ${token}`
    return api(original)
  } catch {
    setAccessToken(null)
    onSessionExpired?.()
    throw error
  }
})

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Do not try to refresh the access token if this request returns 401. */
    skipAuthRefresh?: boolean
  }
}
