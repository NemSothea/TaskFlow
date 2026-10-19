import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import * as authApi from '../../api/auth'
import { refreshAccessToken, setAccessToken, setSessionExpiredHandler } from '../../api/client'
import type { LoginInput, RegisterInput, User } from '../../api/types'
import { AuthContext, type AuthStatus } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Restore the session from the httpOnly refresh cookie on first load.
  useEffect(() => {
    const controller = new AbortController()
    refreshAccessToken()
      .then(() => authApi.fetchMe(controller.signal))
      .then((me) => {
        setUser(me)
        setStatus('authenticated')
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setAccessToken(null)
        setStatus('anonymous')
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null)
      setStatus('anonymous')
      setSessionExpired(true)
    })
    return () => setSessionExpiredHandler(null)
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const me = await authApi.login(input)
    setUser(me)
    setSessionExpired(false)
    setStatus('authenticated')
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    await authApi.register(input)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  const value = useMemo(
    () => ({ status, user, sessionExpired, login, register, logout }),
    [status, user, sessionExpired, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
