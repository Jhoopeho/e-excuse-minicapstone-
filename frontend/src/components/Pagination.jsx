import Button from './Button'

/** `meta` is the Laravel paginate() meta object: { current_page, last_page, total, from, to }. */
export default function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return meta ? <p className="mt-3 text-xs text-slate-500">{meta.total} record(s)</p> : null
  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
      <p className="text-slate-500">Showing {meta.from}–{meta.to} of {meta.total}</p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)}>Previous</Button>
        <span className="px-2 font-medium">Page {meta.current_page} of {meta.last_page}</span>
        <Button variant="secondary" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)}>Next</Button>
      </div>
    </div>
  )
}
