import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { optionsApi, parseError, requestsApi } from '../services/api'
import useDebounce from '../hooks/useDebounce'
import Button from '../components/Button'
import DataTable from '../components/DataTable'
import FormInput from '../components/FormInput'
import PageHeader from '../components/PageHeader'
import Pagination from '../components/Pagination'
import StatusBadge from '../components/StatusBadge'
import RequestDetail from '../components/RequestDetail'
import { ConfirmModal } from '../components/Modal'

const fmt = (d) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
const emptyFilters = { search: '', status: '', category_id: '', date_from: '', date_to: '' }

export default function Requests() {
  const { isTeacher } = useAuth()
  const toast = useToast()
  const [filters, setFilters] = useState(emptyFilters)
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const search = useDebounce(filters.search)

  useEffect(() => { optionsApi.get().then((r) => setCategories(r.data.data.categories)).catch(() => {}) }, [])

  const load = useCallback(() => {
    setLoading(true); setError('')
    const params = { page, ...Object.fromEntries(Object.entries({ ...filters, search }).filter(([, v]) => v !== '')) }
    requestsApi.list(params)
      .then((r) => { setRows(r.data.data); setMeta(r.data.meta) })
      .catch((e) => setError(parseError(e).message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filters.status, filters.category_id, filters.date_from, filters.date_to])
  useEffect(load, [load])

  const setFilter = (e) => { setFilters({ ...filters, [e.target.name]: e.target.value }); setPage(1) }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await requestsApi.remove(toDelete.id)
      toast.success(isTeacher ? 'Record deleted.' : 'Request cancelled.')
      setToDelete(null)
      // Step back a page if we just removed the last row of this page.
      if (rows.length === 1 && page > 1) setPage(page - 1); else load()
    } catch (e) { toast.error(parseError(e).message); setToDelete(null) }
    finally { setDeleting(false) }
  }

  const columns = [
    ...(isTeacher ? [{ key: 'student', header: 'Student', render: (r) => <><p className="font-medium">{r.student?.name}</p><p className="text-xs text-slate-500">{r.student?.id_number}</p></> }] : []),
    { key: 'subject', header: 'Subject', render: (r) => <><p className="font-medium">{r.subject?.code}</p><p className="text-xs text-slate-500">{r.subject?.name}</p></> },
    { key: 'category', header: 'Category', render: (r) => r.category?.name },
    { key: 'dates', header: 'Absent on', render: (r) => (r.date_from === r.date_to ? fmt(r.date_from) : `${fmt(r.date_from)} – ${fmt(r.date_to)}`) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', header: '', className: 'text-right whitespace-nowrap',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" onClick={() => setSelected(r)}>{r.can.review ? 'Review' : 'View'}</Button>
          {r.can.update && <Link to={`/requests/${r.id}/edit`}><Button variant="ghost">Edit</Button></Link>}
          {r.can.delete && (isTeacher || r.status !== 'pending') && <Button variant="ghost" className="!text-red-600 hover:!bg-red-50" onClick={() => setToDelete(r)}>Delete</Button>}
          {r.can.delete && !isTeacher && r.status === 'pending' && <Button variant="ghost" className="!text-red-600 hover:!bg-red-50" onClick={() => setToDelete(r)}>Cancel</Button>}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={isTeacher ? 'Excuse Requests' : 'My Excuse Requests'}
        subtitle={isTeacher ? 'Review requests filed for your subjects' : 'Track the status of every excuse you filed'}
        action={!isTeacher && <Link to="/requests/new"><Button>+ File an excuse</Button></Link>}
      />

      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <FormInput className="lg:col-span-2" label="Search" name="search" value={filters.search} onChange={setFilter} placeholder={isTeacher ? 'Student, ID, subject or reason' : 'Subject or reason'} />
        <FormInput as="select" label="Status" name="status" value={filters.status} onChange={setFilter}>
          <option value="">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
        </FormInput>
        <FormInput as="select" label="Category" name="category_id" value={filters.category_id} onChange={setFilter}>
          <option value="">All</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </FormInput>
        <div className="grid grid-cols-2 gap-2">
          <FormInput label="From" name="date_from" type="date" value={filters.date_from} onChange={setFilter} />
          <FormInput label="To" name="date_to" type="date" value={filters.date_to} onChange={setFilter} />
        </div>
        {Object.values(filters).some(Boolean) && (
          <div className="sm:col-span-2 lg:col-span-5"><button className="text-sm font-semibold text-brand-700 hover:underline" onClick={() => { setFilters(emptyFilters); setPage(1) }}>Clear filters</button></div>
        )}
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} error={error} onRetry={load}
        emptyText={Object.values(filters).some(Boolean) ? 'No requests match your filters.' : (isTeacher ? 'No excuse requests yet.' : 'You have not filed any excuse request yet.')} />
      {!loading && !error && <Pagination meta={meta} onPage={setPage} />}

      <RequestDetail request={selected} onClose={() => setSelected(null)} onChanged={load} />
      <ConfirmModal
        open={!!toDelete} loading={deleting} onClose={() => setToDelete(null)} onConfirm={confirmDelete}
        title={isTeacher || toDelete?.status !== 'pending' ? 'Delete this request?' : 'Cancel this request?'} confirmLabel={isTeacher || toDelete?.status !== 'pending' ? 'Delete' : 'Cancel request'}
        message={isTeacher || toDelete?.status !== 'pending' ? 'This permanently removes the excuse request and its attachments.' : 'Your pending request will be withdrawn and removed. You can file a new one later.'}
      />
    </>
  )
}
