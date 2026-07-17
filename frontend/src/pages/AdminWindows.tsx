import { useEffect, useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
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
  created_at: string
  archived?: boolean
}

function windowStatus(w: WindowItem): 'active' | 'upcoming' | 'closed' {
  const today = new Date().toISOString().slice(0, 10)
  if (today < w.start_date) return 'upcoming'
  if (today > w.end_date) return 'closed'
  return 'active'
}

const STATUS_STYLES = {
  active:   'bg-green-100 text-green-700',
  upcoming: 'bg-yellow-100 text-yellow-700',
  closed:   'bg-gray-100 text-gray-500',
}

const TYPE_STYLES = {
  live:    'bg-blue-100 text-blue-700',
  testing: 'bg-purple-100 text-purple-700',
}

export default function AdminWindows() {
  const { email, role, logout } = useAuth()
  const isAdmin = role === 'admin'
  const [windows, setWindows] = useState<WindowItem[]>([])
  const [archivedWindows, setArchivedWindows] = useState<WindowItem[]>([])
  const [loading, setLoading] = useState(true)

  // form state — null = hidden, 'create' = new window, window_id = editing that window
  const [formMode, setFormMode] = useState<'create' | string | null>(null)
  const [name, setName] = useState('')
  const [windowType, setWindowType] = useState<'testing' | 'live'>('live')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [writingPrompt, setWritingPrompt] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null)
  const [confirmUnarchiveId, setConfirmUnarchiveId] = useState<string | null>(null)
  const [archiving, setArchiving] = useState(false)

  async function loadWindows() {
    const [r1, r2] = await Promise.all([
      api.get('/windows/'),
      api.get('/windows/archived'),
    ])
    const sortByDate = (a: WindowItem, b: WindowItem) => b.start_date.localeCompare(a.start_date)
    setWindows([...r1.data].sort(sortByDate))
    setArchivedWindows([...r2.data].sort(sortByDate))
  }

  useEffect(() => {
    loadWindows().finally(() => setLoading(false))
  }, [])

  function openCreate() {
    setName('')
    setWindowType('live')
    setStartDate('')
    setEndDate('')
    setWritingPrompt('')
    setFormError('')
    setConfirmDeleteId(null)
    setConfirmArchiveId(null)
    setConfirmUnarchiveId(null)
    setFormMode('create')
  }

  function openEdit(w: WindowItem) {
    setName(w.name)
    setWindowType(w.window_type)
    setStartDate(w.start_date)
    setEndDate(w.end_date)
    setWritingPrompt(w.writing_prompt ?? '')
    setFormError('')
    setConfirmDeleteId(null)
    setConfirmArchiveId(null)
    setConfirmUnarchiveId(null)
    setFormMode(w.window_id)
  }

  function closeForm() {
    setFormMode(null)
    setFormError('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (endDate < startDate) {
      setFormError('End date must be on or after start date.')
      return
    }
    setFormError('')
    setSaving(true)
    const payload = {
      name,
      window_type: windowType,
      start_date: startDate,
      end_date: endDate,
      writing_prompt: writingPrompt || undefined,
    }
    try {
      if (formMode === 'create') {
        await api.post('/windows/', payload)
      } else {
        await api.put(`/windows/${formMode}`, payload)
      }
      closeForm()
      loadWindows()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setFormError(msg || 'Failed to save window.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(window_id: string) {
    setDeleting(true)
    try {
      await api.delete(`/windows/${window_id}`)
      setConfirmDeleteId(null)
      loadWindows()
    } catch {
      setConfirmDeleteId(null)
    } finally {
      setDeleting(false)
    }
  }

  async function handleArchive(window_id: string) {
    setArchiving(true)
    try {
      await api.post(`/windows/${window_id}/archive`)
      setConfirmArchiveId(null)
      closeForm()
      loadWindows()
    } catch {
      setConfirmArchiveId(null)
    } finally {
      setArchiving(false)
    }
  }

  async function handleUnarchive(window_id: string) {
    setArchiving(true)
    try {
      await api.post(`/windows/${window_id}/unarchive`)
      setConfirmUnarchiveId(null)
      loadWindows()
    } catch {
      setConfirmUnarchiveId(null)
    } finally {
      setArchiving(false)
    }
  }

  const isEditing = formMode !== null && formMode !== 'create'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-blue-800">BRF Scholarships — Admin</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-gray-600 hover:text-blue-700">Home</Link>
          <span className="text-gray-500">{email}</span>
          <button onClick={logout} className="text-red-500 hover:underline">Sign out</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
            <h2 className="text-xl font-semibold text-gray-800">Application Windows</h2>
          </div>
          {isAdmin && formMode === null && (
            <button
              onClick={openCreate}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + New Window
            </button>
          )}
        </div>

        {formMode !== null && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              {isEditing ? 'Edit Application Window' : 'New Application Window'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. 2026 Scholarship Applications"
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={windowType}
                    onChange={e => setWindowType(e.target.value as 'testing' | 'live')}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="live">Live</option>
                    <option value="testing">Testing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Writing Prompt <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={writingPrompt}
                  onChange={e => setWritingPrompt(e.target.value)}
                  rows={3}
                  placeholder="Describe the writing sample topic applicants should address..."
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Window'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="text-sm px-4 py-2 rounded-lg border hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Active/upcoming/closed windows */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-gray-400">Loading...</div>
          ) : windows.length === 0 ? (
            <div className="p-6 text-sm text-gray-400">No application windows yet. Create one to get started.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Start Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">End Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {windows.map(w => {
                  const status = windowStatus(w)
                  const isConfirmingDelete = confirmDeleteId === w.window_id
                  const isConfirmingArchive = confirmArchiveId === w.window_id
                  return (
                    <tr key={w.window_id} className={formMode === w.window_id ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        <Link to={`/admin/windows/${w.window_id}`} className="hover:text-blue-600 hover:underline">
                          {w.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_STYLES[w.window_type]}`}>
                          {w.window_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{w.start_date}</td>
                      <td className="px-4 py-3 text-gray-600">{w.end_date}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status]}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {isConfirmingDelete ? (
                          <span className="flex items-center justify-end gap-2">
                            <span className="text-xs text-gray-500">Delete?</span>
                            <button
                              onClick={() => handleDelete(w.window_id)}
                              disabled={deleting}
                              className="text-xs text-red-600 font-medium hover:underline disabled:opacity-50"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs text-gray-500 hover:underline"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : isConfirmingArchive ? (
                          <span className="flex items-center justify-end gap-2">
                            <span className="text-xs text-gray-500">Archive?</span>
                            <button
                              onClick={() => handleArchive(w.window_id)}
                              disabled={archiving}
                              className="text-xs text-amber-600 font-medium hover:underline disabled:opacity-50"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmArchiveId(null)}
                              className="text-xs text-gray-500 hover:underline"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <span className="flex items-center justify-end gap-3">
                            <Link
                              to={`/admin/windows/${w.window_id}`}
                              className="text-xs text-gray-600 hover:underline"
                            >
                              Applications
                            </Link>
                            <button
                              onClick={() => openEdit(w)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Edit
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => { setConfirmArchiveId(w.window_id); setConfirmDeleteId(null); closeForm() }}
                                  className="text-xs text-amber-600 hover:underline"
                                >
                                  Archive
                                </button>
                                <button
                                  onClick={() => { setConfirmDeleteId(w.window_id); setConfirmArchiveId(null); closeForm() }}
                                  className="text-xs text-red-500 hover:underline"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Archived windows */}
        {!loading && archivedWindows.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Archived Windows</h3>
              <span className="text-xs text-gray-400">Read-only · not visible to applicants</span>
            </div>
            <div className="bg-white rounded-xl shadow overflow-hidden opacity-90">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Start Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">End Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {archivedWindows.map(w => {
                    const isConfirmingUnarchive = confirmUnarchiveId === w.window_id
                    return (
                      <tr key={w.window_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link to={`/admin/windows/${w.window_id}`} className="font-medium text-gray-600 hover:text-blue-600 hover:underline">
                              {w.name}
                            </Link>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              Archived
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_STYLES[w.window_type]}`}>
                            {w.window_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{w.start_date}</td>
                        <td className="px-4 py-3 text-gray-500">{w.end_date}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {isConfirmingUnarchive ? (
                            <span className="flex items-center justify-end gap-2">
                              <span className="text-xs text-gray-500">Unarchive?</span>
                              <button
                                onClick={() => handleUnarchive(w.window_id)}
                                disabled={archiving}
                                className="text-xs text-blue-600 font-medium hover:underline disabled:opacity-50"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmUnarchiveId(null)}
                                className="text-xs text-gray-500 hover:underline"
                              >
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <span className="flex items-center justify-end gap-3">
                              <Link
                                to={`/admin/windows/${w.window_id}`}
                                className="text-xs text-gray-600 hover:underline"
                              >
                                Applications
                              </Link>
                              {isAdmin && (
                                <button
                                  onClick={() => setConfirmUnarchiveId(w.window_id)}
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Unarchive
                                </button>
                              )}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
