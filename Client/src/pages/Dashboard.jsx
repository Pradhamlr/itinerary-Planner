import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TripCard from '../components/TripCard'
import api from '../services/api'

function Dashboard() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchTrips = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/trips')
      setTrips(response.data.data || [])
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to load trips.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTrip = async (tripId) => {
    try {
      await api.delete(`/trips/${tripId}`)
      setTrips((prev) => prev.filter((trip) => trip._id !== tripId))
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to delete trip.')
    }
  }

  useEffect(() => {
    fetchTrips()
  }, [])

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your Trips</h1>
          <p className="mt-1 text-slate-600">View, manage, and refine your travel itineraries.</p>
        </div>
        <Link
          to="/create-trip"
          className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Create Trip
        </Link>
      </div>

      {error ? <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">Loading trips...</div>
      ) : trips.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">No trips yet</h2>
          <p className="mt-1 text-sm text-slate-600">Create your first itinerary to get started.</p>
          <Link
            to="/create-trip"
            className="mt-4 inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Plan First Trip
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <TripCard key={trip._id} trip={trip} onDelete={handleDeleteTrip} />
          ))}
        </div>
      )}
    </section>
  )
}

export default Dashboard
