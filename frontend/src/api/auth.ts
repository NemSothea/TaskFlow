import { api, setAccessToken } from './client'
import type { LoginInput, LoginResponse, RegisterInput, User } from './types'

const noRefresh = { skipAuthRefresh: true }

export async function login(input: LoginInput): Promise<User> {
  const { data } = await api.post<LoginResponse>('/auth/login/', input, noRefresh)
  setAccessToken(data.access)
  return data.user
}

export async function register(input: RegisterInput): Promise<User> {
  const { data } = await api.post<User>('/auth/register/', input, noRefresh)
  return data
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout/', null, noRefresh)
  } finally {
    setAccessToken(null)
  }
}

export async function fetchMe(signal?: AbortSignal): Promise<User> {
  const { data } = await api.get<User>('/auth/me/', { signal })
  return data
}
