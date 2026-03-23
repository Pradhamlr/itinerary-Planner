import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ItineraryPanel, RecommendationsPanel } from '../components/TripDetailsPanels'
import api from '../services/api'
import { formatCurrency, getCityGradient, getInterestMeta } from '../utils/travel'

function formatTripDate(value) {
  if (!value) {
    return 'Flexible dates'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Flexible dates'
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
  }).format(date)
}

function parseDurationToMinutes(durationText) {
  if (!durationText || typeof durationText !== 'string') {
    return 0
  }

  const hourMatch = durationText.match(/(\d+)\s*hr/)
  const minuteMatch = durationText.match(/(\d+)\s*mins?/)
  const hours = hourMatch ? Number(hourMatch[1]) : 0
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0
  return (hours * 60) + minutes
}

function normalizeItineraryDays(days) {
  return (days || []).map((day) => {
    if (day?.route_stats) {
      return day
    }

    const route = day?.route || []
    const mealSuggestions = day?.meal_suggestions || []
    const travelMinutes = route.reduce((sum, place) => (
      sum
      + parseDurationToMinutes(place.travel_time_from_start)
      + parseDurationToMinutes(place.travel_time_to_next)
      + parseDurationToMinutes(place.return_travel_time_to_start)
    ), 0)
    const visitMinutes = route.reduce((sum, place) => sum + Number(place.visit_duration_minutes || 0), 0)
    const mealBreakMinutes = mealSuggestions.reduce((sum, meal) => (
      sum + (meal.type === 'Dinner' ? 75 : 60)
    ), 0)

    return {
      ...day,
      route_stats: {
        stop_count: route.length,
        total_travel_minutes: travelMinutes,
        total_visit_minutes: visitMinutes,
        meal_break_minutes: mealBreakMinutes,
        total_day_minutes: travelMinutes + visitMinutes + mealBreakMinutes,
        over_travel_limit: false,
        over_total_limit: false,
      },
    }
  })
}

function TripDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [trip, setTrip] = useState(null)
  const [attractions, setAttractions] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [metadata, setMetadata] = useState(null)
  const [itineraryDays, setItineraryDays] = useState([])
  const [itineraryRestaurants, setItineraryRestaurants] = useState([])
  const [itineraryMetadata, setItineraryMetadata] = useState(null)
  const [recommendationsGeneratedAt, setRecommendationsGeneratedAt] = useState('')
  const [itineraryGeneratedAt, setItineraryGeneratedAt] = useState('')
  const [finalizedItineraryGeneratedAt, setFinalizedItineraryGeneratedAt] = useState('')
  const [loadingTrip, setLoadingTrip] = useState(true)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [loadingItinerary, setLoadingItinerary] = useState(false)
  const [savingFinalizedItinerary, setSavingFinalizedItinerary] = useState(false)
  const [recommendationsGenerated, setRecommendationsGenerated] = useState(false)
  const [itineraryGenerated, setItineraryGenerated] = useState(false)
  const [recommendationsError, setRecommendationsError] = useState('')
  const [itineraryError, setItineraryError] = useState('')
  const [tripError, setTripError] = useState('')
  const [recommendationsFromSnapshot, setRecommendationsFromSnapshot] = useState(false)
  const [itineraryFromSnapshot, setItineraryFromSnapshot] = useState(false)
  const [itineraryActionDay, setItineraryActionDay] = useState(null)
  const [swapState, setSwapState] = useState({
    open: false,
    dayNumber: null,
    place: null,
    suggestions: [],
    loading: false,
    applyingPlaceId: '',
  })

  const hydrateSavedPlans = (tripData) => {
    const recommendationSnapshot = tripData?.recommendationSnapshot
    const itinerarySnapshot = tripData?.itinerarySnapshot
    const finalizedItinerarySnapshot = tripData?.finalizedItinerarySnapshot

    if (recommendationSnapshot) {
      setAttractions(recommendationSnapshot.attractions || [])
      setRestaurants(recommendationSnapshot.restaurants || [])
      setMetadata(recommendationSnapshot.metadata || null)
      setRecommendationsGenerated(Boolean(
        (recommendationSnapshot.attractions || []).length || (recommendationSnapshot.restaurants || []).length,
      ))
      setRecommendationsGeneratedAt(recommendationSnapshot.generatedAt || '')
      setRecommendationsFromSnapshot(true)
    } else {
      setAttractions([])
      setRestaurants([])
      setMetadata(null)
      setRecommendationsGenerated(false)
      setRecommendationsGeneratedAt('')
      setRecommendationsFromSnapshot(false)
    }

    if (itinerarySnapshot) {
      setItineraryDays(normalizeItineraryDays(itinerarySnapshot.itinerary || []))
      setItineraryRestaurants(itinerarySnapshot.restaurants || [])
      setItineraryMetadata(itinerarySnapshot.metadata || null)
      setItineraryGenerated(Boolean(
        (itinerarySnapshot.itinerary || []).length,
      ))
      setItineraryGeneratedAt(itinerarySnapshot.generatedAt || '')
      setItineraryFromSnapshot(true)
    } else {
      setItineraryDays([])
      setItineraryRestaurants([])
      setItineraryMetadata(null)
      setItineraryGenerated(false)
      setItineraryGeneratedAt('')
      setItineraryFromSnapshot(false)
    }

    setFinalizedItineraryGeneratedAt(finalizedItinerarySnapshot?.generatedAt || '')
  }

  const fetchTrip = async () => {
    try {
      setLoadingTrip(true)
      setTripError('')
      const response = await api.get(`/trips/${id}`)
      const tripData = response.data.data
      setTrip(tripData)
      hydrateSavedPlans(tripData)
    } catch (err) {
      setTripError(err.response?.data?.message || 'Failed to load trip details.')
    } finally {
      setLoadingTrip(false)
    }
  }

  const fetchRecommendations = async () => {
    try {
      setLoadingRecommendations(true)
      setRecommendationsError('')
      const response = await api.get(`/recommendations/${id}`)
      const recommendationData = response.data || {}

      setAttractions(recommendationData.attractions || [])
      setRestaurants(recommendationData.restaurants || [])
      setMetadata(recommendationData.metadata || null)
      setRecommendationsGenerated(true)
      setRecommendationsGeneratedAt(new Date().toISOString())
      setRecommendationsFromSnapshot(false)
    } catch (err) {
      setRecommendationsError(err.response?.data?.message || 'Failed to generate recommendations.')
      setRecommendationsGenerated(true)
    } finally {
      setLoadingRecommendations(false)
    }
  }

  const fetchItinerary = async () => {
    try {
      setLoadingItinerary(true)
      setItineraryError('')
      const response = await api.get(`/itinerary/${id}`)
      const itineraryData = response.data || {}

      setItineraryDays(normalizeItineraryDays(itineraryData.itinerary || []))
      setItineraryRestaurants(itineraryData.restaurants || [])
      setItineraryMetadata(itineraryData.metadata || null)
      setItineraryGenerated(true)
      setItineraryGeneratedAt(new Date().toISOString())
      setItineraryFromSnapshot(false)
    } catch (err) {
      setItineraryError(err.response?.data?.message || 'Failed to generate itinerary.')
      setItineraryGenerated(true)
    } finally {
      setLoadingItinerary(false)
    }
  }

  const persistItinerarySnapshot = async (nextItineraryDays) => {
    const snapshotPayload = {
      generatedAt: itineraryGeneratedAt || new Date().toISOString(),
      itinerary: normalizeItineraryDays(nextItineraryDays),
      restaurants: itineraryRestaurants || [],
      metadata: itineraryMetadata || {},
    }

    await api.put(`/trips/${id}`, {
      itinerarySnapshot: snapshotPayload,
    })
  }

  const toggleLockedPlace = async (dayNumber, placeId) => {
    const nextItineraryDays = normalizeItineraryDays(itineraryDays.map((day) => (
      day.day !== dayNumber
        ? day
        : {
            ...day,
            route: (day.route || []).map((place) => (
              place.place_id === placeId ? { ...place, locked: !place.locked } : place
            )),
          }
    )))

    setItineraryDays(nextItineraryDays)

    try {
      await persistItinerarySnapshot(nextItineraryDays)
    } catch (err) {
      setItineraryError(err.response?.data?.message || 'Failed to save locked places.')
      fetchTrip()
    }
  }

  const reorderDayStops = async (dayNumber, fromIndex, toIndex) => {
    if (fromIndex === toIndex) {
      return
    }

    const nextItineraryDays = normalizeItineraryDays(itineraryDays.map((day) => {
      if (day.day !== dayNumber) {
        return day
      }

      const nextRoute = [...(day.route || [])]
      const [movedPlace] = nextRoute.splice(fromIndex, 1)
      nextRoute.splice(toIndex, 0, movedPlace)

      return {
        ...day,
        customized_order: true,
        route: nextRoute,
      }
    }))

    setItineraryDays(nextItineraryDays)

    try {
      setItineraryActionDay(dayNumber)
      const targetDay = nextItineraryDays.find((day) => day.day === dayNumber)
      const response = await api.post(`/itinerary/${id}/recalculate-day/${dayNumber}`, {
        route: targetDay?.route || [],
      })
      const itineraryData = response.data || {}

      setItineraryDays(normalizeItineraryDays(itineraryData.itinerary || []))
      setItineraryRestaurants(itineraryData.restaurants || [])
      setItineraryMetadata(itineraryData.metadata || null)
      setItineraryGenerated(true)
      setItineraryGeneratedAt(new Date().toISOString())
      setItineraryFromSnapshot(false)
    } catch (err) {
      setItineraryError(err.response?.data?.message || 'Failed to recalculate reordered itinerary day.')
      fetchTrip()
    } finally {
      setItineraryActionDay(null)
    }
  }

  const regenerateDay = async (dayNumber) => {
    try {
      setItineraryActionDay(dayNumber)
      setItineraryError('')
      const response = await api.post(`/itinerary/${id}/regenerate-day/${dayNumber}`)
      const itineraryData = response.data || {}

      setItineraryDays(normalizeItineraryDays(itineraryData.itinerary || []))
      setItineraryRestaurants(itineraryData.restaurants || [])
      setItineraryMetadata(itineraryData.metadata || null)
      setItineraryGenerated(true)
      setItineraryGeneratedAt(new Date().toISOString())
      setItineraryFromSnapshot(false)
    } catch (err) {
      setItineraryError(err.response?.data?.message || 'Failed to regenerate itinerary day.')
    } finally {
      setItineraryActionDay(null)
    }
  }

  const finalizeItinerary = async () => {
    try {
      setSavingFinalizedItinerary(true)
      setItineraryError('')

      const snapshotPayload = {
        generatedAt: itineraryGeneratedAt || new Date().toISOString(),
        itinerary: normalizeItineraryDays(itineraryDays),
        restaurants: itineraryRestaurants || [],
        metadata: itineraryMetadata || {},
      }

      const response = await api.post(`/itinerary/${id}/finalize`, {
        itinerarySnapshot: snapshotPayload,
      })

      const finalizedSnapshot = response.data?.finalizedItinerarySnapshot
      setTrip((currentTrip) => (
        currentTrip
          ? { ...currentTrip, finalizedItinerarySnapshot: finalizedSnapshot }
          : currentTrip
      ))
      setFinalizedItineraryGeneratedAt(finalizedSnapshot?.generatedAt || new Date().toISOString())
    } catch (err) {
      setItineraryError(err.response?.data?.message || 'Failed to save final itinerary.')
    } finally {
      setSavingFinalizedItinerary(false)
    }
  }

  const openSwapSuggestions = async (dayNumber, place) => {
    try {
      setSwapState({
        open: true,
        dayNumber,
        place,
        suggestions: [],
        loading: true,
        applyingPlaceId: '',
      })
      setItineraryError('')

      const response = await api.post(`/itinerary/${id}/swap-options/${dayNumber}`, {
        placeId: place.place_id,
      })

      setSwapState({
        open: true,
        dayNumber,
        place,
        suggestions: response.data?.suggestions || [],
        loading: false,
        applyingPlaceId: '',
      })
    } catch (err) {
      setSwapState({
        open: false,
        dayNumber: null,
        place: null,
        suggestions: [],
        loading: false,
        applyingPlaceId: '',
      })
      setItineraryError(err.response?.data?.message || 'Failed to load swap suggestions.')
    }
  }

  const closeSwapSuggestions = () => {
    setSwapState({
      open: false,
      dayNumber: null,
      place: null,
      suggestions: [],
      loading: false,
      applyingPlaceId: '',
    })
  }

  const applySwapSuggestion = async (replacementPlaceId) => {
    if (!swapState.dayNumber || !swapState.place?.place_id) {
      return
    }

    try {
      setSwapState((current) => ({
        ...current,
        applyingPlaceId: replacementPlaceId,
      }))
      setItineraryActionDay(swapState.dayNumber)
      setItineraryError('')

      const response = await api.post(`/itinerary/${id}/swap-place/${swapState.dayNumber}`, {
        placeId: swapState.place.place_id,
        replacementPlaceId,
      })
      const itineraryData = response.data || {}

      setItineraryDays(normalizeItineraryDays(itineraryData.itinerary || []))
      setItineraryRestaurants(itineraryData.restaurants || [])
      setItineraryMetadata(itineraryData.metadata || null)
      setItineraryGenerated(true)
      setItineraryGeneratedAt(new Date().toISOString())
      setItineraryFromSnapshot(false)
      closeSwapSuggestions()
    } catch (err) {
      setItineraryError(err.response?.data?.message || 'Failed to swap itinerary place.')
      setSwapState((current) => ({
        ...current,
        applyingPlaceId: '',
      }))
    } finally {
      setItineraryActionDay(null)
    }
  }

  useEffect(() => {
    fetchTrip()
  }, [id])

  if (loadingTrip) {
    return (
      <section className="surface-card p-8 text-center">
        <p className="text-[#6d6a51]">Loading trip details...</p>
      </section>
    )
  }

  if (tripError) {
    return (
      <section>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-ghost mb-4 px-4 py-2"
        >
          Back to dashboard
        </button>
        <div className="surface-card p-8">
          <p className="rounded-2xl bg-[#f5ddd8] px-4 py-3 text-[#8a3022]">{tripError}</p>
        </div>
      </section>
    )
  }

  if (!trip) {
    return (
      <section>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-ghost mb-4 px-4 py-2"
        >
          Back to dashboard
        </button>
        <div className="surface-card p-8 text-center">
          <p className="text-[#6d6a51]">Trip not found.</p>
        </div>
      </section>
    )
  }

  const gradient = getCityGradient(trip.city)

  return (
    <section className="space-y-8">
      <button
        onClick={() => navigate('/dashboard')}
        className="btn-ghost px-4 py-2"
      >
        Back to dashboard
      </button>

      <div className={`hero-panel bg-gradient-to-br ${gradient}`}>
        <div className="p-8 sm:p-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <p className="field-label text-[#f7d9b8]">Trip profile</p>
              <h1 className="editorial-title mt-4 text-5xl font-semibold sm:text-6xl">{trip.city}</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#f5e9d7] sm:text-base">
                A {trip.days}-day trip ready for tourism-aware ranking, attraction selection, and route ordering.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={fetchRecommendations}
                disabled={loadingRecommendations}
                className="btn-secondary px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingRecommendations ? 'Preparing candidates...' : 'Generate Smart Recommendations'}
              </button>
              <button
                onClick={fetchItinerary}
                disabled={loadingItinerary}
                className="btn-ghost border border-white/10 px-6 py-3 text-[#fefae0] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingItinerary ? 'Building itinerary...' : 'Generate Day-wise Itinerary'}
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] bg-white/14 p-5 backdrop-blur">
              <p className="text-sm text-[#f5e9d7]">Duration</p>
              <p className="mt-2 text-3xl font-semibold">{trip.days}</p>
              <p className="text-sm text-[#f5e9d7]">days</p>
            </div>
            <div className="rounded-[24px] bg-white/14 p-5 backdrop-blur">
              <p className="text-sm text-[#f5e9d7]">Budget</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(trip.budget)}</p>
              <p className="text-sm text-[#f5e9d7]">planned spend</p>
            </div>
            <div className="rounded-[24px] bg-white/14 p-5 backdrop-blur">
              <p className="text-sm text-[#f5e9d7]">Start date</p>
              <p className="mt-2 text-2xl font-semibold">{formatTripDate(trip.startDate)}</p>
              <p className="text-sm text-[#f5e9d7]">used for weekday-aware planning</p>
            </div>
            <div className="rounded-[24px] bg-white/14 p-5 backdrop-blur sm:col-span-3">
              <p className="text-sm text-[#f5e9d7]">Interests</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {trip.interests?.length ? (
                  trip.interests.map((interest) => {
                    const meta = getInterestMeta(interest)
                    return (
                      <span key={interest} className="rounded-full bg-white/16 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#fefae0]">
                        {meta.label}
                      </span>
                    )
                  })
                ) : (
                  <span className="text-sm text-[#f5e9d7]">Flexible trip</span>
                )}
              </div>
            </div>
            <div className="rounded-[24px] bg-white/14 p-5 backdrop-blur sm:col-span-3">
              <p className="text-sm text-[#f5e9d7]">Start location</p>
              <p className="mt-2 text-lg font-semibold">
                {trip.hotelLocation?.name
                  ? trip.hotelLocation.name
                  : trip.hotelLocation?.lat && trip.hotelLocation?.lng
                  ? `${trip.hotelLocation.lat.toFixed(4)}, ${trip.hotelLocation.lng.toFixed(4)}`
                  : 'Routes start from the strongest attraction when no hotel location is set.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <RecommendationsPanel
        attractions={attractions}
        restaurants={restaurants}
        metadata={metadata}
        tripDays={trip.days}
        loading={loadingRecommendations}
        generated={recommendationsGenerated}
        error={recommendationsError}
        onRefresh={fetchRecommendations}
        generatedAt={recommendationsGeneratedAt}
        hydratedFromSnapshot={recommendationsFromSnapshot}
      />

      <ItineraryPanel
        itineraryDays={itineraryDays}
        loading={loadingItinerary}
        generated={itineraryGenerated}
        error={itineraryError}
        onRefresh={fetchItinerary}
        generatedAt={itineraryGeneratedAt}
        hydratedFromSnapshot={itineraryFromSnapshot}
        onToggleLock={toggleLockedPlace}
        onRegenerateDay={regenerateDay}
        onReorderDay={reorderDayStops}
        actionDay={itineraryActionDay}
        onFinalize={finalizeItinerary}
        savingFinalized={savingFinalizedItinerary}
        finalizedGeneratedAt={finalizedItineraryGeneratedAt}
        onRequestSwap={openSwapSuggestions}
        onApplySwap={applySwapSuggestion}
        onCloseSwap={closeSwapSuggestions}
        swapState={swapState}
      />
    </section>
  )
}

export default TripDetails
