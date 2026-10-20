import { useCallback, useEffect, useState } from 'react'
import { parseError, subjectsApi } from '../services/api'
import { useToast } from '../context/ToastContext'
import useDebounce from '../hooks/useDebounce'
import Button from '../components/Button'
import DataTable from '../components/DataTable'
import FormInput from '../components/FormInput'
import Modal from '../components/Modal'
import { ConfirmModal } from '../components/Modal'
import PageHeader from '../components/PageHeader'
import Pagination from '../components/Pagination'

export default function Subjects() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // null | {} (new) | subject
  const [form, setForm] = useState({ code: '', name: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const search = useDebounce(q)

  const load = useCallback(() => {
    setLoading(true); setError('')
    subjectsApi.list({ page, search: search || undefined })
      .then((r) => { setRows(r.data.data); setMeta(r.data.meta) })
      .catch((e) => setError(parseError(e).message))
      .finally(() => setLoading(false))
  }, [page, search])
  useEffect(load, [load])

  const openForm = (s = {}) => { setEditing(s); setForm({ code: s.code || '', name: s.name || '' }); setErrors({}) }

  const save = async (e) => {
    e.preventDefault()
    const ce = {}
    if (!form.code.trim()) ce.code = 'Subject code is required.'
    if (!form.name.trim()) ce.name = 'Subject name is required.'
    setErrors(ce)
    if (Object.keys(ce).length) return
    setSaving(true)
    try {
      await (editing.id ? subjectsApi.update(editing.id, form) : subjectsApi.create(form))
      toast.success(editing.id ? 'Subject updated.' : 'Subject added.')
      setEditing(null); load()
    } catch (err) { const p = parseError(err); setErrors(p.errors); if (!Object.keys(p.errors).length) toast.error(p.message) }
    finally { setSaving(false) }
  }

  const remove = async () => {
    setDeleting(true)
    try {
      await subjectsApi.remove(toDelete.id)
      toast.success('Subject deleted.')
      setToDelete(null)
      if (rows.length === 1 && page > 1) setPage(page - 1)
      else load()
    } catch (err) {
      toast.error(parseError(err).message)
      setToDelete(null)
    } finally { setDeleting(false) }
  }

  const columns = [
    { key: 'code', header: 'Code', render: (r) => <span className="font-semibold">{r.code}</span> },
    { key: 'name', header: 'Subject' },
    { key: 'requests_count', header: 'Excuse requests' },
    { key: 'actions', header: '', className: 'text-right', render: (r) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" onClick={() => openForm(r)}>Edit</Button>
        <Button variant="ghost" className="!text-red-600 hover:!bg-red-50" onClick={() => setToDelete(r)}>Delete</Button>
      </div>
    ) },
  ]

  return (
    <>
      <PageHeader title="Subjects" subtitle="Subjects you handle. Students pick from these when filing." action={<Button onClick={() => openForm()}>+ Add subject</Button>} />
      <div className="mb-4 max-w-sm"><FormInput label="Search" name="q" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Code or name" /></div>
      <DataTable columns={columns} rows={rows} loading={loading} error={error} onRetry={load} emptyText="No subjects yet. Add your first subject." />
      {!loading && !error && <Pagination meta={meta} onPage={setPage} />}

      <Modal open={!!editing} title={editing?.id ? 'Edit subject' : 'Add subject'} onClose={() => setEditing(null)}>
        <form onSubmit={save} noValidate className="space-y-4">
          <FormInput label="Code" name="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} error={errors.code} placeholder="IT-301" />
          <FormInput label="Name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} placeholder="Web Development" />
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" loading={saving}>Save</Button></div>
        </form>
      </Modal>
      <ConfirmModal
        open={!!toDelete} loading={deleting} onClose={() => setToDelete(null)} onConfirm={remove}
        title="Delete this subject?" confirmLabel="Delete"
        message="This permanently deletes the subject. Subjects with excuse requests cannot be deleted."
      />
    </>
  )
}
