import { useState } from 'react'
import api from '../services/api'

const SAMPLE_PLACES = ['India Gate, Delhi', 'Red Fort, Delhi', 'Qutub Minar, Delhi', 'Lotus Temple, Delhi']
const SAMPLE_START = 'Connaught Place, Delhi'

const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

function RouteOptimizer() {
  const [startPoint, setStartPoint] = useState('')
  const [places, setPlaces] = useState(['', ''])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updatePlace = (index, value) => {
    setPlaces((prev) => {
      const updated = [...prev]
      updated[index] = value
      return updated
    })
  }

  const addPlace = () => {
    if (places.length < 15) setPlaces((prev) => [...prev, ''])
  }

  const removePlace = (index) => {
    if (places.length > 2) setPlaces((prev) => prev.filter((_, i) => i !== index))
  }

  const loadSample = () => {
    setStartPoint(SAMPLE_START)
    setPlaces([...SAMPLE_PLACES])
    setResult(null)
    setError('')
  }

  const optimizeRoute = async () => {
    setError('')
    setResult(null)

    const validPlaces = places.map((p) => p.trim()).filter(Boolean)

    if (validPlaces.length < 2) {
      setError('Enter at least 2 place names.')
      return
    }

    // Prepend starting point if provided
    const allPlaces = startPoint.trim()
      ? [{ name: startPoint.trim() }, ...validPlaces.map((name) => ({ name }))]
      : validPlaces.map((name) => ({ name }))

    setLoading(true)
    try {
      const res = await api.post('/ml/optimize-route', {
        places: allPlaces,
        startIndex: startPoint.trim() ? 0 : undefined,
      })
      setResult(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Optimization failed. Check place names and try again.')
    } finally {
      setLoading(false)
    }
  }

  const getGoogleMapsDirectionsUrl = () => {
    if (!result?.orderedPlaces || result.orderedPlaces.length < 2) return null
    const ordered = result.orderedPlaces
    const origin = `${ordered[0].lat},${ordered[0].lng}`
    const destination = `${ordered[ordered.length - 1].lat},${ordered[ordered.length - 1].lng}`
    const waypoints = ordered
      .slice(1, -1)
      .map((p) => `${p.lat},${p.lng}`)
      .join('|')
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`
    if (waypoints) url += `&waypoints=${waypoints}`
    url += '&travelmode=driving'
    return url
  }

  const getEmbedMapUrl = () => {
    if (!result?.orderedPlaces || result.orderedPlaces.length < 2 || !GMAPS_KEY) return null
    const ordered = result.orderedPlaces
    const origin = `${ordered[0].lat},${ordered[0].lng}`
    const destination = `${ordered[ordered.length - 1].lat},${ordered[ordered.length - 1].lng}`
    const waypoints = ordered
      .slice(1, -1)
      .map((p) => `${p.lat},${p.lng}`)
      .join('|')
    let url = `https://www.google.com/maps/embed/v1/directions?key=${GMAPS_KEY}&origin=${origin}&destination=${destination}&mode=driving`
    if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`
    return url
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-600 via-cyan-600 to-teal-600 p-8 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl">🗺️</span>
          <div>
            <h1 className="text-3xl font-extrabold">Route Optimizer</h1>
            <p className="mt-1 text-cyan-100">
              Enter place names and find the optimal route using TSP. Coordinates are fetched automatically via Google Maps.
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Enter Places</h2>
          <button
            onClick={loadSample}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
          >
            Load Sample (Delhi)
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500">Just type the place name — we'll find the coordinates for you.</p>

        {/* Starting Point */}
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">📍 Starting Point (optional)</label>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
              S
            </div>
            <input
              type="text"
              placeholder="Your starting location (e.g. Connaught Place, Delhi)"
              value={startPoint}
              onChange={(e) => setStartPoint(e.target.value)}
              className="flex-1 rounded-lg border border-emerald-300 bg-emerald-50/50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Places to Visit */}
        <label className="mb-1.5 mt-4 block text-sm font-medium text-slate-700">🗺️ Places to Visit</label>
        <div className="space-y-3">
          {places.map((place, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {String.fromCharCode(65 + idx)}
              </div>
              <input
                type="text"
                placeholder={`Place ${idx + 1} (e.g. India Gate, Delhi)`}
                value={place}
                onChange={(e) => updatePlace(idx, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && optimizeRoute()}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              {places.length > 2 && (
                <button
                  onClick={() => removePlace(idx)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm text-red-600 transition hover:bg-red-200"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-3">
          {places.length < 15 && (
            <button
              onClick={addPlace}
              className="rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-400 hover:text-brand-600"
            >
              + Add Place
            </button>
          )}
          <button
            onClick={optimizeRoute}
            disabled={loading}
            className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? 'Geocoding & Optimizing...' : '🔀 Find Optimal Route'}
          </button>
        </div>

        {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Google Maps Embed showing optimized route */}
          {getEmbedMapUrl() && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">📍 Optimized Route on Map</h2>
                {getGoogleMapsDirectionsUrl() && (
                  <a
                    href={getGoogleMapsDirectionsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Open in Google Maps ↗
                  </a>
                )}
              </div>
              <div className="mt-4 overflow-hidden rounded-xl">
                <iframe
                  title="Optimized Route Map"
                  src={getEmbedMapUrl()}
                  width="100%"
                  height="450"
                  className="border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          )}

          {/* Algorithm Info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-lg">⚙️</span>
              <h2 className="text-lg font-bold text-slate-900">Algorithm Details</h2>
              <span className="ml-auto rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                TSP — {result.algorithmDetails?.name}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-xs text-slate-500">Algorithm</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{result.algorithmDetails?.name}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-xs text-slate-500">Complexity</p>
                <p className="mt-1 font-mono text-sm font-bold text-slate-900">{result.algorithmDetails?.complexity}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 text-center">
                <p className="text-xs text-emerald-600">Total Distance</p>
                <p className="mt-1 text-xl font-bold text-emerald-700">{result.totalDistance} km</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <p className="text-xs text-blue-600">Optimal</p>
                <p className="mt-1 text-lg font-bold text-blue-700">{result.algorithmDetails?.optimal ? 'Yes ✓' : 'Heuristic'}</p>
              </div>
            </div>
          </div>

          {/* Optimized Route */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Optimized Visit Order</h2>

            <div className="mt-4 space-y-0">
              {result.orderedPlaces?.map((place, idx) => (
                <div key={idx} className="relative flex gap-4 pb-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                      {idx + 1}
                    </div>
                    {idx < result.orderedPlaces.length - 1 && (
                      <div className="w-0.5 flex-1 bg-brand-200" />
                    )}
                  </div>
                  <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="font-semibold text-slate-900">{place.name}</h4>
                    {result.geocodedPlaces?.[result.visitOrder[idx]]?.formattedAddress && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {result.geocodedPlaces[result.visitOrder[idx]].formattedAddress}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      📍 {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                    </p>
                    {idx < result.orderedPlaces.length - 1 && result.distanceMatrix && (
                      <p className="mt-1 text-xs font-medium text-brand-600">
                        → {result.distanceMatrix[result.visitOrder[idx]][result.visitOrder[idx + 1]].toFixed(2)} km to next stop
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Distance Matrix */}
          {result.distanceMatrix && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Distance Matrix (km)</h2>
              <p className="mt-1 text-sm text-slate-500">Haversine distances between all place pairs</p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="rounded-tl-lg bg-slate-100 px-3 py-2 text-left text-xs font-bold text-slate-600"></th>
                      {result.geocodedPlaces?.map((p, i) => (
                        <th key={i} className="max-w-[80px] truncate bg-slate-100 px-3 py-2 text-center text-xs font-bold text-slate-600">
                          {p.name.slice(0, 12)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.distanceMatrix.map((row, i) => (
                      <tr key={i}>
                        <td className="max-w-[80px] truncate bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                          {result.geocodedPlaces?.[i]?.name.slice(0, 12)}
                        </td>
                        {row.map((dist, j) => (
                          <td key={j} className={`px-3 py-2 text-center font-mono text-xs ${
                            i === j ? 'bg-slate-200 text-slate-400' : 'text-slate-700'
                          }`}>
                            {i === j ? '—' : dist.toFixed(1)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default RouteOptimizer
