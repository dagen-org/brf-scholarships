import { useEffect, useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import Footer from '../components/Footer'

interface Reviewer {
  email: string
  role: string
  email_verified: boolean
  first_name?: string
  last_name?: string
  phone?: string
  created_at: string
  invite_token?: string
}

function displayName(r: Reviewer): string {
  const name = [r.first_name, r.last_name].filter(Boolean).join(' ')
  return name || '—'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminReviewers() {
  const { email: adminEmail, logout } = useAuth()
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [loading, setLoading] = useState(true)

  // formMode: null = hidden, 'invite' = invite form, email string = edit that reviewer
  const [formMode, setFormMode] = useState<'invite' | string | null>(null)

  // invite form
  const [inviteEmail, setInviteEmail] = useState('')

  // edit form
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [confirmDeleteEmail, setConfirmDeleteEmail] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function loadReviewers() {
    const r = await api.get('/users/reviewers')
    const sorted = [...r.data].sort((a: Reviewer, b: Reviewer) =>
      a.email.localeCompare(b.email)
    )
    setReviewers(sorted)
  }

  useEffect(() => {
    loadReviewers().finally(() => setLoading(false))
  }, [])

  function openInvite() {
    setInviteEmail('')
    setFormError('')
    setConfirmDeleteEmail(null)
    setFormMode('invite')
  }

  function openEdit(r: Reviewer) {
    setFirstName(r.first_name ?? '')
    setLastName(r.last_name ?? '')
    setPhone(r.phone ?? '')
    setNewPassword('')
    setFormError('')
    setConfirmDeleteEmail(null)
    setFormMode(r.email)
  }

  function closeForm() {
    setFormMode(null)
    setFormError('')
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      await api.post('/users/invite-reviewer', { email: inviteEmail })
      closeForm()
      loadReviewers()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setFormError(msg || 'Failed to send invitation.')
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    const email = formMode as string
    try {
      await api.put(`/users/reviewers/${encodeURIComponent(email)}`, {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        phone: phone || undefined,
      })
      if (newPassword) {
        await api.post(`/users/reviewers/${encodeURIComponent(email)}/set-password`, {
          new_password: newPassword,
        })
      }
      closeForm()
      loadReviewers()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setFormError(msg || 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(email: string) {
    setDeleting(true)
    try {
      await api.delete(`/users/reviewers/${encodeURIComponent(email)}`)
      setConfirmDeleteEmail(null)
      loadReviewers()
    } catch {
      setConfirmDeleteEmail(null)
    } finally {
      setDeleting(false)
    }
  }

  const isEditing = formMode !== null && formMode !== 'invite'

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-blue-800">Beaverton Rotary Scholarships — Admin</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-gray-600 hover:text-blue-700">Home</Link>
          <span className="text-gray-500">{adminEmail}</span>
          <button onClick={logout} className="text-red-500 hover:underline">Sign out</button>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
            <h2 className="text-xl font-semibold text-gray-800">Reviewers</h2>
          </div>
          {formMode === null && (
            <button
              onClick={openInvite}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Invite Reviewer
            </button>
          )}
        </div>

        {/* Invite form */}
        {formMode === 'invite' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Invite New Reviewer</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="max-w-sm">
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="reviewer@example.com"
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500">
                An invitation email will be sent with a link to set their password.
              </p>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Sending...' : 'Send Invitation'}
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

        {/* Edit form */}
        {isEditing && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-1">Edit Reviewer</h3>
            <p className="text-sm text-gray-500 mb-4">{formMode}</p>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
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

        {/* Reviewer table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-gray-400">Loading...</div>
          ) : reviewers.length === 0 ? (
            <div className="p-6 text-sm text-gray-400">No reviewers yet. Use the button above to invite one.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Invited</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {reviewers.map(r => {
                  const isActive = r.email_verified
                  const isConfirming = confirmDeleteEmail === r.email
                  return (
                    <tr key={r.email} className={formMode === r.email ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3 font-medium text-gray-800">{displayName(r)}</td>
                      <td className="px-4 py-3 text-gray-600">{r.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {isActive ? 'Active' : 'Pending Invite'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(r.created_at)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {isConfirming ? (
                          <span className="flex items-center justify-end gap-2">
                            <span className="text-xs text-gray-500">Delete?</span>
                            <button
                              onClick={() => handleDelete(r.email)}
                              disabled={deleting}
                              className="text-xs text-red-600 font-medium hover:underline disabled:opacity-50"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmDeleteEmail(null)}
                              className="text-xs text-gray-500 hover:underline"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <span className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => openEdit(r)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => { setConfirmDeleteEmail(r.email); closeForm() }}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Delete
                            </button>
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
      </main>
      <Footer />
    </div>
  )
}
