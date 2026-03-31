import { getStarFillLevels } from '../utils/travel'

function StarRating({ rating, size = 'text-sm', className = '' }) {
  const fillLevels = getStarFillLevels(rating)

  return (
    <span
      className={`inline-flex items-center gap-[1px] leading-none ${size} ${className}`.trim()}
      aria-label={`${Number(rating || 0).toFixed(1)} out of 5 stars`}
    >
      {fillLevels.map((fill, index) => (
        <span key={`${index}-${fill}`} className="relative inline-block text-[#dadce0]">
          <span aria-hidden="true">★</span>
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 overflow-hidden text-[#fbbc04]"
            style={{ width: `${fill}%` }}
          >
            ★
          </span>
        </span>
      ))}
    </span>
  )
}

export default StarRating
