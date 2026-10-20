export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-intro">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
