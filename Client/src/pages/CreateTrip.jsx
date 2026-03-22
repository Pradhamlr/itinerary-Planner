import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LocationAutocomplete from '../components/LocationAutocomplete'
import api from '../services/api'
import { INTEREST_OPTIONS, formatCurrency, getInterestMeta } from '../utils/travel'

function CreateTrip() {
  const [formData, setFormData] = useState({
    city: '',
    days: '',
    budget: '',
    startDate: '',
    interests: [],
    hotelLocation: null,
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
        ? prev.interests.filter((item) => item !== interest)
        : [...prev.interests, interest],
    }))
  }

  const handleLocationSelect = (location) => {
    setFormData((prev) => ({
      ...prev,
      hotelLocation: location,
    }))
  }

  const clearLocation = () => {
    setFormData((prev) => ({
      ...prev,
      hotelLocation: null,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const parsedDays = Number(formData.days)
    const parsedBudget = Number(formData.budget)

    if (!formData.city.trim()) {
      setError('Please choose a destination city.')
      return
    }

    if (!Number.isInteger(parsedDays) || parsedDays <= 0) {
      setError('Trip duration must be at least 1 day.')
      return
    }

    if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
      setError('Budget must be a valid non-negative number.')
      return
    }

    if (formData.hotelLocation) {
      if (
        !Number.isFinite(Number(formData.hotelLocation.lat))
        || !Number.isFinite(Number(formData.hotelLocation.lng))
      ) {
        setError('Please select a valid hotel or start location from search.')
        return
      }
    }

    const payload = {
      city: formData.city.trim(),
      days: parsedDays,
      budget: parsedBudget,
      startDate: formData.startDate || undefined,
      interests: formData.interests,
      hotelLocation: formData.hotelLocation
        ? {
            name: formData.hotelLocation.name,
            place_id: formData.hotelLocation.place_id,
            lat: Number(formData.hotelLocation.lat),
            lng: Number(formData.hotelLocation.lng),
          }
        : undefined,
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
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="hero-panel">
        <div className="h-full p-8 sm:p-10">
          <p className="field-label text-[#f7d9b8]">New itinerary</p>
          <h1 className="editorial-title mt-4 text-4xl font-semibold">Shape a trip the recommendation engine can personalize.</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-[#f5e9d7]">
            Add your destination, trip length, budget, and interests. We'll use that profile to rank places more intelligently in the next step.
          </p>

          <div className="mt-8 space-y-3 rounded-[26px] bg-white/8 p-5 backdrop-blur">
            <div>
              <p className="text-sm text-[#f5e9d7]">Budget preview</p>
              <p className="mt-2 text-3xl font-semibold">
                {formData.budget ? formatCurrency(formData.budget) : '$0'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-[#f5e9d7]">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-[#f5e9d7]">Duration</p>
                <p className="mt-1 font-semibold">{formData.days || 0} day plan</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-[#f5e9d7]">Start date</p>
                <p className="mt-1 font-semibold">{formData.startDate || 'Flexible dates'}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 text-sm text-[#f5e9d7]">
              <p className="text-[#f5e9d7]">Start location</p>
              <p className="mt-1 font-semibold">
                {formData.hotelLocation?.name ? 'Hotel routing enabled' : 'Start from top attraction'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="surface-card p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="editorial-title text-4xl font-semibold text-brand-palm">Create a smart trip</h2>
          <p className="mt-2 text-sm leading-7 text-[#6d6a51]">
            The more precisely you describe your trip, the better your recommendation results will feel.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="city" className="field-label mb-1 block">
              Destination
            </label>
            <input
              id="city"
              name="city"
              type="text"
              placeholder="Kochi"
              value={formData.city}
              onChange={handleChange}
              required
              className="input-minimal"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="days" className="field-label mb-1 block">
                Number of days
              </label>
              <input
                id="days"
                name="days"
                type="number"
                min="1"
                value={formData.days}
                onChange={handleChange}
                required
                className="input-minimal"
              />
            </div>

            <div>
              <label htmlFor="budget" className="field-label mb-1 block">
                Budget
              </label>
              <input
                id="budget"
                name="budget"
                type="number"
                min="0"
                step="1"
                value={formData.budget}
                onChange={handleChange}
                required
                className="input-minimal"
              />
            </div>

            <div>
              <label htmlFor="startDate" className="field-label mb-1 block">
                Trip start date
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                className="input-minimal"
              />
            </div>
          </div>

          <div>
            <div className="mb-3">
              <label className="field-label block">Hotel / start location</label>
              <p className="mt-1 text-sm text-[#6d6a51]">
                Optional. Search for your hotel, stay, or preferred starting point instead of entering coordinates manually.
              </p>
            </div>
            <LocationAutocomplete
              city={formData.city}
              value={formData.hotelLocation}
              onSelect={handleLocationSelect}
              onClear={clearLocation}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="field-label block">Interests</label>
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-[#8b886f]">Choose 2 to 4</span>
            </div>

            <div className="flex flex-wrap gap-3">
              {INTEREST_OPTIONS.map((interest) => {
                const selected = formData.interests.includes(interest.value)
                return (
                  <button
                    key={interest.value}
                    type="button"
                    onClick={() => toggleInterest(interest.value)}
                    data-selected={selected}
                    className={`chip-token ${selected ? '' : interest.accent}`}
                  >
                    {interest.label}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex min-h-[38px] flex-wrap gap-2">
              {formData.interests.length > 0 ? (
                formData.interests.map((interest) => {
                  const meta = getInterestMeta(interest)
                  return (
                    <span key={interest} className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${meta.accent}`}>
                      {meta.label}
                    </span>
                  )
                })
              ) : (
                <p className="text-sm text-[#6d6a51]">No interests selected yet.</p>
              )}
            </div>
          </div>

          {error ? <p className="rounded-2xl bg-[#f5ddd8] px-4 py-3 text-sm text-[#8a3022]">{error}</p> : null}

          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating itinerary...' : 'Create smart trip'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-ghost"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default CreateTrip
