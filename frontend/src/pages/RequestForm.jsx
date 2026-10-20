import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { optionsApi, parseError, requestsApi } from '../services/api'
import { useToast } from '../context/ToastContext'
import Button, { Spinner } from '../components/Button'
import FormInput from '../components/FormInput'
import PageHeader from '../components/PageHeader'

const MAX_MB = 4
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png']

export default function RequestForm() {
  const { id } = useParams() // present when editing
  const navigate = useNavigate()
  const toast = useToast()
  const [options, setOptions] = useState({ subjects: [], categories: [] })
  const [form, setForm] = useState({ subject_id: '', subject_ids: [], category_id: '', date_from: '', date_to: '', reason: '' })
  const [files, setFiles] = useState([])
  const [existing, setExisting] = useState([])
  const [removed, setRemoved] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    Promise.all([optionsApi.get(), id ? requestsApi.get(id) : null])
      .then(([opt, req]) => {
        setOptions(opt.data.data)
        if (req) {
          const r = req.data.data
          setForm({ subject_id: r.subject.id, subject_ids: [String(r.subject.id)], category_id: r.category.id, date_from: r.date_from, date_to: r.date_to, reason: r.reason })
          setExisting(r.attachments)
        }
      })
      .catch((e) => setLoadError(parseError(e).message))
      .finally(() => setLoading(false))
  }, [id])

  const category = options.categories.find((c) => String(c.id) === String(form.category_id))
  const keptCount = existing.filter((a) => !removed.includes(a.id)).length
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const onSubjectToggle = (subjectId) => {
    setForm((current) => ({
      ...current,
      subject_ids: current.subject_ids.includes(String(subjectId))
        ? current.subject_ids.filter((id) => id !== String(subjectId))
        : [...current.subject_ids, String(subjectId)],
    }))
    setErrors((current) => ({ ...current, subject_ids: undefined }))
  }

  const onFiles = (e) => {
    const picked = Array.from(e.target.files)
    const bad = picked.find((f) => !ALLOWED.includes(f.type))
    if (bad) { setErrors({ ...errors, attachments: `"${bad.name}" is not a PDF, JPG or PNG file.` }); e.target.value = ''; return }
    const big = picked.find((f) => f.size > MAX_MB * 1024 * 1024)
    if (big) { setErrors({ ...errors, attachments: `"${big.name}" is larger than ${MAX_MB} MB.` }); e.target.value = ''; return }
    if (picked.length + keptCount > 3) { setErrors({ ...errors, attachments: 'You can attach at most 3 files.' }); e.target.value = ''; return }
    setErrors({ ...errors, attachments: undefined })
    setFiles(picked)
  }

  const validate = () => {
    const e = {}
    if (id ? !form.subject_id : form.subject_ids.length === 0) e.subject_ids = 'Please choose at least one subject.'
    if (!form.category_id) e.category_id = 'Please choose a category.'
    if (!form.date_from) e.date_from = 'Start date is required.'
    if (form.date_from && form.date_to && form.date_to < form.date_from) e.date_to = 'End date must be on or after the start date.'
    if (form.reason.trim().length < 10) e.reason = 'Please explain the reason in at least 10 characters.'
    if (category?.requires_attachment && files.length + keptCount === 0) e.attachments = `"${category.name}" requires a supporting document.`
    return e
  }

  const onSubmit = async (ev) => {
    ev.preventDefault()
    const clientErrors = validate()
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length) return

    const fd = new FormData()
    Object.entries(form).filter(([key]) => key !== 'subject_ids').forEach(([k, v]) => fd.append(k, v))
    if (id) {
      fd.append('subject_id', form.subject_id)
    } else {
      form.subject_ids.forEach((subjectId) => fd.append('subject_ids[]', subjectId))
    }
    files.forEach((f) => fd.append('attachments[]', f))
    removed.forEach((rid) => fd.append('remove_attachments[]', rid))

    setSaving(true)
    try {
      await (id ? requestsApi.update(id, fd) : requestsApi.create(fd))
      toast.success(id ? 'Request updated.' : 'Excuse request submitted. Your teacher will review it.')
      navigate('/requests')
    } catch (err) {
      const p = parseError(err)
      setErrors(p.errors) // 422 messages from Laravel Form Requests, shown under each field
      if (!Object.keys(p.errors).length) toast.error(p.message)
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (loadError) return <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">{loadError}</div>

  return (
    <>
      <PageHeader title={id ? 'Edit excuse request' : 'File an excuse request'} subtitle="Requests can be edited until a teacher decides on them." />
      <form onSubmit={onSubmit} noValidate className="excuse-request-form max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          {id ? (
            <FormInput as="select" label="Subject" name="subject_id" value={form.subject_id} onChange={onChange} error={errors.subject_ids}>
              <option value="">Select subject…</option>
              {options.subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
            </FormInput>
          ) : (
            <fieldset className="subject-options">
              <legend>Subjects <span className="optional">(select all that apply)</span></legend>
              <div className="subject-option-list">{options.subjects.map((s) => {
                const selected = form.subject_ids.includes(String(s.id))
                return <label key={s.id} className={`subject-option ${selected ? 'selected' : ''}`}>
                  <input type="checkbox" checked={selected} onChange={() => onSubjectToggle(s.id)} />
                  <span><strong>{s.code}</strong><small>{s.name}</small></span>
                </label>
              })}</div>
              {errors.subject_ids && <p className="form-message error-message">{errors.subject_ids}</p>}
            </fieldset>
          )}
          <FormInput as="select" label="Absence category" name="category_id" value={form.category_id} onChange={onChange} error={errors.category_id}
            hint={category?.requires_attachment ? 'A supporting document is required for this category.' : undefined}>
            <option value="">Select category…</option>
            {options.categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.requires_attachment ? ' *' : ''}</option>)}
          </FormInput>
          <FormInput label="Absent from" name="date_from" type="date" value={form.date_from} onChange={onChange} error={errors.date_from} />
          <FormInput label={<>Absent until <span className="optional">(optional)</span></>} name="date_to" type="date" value={form.date_to} onChange={onChange} error={errors.date_to} min={form.date_from || undefined} />
        </div>
        <FormInput as="textarea" rows={4} label="Reason" name="reason" value={form.reason} onChange={onChange} error={errors.reason} placeholder="Briefly explain why you were absent" className="request-reason-field" />

        <div className="request-attachments-field">
          <div className="supporting-document-field">
            <label className="supporting-document-label" htmlFor="attachments">
              <span className="supporting-document-title">Supporting document</span>
              <span className="supporting-document-meta">PDF, JPG or PNG · Max {MAX_MB} MB · Up to 3 files</span>
            </label>
            <label className="supporting-document-dropzone" htmlFor="attachments">
              <span className="supporting-document-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v6h5M12 18v-6m-3 3 3-3 3 3" /></svg>
              </span>
              <span className="supporting-document-copy"><strong>Choose files to upload</strong><small>or drag and drop them here</small></span>
              <span className="supporting-document-action">Browse files</span>
              <input id="attachments" name="attachments" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={onFiles} />
            </label>
            {files.length > 0 && <ul className="supporting-document-selected">{files.map((file) => <li key={`${file.name}-${file.lastModified}`}>{file.name}</li>)}</ul>}
            {errors.attachments && <p className="mt-1 text-xs font-medium text-red-600" role="alert">{errors.attachments}</p>}
          </div>
          {existing.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm">
              {existing.map((a) => (
                <li key={a.id} className={`flex items-center justify-between rounded bg-slate-50 px-3 py-1.5 ${removed.includes(a.id) ? 'line-through opacity-50' : ''}`}>
                  <a href={a.url} target="_blank" rel="noreferrer" className="text-brand-700 underline">{a.original_name}</a>
                  <button type="button" className="text-xs font-semibold text-red-600" onClick={() => setRemoved(removed.includes(a.id) ? removed.filter((x) => x !== a.id) : [...removed, a.id])}>
                    {removed.includes(a.id) ? 'Undo' : 'Remove'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={() => navigate('/requests')} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving}>{id ? 'Save changes' : 'Submit request'}</Button>
        </div>
      </form>
    </>
  )
}
