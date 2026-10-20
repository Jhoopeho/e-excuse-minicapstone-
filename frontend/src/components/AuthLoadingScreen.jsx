export default function AuthLoadingScreen({ title, message }) {
  return (
    <div className="auth-loading-screen" role="status" aria-live="polite">
      <div className="auth-loading-content">
        <img className="auth-loading-logo" src="/brand-icon.png" alt="" />
        <strong>{title}</strong>
        <span className="auth-loading-spinner" aria-hidden="true" />
        <p>{message}</p>
      </div>
    </div>
  )
}
