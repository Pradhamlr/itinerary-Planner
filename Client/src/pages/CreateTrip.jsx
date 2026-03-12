import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function CreateTrip() {
  const [formData, setFormData] = useState({
    city: '',
    days: '',
    budget: '',
    interests: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const parsedDays = Number(formData.days)
    const parsedBudget = Number(formData.budget)

    if (!formData.city || !parsedDays || Number.isNaN(parsedBudget)) {
      setError('Please provide valid city, days, and budget values.')
      return
    }

    const payload = {
      city: formData.city.trim(),
      days: parsedDays,
      budget: parsedBudget,
      interests: formData.interests
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    }

    setLoading(true)
    try {
      await api.post('/trips', payload)
      navigate('/dashboard', { replace: true })
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to create trip.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900">Create New Trip</h1>
      <p className="mt-2 text-sm text-slate-600">Enter trip basics to save your itinerary request.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="city" className="mb-1 block text-sm font-medium text-slate-700">
            City
          </label>
          <input
            id="city"
            name="city"
            type="text"
            value={formData.city}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="days" className="mb-1 block text-sm font-medium text-slate-700">
              Days
            </label>
            <input
              id="days"
              name="days"
              type="number"
              min="1"
              value={formData.days}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="budget" className="mb-1 block text-sm font-medium text-slate-700">
              Budget
            </label>
            <input
              id="budget"
              name="budget"
              type="number"
              min="0"
              step="0.01"
              value={formData.budget}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
            />
          </div>
        </div>

        <div>
          <label htmlFor="interests" className="mb-1 block text-sm font-medium text-slate-700">
            Interests
          </label>
          <input
            id="interests"
            name="interests"
            type="text"
            placeholder="culture, food, art"
            value={formData.interests}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
          />
          <p className="mt-1 text-xs text-slate-500">Enter interests separated by commas.</p>
        </div>

        {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Creating...' : 'Create Trip'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}

export default CreateTrip
