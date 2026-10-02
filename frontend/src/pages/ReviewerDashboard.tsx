import { useAuth } from '../contexts/AuthContext'
import Footer from '../components/Footer'

export default function ReviewerDashboard() {
  const { email, logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-blue-800">BRF Scholarships — Review</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">{email}</span>
          <button onClick={logout} className="text-red-500 hover:underline">Sign out</button>
        </div>
      </nav>
      <main className="flex-1 max-w-6xl mx-auto w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Applications to Review</h2>
        <div className="bg-white rounded-xl shadow p-6 text-sm text-gray-500">
          Application list coming soon.
        </div>
      </main>
      <Footer />
    </div>
  )
}
