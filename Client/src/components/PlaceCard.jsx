function PlaceCard({ place }) {
  const getCategoryBadgeColor = (category) => {
    const colors = {
      museum: 'bg-purple-100 text-purple-700',
      monument: 'bg-yellow-100 text-yellow-700',
      historic: 'bg-amber-100 text-amber-700',
      nature: 'bg-green-100 text-green-700',
      religious: 'bg-blue-100 text-blue-700',
      architecture: 'bg-indigo-100 text-indigo-700',
      restaurant: 'bg-rose-100 text-rose-700',
      park: 'bg-emerald-100 text-emerald-700',
      entertainment: 'bg-pink-100 text-pink-700',
      other: 'bg-gray-100 text-gray-700',
    };
    return colors[category] || colors.other;
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="flex-1 font-semibold text-slate-900">{place.name}</h3>
        {place.rating && (
          <div className="flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1">
            <span className="text-sm font-medium text-yellow-700">★ {place.rating}</span>
          </div>
        )}
      </div>

      <div className="mb-3">
        <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide ${getCategoryBadgeColor(place.category)}`}>
          {place.category}
        </span>
      </div>

      {place.description && (
        <p className="mb-3 line-clamp-2 text-sm text-slate-600">{place.description}</p>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 pt-2">
        <p className="text-xs text-slate-400">
          {place.lat?.toFixed(4)}, {place.lng?.toFixed(4)}
        </p>
        <a
          href={`https://www.google.com/maps/search/${encodeURIComponent(place.name)}/@${place.lat},${place.lng},15z`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          View Map
        </a>
      </div>
    </article>
  );
}

export default PlaceCard;
