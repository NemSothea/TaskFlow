import axios from 'axios'

/** Field-level validation errors in DRF's default shape: { field: ["msg"] }. */
export type FieldErrors = Record<string, string[]>

export interface ApiError {
  /** HTTP status, or null for network errors / timeouts. */
  status: number | null
  /** Best human-readable message, or null if none was provided by the server. */
  message: string | null
  fieldErrors: FieldErrors
  canceled: boolean
}

export function parseApiError(error: unknown): ApiError {
  if (axios.isCancel(error)) {
    return { status: null, message: null, fieldErrors: {}, canceled: true }
  }
  if (!axios.isAxiosError(error)) {
    return { status: null, message: null, fieldErrors: {}, canceled: false }
  }

  const status = error.response?.status ?? null
  const data: unknown = error.response?.data
  const fieldErrors: FieldErrors = {}
  let message: string | null = null

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (const [key, value] of Object.entries(data)) {
      const messages = Array.isArray(value) ? value.map(String) : [String(value)]
      if (key === 'detail' || key === 'non_field_errors') {
        message = messages.join(' ')
      } else {
        fieldErrors[key] = messages
      }
    }
  }

  return { status, message, fieldErrors, canceled: false }
}
