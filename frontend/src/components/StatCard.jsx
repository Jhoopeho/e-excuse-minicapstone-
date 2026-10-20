export default function StatCard({ label, value, hint, tone = 'blue' }) {
  const tones = { blue: 'text-brand-700', amber: 'text-amber-600', green: 'text-emerald-600', red: 'text-red-600' }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tones[tone]}`}>{value}</p>
      {hint && <p className="mt-1 truncate text-xs text-slate-500" title={hint}>{hint}</p>}
    </div>
  )
}
