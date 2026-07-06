import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import PublicNav from '../components/PublicNav'

const COLOR_STYLES = {
  blue:   { card: 'bg-blue-50 border-l-4 border-blue-500 hover:bg-blue-100', title: 'text-blue-900' },
  purple: { card: 'bg-purple-50 border-l-4 border-purple-500 hover:bg-purple-100', title: 'text-purple-900' },
  green:  { card: 'bg-green-50 border-l-4 border-green-500 hover:bg-green-100', title: 'text-green-900' },
  amber:  { card: 'bg-amber-50 border-l-4 border-amber-500 hover:bg-amber-100', title: 'text-amber-900' },
}

type CardColor = keyof typeof COLOR_STYLES

export default function AdminDashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicNav />
      <main className="flex-1 max-w-6xl mx-auto w-full p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashCard title="Application Windows" description="Create and manage scholarship windows and view submitted applications." to="/admin/windows" color="blue" />
          <DashCard title="Reviewers" description="Invite or manage reviewer accounts." to="/admin/reviewers" color="purple" />
          <DashCard title="Applicants" description="View, edit, or delete registered applicant accounts." to="/admin/applicants" color="green" />
          <DashCard title="Admin Guide" description="Reference documentation for managing windows, reviewers, applicants, and applications." to="/admin/docs" color="amber" />
        </div>
      </main>
      <Footer />
    </div>
  )
}

function DashCard({ title, description, to, color }: { title: string; description: string; to: string; color: CardColor }) {
  const styles = COLOR_STYLES[color]
  return (
    <Link
      to={to}
      className={`block rounded-xl shadow p-6 transition-colors ${styles.card}`}
    >
      <h2 className={`font-semibold mb-1 ${styles.title}`}>{title}</h2>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  )
}
