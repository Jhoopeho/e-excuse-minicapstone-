import { Spinner } from './Button'

/**
 * columns: [{ key, header, render?(row), className? }]
 * Handles loading, error and empty states. Rows use a stable `id` as key.
 */
export default function DataTable({ columns, rows, loading, error, emptyText = 'Nothing here yet.', onRetry }) {
  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        {error}
        {onRetry && <button onClick={onRetry} className="ml-2 font-semibold underline">Try again</button>}
      </div>
    )
  }
  if (!rows.length) return <div className="rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center text-sm text-slate-500">{emptyText}</div>

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>{columns.map((c) => <th key={c.key} className={`px-4 py-3 ${c.className || ''}`}>{c.header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-brand-50/40">
              {columns.map((c) => <td key={c.key} className={`px-4 py-3 align-top ${c.className || ''}`}>{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
