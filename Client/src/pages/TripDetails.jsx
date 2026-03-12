import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PlaceCard from '../components/PlaceCard'
import api from '../services/api'

function TripDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [trip, setTrip] = useState(null)
  const [places, setPlaces] = useState([])
  const [loadingTrip, setLoadingTrip] = useState(true)
  const [loadingPlaces, setLoadingPlaces] = useState(false)
  const [placesError, setPlacesError] = useState('')
  const [tripError, setTripError] = useState('')

  const fetchTrip = async () => {
    try {
      setLoadingTrip(true)
      setTripError('')
      const response = await api.get(`/trips/${id}`)
      setTrip(response.data.data)
    } catch (err) {
      setTripError(err.response?.data?.message || 'Failed to load trip details.')
    } finally {
      setLoadingTrip(false)
    }
  }

  const fetchPlaces = async () => {
    if (!trip?.city) return

    try {
      setLoadingPlaces(true)
      setPlacesError('')
      const response = await api.get(`/places/${trip.city}`)
      setPlaces(response.data.data || [])
    } catch (err) {
      setPlacesError(err.response?.data?.message || 'Failed to load places.')
    } finally {
      setLoadingPlaces(false)
    }
  }

  useEffect(() => {
    fetchTrip()
  }, [id])

  useEffect(() => {
    if (trip?.city && places.length === 0) {
      fetchPlaces()
    }
  }, [trip?.city])

  if (loadingTrip) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-600">Loading trip details...</p>
      </section>
    )
  }

  if (tripError) {
    return (
      <section>
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          ← Back to Dashboard
        </button>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700">{tripError}</p>
        </div>
      </section>
    )
  }

  if (!trip) {
    return (
      <section>
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          ← Back to Dashboard
        </button>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">Trip not found.</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-6 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
      >
        ← Back to Dashboard
      </button>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold text-slate-900">{trip.city}</h1>
        <p className="mt-1 text-slate-600">Your {trip.days}-day itinerary</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-600">Duration</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{trip.days}</p>
            <p className="text-xs text-slate-500">days</p>
          </div>

          <div className="rounded-lg bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">Budget</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">${trip.budget}</p>
          </div>

          <div className="rounded-lg bg-cyan-50 p-4">
            <p className="text-sm text-cyan-700">Interests</p>
            <p className="mt-1 text-sm font-semibold text-cyan-700">
              {trip.interests?.length > 0 ? trip.interests.join(', ') : 'None'}
            </p>
          </div>
        </div>

        {trip.description && (
          <div className="mt-6">
            <h3 className="font-semibold text-slate-900">Notes</h3>
            <p className="mt-2 text-slate-600">{trip.description}</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Recommended Places</h2>
          <button
            onClick={() => fetchPlaces()}
            disabled={loadingPlaces}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {loadingPlaces ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {placesError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{placesError}</p>
        ) : loadingPlaces ? (
          <p className="text-slate-600">Fetching attractions...</p>
        ) : places.length === 0 ? (
          <p className="text-slate-600">No places found. Try refreshing.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {places.map((place) => (
              <PlaceCard key={place._id || place.place_id} place={place} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default TripDetails
