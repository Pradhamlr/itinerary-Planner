const PlacesService = require('./placesService');
const RoutingService = require('./routingService');
const CostEstimatorService = require('./costEstimatorService');

class ItineraryService {
  /**
   * Generate a complete day-wise itinerary for a trip.
   * Uses ML-based recommendation engine for place selection.
   * @param {Object} params
   * @param {string} params.city
   * @param {number} params.days
   * @param {number} params.budget
   * @param {string[]} params.interests
   * @param {string} params.pace - 'relaxed' | 'moderate' | 'packed'
   * @param {string} params.budgetCategory - 'low' | 'medium' | 'luxury'
   * @returns {Object} Complete itinerary with day-wise plan, cost, and route
   */
  static async generateItinerary(params) {
    const {
      city,
      days,
      budget,
      interests = [],
      pace = 'moderate',
      budgetCategory = 'medium',
    } = params;

    // 1. Get ML-powered recommendations (interest + budget aware)
    const placesPerDay = { relaxed: 3, moderate: 5, packed: 7 };
    const maxPlaces = days * (placesPerDay[pace] || 5);

    let selectedPlaces;
    try {
      // Use ML recommendation endpoint for interest-based ranking
      selectedPlaces = await PlacesService.getRecommendations(
        city, interests, budgetCategory, maxPlaces
      );
    } catch {
      // Fallback: fetch all places and rank locally
      const allPlaces = await PlacesService.getPlacesByCity(city);
      const scoredPlaces = this.rankPlaces(allPlaces, interests);
      selectedPlaces = scoredPlaces.slice(0, maxPlaces);
    }

    // Separate restaurants from sightseeing places
    const restaurants = selectedPlaces.filter(
      (p) => p.category === 'restaurant'
    );
    const sightseeingPlaces = selectedPlaces.filter(
      (p) => p.category !== 'restaurant'
    );

    if (sightseeingPlaces.length === 0) {
      return {
        city,
        days,
        budget,
        itinerary: [],
        restaurants: restaurants.slice(0, days * 3),
        estimatedCost: CostEstimatorService.estimate(city, days, budgetCategory, 0),
        totalPlaces: 0,
        optimizationInfo: { algorithm: 'none', totalDistance: 0 },
      };
    }

    // 2. Optimize route using TSP
    const placesForRouting = sightseeingPlaces.map((p) => ({
      name: p.name,
      lat: p.lat != null ? p.lat : p.coordinates?.lat,
      lng: p.lng != null ? p.lng : p.coordinates?.lng,
      category: p.category,
      rating: p.rating,
      description: p.description,
      place_id: p.place_id || p._id?.toString(),
      visit_duration: p.visit_duration,
      best_time: p.best_time,
      tags: p.tags,
    })).filter((p) => p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng));

    const routeResult = RoutingService.optimizeRoute(placesForRouting);

    // 3. Distribute across days
    const dayWiseItinerary = RoutingService.distributeAcrossDays(
      routeResult.orderedPlaces,
      days,
      pace
    );

    // 4. Estimate costs
    const estimatedCost = CostEstimatorService.estimate(
      city,
      days,
      budgetCategory,
      sightseeingPlaces.length
    );

    return {
      city,
      days,
      budget,
      pace,
      budgetCategory,
      itinerary: dayWiseItinerary,
      restaurants: restaurants.slice(0, days * 3),
      estimatedCost,
      totalPlaces: sightseeingPlaces.length,
      optimizationInfo: {
        algorithm: routeResult.algorithm,
        totalDistance: routeResult.totalDistance,
        modelUsed: 'TF-IDF Content-Based Filtering',
      },
    };
  }

  /**
   * Rank places based on user interest matching and ratings (local fallback).
   */
  static rankPlaces(places, interests) {
    const interestCategoryMap = {
      history: ['historic', 'monument', 'museum'],
      adventure: ['nature', 'park', 'entertainment'],
      food: ['restaurant'],
      nature: ['nature', 'park'],
      culture: ['museum', 'architecture', 'religious'],
      shopping: ['entertainment', 'interesting_places'],
      nightlife: ['entertainment'],
      beaches: ['nature'],
      art: ['museum', 'architecture'],
      sports: ['entertainment', 'park'],
      spiritual: ['religious'],
    };

    const relevantCategories = new Set();
    interests.forEach((interest) => {
      const cats = interestCategoryMap[interest.toLowerCase()] || [];
      cats.forEach((c) => relevantCategories.add(c));
    });

    return places
      .filter((p) => p.name && p.name !== 'Unnamed Place')
      .map((place) => {
        let score = 0;

        if (relevantCategories.size > 0 && relevantCategories.has(place.category)) {
          score += 10;
        }

        if (place.rating) {
          score += place.rating;
        }

        if (place.description && place.description.length > 20) {
          score += 2;
        }

        return { ...place.toObject ? place.toObject() : place, _score: score };
      })
      .sort((a, b) => b._score - a._score);
  }
}

module.exports = ItineraryService;
