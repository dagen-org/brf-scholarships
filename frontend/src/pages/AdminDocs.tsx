import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Footer from '../components/Footer'

export default function AdminDocs() {
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

      <main className="flex-1 max-w-3xl mx-auto w-full p-6 space-y-8">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
          <h2 className="text-xl font-semibold text-gray-800">Admin Guide</h2>
        </div>

        {/* Table of contents */}
        <nav className="bg-white rounded-xl shadow p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Contents</p>
          <ol className="space-y-1 text-sm">
            <li><a href="#overview" className="text-blue-600 hover:underline">1. Overview</a></li>
            <li><a href="#windows" className="text-blue-600 hover:underline">2. Application Windows</a></li>
            <li><a href="#reviewers" className="text-blue-600 hover:underline">3. Reviewers</a></li>
            <li><a href="#applicants" className="text-blue-600 hover:underline">4. Applicants</a></li>
            <li><a href="#applications" className="text-blue-600 hover:underline">5. Reviewing Applications</a></li>
            <li><a href="#statuses" className="text-blue-600 hover:underline">6. Status Reference</a></li>
          </ol>
        </nav>

        {/* 1. Overview */}
        <Section id="overview" title="1. Overview">
          <p>
            The admin dashboard is the central control panel for managing scholarship cycles. Admins can
            create application windows, manage reviewer and applicant accounts, and review submitted
            applications. Reviewers share access to applications but cannot modify account settings or
            create windows.
          </p>
          <p className="mt-3">
            Applicants self-register at the public sign-up page. They verify their email before they can
            log in and submit applications. Each applicant may only have one active (non-testing) application
            per window.
          </p>
        </Section>

        {/* 2. Application Windows */}
        <Section id="windows" title="2. Application Windows">
          <p>
            A window defines a scholarship cycle: the date range during which applicants can submit,
            and an optional writing prompt included in every application form.
          </p>

          <SubSection title="Creating a window">
            <p>Go to <strong>Application Windows → + New Window</strong> and fill in:</p>
            <FieldList fields={[
              ['Name', 'A descriptive label visible to applicants, e.g. "2026 Scholarship Applications".'],
              ['Type', 'Live or Testing (see below).'],
              ['Start / End Date', 'The inclusive date range. End date must be on or after start date. Applicants can only submit while the window is active.'],
              ['Writing Prompt', 'Optional. When set, this prompt appears in the application form and applicants must provide a written response.'],
            ]} />
          </SubSection>

          <SubSection title="Window types">
            <p>
              <Badge color="blue">Live</Badge> windows accept real applicant submissions. Each applicant may
              submit at most one application per live window.
            </p>
            <p className="mt-2">
              <Badge color="purple">Testing</Badge> windows are for admins and reviewers to exercise the
              application form and review workflow before going live. There is no single-application
              restriction — you can create as many test applications as needed. Test applications are
              visible only to admins and reviewers.
            </p>
          </SubSection>

          <SubSection title="Window statuses">
            <StatusTable rows={[
              ['Upcoming', 'yellow', 'Today is before the start date. Applicants cannot submit yet.'],
              ['Active', 'green', 'Today is within the start–end range. Applicants can submit.'],
              ['Closed', 'gray', 'Today is after the end date. New submissions are blocked; existing applications are still reviewable.'],
            ]} />
          </SubSection>

          <SubSection title="Archiving a window">
            <p>
              Archiving preserves a closed window and all of its applications for the historical record
              without keeping it active. Use the inline <strong>Archive</strong> link on the windows list
              and confirm when prompted.
            </p>
            <p className="mt-2">Archived windows have these restrictions:</p>
            <ul className="mt-1.5 space-y-1 list-disc list-inside text-gray-600">
              <li>Not visible to applicants — only admins and reviewers can see them.</li>
              <li>Window settings (name, dates, writing prompt) cannot be edited.</li>
              <li>No new applications can be created.</li>
              <li>Existing application data is read-only — no editing, saving, submitting, or deleting by any user.</li>
              <li>Reviewer notes can still be added and edited.</li>
              <li>The window cannot be deleted while archived.</li>
            </ul>
            <p className="mt-2">
              Archived windows appear in a separate <Badge color="amber">Archived</Badge> section at the
              bottom of the Application Windows list. To reverse the action, click{' '}
              <strong>Unarchive</strong> on any archived window.
            </p>
          </SubSection>

          <SubSection title="Deleting a window">
            <p>
              Deleting a window permanently removes it and all of its applications. This cannot be undone.
              Use the inline <strong>Delete</strong> link and confirm when prompted. Archived windows
              cannot be deleted — unarchive first if deletion is truly needed.
            </p>
          </SubSection>
        </Section>

        {/* 3. Reviewers */}
        <Section id="reviewers" title="3. Reviewers">
          <p>
            Reviewers can read all submitted applications and leave notes (comments and questions for the
            applicant), but cannot manage windows or accounts.
          </p>

          <SubSection title="Inviting a reviewer">
            <p>
              Go to <strong>Reviewers → + Invite Reviewer</strong> and enter the reviewer's email. The system
              sends an invitation email with a link to set their password. Until they accept the invite and
              set a password their status shows <Badge color="yellow">Pending Invite</Badge>.
            </p>
          </SubSection>

          <SubSection title="Editing a reviewer">
            <p>
              Click <strong>Edit</strong> on any row to update their first name, last name, and phone number.
              You can also set a new password on their behalf — useful if they lose access. Leave the
              password field blank to keep their current password.
            </p>
          </SubSection>

          <SubSection title="Reviewer statuses">
            <StatusTable rows={[
              ['Pending Invite', 'yellow', 'The invitation was sent but the reviewer has not yet accepted it and set a password.'],
              ['Active', 'green', 'The reviewer accepted the invite and their account is ready.'],
            ]} />
          </SubSection>
        </Section>

        {/* 4. Applicants */}
        <Section id="applicants" title="4. Applicants">
          <p>
            Applicants register themselves via the public sign-up page. After registering they receive a
            6-digit verification code by email; they must verify before they can log in.
          </p>

          <SubSection title="Editing an applicant">
            <p>
              Click <strong>Edit</strong> on any row to update their name (first, middle, last), phone
              number, home address, or password. These are the same fields the applicant can edit in
              their own profile. Changing them here takes effect immediately.
            </p>
          </SubSection>

          <SubSection title="Deleting an applicant">
            <p>
              Deleting an applicant removes their account. It does <em>not</em> automatically delete their
              submitted applications — those remain in the relevant windows and can still be reviewed.
              If you also need to remove their applications, delete them individually from the window's
              application list.
            </p>
          </SubSection>

          <SubSection title="Applicant statuses">
            <StatusTable rows={[
              ['Unverified', 'yellow', 'The applicant registered but has not yet confirmed their email. They cannot log in.'],
              ['Verified', 'green', 'Email confirmed. The applicant can log in and submit applications.'],
            ]} />
          </SubSection>
        </Section>

        {/* 5. Reviewing Applications */}
        <Section id="applications" title="5. Reviewing Applications">
          <p>
            Open a window from <strong>Application Windows</strong>, then click an applicant's row (or the
            <strong> View</strong> link) to open the full application. From there you can read all form
            responses, view uploaded documents, update the application status, and leave reviewer notes.
          </p>

          <SubSection title="Scholarship types">
            <FieldList fields={[
              ['Academic', 'For students pursuing a four-year degree at an accredited college or university.'],
              ['Academic Renewal', 'For previous Academic scholarship recipients returning for a subsequent year.'],
              ['CEYP', 'Connecting Education to Youth Potential — for students who have experienced the foster care system.'],
              ['Vocational', 'For students enrolled in a vocational or trade program.'],
            ]} />
          </SubSection>

          <SubSection title="Reviewer notes">
            <p>
              Each application has a notes panel visible to all reviewers and admins. Notes are
              categorized as either <strong>Comments</strong> (general observations) or{' '}
              <strong>Questions for Applicant</strong> (items that need follow-up). Notes are attributed
              to the reviewer who wrote them and are timestamped.
            </p>
          </SubSection>

          <SubSection title="Test applications">
            <p>
              On testing windows, a purple panel lets admins and reviewers start a test application for
              any scholarship type. Test applications exercise the full form and review flow without
              affecting real applicant data. They can be deleted from the application list at any time.
            </p>
          </SubSection>
        </Section>

        {/* 6. Status Reference */}
        <Section id="statuses" title="6. Status Reference">
          <p className="mb-4">Application statuses progress through the review lifecycle:</p>
          <StatusTable rows={[
            ['Draft', 'gray', 'The applicant started but has not yet submitted. Not visible to reviewers.'],
            ['Submitted', 'blue', 'The applicant submitted. Ready for reviewer assignment and review.'],
            ['Under Review', 'yellow', 'Actively being evaluated by reviewers.'],
            ['Awarded', 'green', 'The scholarship was granted.'],
            ['Declined', 'red', 'The application was not selected.'],
          ]} />
        </Section>
      </main>
      <Footer />
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="bg-white rounded-xl shadow p-6 space-y-4 scroll-mt-6">
      <h3 className="text-base font-semibold text-gray-900 border-b pb-2">{title}</h3>
      <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="font-medium text-gray-800">{title}</p>
      <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
    </div>
  )
}

function FieldList({ fields }: { fields: [string, string][] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {fields.map(([name, desc]) => (
        <li key={name}>
          <span className="font-medium text-gray-800">{name}:</span>{' '}
          <span className="text-gray-600">{desc}</span>
        </li>
      ))}
    </ul>
  )
}

type BadgeColor = 'blue' | 'purple' | 'green' | 'yellow' | 'gray' | 'red' | 'amber'

const BADGE_STYLES: Record<BadgeColor, string> = {
  blue:   'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  green:  'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  gray:   'bg-gray-100 text-gray-600',
  red:    'bg-red-100 text-red-600',
  amber:  'bg-amber-100 text-amber-700',
}

function Badge({ color, children }: { color: BadgeColor; children: React.ReactNode }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${BADGE_STYLES[color]}`}>
      {children}
    </span>
  )
}

function StatusTable({ rows }: { rows: [string, BadgeColor, string][] }) {
  return (
    <table className="mt-2 w-full text-sm border rounded-lg overflow-hidden">
      <thead className="bg-gray-50">
        <tr>
          <th className="text-left px-3 py-2 font-medium text-gray-600 w-32">Status</th>
          <th className="text-left px-3 py-2 font-medium text-gray-600">Meaning</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map(([label, color, desc]) => (
          <tr key={label}>
            <td className="px-3 py-2"><Badge color={color}>{label}</Badge></td>
            <td className="px-3 py-2 text-gray-600">{desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
