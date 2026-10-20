// Reusable controlled input / select / textarea with label and error text shown under the field.
export default function FormInput({ label, name, error, as = 'input', children, hint, className = '', ...rest }) {
  const Tag = as
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <Tag
        id={name}
        name={name}
        aria-invalid={!!error}
        className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 ${
          error ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
        }`}
        {...rest}
      >
        {children}
      </Tag>
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600" role="alert">{error}</p>}
    </div>
  )
}
