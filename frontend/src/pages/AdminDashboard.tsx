import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Footer from '../components/Footer'

export default function AdminDashboard() {
  const { email, logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-blue-800">Beaverton Rotary Scholarships — Admin</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-gray-600 hover:text-blue-700">Home</Link>
          <span className="text-gray-500">{email}</span>
          <button onClick={logout} className="text-red-500 hover:underline">Sign out</button>
        </div>
      </nav>
      <main className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashCard title="Application Windows" description="Create and manage scholarship windows and view submitted applications." to="/admin/windows" />
          <DashCard title="Reviewers" description="Invite or manage reviewer accounts." to="/admin/reviewers" />
        </div>
      </main>
      <Footer />
    </div>
  )
}

function DashCard({ title, description, to }: { title: string; description: string; to: string }) {
  return (
    <Link
      to={to}
      className="block bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow"
    >
      <h2 className="font-semibold text-gray-800 mb-1">{title}</h2>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  )
}
