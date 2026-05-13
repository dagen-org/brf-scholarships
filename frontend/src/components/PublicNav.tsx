import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import brfLogo from '../images/beaverton-rotary-foundation.png'

export default function PublicNav() {
  const { isAuthenticated, role, logout } = useAuth()

  function dashboardPath() {
    if (role === 'admin') return '/admin'
    if (role === 'reviewer') return '/review'
    return '/apply'
  }

  return (
    <nav className="bg-white shadow px-6 h-[120px] flex justify-between items-center">
      <Link to="/"><img src={brfLogo} alt="Beaverton Rotary Foundation" className="h-20 object-contain" /></Link>
      <div className="text-lg font-bold text-blue-800">Beaverton Rotary Foundation Scholarships</div>
      <div className="flex items-center gap-6 text-sm">
        <Link to="/about" className="text-gray-600 hover:text-blue-700">About</Link>
        {isAuthenticated ? (
          <>
            <Link to={dashboardPath()} className="text-gray-600 hover:text-blue-700">Dashboard</Link>
            <button onClick={logout} className="text-red-500 hover:underline">Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-gray-600 hover:text-blue-700">Sign In</Link>
            <Link
              to="/login?tab=register"
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
