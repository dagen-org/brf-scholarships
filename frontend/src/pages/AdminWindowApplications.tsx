import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import Footer from '../components/Footer'

interface WindowItem {
  window_id: string
  name: string
  window_type: 'testing' | 'live'
  start_date: string
  end_date: string
  writing_prompt?: string
}

interface Application {
  app_id: string
  owner_email: string
  scholarship_type: string
  status: string
  created_at: string
  updated_at: string
  data?: { first_name?: string; last_name?: string }
}

function applicantDisplayName(app: Application): string {
  const name = [app.data?.first_name, app.data?.last_name].filter(Boolean).join(' ')
  return name || app.owner_email
}

function windowStatus(w: WindowItem): 'active' | 'upcoming' | 'closed' {
  const today = new Date().toISOString().slice(0, 10)
  if (today < w.start_date) return 'upcoming'
  if (today > w.end_date) return 'closed'
  return 'active'
}

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  upcoming: 'bg-yellow-100 text-yellow-700',
  closed:   'bg-gray-100 text-gray-500',
}

const TYPE_STYLES: Record<string, string> = {
  live:    'bg-blue-100 text-blue-700',
  testing: 'bg-purple-100 text-purple-700',
}

const APP_STATUS_STYLES: Record<string, string> = {
  draft:        'bg-gray-100 text-gray-600',
  submitted:    'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  awarded:      'bg-green-100 text-green-700',
  declined:     'bg-red-100 text-red-600',
}

const SCHOLARSHIP_LABELS: Record<string, string> = {
  academic:         'Academic',
  academic_renewal: 'Academic Renewal',
  ceyp:             'CEYP',
  vocational:       'Vocational',
}

const SCHOLARSHIP_TYPES = [
  { type: 'academic',         label: 'Academic' },
  { type: 'academic_renewal', label: 'Academic Renewal' },
  { type: 'ceyp',             label: 'CEYP' },
  { type: 'vocational',       label: 'Vocational' },
]

export default function AdminWindowApplications() {
  const { window_id } = useParams<{ window_id: string }>()
  const { email, logout } = useAuth()
  const navigate = useNavigate()
  const [window_, setWindow_] = useState<WindowItem | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState<string | null>(null)
  const [startError, setStartError] = useState('')

  useEffect(() => {
    if (!window_id) return
    Promise.all([
      api.get(`/windows/${window_id}`),
      api.get(`/applications/window/${window_id}`),
    ])
      .then(([winRes, appsRes]) => {
        setWindow_(winRes.data)
        setApplications(appsRes.data)
      })
      .catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false))
  }, [window_id])

  async function startTestApplication(scholarshipType: string) {
    if (!window_id) return
    setStarting(scholarshipType)
    setStartError('')
    try {
      const res = await api.post('/applications/', {
        window_id,
        scholarship_type: scholarshipType,
      })
      navigate(`/admin/applications/${res.data.app_id}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setStartError(msg || 'Failed to start test application.')
      setStarting(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-blue-800">BRF Scholarships — Admin</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-gray-600 hover:text-blue-700">Home</Link>
          <span className="text-gray-500">{email}</span>
          <button onClick={logout} className="text-red-500 hover:underline">Sign out</button>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/windows" className="text-sm text-blue-600 hover:underline">← Application Windows</Link>
          <h2 className="text-xl font-semibold text-gray-800">
            {loading ? 'Loading...' : (window_?.name ?? 'Applications')}
          </h2>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && window_ && (() => {
          const status = windowStatus(window_)
          return (
            <div className="bg-white rounded-xl shadow p-5 flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-1">Type</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_STYLES[window_.window_type]}`}>
                  {window_.window_type}
                </span>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Status</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status]}`}>
                  {status}
                </span>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Dates</p>
                <p className="text-gray-700">{window_.start_date} — {window_.end_date}</p>
              </div>
              {window_.writing_prompt && (
                <div className="w-full">
                  <p className="text-gray-400 text-xs mb-1">Writing Prompt</p>
                  <p className="text-gray-700">{window_.writing_prompt}</p>
                </div>
              )}
            </div>
          )
        })()}

        {/* Test application panel — only for testing windows */}
        {!loading && window_?.window_type === 'testing' && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 space-y-3">
            <div>
              <p className="font-medium text-purple-900 text-sm">Start a Test Application</p>
              <p className="text-xs text-purple-700 mt-0.5">
                Testing windows allow admins and reviewers to submit test applications.
              </p>
            </div>
            {startError && <p className="text-xs text-red-600">{startError}</p>}
            <div className="flex flex-wrap gap-2">
              {SCHOLARSHIP_TYPES.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => startTestApplication(type)}
                  disabled={!!starting}
                  className="text-sm bg-white border border-purple-300 text-purple-800 px-3 py-1.5 rounded-lg hover:bg-purple-100 disabled:opacity-50"
                >
                  {starting === type ? 'Starting…' : label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-gray-400">Loading...</div>
          ) : applications.length === 0 ? (
            <div className="p-6 text-sm text-gray-400">No applications submitted for this window yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Applicant</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Scholarship Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Submitted</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {applications.map(app => (
                  <tr key={app.app_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-gray-800 font-medium">{applicantDisplayName(app)}</p>
                      {(app.data?.first_name || app.data?.last_name) && (
                        <p className="text-xs text-gray-400">{app.owner_email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {SCHOLARSHIP_LABELS[app.scholarship_type] ?? app.scholarship_type}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${APP_STATUS_STYLES[app.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(app.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/applications/${app.app_id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
