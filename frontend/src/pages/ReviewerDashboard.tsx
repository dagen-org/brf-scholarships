import Footer from '../components/Footer'
import PublicNav from '../components/PublicNav'

export default function ReviewerDashboard() {

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicNav />
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
