import { Link } from 'react-router-dom'

const PACE_LABELS = { relaxed: 'Relaxed', moderate: 'Moderate', packed: 'Packed' }
const TIER_LABELS = { low: 'Budget', medium: 'Mid-Range', luxury: 'Luxury' }

function TripCard({ trip, onDelete }) {
  const placeCount = trip.itinerary?.reduce((sum, d) => sum + (d.places?.length || 0), 0) || 0

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <Link to={`/trip/${trip._id}`} className="block">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-900">{trip.city}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {trip.days} day{trip.days > 1 ? 's' : ''} · {PACE_LABELS[trip.pace] || 'Moderate'}
            </p>
          </div>
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            ₹{Number(trip.budget).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="mb-3 flex gap-3 text-xs text-slate-500">
          {trip.budgetCategory && (
            <span className="rounded bg-violet-50 px-2 py-0.5 font-medium text-violet-600">
              {TIER_LABELS[trip.budgetCategory] || trip.budgetCategory}
            </span>
          )}
          {placeCount > 0 && (
            <span className="rounded bg-blue-50 px-2 py-0.5 font-medium text-blue-600">
              {placeCount} places
            </span>
          )}
          {trip.optimizationInfo?.algorithm && (
            <span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-600">
              Route optimized
            </span>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {(trip.interests || []).length > 0 ? (
            trip.interests.slice(0, 4).map((interest) => (
              <span key={interest} className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium capitalize text-cyan-700">
                {interest}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-400">No interests</span>
          )}
          {(trip.interests || []).length > 4 && (
            <span className="text-xs text-slate-400">+{trip.interests.length - 4} more</span>
          )}
        </div>
      </Link>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-400">{new Date(trip.createdAt).toLocaleDateString()}</p>
        <div className="flex gap-2">
          <Link
            to={`/trip/${trip._id}`}
            className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-100"
          >
            View
          </Link>
          <button
            type="button"
            onClick={() => onDelete(trip._id)}
            className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  )
}

export default TripCard
