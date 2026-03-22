import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import api from '../services/api'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
      // Clear the message from location state
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', formData)
      login(response.data.data)
      navigate(from, { replace: true })
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-xl surface-card p-7 sm:p-10">
      <p className="field-label">Smart Itinerary</p>
      <h1 className="editorial-title mt-3 text-4xl font-semibold text-brand-palm">Welcome back</h1>
      <p className="mt-3 max-w-md text-sm leading-7 text-[#5a5843]">Log in to continue planning your Kerala journey with recommendation-aware itineraries.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="email" className="field-label block">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="input-minimal"
          />
        </div>

        <div>
          <label htmlFor="password" className="field-label block">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="input-minimal"
          />
        </div>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-semibold text-brand-secondary hover:text-brand-terracottaInk">
            Forgot password?
          </Link>
        </div>

        {successMessage && (
          <p className="rounded-xl bg-[#deeadf] px-4 py-3 text-sm text-[#1e4f36]">{successMessage}</p>
        )}

        {error ? <p className="rounded-xl bg-[#f5ddd8] px-4 py-3 text-sm text-[#8a3022]">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="mt-6 text-sm text-[#5a5843]">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-semibold text-brand-secondary hover:text-brand-terracottaInk hover:underline">
          Create one
        </Link>
      </p>
    </section>
  )
}

export default Login
