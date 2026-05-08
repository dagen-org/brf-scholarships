import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  roles: string[]
}

export default function PrivateRoute({ roles }: Props) {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role && !roles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
