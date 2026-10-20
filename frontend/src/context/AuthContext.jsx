import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, tokenStore } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!tokenStore.get())
  const [authTransition, setAuthTransition] = useState(null)

  // Verify a saved Sanctum token with the API before protected routes render.
  useEffect(() => {
    if (!tokenStore.get()) return
    authApi.me()
      .then((res) => setUser(res.data.data))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  // The Axios interceptor fires this on any 401 response.
  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener('auth:unauthorized', onUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized)
  }, [])

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials)
    tokenStore.set(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload)
    tokenStore.set(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* token may already be invalid */ }
    tokenStore.clear() // logout always clears the token
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, authTransition, setAuthTransition, login, register, logout, isTeacher: user?.role === 'teacher', isStudent: user?.role === 'student' }),
    [user, loading, authTransition, login, register, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
