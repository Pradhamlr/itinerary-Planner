import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TripCard from '../components/TripCard'
import api from '../services/api'

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-[28px] bg-brand-surfaceLow shadow-soft">
          <div className="h-44 animate-pulse bg-[#ddd7be]" />
          <div className="space-y-4 p-5">
            <div className="h-5 w-2/3 animate-pulse rounded-full bg-[#ddd7be]" />
            <div className="h-4 w-1/2 animate-pulse rounded-full bg-[#ddd7be]" />
            <div className="flex gap-2">
              <div className="h-8 w-20 animate-pulse rounded-full bg-[#ddd7be]" />
              <div className="h-8 w-24 animate-pulse rounded-full bg-[#ddd7be]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

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
    <section className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="hero-panel">
          <div className="p-8 sm:p-10">
            <p className="field-label text-[#f7d9b8]">Smart Itinerary Planner</p>
            <h1 className="editorial-title mt-4 max-w-2xl text-4xl font-semibold sm:text-5xl">
              Curate a Kerala journey that feels like a modern heirloom.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#f5e9d7] sm:text-base">
              Build trips, align your interests, and generate recommendation-ready routes that balance iconic landmarks with meaningful discoveries.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/create-trip"
                className="btn-secondary"
              >
                Create a new trip
              </Link>
              <button
                type="button"
                onClick={fetchTrips}
                className="btn-ghost border border-white/10 text-[#fefae0] hover:text-white"
              >
                Refresh dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="surface-card p-6">
            <p className="text-sm text-[#6d6a51]">Trips saved</p>
            <p className="editorial-title mt-3 text-4xl font-semibold text-brand-palm">{trips.length}</p>
            <p className="mt-2 text-sm text-[#6d6a51]">Your active travel ideas in one place.</p>
          </div>
          <div className="surface-card p-6">
            <p className="text-sm text-[#6d6a51]">Recommendation ready</p>
            <p className="editorial-title mt-3 text-4xl font-semibold text-brand-palm">{trips.filter((trip) => trip.interests?.length).length}</p>
            <p className="mt-2 text-sm text-[#6d6a51]">Trips already primed with interests for smart scoring.</p>
          </div>
          <div className="surface-card p-6">
            <p className="text-sm text-[#6d6a51]">Next move</p>
            <p className="mt-3 text-xl font-semibold text-brand-palm">Open a trip and generate ranked places.</p>
            <p className="mt-2 text-sm text-[#6d6a51]">Each itinerary now supports ML-powered suggestions.</p>
          </div>
        </div>
      </div>

      {error ? <p className="rounded-2xl bg-[#f5ddd8] px-4 py-3 text-sm text-[#8a3022]">{error}</p> : null}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="editorial-title text-3xl font-semibold text-brand-palm">Your Trips</h2>
          <p className="mt-1 text-[#6d6a51]">Track budgets, interests, and recommendation-ready itineraries.</p>
        </div>
        <Link
          to="/create-trip"
          className="btn-secondary"
        >
          Plan another destination
        </Link>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : trips.length === 0 ? (
        <div className="rounded-[30px] bg-brand-surfaceLow p-10 text-center shadow-soft">
          <h3 className="editorial-title text-3xl font-semibold text-brand-palm">No trips yet</h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#6d6a51]">
            Start with one destination, a trip length, and a few interests. The recommendation engine will take it from there.
          </p>
          <Link
            to="/create-trip"
            className="btn-primary mt-6"
          >
            Create your first trip
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {trips.map((trip) => (
            <TripCard key={trip._id} trip={trip} onDelete={handleDeleteTrip} />
          ))}
        </div>
      )}
    </section>
  )
}

export default Dashboard
