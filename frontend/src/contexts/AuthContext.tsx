import { createContext, useContext, useState, ReactNode } from 'react'
import { flushSync } from 'react-dom'
import api from '../api/client'

interface AuthState {
  token: string | null
  role: string | null
  email: string | null
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<string>
  setSession: (token: string, role: string, email: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role'),
    email: localStorage.getItem('email'),
  })

  function setSession(token: string, role: string, email: string) {
    localStorage.setItem('token', token)
    localStorage.setItem('role', role)
    localStorage.setItem('email', email)
    flushSync(() => setAuth({ token, role, email }))
  }

  async function login(email: string, password: string): Promise<string> {
    const res = await api.post('/auth/login', { email, password })
    const { access_token, role } = res.data
    setSession(access_token, role, email)
    return role
  }

  function logout() {
    localStorage.clear()
    setAuth({ token: null, role: null, email: null })
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, setSession, logout, isAuthenticated: !!auth.token }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
