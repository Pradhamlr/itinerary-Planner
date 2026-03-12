import { Link } from 'react-router-dom'

function TripCard({ trip, onDelete }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-4">
        <Link to={`/trip/${trip._id}`} className="flex-1">
          <h3 className="text-xl font-semibold text-slate-900">{trip.city}</h3>
          <p className="mt-1 text-sm text-slate-500">{trip.days} day{trip.days > 1 ? 's' : ''}</p>
        </Link>
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">${trip.budget}</div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(trip.interests || []).length > 0 ? (
          trip.interests.map((interest) => (
            <span key={interest} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-cyan-700">
              {interest}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-500">No interests added</span>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-400">Created: {new Date(trip.createdAt).toLocaleDateString()}</p>
        <button
          type="button"
          onClick={() => onDelete(trip._id)}
          className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
        >
          Delete
        </button>
      </div>
    </article>
  )
}

export default TripCard
