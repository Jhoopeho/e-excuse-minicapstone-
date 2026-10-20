import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { parseError } from '../services/api'
import Button from '../components/Button'
import FormInput from '../components/FormInput'

export default function Register() {
  const { user, register, setAuthTransition } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ id_number: '', name: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)

  if (user && !loading) return <Navigate to="/" replace />

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const validate = () => {
    const e = {}
    if (!/^\d{5}$/.test(form.id_number)) e.id_number = 'Student ID must contain exactly 5 digits.'
    if (!form.name.trim()) e.name = 'Please enter your full name.'
    if (form.password !== form.password_confirmation) e.password_confirmation = 'Passwords do not match.'
    return e
  }

  const onSubmit = async (ev) => {
    ev.preventDefault()
    const clientErrors = validate()
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length) return

    setLoading(true)
    setAuthTransition({ title: 'Creating your account...', message: 'Setting up your e-Excuse account.' })
    try {
      await register(form)
      toast.success('Account created. Welcome to e-Excuse!')
      await new Promise((resolve) => window.setTimeout(resolve, 800))
      navigate('/dashboard')
    } catch (err) {
      setAuthTransition(null)
      const p = parseError(err)
      setErrors(p.errors)
      if (!Object.keys(p.errors).length) toast.error(p.message)
    } finally {
      setLoading(false)
      setAuthTransition(null)
    }
  }

  return (
    <div className="login-page">
      <main className="login-shell register-shell">
        <section className="login-campus" aria-label="Mater Dei College campus">
          <img src="/mater-dei-campus.jpg" alt="Mater Dei College campus in Tubigon, Bohol" />
          <div className="login-campus-shade" />
          <div className="login-campus-caption">
            <span>STUDENT ABSENCE MANAGEMENT</span>
            <strong>Learn. Grow. Serve.</strong>
            <p>Tubigon, Bohol</p>
          </div>
        </section>
        <form onSubmit={onSubmit} noValidate className="login-card register-card">
          <div className="login-brand">
            <span className="brand-mark"><img src="/brand-icon.png" alt="" /></span>
            <span><strong>e-Excuse</strong><small>Mater Dei College</small></span>
          </div>
          <div className="login-heading">
            <p className="login-eyebrow">GET STARTED</p>
            <h1>Create a student account</h1>
            <p>Teacher accounts are issued by the school.</p>
          </div>
          <FormInput label="ID number" name="id_number" value={form.id_number} onChange={onChange} error={errors.id_number} />
          <FormInput label="Full name" name="name" value={form.name} onChange={onChange} error={errors.name} />
          <div className="register-password-field">
            <label htmlFor="password">Password</label>
            <div className="register-password-wrap">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={onChange} aria-invalid={!!errors.password} className={`register-password-input ${errors.password ? 'has-error' : ''}`} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="register-password-toggle">{showPassword ? 'Hide' : 'Show'}</button>
            </div>
            {errors.password && <p className="login-field-error" role="alert">{errors.password}</p>}
          </div>
          <div className="register-password-field">
            <label htmlFor="password_confirmation">Confirm password</label>
            <div className="register-password-wrap">
              <input id="password_confirmation" name="password_confirmation" type={showPasswordConfirmation ? 'text' : 'password'} value={form.password_confirmation} onChange={onChange} aria-invalid={!!errors.password_confirmation} className={`register-password-input ${errors.password_confirmation ? 'has-error' : ''}`} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPasswordConfirmation((visible) => !visible)} aria-label={showPasswordConfirmation ? 'Hide confirm password' : 'Show confirm password'} className="register-password-toggle">{showPasswordConfirmation ? 'Hide' : 'Show'}</button>
            </div>
            {errors.password_confirmation && <p className="login-field-error" role="alert">{errors.password_confirmation}</p>}
          </div>
          <Button type="submit" loading={loading} className="login-submit">Sign up <span aria-hidden="true">›</span></Button>
          <p className="login-signup">Already registered? <Link to="/login">Log in</Link></p>
        </form>
      </main>
    </div>
  )
}
