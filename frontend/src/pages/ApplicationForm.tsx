import { useEffect, useRef, useState, FormEvent, ChangeEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import Footer from '../components/Footer'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AppWindow {
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
  window_id: string
  scholarship_type: string
  status: string
  data: Record<string, unknown>
  created_at: string
  updated_at: string
}

interface FileRef { file_id: string; filename: string }

// ─── Constants ───────────────────────────────────────────────────────────────

const HIGH_SCHOOLS = ['Aloha', 'Beaverton', 'Mountainside', 'Southridge', 'Sunset', 'Westview', 'Other']

const TYPE_LABELS: Record<string, string> = {
  academic: 'Academic',
  academic_renewal: 'Academic Renewal',
  ceyp: 'CEYP',
  vocational: 'Vocational',
}

const STATUS_STYLES: Record<string, string> = {
  draft:        'bg-yellow-100 text-yellow-700',
  submitted:    'bg-blue-100 text-blue-700',
  under_review: 'bg-purple-100 text-purple-700',
  awarded:      'bg-green-100 text-green-700',
  declined:     'bg-red-100 text-red-600',
}

function getSections(type: string) {
  const base = [
    { id: 'personal',    label: 'Personal Information' },
  ]
  if (type === 'ceyp') base.push({ id: 'family', label: 'Family Information' })
  if (type === 'academic' || type === 'ceyp')
    return [...base,
      { id: 'education', label: 'Education' },
      { id: 'finance',   label: 'Finance' },
      { id: 'files',     label: 'Files' },
      { id: 'additional',label: 'Additional Information' },
    ]
  if (type === 'academic_renewal')
    return [...base,
      { id: 'education', label: 'Education' },
      { id: 'finance',   label: 'Finance' },
      { id: 'files',     label: 'Files' },
    ]
  if (type === 'vocational')
    return [...base,
      { id: 'education', label: 'Education' },
      { id: 'costs',     label: 'Estimated Costs' },
      { id: 'resources', label: 'Estimated Resources' },
      { id: 'files',     label: 'Files & Essay' },
    ]
  return base
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function num(v: unknown): number {
  const n = parseFloat(String(v))
  return isNaN(n) ? 0 : n
}

function fmtCurrency(v: unknown): string {
  return num(v).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── Shared field primitives ──────────────────────────────────────────────────

interface FieldProps { label: string; optional?: boolean; children: React.ReactNode }
function Field({ label, optional, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {optional && <span className="ml-1 text-gray-400 font-normal text-xs">(optional)</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const readCls  = 'text-sm text-gray-800 py-1 min-h-[1.5rem]'

interface TFProps { value: string; onChange?: (v: string) => void; readOnly: boolean; placeholder?: string }
function TF({ value, onChange, readOnly, placeholder }: TFProps) {
  if (readOnly) return <p className={readCls}>{value || '—'}</p>
  return <input type="text" value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} className={inputCls} />
}

interface TAProps { value: string; onChange?: (v: string) => void; readOnly: boolean; rows?: number; placeholder?: string }
function TA({ value, onChange, readOnly, rows = 4, placeholder }: TAProps) {
  if (readOnly) return <p className={`${readCls} whitespace-pre-wrap`}>{value || '—'}</p>
  return <textarea value={value} onChange={e => onChange?.(e.target.value)} rows={rows} placeholder={placeholder} className={inputCls} />
}

interface CurrProps { value: string; onChange?: (v: string) => void; readOnly: boolean }
function Curr({ value, onChange, readOnly }: CurrProps) {
  if (readOnly) return <p className={readCls}>{value ? fmtCurrency(value) : '—'}</p>
  return (
    <div className="relative">
      <span className="absolute left-3 top-2 text-sm text-gray-500">$</span>
      <input
        type="number" min="0" step="0.01"
        value={value}
        onChange={e => onChange?.(e.target.value)}
        className={`${inputCls} pl-6`}
      />
    </div>
  )
}

interface RadioProps { value: string; options: string[]; onChange?: (v: string) => void; readOnly: boolean }
function RadioGroup({ value, options, onChange, readOnly }: RadioProps) {
  if (readOnly) return <p className={readCls}>{value || '—'}</p>
  return (
    <div className="flex flex-wrap gap-3 mt-1">
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="radio" checked={value === opt} onChange={() => onChange?.(opt)} className="accent-blue-600" />
          {opt}
        </label>
      ))}
    </div>
  )
}

interface TotalProps { label: string; value: number }
function TotalRow({ label, value }: TotalProps) {
  return (
    <div className="flex justify-between items-center border-t pt-2 mt-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{fmtCurrency(value)}</span>
    </div>
  )
}

// ─── File upload field ────────────────────────────────────────────────────────

interface FileFieldProps {
  label: string
  fieldKey: string
  appId: string
  data: Record<string, unknown>
  onFileUploaded: (key: string, ref: FileRef) => void
  readOnly: boolean
  optional?: boolean
  multiple?: boolean
}

function FileField({ label, fieldKey, appId, data, onFileUploaded, readOnly, optional, multiple }: FileFieldProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const existing: FileRef | FileRef[] | undefined = data[fieldKey] as FileRef | FileRef[] | undefined
  const fileList: FileRef[] = multiple
    ? (Array.isArray(existing) ? existing : [])
    : (existing && !Array.isArray(existing) ? [existing] : [])

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      const res = await api.post('/files/upload-url', {
        app_id: appId, filename: file.name, content_type: file.type,
      })
      const { upload_url, file_id } = res.data
      await fetch(upload_url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      onFileUploaded(fieldKey, { file_id, filename: file.name })
    } catch {
      setUploadError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <Field label={label} optional={optional}>
      <div className="space-y-1">
        {fileList.length > 0 ? (
          fileList.map(f => (
            <p key={f.file_id} className="text-sm text-blue-700 flex items-center gap-1">
              <span>📎</span> {f.filename}
            </p>
          ))
        ) : (
          <p className="text-sm text-gray-400 italic">No file uploaded</p>
        )}
        {!readOnly && (
          <>
            <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileChange} />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="text-xs text-blue-600 hover:underline disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : fileList.length > 0 && multiple ? '+ Add another file' : fileList.length > 0 ? 'Replace file' : 'Upload file'}
            </button>
          </>
        )}
        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
      </div>
    </Field>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

interface SectionProps { id: string; title: string; children: React.ReactNode }
function Section({ id, title, children }: SectionProps) {
  return (
    <div id={id} className="bg-white rounded-xl shadow p-6 space-y-4 scroll-mt-6">
      <h3 className="text-base font-semibold text-gray-800 border-b pb-2">{title}</h3>
      {children}
    </div>
  )
}

// ─── Form sections ────────────────────────────────────────────────────────────

interface SectionFormProps {
  data: Record<string, unknown>
  set: (key: string, val: unknown) => void
  readOnly: boolean
  appId: string
  onFileUploaded: (key: string, ref: FileRef) => void
  writingPrompt?: string
}

function PersonalSection({ data, set, readOnly, type }: SectionFormProps & { type: string }) {
  const s = (k: string) => String(data[k] ?? '')
  return (
    <Section id="personal" title="Personal Information">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="First Name"><TF value={s('first_name')} onChange={v => set('first_name', v)} readOnly={readOnly} /></Field>
        <Field label="Middle Name" optional><TF value={s('middle_name')} onChange={v => set('middle_name', v)} readOnly={readOnly} /></Field>
        <Field label="Last Name"><TF value={s('last_name')} onChange={v => set('last_name', v)} readOnly={readOnly} /></Field>
      </div>
      <Field label="Home Address">
        <TA value={s('address')} onChange={v => set('address', v)} readOnly={readOnly} rows={2} placeholder="Street, City, State, ZIP" />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Email Address"><TF value={s('email')} onChange={v => set('email', v)} readOnly={readOnly} /></Field>
        <Field label="Phone Number"><TF value={s('phone')} onChange={v => set('phone', v)} readOnly={readOnly} /></Field>
      </div>
      <Field label="Parent(s) or Legal Guardian(s)">
        <TA value={s('guardians')} onChange={v => set('guardians', v)} readOnly={readOnly} rows={2} placeholder="Name(s) and relationship" />
      </Field>
      {type === 'ceyp' && (
        <Field label="Date of Birth">
          {readOnly
            ? <p className={readCls}>{s('date_of_birth') || '—'}</p>
            : <input type="date" value={s('date_of_birth')} onChange={e => set('date_of_birth', e.target.value)} className={inputCls} />
          }
        </Field>
      )}
    </Section>
  )
}

function FamilySection({ data, set, readOnly }: SectionFormProps) {
  const s = (k: string) => String(data[k] ?? '')
  return (
    <Section id="family" title="Family Information">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Mother's First Name"><TF value={s('mother_first')} onChange={v => set('mother_first', v)} readOnly={readOnly} /></Field>
        <Field label="Mother's Middle Name" optional><TF value={s('mother_middle')} onChange={v => set('mother_middle', v)} readOnly={readOnly} /></Field>
        <Field label="Mother's Last Name"><TF value={s('mother_last')} onChange={v => set('mother_last', v)} readOnly={readOnly} /></Field>
      </div>
      <Field label="Mother's Address">
        <TA value={s('mother_address')} onChange={v => set('mother_address', v)} readOnly={readOnly} rows={2} />
      </Field>
      <Field label="Mother's Occupation"><TF value={s('mother_occupation')} onChange={v => set('mother_occupation', v)} readOnly={readOnly} /></Field>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Father's First Name" optional><TF value={s('father_first')} onChange={v => set('father_first', v)} readOnly={readOnly} /></Field>
        <Field label="Father's Middle Name" optional><TF value={s('father_middle')} onChange={v => set('father_middle', v)} readOnly={readOnly} /></Field>
        <Field label="Father's Last Name" optional><TF value={s('father_last')} onChange={v => set('father_last', v)} readOnly={readOnly} /></Field>
      </div>
      <Field label="Father's Address" optional>
        <TA value={s('father_address')} onChange={v => set('father_address', v)} readOnly={readOnly} rows={2} />
      </Field>
      <Field label="Father's Occupation" optional><TF value={s('father_occupation')} onChange={v => set('father_occupation', v)} readOnly={readOnly} /></Field>
    </Section>
  )
}

function EducationAcademicSection({ data, set, readOnly }: SectionFormProps) {
  const s = (k: string) => String(data[k] ?? '')
  return (
    <Section id="education" title="Education Information">
      <Field label="High School Attended">
        <RadioGroup value={s('high_school')} options={HIGH_SCHOOLS} onChange={v => set('high_school', v)} readOnly={readOnly} />
        {(s('high_school') === 'Other' || (!HIGH_SCHOOLS.slice(0, -1).includes(s('high_school')) && s('high_school'))) && (
          <TF value={s('high_school_other')} onChange={v => set('high_school_other', v)} readOnly={readOnly} placeholder="School name" />
        )}
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Cumulative GPA"><TF value={s('cumulative_gpa')} onChange={v => set('cumulative_gpa', v)} readOnly={readOnly} /></Field>
        <Field label="Weighted GPA"><TF value={s('weighted_gpa')} onChange={v => set('weighted_gpa', v)} readOnly={readOnly} /></Field>
        <Field label="ACT Score" optional><TF value={s('act_score')} onChange={v => set('act_score', v)} readOnly={readOnly} /></Field>
        <Field label="SAT Score" optional><TF value={s('sat_score')} onChange={v => set('sat_score', v)} readOnly={readOnly} /></Field>
        <Field label="Advisor / Counselor"><TF value={s('advisor')} onChange={v => set('advisor', v)} readOnly={readOnly} /></Field>
        <Field label="Advisor Phone Number"><TF value={s('advisor_phone')} onChange={v => set('advisor_phone', v)} readOnly={readOnly} /></Field>
        <Field label="Intended College or University"><TF value={s('intended_college')} onChange={v => set('intended_college', v)} readOnly={readOnly} /></Field>
        <Field label="Field of Study"><TF value={s('field_of_study')} onChange={v => set('field_of_study', v)} readOnly={readOnly} /></Field>
        <Field label="Academic Honors" optional><TF value={s('academic_honors')} onChange={v => set('academic_honors', v)} readOnly={readOnly} /></Field>
        <Field label="College Credits" optional><TF value={s('college_credits')} onChange={v => set('college_credits', v)} readOnly={readOnly} /></Field>
      </div>
    </Section>
  )
}

function EducationRenewalSection({ data, set, readOnly }: SectionFormProps) {
  const s = (k: string) => String(data[k] ?? '')
  return (
    <Section id="education" title="Education Information">
      <Field label="High School Attended">
        <RadioGroup value={s('high_school')} options={HIGH_SCHOOLS} onChange={v => set('high_school', v)} readOnly={readOnly} />
        {s('high_school') === 'Other' && (
          <TF value={s('high_school_other')} onChange={v => set('high_school_other', v)} readOnly={readOnly} placeholder="School name" />
        )}
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Cumulative GPA"><TF value={s('cumulative_gpa')} onChange={v => set('cumulative_gpa', v)} readOnly={readOnly} /></Field>
        <Field label="Weighted GPA"><TF value={s('weighted_gpa')} onChange={v => set('weighted_gpa', v)} readOnly={readOnly} /></Field>
        <Field label="Current College / University"><TF value={s('current_college')} onChange={v => set('current_college', v)} readOnly={readOnly} /></Field>
        <Field label="Current Field of Study"><TF value={s('field_of_study')} onChange={v => set('field_of_study', v)} readOnly={readOnly} /></Field>
        <Field label="Academic Honors" optional><TF value={s('academic_honors')} onChange={v => set('academic_honors', v)} readOnly={readOnly} /></Field>
        <Field label="Credits Earned"><TF value={s('credits_earned')} onChange={v => set('credits_earned', v)} readOnly={readOnly} /></Field>
      </div>
    </Section>
  )
}

function EducationVocationalSection({ data, set, readOnly }: SectionFormProps) {
  const s = (k: string) => String(data[k] ?? '')
  return (
    <Section id="education" title="Education Information">
      <Field label="High School Attended">
        <RadioGroup value={s('high_school')} options={HIGH_SCHOOLS} onChange={v => set('high_school', v)} readOnly={readOnly} />
        {s('high_school') === 'Other' && (
          <TF value={s('high_school_other')} onChange={v => set('high_school_other', v)} readOnly={readOnly} placeholder="School name" />
        )}
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Cumulative GPA"><TF value={s('cumulative_gpa')} onChange={v => set('cumulative_gpa', v)} readOnly={readOnly} /></Field>
        <Field label="ACT Score" optional><TF value={s('act_score')} onChange={v => set('act_score', v)} readOnly={readOnly} /></Field>
        <Field label="SAT Score" optional><TF value={s('sat_score')} onChange={v => set('sat_score', v)} readOnly={readOnly} /></Field>
        <Field label="Advisor / Counselor"><TF value={s('advisor')} onChange={v => set('advisor', v)} readOnly={readOnly} /></Field>
        <Field label="Advisor Phone Number"><TF value={s('advisor_phone')} onChange={v => set('advisor_phone', v)} readOnly={readOnly} /></Field>
        <Field label="Post-Secondary School to Attend"><TF value={s('post_secondary_school')} onChange={v => set('post_secondary_school', v)} readOnly={readOnly} /></Field>
        <Field label="Field of Study"><TF value={s('field_of_study')} onChange={v => set('field_of_study', v)} readOnly={readOnly} /></Field>
      </div>
      <Field label="Vocational Goals">
        <TA value={s('vocational_goals')} onChange={v => set('vocational_goals', v)} readOnly={readOnly} rows={3} />
      </Field>
    </Section>
  )
}

function FinanceAcademicSection({ data, set, readOnly }: SectionFormProps) {
  const s = (k: string) => String(data[k] ?? '')
  const totalCosts = num(data.fin_tuition) + num(data.fin_books) + num(data.fin_other_costs)
  const totalResources = num(data.fin_family) + num(data.fin_loans) + num(data.fin_other_scholarships) + num(data.fin_other_resources)
  return (
    <Section id="finance" title="Finance Information">
      <Field label="Intended College or Institution"><TF value={s('fin_institution')} onChange={v => set('fin_institution', v)} readOnly={readOnly} /></Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Tuition and Fees"><Curr value={s('fin_tuition')} onChange={v => set('fin_tuition', v)} readOnly={readOnly} /></Field>
        <Field label="Books and Supplies"><Curr value={s('fin_books')} onChange={v => set('fin_books', v)} readOnly={readOnly} /></Field>
        <Field label="Other Costs"><Curr value={s('fin_other_costs')} onChange={v => set('fin_other_costs', v)} readOnly={readOnly} /></Field>
      </div>
      <TotalRow label="Total Estimated Costs" value={totalCosts} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <Field label="Estimated Family Contribution"><Curr value={s('fin_family')} onChange={v => set('fin_family', v)} readOnly={readOnly} /></Field>
        <Field label="Student Loans"><Curr value={s('fin_loans')} onChange={v => set('fin_loans', v)} readOnly={readOnly} /></Field>
        <Field label="Other Scholarships"><Curr value={s('fin_other_scholarships')} onChange={v => set('fin_other_scholarships', v)} readOnly={readOnly} /></Field>
        <Field label="Other Resources"><Curr value={s('fin_other_resources')} onChange={v => set('fin_other_resources', v)} readOnly={readOnly} /></Field>
      </div>
      <TotalRow label="Total Estimated Resources" value={totalResources} />
    </Section>
  )
}

function FinanceRenewalSection({ data, set, readOnly }: SectionFormProps) {
  const s = (k: string) => String(data[k] ?? '')
  const totalCosts = num(data.fin_tuition) + num(data.fin_books) + num(data.fin_living) + num(data.fin_other_costs)
  const totalResources = num(data.fin_family) + num(data.fin_loans) + num(data.fin_other_scholarships) + num(data.fin_other_resources)
  return (
    <Section id="finance" title="Finance Information">
      <Field label="Current Institution"><TF value={s('fin_institution')} onChange={v => set('fin_institution', v)} readOnly={readOnly} /></Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Tuition and Fees"><Curr value={s('fin_tuition')} onChange={v => set('fin_tuition', v)} readOnly={readOnly} /></Field>
        <Field label="Books and Supplies"><Curr value={s('fin_books')} onChange={v => set('fin_books', v)} readOnly={readOnly} /></Field>
        <Field label="Living Expenses"><Curr value={s('fin_living')} onChange={v => set('fin_living', v)} readOnly={readOnly} /></Field>
        <Field label="Other Costs"><Curr value={s('fin_other_costs')} onChange={v => set('fin_other_costs', v)} readOnly={readOnly} /></Field>
      </div>
      <TotalRow label="Total Estimated Costs" value={totalCosts} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <Field label="Family Contribution"><Curr value={s('fin_family')} onChange={v => set('fin_family', v)} readOnly={readOnly} /></Field>
        <Field label="Student Loans"><Curr value={s('fin_loans')} onChange={v => set('fin_loans', v)} readOnly={readOnly} /></Field>
        <Field label="Other Scholarships"><Curr value={s('fin_other_scholarships')} onChange={v => set('fin_other_scholarships', v)} readOnly={readOnly} /></Field>
        <Field label="Other Resources"><Curr value={s('fin_other_resources')} onChange={v => set('fin_other_resources', v)} readOnly={readOnly} /></Field>
      </div>
      <TotalRow label="Total Estimated Resources" value={totalResources} />
    </Section>
  )
}

function CostsSection({ data, set, readOnly }: SectionFormProps) {
  const s = (k: string) => String(data[k] ?? '')
  const total = num(data.voc_tuition) + num(data.voc_books) + num(data.voc_living) + num(data.voc_other_costs)
  return (
    <Section id="costs" title="Estimated Costs">
      <Field label="Description">
        <TA value={s('voc_costs_description')} onChange={v => set('voc_costs_description', v)} readOnly={readOnly} rows={2} />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Tuition and Fees"><Curr value={s('voc_tuition')} onChange={v => set('voc_tuition', v)} readOnly={readOnly} /></Field>
        <Field label="Books and Supplies"><Curr value={s('voc_books')} onChange={v => set('voc_books', v)} readOnly={readOnly} /></Field>
        <Field label="Living Expenses"><Curr value={s('voc_living')} onChange={v => set('voc_living', v)} readOnly={readOnly} /></Field>
        <Field label="Other Costs"><Curr value={s('voc_other_costs')} onChange={v => set('voc_other_costs', v)} readOnly={readOnly} /></Field>
      </div>
      <TotalRow label="Total Estimated Costs" value={total} />
    </Section>
  )
}

function ResourcesSection({ data, set, readOnly }: SectionFormProps) {
  const s = (k: string) => String(data[k] ?? '')
  const total = num(data.voc_savings) + num(data.voc_work_income) + num(data.voc_other_resources) + num(data.voc_relative_assistance)
  return (
    <Section id="resources" title="Estimated Resources">
      <Field label="Description">
        <TA value={s('voc_resources_description')} onChange={v => set('voc_resources_description', v)} readOnly={readOnly} rows={2} />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Savings from Summer Work"><Curr value={s('voc_savings')} onChange={v => set('voc_savings', v)} readOnly={readOnly} /></Field>
        <Field label="Student Work (school year)"><Curr value={s('voc_work_income')} onChange={v => set('voc_work_income', v)} readOnly={readOnly} /></Field>
        <Field label="Other Resources"><Curr value={s('voc_other_resources')} onChange={v => set('voc_other_resources', v)} readOnly={readOnly} /></Field>
        <Field label="Assistance from Relatives"><Curr value={s('voc_relative_assistance')} onChange={v => set('voc_relative_assistance', v)} readOnly={readOnly} /></Field>
      </div>
      <Field label="Student Loans (list)">
        <TA value={s('voc_student_loans')} onChange={v => set('voc_student_loans', v)} readOnly={readOnly} rows={2} />
      </Field>
      <Field label="Other Scholarships (list)">
        <TA value={s('voc_other_scholarships')} onChange={v => set('voc_other_scholarships', v)} readOnly={readOnly} rows={2} />
      </Field>
      <TotalRow label="Total Estimated Resources" value={total} />
    </Section>
  )
}

function FilesAcademicSection({ data, set, readOnly, appId, onFileUploaded, writingPrompt }: SectionFormProps) {
  const s = (k: string) => String(data[k] ?? '')
  const writingType = s('writing_sample_type') || 'file'
  return (
    <Section id="files" title="Files">
      <FileField label="High School Transcript" fieldKey="file_transcript" appId={appId} data={data} onFileUploaded={onFileUploaded} readOnly={readOnly} />
      <FileField label="Resume" fieldKey="file_resume" appId={appId} data={data} onFileUploaded={onFileUploaded} readOnly={readOnly} />
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">
          Writing Sample
          {writingPrompt && <span className="ml-2 text-xs font-normal text-gray-500 italic">Prompt: "{writingPrompt}"</span>}
        </p>
        {!readOnly && (
          <div className="flex gap-4 mb-2">
            {['file', 'text'].map(opt => (
              <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" checked={writingType === opt} onChange={() => set('writing_sample_type', opt)} className="accent-blue-600" />
                {opt === 'file' ? 'Upload file' : 'Write here'}
              </label>
            ))}
          </div>
        )}
        {writingType === 'file'
          ? <FileField label="" fieldKey="file_writing_sample" appId={appId} data={data} onFileUploaded={onFileUploaded} readOnly={readOnly} />
          : <TA value={s('writing_sample_text')} onChange={v => set('writing_sample_text', v)} readOnly={readOnly} rows={8} />
        }
      </div>
      <FileField label="Letter(s) of Recommendation" fieldKey="file_recommendations" appId={appId} data={data} onFileUploaded={onFileUploaded} readOnly={readOnly} multiple />
    </Section>
  )
}

function FilesRenewalSection({ data, readOnly, appId, onFileUploaded }: SectionFormProps) {
  return (
    <Section id="files" title="Files">
      <FileField label="Current Year Transcript" fieldKey="file_transcript" appId={appId} data={data} onFileUploaded={onFileUploaded} readOnly={readOnly} />
      <FileField label="Written Presentation" fieldKey="file_written_presentation" appId={appId} data={data} onFileUploaded={onFileUploaded} readOnly={readOnly} />
    </Section>
  )
}

function FilesVocationalSection({ data, set, readOnly, appId, onFileUploaded }: SectionFormProps) {
  const s = (k: string) => String(data[k] ?? '')
  return (
    <Section id="files" title="Files & Essay">
      <FileField label="High School Transcript" fieldKey="file_transcript" appId={appId} data={data} onFileUploaded={onFileUploaded} readOnly={readOnly} />
      <Field label="Extracurricular and Personal Activities">
        <TA value={s('voc_activities')} onChange={v => set('voc_activities', v)} readOnly={readOnly} rows={4} />
      </Field>
      <FileField label="Extracurricular Activities (supporting file)" fieldKey="file_activities" appId={appId} data={data} onFileUploaded={onFileUploaded} readOnly={readOnly} optional />
      <div>
        <FileField label="Career or Education Plans Essay" fieldKey="file_essay" appId={appId} data={data} onFileUploaded={onFileUploaded} readOnly={readOnly} />
        <p className="text-xs text-gray-400 mt-1">
          Attach an essay describing your career or continuing education goals, how you became interested in this career, and how you intend to pursue these goals. No more than two double-spaced typewritten pages (minimum 11pt font).
        </p>
      </div>
      <FileField label="Personal References" fieldKey="file_references" appId={appId} data={data} onFileUploaded={onFileUploaded} readOnly={readOnly} multiple />
    </Section>
  )
}

function AdditionalSection({ data, set, readOnly }: SectionFormProps) {
  const s = (k: string) => String(data[k] ?? '')
  return (
    <Section id="additional" title="Additional Information">
      <Field label="Extracurricular Activities">
        <TA value={s('extracurricular')} onChange={v => set('extracurricular', v)} readOnly={readOnly} rows={4} placeholder="List clubs, sports, community service, etc." />
      </Field>
      <Field label="Additional Information" optional>
        <TA value={s('miscellaneous')} onChange={v => set('miscellaneous', v)} readOnly={readOnly} rows={4} placeholder="Is there anything else you'd like us to know?" />
      </Field>
    </Section>
  )
}

// ─── Comments (reviewer/admin) ────────────────────────────────────────────────

interface Comment { app_id: string; author_email: string; content: string; created_at: string }

function CommentsSection({ appId }: { appId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get(`/applications/${appId}/comments`).then(r => setComments(r.data))
  }, [appId])

  async function addComment(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSaving(true)
    try {
      const res = await api.post(`/applications/${appId}/comments`, { content: text.trim() })
      setComments(prev => [...prev, res.data])
      setText('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <h3 className="text-base font-semibold text-gray-800 border-b pb-2">Reviewer Comments</h3>
      {comments.length === 0
        ? <p className="text-sm text-gray-400 italic">No comments yet.</p>
        : comments.map((c, i) => (
          <div key={i} className="border-l-2 border-blue-200 pl-3 space-y-0.5">
            <p className="text-xs text-gray-400">{c.author_email} · {new Date(c.created_at).toLocaleString()}</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.content}</p>
          </div>
        ))
      }
      <form onSubmit={addComment} className="space-y-2 pt-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          placeholder="Add a comment…"
          className={inputCls}
        />
        <button type="submit" disabled={saving || !text.trim()} className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Saving…' : 'Add Comment'}
        </button>
      </form>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ApplicationForm() {
  const { app_id } = useParams<{ app_id: string }>()
  const { role, email } = useAuth()
  const navigate = useNavigate()

  const [app, setApp] = useState<Application | null>(null)
  const [window_, setWindow_] = useState<AppWindow | null>(null)
  const [data, setData] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [submitConfirm, setSubmitConfirm] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const saveTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!app_id) return
    Promise.all([
      api.get(`/applications/${app_id}`),
    ]).then(([appRes]) => {
      const a: Application = appRes.data
      setApp(a)
      setData(a.data ?? {})
      return api.get(`/windows/${a.window_id}`)
    }).then(winRes => {
      setWindow_(winRes.data)
    }).catch(() => setLoadError('Failed to load application.'))
      .finally(() => setLoading(false))
  }, [app_id])

  const t = today()
  const windowOpen = window_ && window_.start_date <= t && t <= window_.end_date
  const isApplicant = role === 'applicant'
  const isReviewerOrAdmin = role === 'admin' || role === 'reviewer'
  const isTestWindow = window_?.window_type === 'testing'
  const isOwner = app?.owner_email === email
  const isEditable =
    (isApplicant && app?.status === 'draft' && !!windowOpen) ||
    (isReviewerOrAdmin && isTestWindow && isOwner && app?.status === 'draft')

  const backPath = isReviewerOrAdmin
    ? `/admin/windows/${app?.window_id}`
    : '/apply'

  function set(key: string, val: unknown) {
    setData(prev => {
      const next = { ...prev, [key]: val }
      scheduleAutoSave(next)
      return next
    })
  }

  function handleFileUploaded(key: string, ref: FileRef) {
    setData(prev => {
      const existing = prev[key]
      const isMulti = Array.isArray(existing)
      const next = {
        ...prev,
        [key]: isMulti ? [...existing, ref] : ref,
      }
      scheduleAutoSave(next)
      return next
    })
  }

  function scheduleAutoSave(nextData: Record<string, unknown>) {
    clearTimeout(saveTimer.current)
    setSaveStatus('unsaved')
    saveTimer.current = setTimeout(() => doSave(nextData), 1500)
  }

  async function doSave(dataToSave: Record<string, unknown>) {
    setSaveStatus('saving')
    try {
      await api.put(`/applications/${app_id}/data`, { data: dataToSave })
      setSaveStatus('saved')
    } catch {
      setSaveStatus('unsaved')
    }
  }

  async function handleSaveNow() {
    clearTimeout(saveTimer.current)
    await doSave(data)
  }

  async function handleSubmit() {
    setSubmitError('')
    try {
      await doSave(data)
      await api.post(`/applications/${app_id}/submit`)
      navigate(backPath)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setSubmitError(msg || 'Submission failed. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Loading application…</p>
      </div>
    )
  }

  if (loadError || !app || !window_) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-red-600">{loadError || 'Application not found.'}</p>
      </div>
    )
  }

  const type = app.scholarship_type
  const sections = getSections(type)
  const sectionProps: SectionFormProps = { data, set, readOnly: !isEditable, appId: app_id!, onFileUploaded: handleFileUploaded, writingPrompt: window_.writing_prompt }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Nav */}
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-lg font-bold text-blue-800">BRF Scholarships</h1>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{email}</span>
        </div>
      </nav>

      <div className="flex-1 flex max-w-5xl mx-auto w-full px-4 py-6 gap-6">

        {/* Sidebar */}
        <aside className="hidden md:block w-44 shrink-0">
          <div className="sticky top-24 space-y-1">
            <Link to={backPath} className="block text-xs text-blue-600 hover:underline mb-3">← Back</Link>
            {sections.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block text-sm text-gray-600 hover:text-blue-700 py-0.5 hover:underline"
              >
                {s.label}
              </a>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 space-y-4 min-w-0">

          {/* Header */}
          <div className="bg-white rounded-xl shadow px-5 py-4 flex flex-wrap items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-400">{window_.name}</p>
              <h2 className="text-base font-semibold text-gray-800">{TYPE_LABELS[type] ?? type} Scholarship Application</h2>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[app.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {app.status.replace('_', ' ')}
            </span>
            {isEditable && (
              <span className={`text-xs ${saveStatus === 'saving' ? 'text-blue-500' : saveStatus === 'unsaved' ? 'text-yellow-600' : 'text-green-600'}`}>
                {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'unsaved' ? 'Unsaved changes' : 'Saved'}
              </span>
            )}
          </div>

          {/* Read-only notice */}
          {!isEditable && isApplicant && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
              {app.status !== 'draft'
                ? 'This application has been submitted and can no longer be edited.'
                : 'The application window has closed. This application is read-only.'}
            </div>
          )}

          {/* Sections */}
          <PersonalSection {...sectionProps} type={type} />
          {type === 'ceyp' && <FamilySection {...sectionProps} />}
          {(type === 'academic' || type === 'ceyp') && <EducationAcademicSection {...sectionProps} />}
          {type === 'academic_renewal' && <EducationRenewalSection {...sectionProps} />}
          {type === 'vocational' && <EducationVocationalSection {...sectionProps} />}
          {(type === 'academic' || type === 'ceyp') && <FinanceAcademicSection {...sectionProps} />}
          {type === 'academic_renewal' && <FinanceRenewalSection {...sectionProps} />}
          {type === 'vocational' && <CostsSection {...sectionProps} />}
          {type === 'vocational' && <ResourcesSection {...sectionProps} />}
          {(type === 'academic' || type === 'ceyp') && <FilesAcademicSection {...sectionProps} />}
          {type === 'academic_renewal' && <FilesRenewalSection {...sectionProps} />}
          {type === 'vocational' && <FilesVocationalSection {...sectionProps} />}
          {(type === 'academic' || type === 'ceyp') && <AdditionalSection {...sectionProps} />}

          {/* Save / Submit bar */}
          {isEditable && (
            <div className="bg-white rounded-xl shadow px-5 py-4 flex flex-wrap items-center gap-3">
              <button
                onClick={handleSaveNow}
                disabled={saveStatus === 'saving'}
                className="text-sm px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                onClick={() => setSubmitConfirm(true)}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Submit Application
              </button>
              {submitError && <p className="text-sm text-red-600">{submitError}</p>}
            </div>
          )}

          {/* Comments (reviewer / admin) — not shown on own test applications */}
          {isReviewerOrAdmin && !isOwner && <CommentsSection appId={app_id!} />}

        </div>
      </div>

      {/* Submit confirmation modal */}
      {submitConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-semibold text-gray-800">Submit Application?</h3>
            <p className="text-sm text-gray-600">
              Once submitted, you will not be able to make further edits. Make sure all sections are complete before continuing.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setSubmitConfirm(false)} className="text-sm px-4 py-2 rounded-lg border hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => { setSubmitConfirm(false); handleSubmit() }}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
