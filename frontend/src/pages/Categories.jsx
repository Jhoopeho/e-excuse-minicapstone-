import { useCallback, useEffect, useState } from 'react'
import { categoriesApi, parseError } from '../services/api'
import { useToast } from '../context/ToastContext'
import Button from '../components/Button'
import DataTable from '../components/DataTable'
import FormInput from '../components/FormInput'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import Pagination from '../components/Pagination'

export default function Categories() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', requires_attachment: false })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true); setError('')
    categoriesApi.list({ page })
      .then((r) => { setRows(r.data.data); setMeta(r.data.meta) })
      .catch((e) => setError(parseError(e).message))
      .finally(() => setLoading(false))
  }, [page])
  useEffect(load, [load])

  const openForm = (c = {}) => { setEditing(c); setForm({ name: c.name || '', requires_attachment: !!c.requires_attachment }); setErrors({}) }

  const save = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setErrors({ name: 'Category name is required.' }); return }
    setSaving(true)
    try {
      await (editing.id ? categoriesApi.update(editing.id, form) : categoriesApi.create(form))
      toast.success(editing.id ? 'Category updated.' : 'Category added.')
      setEditing(null); load()
    } catch (err) { const p = parseError(err); setErrors(p.errors); if (!Object.keys(p.errors).length) toast.error(p.message) }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'name', header: 'Category', render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'requires_attachment', header: 'Document required', render: (r) => (r.requires_attachment ? 'Yes' : 'No') },
    { key: 'requests_count', header: 'Excuse requests' },
    { key: 'actions', header: '', className: 'text-right', render: (r) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" onClick={() => openForm(r)}>Edit</Button>
      </div>
    ) },
  ]

  return (
    <>
      <PageHeader title="Absence Categories" subtitle="Choose which categories need a supporting document." />
      <DataTable columns={columns} rows={rows} loading={loading} error={error} onRetry={load} emptyText="No categories yet." />
      {!loading && !error && <Pagination meta={meta} onPage={setPage} />}

      <Modal open={!!editing} title={editing?.id ? 'Edit category' : 'Add category'} onClose={() => setEditing(null)}>
        <form onSubmit={save} noValidate className="space-y-4">
          <FormInput label="Name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.requires_attachment} onChange={(e) => setForm({ ...form, requires_attachment: e.target.checked })} /> Students must attach a supporting document</label>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" loading={saving}>Save</Button></div>
        </form>
      </Modal>
    </>
  )
}
