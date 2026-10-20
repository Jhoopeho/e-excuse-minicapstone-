import { useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import FormInput from './FormInput'
import StatusBadge from './StatusBadge'
import { parseError, requestsApi } from '../services/api'
import { useToast } from '../context/ToastContext'

const fmt = (d) => new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
const isImage = (attachment) => /\.(jpe?g|png)$/i.test(attachment.original_name || '')

/** Details of one excuse request. Teachers who may review it also get the approve / reject form. */
export default function RequestDetail({ request, onClose, onChanged }) {
  const toast = useToast()
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  if (!request) return null

  const decide = async (status) => {
    if (remarks.trim().length < 3) { setError('Please add a remark explaining your decision.'); return }
    setError(''); setBusy(status)
    try {
      await requestsApi.setStatus(request.id, { status, teacher_remarks: remarks })
      toast.success(`Request ${status}.`)
      setRemarks('')
      onChanged()
      onClose()
    } catch (e) {
      const p = parseError(e)
      setError(p.errors.teacher_remarks || p.message)
    } finally { setBusy('') }
  }

  const rows = [
    ['Student', `${request.student?.name} (${request.student?.id_number})`],
    ['Subject', `${request.subject?.code} — ${request.subject?.name}`],
    ['Category', request.category?.name],
    ['Absence dates', request.date_from === request.date_to ? fmt(request.date_from) : `${fmt(request.date_from)} – ${fmt(request.date_to)}`],
    ['Filed on', fmt(request.created_at)],
  ]

  return (
    <Modal open title={`Excuse request #${request.id}`} onClose={onClose}>
      <div className="mb-4"><StatusBadge status={request.status} /></div>
      <dl className="space-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-3 gap-2"><dt className="text-slate-500">{k}</dt><dd className="col-span-2 font-medium">{v}</dd></div>
        ))}
        <div className="grid grid-cols-3 gap-2"><dt className="text-slate-500">Reason</dt><dd className="col-span-2 whitespace-pre-wrap">{request.reason}</dd></div>
        <div className="grid grid-cols-3 gap-2">
          <dt className="text-slate-500">Documents</dt>
          <dd className="col-span-2">
            {request.attachments?.length
              ? <div className="space-y-3">{request.attachments.map((a) => (
                <div key={a.id} className="space-y-1">
                  {isImage(a)
                    ? <img src={a.url} alt={a.original_name} className="max-h-72 max-w-full rounded-lg border border-slate-200 object-contain" />
                    : <a href={a.url} target="_blank" rel="noreferrer" className="block text-brand-700 underline">{a.original_name}</a>}
                </div>
              ))}</div>
              : <span className="text-slate-400">None attached</span>}
          </dd>
        </div>
        {request.teacher_remarks && (
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Teacher remarks {request.reviewed_at && `· ${fmt(request.reviewed_at)}`}</p>
            <p className="mt-1">{request.teacher_remarks}</p>
          </div>
        )}
      </dl>

      {request.can?.review && (
        <div className="mt-5 space-y-3 border-t pt-4">
          <FormInput as="textarea" rows={3} label="Remarks (required)" name="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} error={error} placeholder="Explain your decision to the student" />
          <div className="flex justify-end gap-2">
            <Button variant="danger" loading={busy === 'rejected'} disabled={!!busy} onClick={() => decide('rejected')}>Reject</Button>
            <Button variant="success" loading={busy === 'approved'} disabled={!!busy} onClick={() => decide('approved')}>Approve</Button>
          </div>
        </div>
      )}
      {!request.can?.review && <div className="mt-5 flex justify-end"><Button variant="secondary" onClick={onClose}>Close</Button></div>}
    </Modal>
  )
}
