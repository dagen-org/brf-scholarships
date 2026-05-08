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

  async function login(email: string, password: string): Promise<string> {
    const res = await api.post('/auth/login', { email, password })
    const { access_token, role } = res.data
    localStorage.setItem('token', access_token)
    localStorage.setItem('role', role)
    localStorage.setItem('email', email)
    flushSync(() => setAuth({ token: access_token, role, email }))
    return role
  }

  function logout() {
    localStorage.clear()
    setAuth({ token: null, role: null, email: null })
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, isAuthenticated: !!auth.token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
