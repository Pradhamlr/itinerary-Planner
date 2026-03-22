import { Link } from 'react-router-dom'
import { formatCurrency, getCityGradient, getInterestMeta } from '../utils/travel'

function TripCard({ trip, onDelete }) {
  const interests = trip.interests || []
  const gradient = getCityGradient(trip.city)

  return (
    <article className="group overflow-hidden rounded-[28px] bg-brand-surfaceLow shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-ambient">
      <div className={`relative h-44 bg-gradient-to-br ${gradient}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(29,28,13,0.24),transparent_45%)]" />
        <div className="relative flex h-full flex-col justify-between p-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="field-label text-[#f7d9b8]">Smart Trip</p>
              <h3 className="editorial-title mt-2 text-3xl font-semibold">{trip.city}</h3>
            </div>
            <div className="rounded-full bg-white/16 px-3 py-1 text-sm font-semibold backdrop-blur">
              {formatCurrency(trip.budget)}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-white/90">
            <span>{trip.days} day{trip.days > 1 ? 's' : ''}</span>
            <span>{new Date(trip.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="flex min-h-[52px] flex-wrap gap-2">
          {interests.length > 0 ? (
            interests.slice(0, 4).map((interest) => {
              const meta = getInterestMeta(interest)
              return (
                <span
                  key={interest}
                  className={`inline-flex items-center rounded-full px-3 py-1.5 leading-none text-[11px] font-semibold uppercase tracking-[0.18em] ${meta.accent}`}
                >
                  {meta.label}
                </span>
              )
            })
          ) : (
            <span className="text-sm text-[#6d6a51]">No interests added yet</span>
          )}
          {interests.length > 4 ? (
            <span className="inline-flex items-center rounded-full bg-[#e7e3ca] px-3 py-1.5 leading-none text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6d6a51]">
              +{interests.length - 4} more
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-[#efe8cd] p-3">
            <p className="text-[#6d6a51]">Trip pace</p>
            <p className="mt-1 font-semibold text-brand-palm">
              {trip.days >= 6 ? 'Slow travel' : trip.days >= 3 ? 'Balanced' : 'Quick escape'}
            </p>
          </div>
          <div className="rounded-2xl bg-[#efe8cd] p-3">
            <p className="text-[#6d6a51]">Focus</p>
            <p className="mt-1 font-semibold text-brand-palm">
              {interests[0] ? getInterestMeta(interests[0]).label : 'Flexible'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <Link
            to={`/trip/${trip._id}`}
            className="btn-primary px-4 py-2"
          >
            Open itinerary
          </Link>
          <button
            type="button"
            onClick={() => onDelete(trip._id)}
            className="rounded-xl bg-[#f5ddd8] px-4 py-2 text-sm font-semibold text-[#8a3022] transition hover:bg-[#f2d0c8]"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  )
}

export default TripCard
