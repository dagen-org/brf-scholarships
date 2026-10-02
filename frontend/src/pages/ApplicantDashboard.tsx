import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import Footer from '../components/Footer'

interface Window_ {
  window_id: string
  name: string
  start_date: string
  end_date: string
  writing_prompt?: string
}

interface Application {
  app_id: string
  scholarship_type: string
  status: string
  window_id: string
  updated_at: string
}

const SCHOLARSHIP_TYPES = [
  {
    type: 'academic',
    label: 'Academic',
    description:
      'For graduating high school seniors attending a college or university in Oregon. Awards up to $6,000/year, renewable for up to four years.',
  },
  {
    type: 'academic_renewal',
    label: 'Academic Renewal',
    description:
      'For students who previously received an Academic scholarship and are continuing their college education. Supports up to three additional years.',
  },
  {
    type: 'ceyp',
    label: 'CEYP',
    description:
      'Continuing Education for Young Parents. For young women who had a child prior to graduating high school, supporting career-focused education.',
  },
  {
    type: 'vocational',
    label: 'Vocational',
    description:
      'For students pursuing trade schools, beauty schools, or other vocational programs who do not wish to attend a four-year college.',
  },
]

const STATUS_STYLES: Record<string, string> = {
  draft:        'bg-yellow-100 text-yellow-700',
  submitted:    'bg-blue-100 text-blue-700',
  under_review: 'bg-purple-100 text-purple-700',
  awarded:      'bg-green-100 text-green-700',
  declined:     'bg-red-100 text-red-600',
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

export default function ApplicantDashboard() {
  const { email, logout } = useAuth()
  const navigate = useNavigate()
  const [activeWindow, setActiveWindow] = useState<Window_ | null>(null)
  const [myApps, setMyApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/windows/active').catch(() => ({ data: null })),
      api.get('/applications/mine'),
    ]).then(([winRes, appsRes]) => {
      setActiveWindow(winRes.data)
      setMyApps(appsRes.data)
    }).finally(() => setLoading(false))
  }, [])

  async function startApplication(scholarshipType: string) {
    if (!activeWindow) return
    setStarting(scholarshipType)
    setError('')
    try {
      const res = await api.post('/applications/', {
        window_id: activeWindow.window_id,
        scholarship_type: scholarshipType,
      })
      navigate(`/apply/${res.data.app_id}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Failed to start application')
      setStarting(null)
    }
  }

  const hasDraftOrSubmitted = myApps.some(a => a.status === 'draft' || a.status === 'submitted')

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-blue-800">BRF Scholarships</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">{email}</span>
          <button onClick={logout} className="text-red-500 hover:underline">Sign out</button>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 space-y-8">

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <>
            {/* Existing applications */}
            {myApps.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-800">My Applications</h2>
                {myApps.map(app => {
                  const typeLabel = SCHOLARSHIP_TYPES.find(t => t.type === app.scholarship_type)?.label ?? app.scholarship_type
                  const statusLabel = app.status.replace('_', ' ')
                  return (
                    <div key={app.app_id} className="bg-white rounded-xl shadow p-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-800">{typeLabel}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Last updated {new Date(app.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[app.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {statusLabel}
                        </span>
                        <button
                          onClick={() => navigate(`/apply/${app.app_id}`)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {app.status === 'draft' ? 'Continue' : 'View'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </section>
            )}

            {/* Start new application */}
            {!hasDraftOrSubmitted && (
              <section className="space-y-4">
                {activeWindow ? (
                  <>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Apply for a Scholarship</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="font-medium text-gray-700">{activeWindow.name}</span>
                        {' '}is open until {formatDate(activeWindow.end_date)}.
                        {activeWindow.writing_prompt && (
                          <span className="block mt-1 italic">Writing prompt: "{activeWindow.writing_prompt}"</span>
                        )}
                      </p>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {SCHOLARSHIP_TYPES.map(({ type, label, description }) => (
                        <button
                          key={type}
                          onClick={() => startApplication(type)}
                          disabled={!!starting}
                          className="text-left bg-white rounded-xl shadow p-5 hover:shadow-md transition-shadow disabled:opacity-60 border-2 border-transparent hover:border-blue-200"
                        >
                          <p className="font-semibold text-blue-800 mb-1">
                            {starting === type ? 'Starting…' : label}
                          </p>
                          <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-xl shadow p-6 text-center space-y-2">
                    <p className="font-medium text-gray-700">No scholarship window is currently open.</p>
                    <p className="text-sm text-gray-500">
                      Check back soon — the next cycle typically opens in the spring.
                    </p>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
