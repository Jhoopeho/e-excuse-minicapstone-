import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-5xl font-bold text-brand-700">404</p>
      <p className="mt-2 text-slate-600">We couldn't find that page.</p>
      <Link to="/" className="mt-4 inline-block font-semibold text-brand-700 underline">Back to dashboard</Link>
    </div>
  )
}
