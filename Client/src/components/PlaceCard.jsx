function PlaceCard({ place }) {
  const getTypeBadgeColor = (type) => {
    const colors = {
      tourist_attraction: 'bg-purple-100 text-purple-700',
      museum: 'bg-indigo-100 text-indigo-700',
      park: 'bg-emerald-100 text-emerald-700',
      beach: 'bg-cyan-100 text-cyan-700',
      church: 'bg-blue-100 text-blue-700',
      temple: 'bg-orange-100 text-orange-700',
      restaurant: 'bg-rose-100 text-rose-700',
      art_gallery: 'bg-pink-100 text-pink-700',
      zoo: 'bg-green-100 text-green-700',
      campground: 'bg-lime-100 text-lime-700',
      point_of_interest: 'bg-slate-100 text-slate-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  // Get primary type (first relevant type from the types array)
  const getPrimaryType = () => {
    if (!place.types || place.types.length === 0) return 'place';
    
    const relevantTypes = [
      'tourist_attraction',
      'museum',
      'park',
      'beach',
      'church',
      'temple',
      'restaurant',
      'art_gallery',
      'zoo',
      'campground',
    ];
    
    const primaryType = place.types.find(type => relevantTypes.includes(type));
    return primaryType || place.types[0];
  };

  const primaryType = getPrimaryType();

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="flex-1 font-semibold text-slate-900">{place.name}</h3>
        {place.rating && place.rating > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1">
            <span className="text-sm font-medium text-yellow-700">★ {place.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-1">
        <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide ${getTypeBadgeColor(primaryType)}`}>
          {primaryType.replace(/_/g, ' ')}
        </span>
        {place.user_ratings_total > 0 && (
          <span className="inline-block rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
            {place.user_ratings_total} reviews
          </span>
        )}
      </div>

      {place.description && (
        <p className="mb-3 line-clamp-2 text-sm text-slate-600">{place.description}</p>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 pt-2">
        <p className="text-xs text-slate-400">
          {place.lat?.toFixed(4)}, {place.lng?.toFixed(4)}
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}&query_place_id=${place.place_id}`}
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
