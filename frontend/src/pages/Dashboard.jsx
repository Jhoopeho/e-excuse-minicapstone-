import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardApi, parseError, requestsApi } from '../services/api'
import { Spinner } from '../components/Button'

const dateLabel = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
const DashboardIcon = ({ children }) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>
const documentIcon = <DashboardIcon><path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v6h5M9 13h6M9 17h6" /></DashboardIcon>
const chevronIcon = <DashboardIcon><path d="m9 18 6-6-6-6" /></DashboardIcon>

export default function Dashboard() {
  const { user, isTeacher } = useAuth()
  const [data, setData] = useState(null)
  const [recent, setRecent] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const load = useCallback(() => {
    setLoading(true); setError('')
    Promise.all([dashboardApi.get(), requestsApi.list({ per_page: 4 })])
      .then(([dashboard, requests]) => { setData(dashboard.data.data); setRecent(requests.data.data) })
      .catch((e) => setError(parseError(e).message))
      .finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (error) return <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">{error} <button className="font-semibold underline" onClick={load}>Retry</button></div>
  const total = data.total_requests || 0
  const statuses = ['Approved', 'Pending', 'Rejected']
  const byStatus = Object.fromEntries(Object.entries(data.by_status || {}).map(([key, value]) => [key.toLowerCase(), value]))
  const statItems = [
    [documentIcon, 'blue', 'Total Requests', total, 'blue-chip'],
    [<DashboardIcon><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></DashboardIcon>, 'amber', 'Pending', data.pending_requests, 'amber-chip'],
    [<DashboardIcon><path d="m5 12 4 4L19 6" /></DashboardIcon>, 'green', 'Approved', byStatus.approved || 0, 'green-chip'],
    [<DashboardIcon><path d="m18 6-12 12M6 6l12 12" /></DashboardIcon>, 'red', 'Rejected', byStatus.rejected || 0, 'red-chip'],
  ]
  return <>
    <section className="welcome-row"><div><h1>{isTeacher ? 'Review student requests' : `Good day, ${user.name.split(' ')[0]}!`}</h1><p>{isTeacher ? 'Stay on top of absence requests for your subjects.' : 'Stay responsible, your excuses matter.'}</p></div></section>
    {!isTeacher && <section className="hero-banner"><div className="hero-copy"><span className="eyebrow">WELCOME TO e-EXCUSE</span><h2>Manage Your Absences Easily</h2><p>Submit and track your absence excuses, provide supporting documents, and stay updated all in one place.</p><Link to="/requests/new" className="hero-button"><span className="document-icon">{documentIcon}</span>Submit an Excuse <b>{chevronIcon}</b></Link></div><div className="hero-art"><img className="hero-art-image" src="/dashboard-hero.svg" alt="" /></div></section>}
    <section className="stats-grid">{statItems.map(([icon, tone, label, value, chip]) => <article className="stat-card" key={label}><span className={`stat-icon ${tone}`}>{icon}</span><div><small>{label}</small><strong>{value ?? 0}</strong></div><span className={`stat-chip ${chip}`}>{total ? Math.round(((value || 0) / total) * 100) : 0}%</span></article>)}</section>
    <section className="dashboard-columns">
      <article className="panel activity-panel"><div className="panel-heading"><div><h3>{isTeacher ? 'Recent Requests' : 'Recent Activity'}</h3><p>{isTeacher ? 'Latest absence requests to review' : 'Your latest absence requests'}</p></div><Link to="/requests" className="text-link">View All <span>{chevronIcon}</span></Link></div>
        {recent.length ? recent.map((request, index) => <div className="activity-row" key={request.id}><span className={`reason-icon ${['green','amber','blue','red'][index % 4]}`}>{documentIcon}</span><div className="activity-copy"><strong>{request.reason}</strong><small>{dateLabel(request.date_from)}{request.date_to && request.date_to !== request.date_from ? ` – ${dateLabel(request.date_to)}` : ''} <span>•</span> {request.subject?.code || request.category?.name || 'Request'}</small></div><span className={`status-pill ${request.status}`}>{request.status}</span><Link className="row-arrow" to="/requests" aria-label="View request">{chevronIcon}</Link></div>) : <div className="empty-state">No requests yet. Submit your first excuse to get started.</div>}
      </article>
      <article className="panel overview-panel"><div className="panel-heading"><h3>Request Status Overview</h3><span className="month-chip">All time</span></div>{statuses.map((status) => { const count = byStatus[status.toLowerCase()] || 0; return <div className="progress-row" key={status}><span>{status}</span><div className="progress-track"><i className={status.toLowerCase()} style={{ width: `${total ? count / total * 100 : 0}%` }} /></div><strong>{count}</strong></div> })}</article>
    </section>
  </>
}
