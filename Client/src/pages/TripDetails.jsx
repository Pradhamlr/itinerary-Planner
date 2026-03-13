import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'

const CATEGORY_COLORS = {
  museum: 'bg-purple-100 text-purple-700',
  monument: 'bg-amber-100 text-amber-700',
  historic: 'bg-orange-100 text-orange-700',
  nature: 'bg-green-100 text-green-700',
  park: 'bg-emerald-100 text-emerald-700',
  religious: 'bg-indigo-100 text-indigo-700',
  architecture: 'bg-sky-100 text-sky-700',
  restaurant: 'bg-rose-100 text-rose-700',
  entertainment: 'bg-pink-100 text-pink-700',
  interesting_places: 'bg-slate-100 text-slate-600',
}

function CostBreakdown({ cost }) {
  if (!cost) return null
  const { breakdown, totalEstimate, perDay, currency, budgetCategory } = cost

  const tierLabel = { low: 'Budget', medium: 'Mid-Range', luxury: 'Luxury' }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Cost Estimate</h2>
        <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 capitalize">
          {tierLabel[budgetCategory] || budgetCategory}
        </span>
      </div>

      <div className="space-y-3">
        {[
          { label: 'Accommodation', daily: breakdown.stay.daily, total: breakdown.stay.total, icon: '🏨' },
          { label: 'Food & Dining', daily: breakdown.food.daily, total: breakdown.food.total, icon: '🍽️' },
          { label: 'Transport', daily: breakdown.transport.daily, total: breakdown.transport.total, icon: '🚗' },
          { label: 'Entry Tickets', daily: breakdown.entryTickets.perPlace, total: breakdown.entryTickets.total, icon: '🎟️', perUnit: '/place' },
          { label: 'Miscellaneous', total: breakdown.miscellaneous, icon: '📦' },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span>{item.icon}</span>
              <span className="text-sm font-medium text-slate-700">{item.label}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-slate-900">
                {currency === 'INR' ? '₹' : '$'}{item.total.toLocaleString('en-IN')}
              </span>
              {item.daily != null && (
                <span className="ml-2 text-xs text-slate-500">
                  ({currency === 'INR' ? '₹' : '$'}{item.daily.toLocaleString('en-IN')}{item.perUnit || '/day'})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-600 px-4 py-3 text-white">
        <span className="font-semibold">Total Estimated Cost</span>
        <div className="text-right">
          <span className="text-xl font-bold">{currency === 'INR' ? '₹' : '$'}{totalEstimate.toLocaleString('en-IN')}</span>
          <span className="ml-2 text-sm opacity-80">({currency === 'INR' ? '₹' : '$'}{perDay.toLocaleString('en-IN')}/day)</span>
        </div>
      </div>
    </div>
  )
}

function DayTimeline({ itinerary }) {
  const [activeDay, setActiveDay] = useState(0)

  if (!itinerary || itinerary.length === 0) return null

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-slate-900">Day-wise Itinerary</h2>

      {/* Day tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {itinerary.map((dayData, idx) => (
          <button
            key={dayData.day}
            onClick={() => setActiveDay(idx)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeDay === idx
                ? 'bg-brand-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Day {dayData.day}
          </button>
        ))}
      </div>

      {/* Active day timeline */}
      {itinerary[activeDay] && (
        <div className="relative">
          {itinerary[activeDay].places.length === 0 ? (
            <div className="rounded-lg bg-slate-50 p-6 text-center">
              <p className="text-lg font-medium text-slate-600">Free Day!</p>
              <p className="mt-1 text-sm text-slate-500">Explore on your own or relax.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {itinerary[activeDay].places.map((place, idx) => (
                <div key={idx} className="relative flex gap-4 pb-6">
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                      {place.order || idx + 1}
                    </div>
                    {idx < itinerary[activeDay].places.length - 1 && (
                      <div className="w-0.5 flex-1 bg-brand-200" />
                    )}
                  </div>

                  {/* Place card */}
                  <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900">{place.name}</h4>
                        <span
                          className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                            CATEGORY_COLORS[place.category] || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {place.category}
                        </span>
                      </div>
                      {place.rating != null && place.rating > 0 && (
                        <span className="flex items-center gap-1 rounded-lg bg-yellow-50 px-2 py-1 text-sm font-medium text-yellow-700">
                          ★ {typeof place.rating === 'number' ? place.rating.toFixed(1) : place.rating}
                        </span>
                      )}
                    </div>
                    {place.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{place.description}</p>
                    )}
                    {place.lat != null && place.lng != null && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline"
                      >
                        View on Google Maps →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MapEmbed({ places, city }) {
  if (!places || places.length === 0) return null

  const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const [activeDay, setActiveDay] = useState(0)

  // Get places for the selected day (with valid coordinates)
  const dayPlaces = (places[activeDay]?.places || []).filter(
    (p) => p.lat != null && p.lng != null
  )
  // All places across all days (for the "all days" view)
  const allPlaces = places.flatMap((d) => d.places || []).filter(
    (p) => p.lat != null && p.lng != null
  )

  // Google Maps Embed API supports max 9 intermediate waypoints (11 total stops)
  const getEmbedUrl = (routePlaces) => {
    if (!GMAPS_KEY || routePlaces.length < 2) return null
    const capped = routePlaces.slice(0, 11) // max 11 stops (origin + 9 waypoints + destination)
    const origin = `${capped[0].lat},${capped[0].lng}`
    const destination = `${capped[capped.length - 1].lat},${capped[capped.length - 1].lng}`
    const waypoints = capped
      .slice(1, -1)
      .map((p) => `${p.lat},${p.lng}`)
      .join('|')
    let url = `https://www.google.com/maps/embed/v1/directions?key=${GMAPS_KEY}&origin=${origin}&destination=${destination}&mode=driving`
    if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`
    return url
  }

  const getDirectionsUrl = (routePlaces) => {
    if (routePlaces.length < 2) return null
    const origin = `${routePlaces[0].lat},${routePlaces[0].lng}`
    const destination = `${routePlaces[routePlaces.length - 1].lat},${routePlaces[routePlaces.length - 1].lng}`
    const waypoints = routePlaces
      .slice(1, -1)
      .map((p) => `${p.lat},${p.lng}`)
      .join('|')
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`
    if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`
    url += '&travelmode=driving'
    return url
  }

  // Show per-day route or all-days route
  const currentPlaces = activeDay < places.length ? dayPlaces : allPlaces
  const embedUrl = getEmbedUrl(currentPlaces)
  const directionsUrl = getDirectionsUrl(currentPlaces)

  if (allPlaces.length === 0) return null

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Optimized Route Map</h2>
        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Open in Google Maps ↗
          </a>
        )}
      </div>

      {/* Day selector tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {places.map((dayData, idx) => (
          <button
            key={idx}
            onClick={() => setActiveDay(idx)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              activeDay === idx
                ? 'bg-brand-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Day {dayData.day}
          </button>
        ))}
        <button
          onClick={() => setActiveDay(places.length)}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            activeDay === places.length
              ? 'bg-brand-600 text-white shadow'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Days
        </button>
      </div>

      <div className="overflow-hidden rounded-xl">
        {embedUrl ? (
          <iframe
            title={`Route Map — ${city}`}
            src={embedUrl}
            width="100%"
            height="450"
            className="border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="flex h-[300px] items-center justify-center bg-slate-100 text-sm text-slate-500">
            {!GMAPS_KEY ? 'Google Maps API key not configured.' : 'Select a day with at least 2 places to see the route.'}
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {currentPlaces.map((p, i) => (
          <a
            key={i}
            href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
              {i + 1}
            </span>
            {p.name?.length > 25 ? p.name.slice(0, 25) + '...' : p.name}
          </a>
        ))}
      </div>
    </div>
  )
}

function RestaurantList({ restaurants }) {
  if (!restaurants || restaurants.length === 0) return null

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-slate-900">🍽️ Restaurant Suggestions</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {restaurants.map((r, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">{r.name}</h4>
              {r.category && (
                <span className="text-xs text-slate-500 capitalize">{r.category}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {r.rating > 0 && (
                <span className="text-xs font-medium text-yellow-600">★ {r.rating}</span>
              )}
              {r.lat != null && r.lng != null && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  Map
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TripDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [regenerating, setRegenerating] = useState(false)

  const fetchTrip = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get(`/trips/${id}`)
      setTrip(response.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load trip details.')
    } finally {
      setLoading(false)
    }
  }

  const regenerateItinerary = async () => {
    if (!trip) return
    try {
      setRegenerating(true)
      const response = await api.post('/itinerary/generate', {
        city: trip.city,
        days: trip.days,
        budget: trip.budget,
        interests: trip.interests,
        pace: trip.pace || 'moderate',
        budgetCategory: trip.budgetCategory || 'medium',
      })
      const gen = response.data.data

      // Update trip with new itinerary
      await api.put(`/trips/${id}`, {
        itinerary: gen.itinerary,
        restaurants: gen.restaurants,
        estimatedCost: gen.estimatedCost,
        optimizationInfo: gen.optimizationInfo,
      })

      await fetchTrip()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to regenerate itinerary.')
    } finally {
      setRegenerating(false)
    }
  }

  useEffect(() => {
    fetchTrip()
  }, [id])

  if (loading) {
    return (
      <section className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          <p className="text-slate-600">Loading trip details...</p>
        </div>
      </section>
    )
  }

  if (error && !trip) {
    return (
      <section>
        <button onClick={() => navigate('/dashboard')} className="mb-4 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
          ← Back to Dashboard
        </button>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700">{error}</p>
        </div>
      </section>
    )
  }

  if (!trip) return null

  const paceLabels = { relaxed: 'Relaxed', moderate: 'Moderate', packed: 'Packed' }
  const tierLabels = { low: 'Budget', medium: 'Mid-Range', luxury: 'Luxury' }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button onClick={() => navigate('/dashboard')} className="w-fit rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
          ← Back to Dashboard
        </button>
        <button
          onClick={regenerateItinerary}
          disabled={regenerating}
          className="w-fit rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {regenerating ? 'Regenerating...' : '🔄 Regenerate Itinerary'}
        </button>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      {/* Trip Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold text-slate-900">{trip.city}</h1>
        <p className="mt-1 text-slate-600">
          {trip.days}-day {paceLabels[trip.pace] || 'moderate'} trip
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-xs text-slate-500">Duration</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{trip.days}</p>
            <p className="text-xs text-slate-500">days</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4 text-center">
            <p className="text-xs text-emerald-600">Budget</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">₹{Number(trip.budget).toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded-lg bg-cyan-50 p-4 text-center">
            <p className="text-xs text-cyan-600">Pace</p>
            <p className="mt-1 text-lg font-bold text-cyan-700">{paceLabels[trip.pace] || 'Moderate'}</p>
          </div>
          <div className="rounded-lg bg-violet-50 p-4 text-center">
            <p className="text-xs text-violet-600">Tier</p>
            <p className="mt-1 text-lg font-bold text-violet-700">{tierLabels[trip.budgetCategory] || 'Mid-Range'}</p>
          </div>
        </div>

        {trip.interests?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {trip.interests.map((i) => (
              <span key={i} className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 capitalize">
                {i}
              </span>
            ))}
          </div>
        )}

        {trip.optimizationInfo?.algorithm && (
          <div className="mt-4 space-y-2">
            <div className="rounded-lg bg-violet-50 border border-violet-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-600 text-xs font-bold text-white">ML</span>
                <span className="text-sm font-bold text-violet-800">Powered by Trained ML Model</span>
              </div>
              <p className="mt-1 text-xs text-violet-600">
                Places recommended using <span className="font-semibold">TF-IDF Content-Based Filtering</span> with Cosine Similarity (scikit-learn)
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
              Route optimized using <span className="font-semibold">{trip.optimizationInfo.algorithm}</span>
              {trip.optimizationInfo.algorithm === 'dynamic-programming' && ' (Held-Karp TSP)'}
              {trip.optimizationInfo.algorithm === 'nearest-neighbor' && ' (Greedy Heuristic)'}
              {trip.optimizationInfo.totalDistance > 0 && (
                <> — Total distance: <span className="font-semibold">{trip.optimizationInfo.totalDistance} km</span></>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Day-wise Itinerary Timeline */}
      <DayTimeline itinerary={trip.itinerary} />

      {/* Map */}
      <MapEmbed places={trip.itinerary} city={trip.city} />

      {/* Cost Breakdown */}
      <CostBreakdown cost={trip.estimatedCost} />

      {/* Restaurant Suggestions */}
      <RestaurantList restaurants={trip.restaurants} />
    </section>
  )
}

export default TripDetails
