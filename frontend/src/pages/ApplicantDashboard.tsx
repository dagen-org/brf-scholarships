import { useAuth } from '../contexts/AuthContext'

export default function ApplicantDashboard() {
  const { email, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-blue-800">BRF Scholarships</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">{email}</span>
          <button onClick={logout} className="text-red-500 hover:underline">Sign out</button>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto p-6">
        <h2 className="text-xl font-semibold mb-4">My Application</h2>
        <div className="bg-white rounded-xl shadow p-6 text-sm text-gray-500">
          Application form coming soon. Select a scholarship type to begin.
        </div>
      </main>
    </div>
  )
}
