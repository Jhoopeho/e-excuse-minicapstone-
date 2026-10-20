import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { parseError } from '../services/api'
import Button from '../components/Button'
import FormInput from '../components/FormInput'
import AuthLoadingScreen from '../components/AuthLoadingScreen'

export default function Login() {
  const { user, login, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ id_number: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [postLoginLoading, setPostLoginLoading] = useState(false)

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    const clientErrors = {}
    if (!form.id_number.trim()) clientErrors.id_number = 'Please enter your ID number.'
    if (!form.password) clientErrors.password = 'Please enter your password.'
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length) return

    setLoading(true)
    try {
      const u = await login(form)
      if (u.role !== role) {
        await logout()
        setErrors({ id_number: `This account is a ${u.role} account. Choose "${u.role}" above.` })
        return
      }
      toast.success(`Welcome back, ${u.name}!`)
      setPostLoginLoading(true)
      await new Promise((resolve) => window.setTimeout(resolve, 2500))
      navigate('/dashboard')
    } catch (err) {
      const p = parseError(err)
      setErrors(Object.keys(p.errors).length ? p.errors : { id_number: p.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {postLoginLoading ? (
        <AuthLoadingScreen title={`Welcome back, ${user?.name}!`} message="Preparing your dashboard..." />
      ) : (
        <main className="login-shell">
          <section className="login-campus" aria-label="Mater Dei College campus">
            <img src="/mater-dei-campus.jpg" alt="Mater Dei College campus in Tubigon, Bohol" />
            <div className="login-campus-shade" />
            <div className="login-campus-caption">
              <span>STUDENT ABSENCE MANAGEMENT</span>
              <strong>Learn. Grow. Serve.</strong>
              <p>Tubigon, Bohol</p>
            </div>
          </section>
          <form onSubmit={onSubmit} noValidate className="login-card">
            <div className="login-brand">
              <span className="brand-mark"><img src="/brand-icon.png" alt="" /></span>
              <span><strong>e-Excuse</strong><small>Mater Dei College</small></span>
            </div>
            <div className="login-heading">
              <p className="login-eyebrow">WELCOME BACK</p>
              <h1>Sign in to your account</h1>
              <p>Manage your absence requests and stay up to date.</p>
            </div>
            <label className="login-role-label">I am signing in as</label>
            <div className={`login-role-switch ${role === 'teacher' ? 'teacher-selected' : ''}`} role="tablist" aria-label="Account type">
              <span className="login-role-slider" />
          {['student', 'teacher'].map((r) => (
            <button
              key={r} type="button" role="tab" aria-selected={role === r} onClick={() => setRole(r)}
              className={`login-role-option ${role === r ? 'active' : ''}`}
            >{r}</button>
          ))}
            </div>
            <FormInput label="ID number" name="id_number" value={form.id_number} onChange={onChange} error={errors.id_number} placeholder="Enter your ID" autoComplete="username" />
            <div className="password-field">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={onChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  className="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="password-visibility"
                >{showPassword ? 'Hide' : 'Show'}</button>
              </div>
              {errors.password && <p className="login-field-error" role="alert">{errors.password}</p>}
            </div>
            <Button type="submit" loading={loading} className="login-submit">Log in <span aria-hidden="true">›</span></Button>
            {role === 'student' && (
              <p className="login-signup">
                No account yet? <Link to="/register">Sign up</Link>
              </p>
            )}
          </form>
        </main>
      )}
    </div>
  )
}
