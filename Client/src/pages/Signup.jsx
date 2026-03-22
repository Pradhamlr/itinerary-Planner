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
      <section className="mx-auto w-full max-w-xl surface-card p-7 sm:p-10">
        <p className="field-label">Account Setup</p>
        <h1 className="editorial-title mt-3 text-4xl font-semibold text-brand-palm">Verify Your Email</h1>
        <p className="mt-3 text-sm leading-7 text-[#5a5843]">
          We sent a 6-digit code to {formData.email}
        </p>

        <form onSubmit={handleVerificationSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="verificationCode" className="field-label block">
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
              className="input-minimal text-center text-lg tracking-[0.4em]"
              required
            />
          </div>

          {error && (
            <p className="rounded-xl bg-[#f5ddd8] px-4 py-3 text-sm text-[#8a3022]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={resendCode}
              disabled={loading}
              className="text-sm font-semibold text-brand-secondary hover:text-brand-terracottaInk disabled:opacity-50"
            >
              Resend Code
            </button>
          </div>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-sm font-semibold text-[#5a5843] hover:text-brand-palm"
          >
            Back to Signup
          </button>
        </form>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-xl surface-card p-7 sm:p-10">
      <p className="field-label">New Account</p>
      <h1 className="editorial-title mt-3 text-4xl font-semibold text-brand-palm">Create account</h1>
      <p className="mt-3 text-sm leading-7 text-[#5a5843]">Start planning your next journey in minutes.</p>

      <form onSubmit={handleSignupSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="name" className="field-label block">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
            className="input-minimal"
          />
        </div>

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
            minLength={6}
            className="input-minimal"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="field-label block">
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
            className="input-minimal"
          />
        </div>

        {error && <p className="rounded-xl bg-[#f5ddd8] px-4 py-3 text-sm text-[#8a3022]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-[#5a5843]">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-secondary hover:text-brand-terracottaInk hover:underline">
          Login
        </Link>
      </p>
    </section>
  )
}

export default Signup
