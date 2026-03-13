import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const INTEREST_OPTIONS = [
  'adventure', 'culture', 'food', 'nature', 'history',
  'shopping', 'nightlife', 'beaches', 'art', 'sports', 'spiritual',
]

const AVAILABLE_CITIES = [
  'Agra', 'Ahmedabad', 'Alleppey', 'Amritsar', 'Andaman', 'Aurangabad',
  'Bangalore', 'Bhopal', 'Bodhgaya', 'Chennai', 'Corbett', 'Darjeeling',
  'Delhi', 'Goa', 'Hampi', 'Hyderabad', 'Jaipur', 'Jodhpur',
  'Kaziranga', 'Khajuraho', 'Kochi', 'Kolkata', 'Kullu', 'Madurai',
  'Manali', 'Mumbai', 'Munnar', 'Mysore', 'Nainital', 'Ooty',
  'Puri', 'Pushkar', 'Ranthambore', 'Rishikesh', 'Shimla', 'Udaipur',
  'Uttarakhand Hills', 'Varanasi',
]

function CreateTrip() {
  const [formData, setFormData] = useState({
    city: '',
    days: '',
    budget: '',
    budgetCategory: 'medium',
    pace: 'moderate',
    interests: [],
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const toggleInterest = (interest) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
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

    if (formData.interests.length === 0) {
      setError('Please select at least one interest.')
      return
    }

    const payload = {
      city: formData.city.trim(),
      days: parsedDays,
      budget: parsedBudget,
      budgetCategory: formData.budgetCategory,
      pace: formData.pace,
      interests: formData.interests,
    }

    setLoading(true)
    try {
      const response = await api.post('/trips', payload)
      navigate(`/trip/${response.data.data._id}`, { replace: true })
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to create trip.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900">Plan Your Trip</h1>
      <p className="mt-2 text-sm text-slate-600">
        Tell us your preferences and we&apos;ll generate an optimized day-wise itinerary.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* City */}
        <div>
          <label htmlFor="city" className="mb-1 block text-sm font-medium text-slate-700">
            Destination City
          </label>
          <select
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
          >
            <option value="">Select a city</option>
            {AVAILABLE_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Days + Budget */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="days" className="mb-1 block text-sm font-medium text-slate-700">
              Number of Days
            </label>
            <input
              id="days"
              name="days"
              type="number"
              min="1"
              max="30"
              value={formData.days}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="budget" className="mb-1 block text-sm font-medium text-slate-700">
              Total Budget (INR)
            </label>
            <input
              id="budget"
              name="budget"
              type="number"
              min="0"
              step="100"
              placeholder="e.g. 15000"
              value={formData.budget}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
            />
          </div>
        </div>

        {/* Budget Category + Pace */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="budgetCategory" className="mb-1 block text-sm font-medium text-slate-700">
              Budget Tier
            </label>
            <select
              id="budgetCategory"
              name="budgetCategory"
              value={formData.budgetCategory}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
            >
              <option value="low">Budget Friendly</option>
              <option value="medium">Mid Range</option>
              <option value="luxury">Luxury</option>
            </select>
          </div>
          <div>
            <label htmlFor="pace" className="mb-1 block text-sm font-medium text-slate-700">
              Travel Pace
            </label>
            <select
              id="pace"
              name="pace"
              value={formData.pace}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
            >
              <option value="relaxed">Relaxed (3 places/day)</option>
              <option value="moderate">Moderate (5 places/day)</option>
              <option value="packed">Packed (7 places/day)</option>
            </select>
          </div>
        </div>

        {/* Interests Multi-Select */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Interests <span className="text-xs text-slate-500">(select at least one)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => {
              const isSelected = formData.interests.includes(interest)
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition ${
                    isSelected
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-brand-500 hover:text-brand-600'
                  }`}
                >
                  {interest}
                </button>
              )
            })}
          </div>
        </div>

        {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-brand-600 px-6 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Generating Itinerary...' : 'Generate Itinerary'}
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
