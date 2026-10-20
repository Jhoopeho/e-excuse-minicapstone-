import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from './Button'

export default function Layout() {
  const { user, logout, isTeacher, setAuthTransition } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const icon = (children) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>
  const links = [
    { to: '/dashboard', label: 'Dashboard', end: true, icon: icon(<><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>) },
    { to: '/requests', label: isTeacher ? 'Review Requests' : 'My Requests', end: !isTeacher, icon: icon(<><path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v6h5M9 13h6M9 17h6" /></>) },
    ...(isTeacher ? [
      { to: '/subjects', label: 'Subjects', icon: icon(<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" /><path d="M4 6v15M8 7h8M8 11h8" /></>) },
      { to: '/categories', label: 'Categories', icon: icon(<><path d="M20 13 13 20a2 2 0 0 1-2.8 0L3 12.8V4h8.8l7.6 7.2a1.3 1.3 0 0 1 .6 1.8Z" /><circle cx="8" cy="8" r="1" /></>) },
    ] : [{ to: '/requests/new', label: 'Submit Excuse', icon: icon(<><path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v6h5M12 13v6M9 16h6" /></>) }]),
  ]
  const handleLogout = async () => {
    setAuthTransition({ title: 'Signing out...', message: 'Securely ending your session.' })
    try {
      await logout()
      navigate('/login')
      await new Promise((resolve) => window.setTimeout(resolve, 800))
    } finally {
      setAuthTransition(null)
    }
  }
  const title = links.find((link) => link.to === location.pathname)?.label || 'Dashboard'
  return <div className="app-shell app-theme">
    <aside className="sidebar">
      <a className="brand" href="/dashboard" aria-label="e-Excuse dashboard"><span className="brand-mark"><img src="/brand-icon.png" alt="" /></span><span><strong>e-Excuse</strong><small>Student Absence<br />Management System</small></span></a>
      <button className="menu-toggle" aria-label="Toggle menu" onClick={() => setOpen(!open)}>☰</button>
      <nav className={`main-nav ${open ? 'menu-open' : ''}`} aria-label="Main navigation">
        {links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><span className="nav-icon">{link.icon}</span>{link.label}</NavLink>)}
      </nav>
      <div className="sidebar-user"><span className="mini-avatar">{user.name.slice(0, 1)}</span><span className="user-copy"><strong>{user.name}</strong><small>{isTeacher ? 'Request reviewer' : 'Student'}</small></span></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="topbar-right"><span className="top-user">{user.name} · <span className="capitalize">{user.role}</span></span><Button variant="secondary" className="logout-button" onClick={handleLogout}>Log out</Button></div></header>
      <div className="page-content"><div className="mobile-page-title">{title}</div><Outlet /></div>
    </main>
  </div>
}
