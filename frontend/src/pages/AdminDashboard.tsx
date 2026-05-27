import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import PublicNav from '../components/PublicNav'

export default function AdminDashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicNav />
      <main className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashCard title="Application Windows" description="Create and manage scholarship windows and view submitted applications." to="/admin/windows" />
          <DashCard title="Reviewers" description="Invite or manage reviewer accounts." to="/admin/reviewers" />
          <DashCard title="Applicants" description="View, edit, or delete registered applicant accounts." to="/admin/applicants" />
          <DashCard title="Admin Guide" description="Reference documentation for managing windows, reviewers, applicants, and applications." to="/admin/docs" />
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
