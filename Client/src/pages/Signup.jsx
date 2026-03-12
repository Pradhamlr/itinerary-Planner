import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

function Signup() {
  const [step, setStep] = useState(1) // 1: signup form, 2: email verification
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    verificationCode: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSignupSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/auth/signup', formData)
      if (response.data.success) {
        setStep(2) // Move to verification step
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.verificationCode) {
        setError('Please enter the verification code')
        return
      }

      const response = await api.post('/auth/verify-email', {
        email: formData.email,
        code: formData.verificationCode
      })

      if (response.data.success) {
        navigate('/login', {
          state: { message: 'Email verified successfully! Please log in to continue.' }
        })
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resendCode = async () => {
    setError('')
    setLoading(true)

    try {
      await api.post('/auth/signup', formData)
      setError('')
      // Show success message or toast here if needed
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to resend code.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 2) {
    return (
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">Verify Your Email</h1>
        <p className="mt-2 text-sm text-slate-600">
          We sent a 6-digit code to {formData.email}
        </p>

        <form onSubmit={handleVerificationSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="verificationCode" className="mb-1 block text-sm font-medium text-slate-700">
              Verification Code
            </label>
            <input
              id="verificationCode"
              name="verificationCode"
              type="text"
              value={formData.verificationCode}
              onChange={handleChange}
              placeholder="123456"
              maxLength={6}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none ring-brand-500 transition focus:ring-2 text-center text-lg tracking-widest"
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={resendCode}
              disabled={loading}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50"
            >
              Resend Code
            </button>
          </div>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-sm text-slate-600 hover:text-slate-700 font-medium"
          >
            Back to Signup
          </button>
        </form>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
      <p className="mt-2 text-sm text-slate-600">Start planning your next journey in minutes.</p>

      <form onSubmit={handleSignupSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-700">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength={6}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
          />
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          Login
        </Link>
      </p>
    </section>
  )
}

export default Signup
