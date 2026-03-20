const axios = require('axios');
const Place = require('../models/Place');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const CANDIDATE_FETCH_LIMIT = 600;
const CANDIDATE_POOL_LIMIT = 120;
const CANDIDATE_SAMPLE_SIZE = 40;
const PLACES_PER_DAY = 4;

const MIN_ATTRACTION_RATING = 4.2;
const MIN_ATTRACTION_REVIEWS = 500;
const POPULARITY_GATE_PRIMARY = 7.8;
const POPULARITY_GATE_FALLBACK = 7.5;
const POPULARITY_GATE_MIN_RESULTS = 120;
const WEIGHTED_RATING_THRESHOLD = 2000;

const MIN_RESTAURANT_RATING = 4.2;
const MIN_RESTAURANT_REVIEWS = 300;
const RESTAURANT_POOL_LIMIT = 80;
const RESTAURANT_SAMPLE_SIZE = 20;
const RESTAURANT_RETURN_COUNT = 8;

const INTEREST_TYPE_MAP = {
  beaches: ['beach', 'natural_feature'],
  culture: ['museum', 'art_gallery', 'hindu_temple', 'temple', 'church', 'monument'],
  nature: ['park', 'zoo', 'garden', 'natural_feature'],
  food: ['restaurant', 'cafe'],
  shopping: ['shopping_mall', 'store'],
  nightlife: ['bar', 'night_club'],
  history: ['museum', 'historical_landmark', 'monument', 'church', 'synagogue', 'temple'],
  art: ['art_gallery', 'museum'],
  adventure: ['amusement_park', 'park', 'natural_feature'],
  sports: ['park'],
};

const ALLOWED_ATTRACTION_TYPES = new Set([
  'tourist_attraction',
  'museum',
  'church',
  'hindu_temple',
  'temple',
  'mosque',
  'synagogue',
  'art_gallery',
  'park',
  'zoo',
  'aquarium',
  'amusement_park',
  'natural_feature',
  'beach',
  'historical_landmark',
  'monument',
  'landmark',
]);

const BLOCKED_ATTRACTION_TYPES = new Set([
  'travel_agency',
  'tour_operator',
  'tour_agency',
  'tourist_information_center',
  'florist',
  'store',
]);

const GENERIC_PLACE_TYPES = new Set([
  'establishment',
  'point_of_interest',
  'premise',
]);

const RESTAURANT_TYPES = new Set([
  'restaurant',
  'cafe',
  'bar',
  'bakery',
  'meal_takeaway',
  'night_club',
]);

const BLOCKED_RESTAURANT_TYPES = new Set([
  'lodging',
  'hotel',
  'resort_hotel',
  'travel_agency',
  'tour_operator',
  'tour_agency',
]);

const normalizeInterest = (interest) => String(interest || '').trim().toLowerCase();
const normalizeType = (type) => String(type || '').trim().toLowerCase();

const getNormalizedTypes = (place) => (place.types || []).map(normalizeType);

const getPrimaryCategory = (place) => {
  const types = getNormalizedTypes(place);
  const category = types.find((type) => ALLOWED_ATTRACTION_TYPES.has(type))
    || types.find((type) => RESTAURANT_TYPES.has(type))
    || types[0];
  return category ? String(category).replace(/_/g, ' ') : 'other';
};

const getReviewTexts = (place) => {
  if (!Array.isArray(place.reviews)) {
    return [];
  }

  return place.reviews
    .map((review) => {
      if (typeof review === 'string') {
        return review.trim();
      }

      return typeof review?.text === 'string' ? review.text.trim() : '';
    })
    .filter(Boolean);
};

const getReviewAverageRating = (place) => {
  if (!Array.isArray(place.reviews) || place.reviews.length === 0) {
    return Number.isFinite(place.rating) ? Number(place.rating) : 0;
  }

  const reviewRatings = place.reviews
    .map((review) => (Number.isFinite(review?.rating) ? Number(review.rating) : null))
    .filter((rating) => Number.isFinite(rating));

  if (reviewRatings.length === 0) {
    return Number.isFinite(place.rating) ? Number(place.rating) : 0;
  }

  return reviewRatings.reduce((sum, rating) => sum + rating, 0) / reviewRatings.length;
};

const getSentimentSignal = (place) => {
  const reviewAverageRating = getReviewAverageRating(place);
  if (!Number.isFinite(reviewAverageRating) || reviewAverageRating <= 0) {
    return 0.5;
  }

  return Math.max(0, Math.min(1, reviewAverageRating / 5));
};

const getPopularitySignal = (place) => Math.log((Number(place.user_ratings_total) || 0) + 1);

const buildMlPayloadPlace = (place) => {
  const reviewTexts = getReviewTexts(place);

  return {
    place_id: place.place_id,
    name: place.name,
    category: getPrimaryCategory(place),
    rating: Number.isFinite(place.rating) ? Number(place.rating) : 0,
    review: reviewTexts.join(' || '),
    city: place.city,
    lat: place.lat,
    lng: place.lng,
    reviews: reviewTexts,
    review_count: reviewTexts.length,
    review_avg_rating: getReviewAverageRating(place),
    user_ratings_total: Number.isFinite(place.user_ratings_total) ? Number(place.user_ratings_total) : 0,
  };
};

const buildScoreNormalizer = (values) => {
  const numericValues = values.filter((value) => Number.isFinite(value));
  if (numericValues.length === 0) {
    return () => 0;
  }

  const minValue = Math.min(...numericValues);
  const maxValue = Math.max(...numericValues);

  if (minValue === maxValue) {
    return () => (maxValue > 0 ? 1 : 0);
  }

  return (value) => (value - minValue) / (maxValue - minValue);
};

const shuffleArray = (items) => {
  const cloned = [...items];
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]];
  }
  return cloned;
};

const sampleArray = (items, sampleSize) => shuffleArray(items).slice(0, Math.min(sampleSize, items.length));

const previewPlaceNames = (places, limit = 10) =>
  places
    .slice(0, limit)
    .map((place) => `${place.name} (${Number(place.rating || 0).toFixed(1)}, ${Number(place.user_ratings_total || 0)} reviews)`)
    .join(' | ');

const hasAnyType = (place, typeSet) => getNormalizedTypes(place).some((type) => typeSet.has(type));

const isAllowedAttraction = (place) => {
  const normalizedTypes = getNormalizedTypes(place);
  const specificTypes = normalizedTypes.filter((type) => !GENERIC_PLACE_TYPES.has(type));

  return specificTypes.some((type) => ALLOWED_ATTRACTION_TYPES.has(type))
    && !specificTypes.some((type) => BLOCKED_ATTRACTION_TYPES.has(type));
};

const isBlockedRestaurant = (place) => getNormalizedTypes(place).some((type) => BLOCKED_RESTAURANT_TYPES.has(type));

const filterByInterests = (places, tripInterests, requiredAttractionCount) => {
  const normalizedInterests = (tripInterests || []).map(normalizeInterest).filter(Boolean);
  if (normalizedInterests.length === 0) {
    return {
      places,
      interestFilterApplied: false,
    };
  }

  const allowedTypes = new Set(normalizedInterests.flatMap((interest) => INTEREST_TYPE_MAP[interest] || []));
  const filteredPlaces = places.filter((place) =>
    getNormalizedTypes(place).some((type) => allowedTypes.has(type)),
  );

  return {
    places: filteredPlaces.length >= requiredAttractionCount ? filteredPlaces : places,
    interestFilterApplied: filteredPlaces.length >= requiredAttractionCount,
  };
};

const buildAttractionResponse = (place, scores) => {
  const reviewTexts = getReviewTexts(place);
  const reviewSnippet = reviewTexts[0] || place.description || 'No review snippet available yet.';

  return {
    _id: place._id,
    place_id: place.place_id,
    name: place.name,
    lat: place.lat,
    lng: place.lng,
    city: place.city,
    rating: place.rating,
    reviewSnippet: reviewSnippet.slice(0, 220),
    types: place.types || [],
    category: getPrimaryCategory(place),
    user_ratings_total: place.user_ratings_total || 0,
    ml_score: Number(scores.mlScore.toFixed(4)),
    weighted_rating: Number(scores.weightedRating.toFixed(4)),
    popularity_score: Number(scores.normalizedPopularitySignal.toFixed(4)),
    sentiment_score: Number(scores.sentimentScore.toFixed(4)),
    final_score: Number(scores.finalScore.toFixed(4)),
  };
};

const buildRestaurantResponse = (place) => {
  const reviewTexts = getReviewTexts(place);
  const reviewSnippet = reviewTexts[0] || place.description || 'Popular place for a meal break.';

  return {
    _id: place._id,
    place_id: place.place_id,
    name: place.name,
    lat: place.lat,
    lng: place.lng,
    city: place.city,
    rating: place.rating,
    reviewSnippet: reviewSnippet.slice(0, 180),
    types: place.types || [],
    category: getPrimaryCategory(place),
    user_ratings_total: place.user_ratings_total || 0,
  };
};

class RecommendationService {
  static async fetchCandidatePlaces(city) {
    return Place.find({ city: String(city).toLowerCase() })
      .sort({ user_ratings_total: -1 })
      .limit(CANDIDATE_FETCH_LIMIT);
  }

  static async fetchMlRecommendations(places) {
    const response = await axios.post(
      `${ML_SERVICE_URL}/recommend`,
      {
        places: places.map(buildMlPayloadPlace),
        top_k: places.length,
      },
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data?.recommendations || [];
  }

  static buildAttractionCandidatePool(places, tripInterests, requiredAttractionCount) {
    const afterTypeFilter = places.filter((place) => isAllowedAttraction(place));
    const afterQualityFilter = afterTypeFilter
      .filter((place) => Number(place.rating || 0) >= MIN_ATTRACTION_RATING)
      .filter((place) => Number(place.user_ratings_total || 0) >= MIN_ATTRACTION_REVIEWS);

    let afterPopularityFilter = afterQualityFilter
      .filter((place) => getPopularitySignal(place) >= POPULARITY_GATE_PRIMARY);

    if (afterPopularityFilter.length < POPULARITY_GATE_MIN_RESULTS) {
      afterPopularityFilter = afterQualityFilter
        .filter((place) => getPopularitySignal(place) >= POPULARITY_GATE_FALLBACK);
    }

    const candidatePool = afterPopularityFilter
      .sort((a, b) => {
    const scoreA = (getPopularitySignal(a) * 0.7) + ((a.rating || 0) * 0.3);
    const scoreB = (getPopularitySignal(b) * 0.7) + ((b.rating || 0) * 0.3);
    return scoreB - scoreA;
    })
      .slice(0, CANDIDATE_POOL_LIMIT);

    const { places: interestFilteredPlaces, interestFilterApplied } = filterByInterests(
      candidatePool,
      tripInterests,
      requiredAttractionCount,
    );

    console.log('[recommendations] total_places:', places.length);
    console.log('[recommendations] after_type_filter:', afterTypeFilter.length);
    console.log('[recommendations] type_filter_preview:', previewPlaceNames(afterTypeFilter));
    console.log('[recommendations] after_quality_filter:', afterQualityFilter.length);
    console.log('[recommendations] quality_filter_preview:', previewPlaceNames(afterQualityFilter));
    console.log('[recommendations] after_popularity_filter:', afterPopularityFilter.length);
    console.log('[recommendations] popularity_filter_preview:', previewPlaceNames(afterPopularityFilter));
    console.log('[recommendations] candidate_pool_size:', candidatePool.length);
    console.log('[recommendations] after_interest_filter:', interestFilteredPlaces.length);
    console.log('[recommendations] interest_filter_preview:', previewPlaceNames(interestFilteredPlaces));

    return {
      candidatePool: interestFilteredPlaces,
      interestFilterApplied,
    };
  }

  static buildRestaurantPool(places) {
    return places
      .filter((place) => hasAnyType(place, RESTAURANT_TYPES))
      .filter((place) => !isBlockedRestaurant(place))
      .filter((place) => Number(place.rating || 0) >= MIN_RESTAURANT_RATING)
      .filter((place) => Number(place.user_ratings_total || 0) >= MIN_RESTAURANT_REVIEWS)
      .sort((first, second) => {
        if ((second.rating || 0) !== (first.rating || 0)) {
          return (second.rating || 0) - (first.rating || 0);
        }

        return (second.user_ratings_total || 0) - (first.user_ratings_total || 0);
      })
      .slice(0, RESTAURANT_POOL_LIMIT);
  }

  static rankAttractions(attractions, mlScoreMap) {
    const ratingValues = attractions
      .map((place) => Number(place.rating || 0))
      .filter((rating) => Number.isFinite(rating) && rating > 0);
    const averageRating = ratingValues.length > 0
      ? ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length
      : 0;

    const popularitySignals = attractions.map((place) => getPopularitySignal(place));
    const normalizePopularitySignal = buildScoreNormalizer(popularitySignals);

    return attractions
      .map((place) => {
        const rating = Number(place.rating || 0);
        const reviewCount = Number(place.user_ratings_total || 0);
        const weightedRating = ((reviewCount / (reviewCount + WEIGHTED_RATING_THRESHOLD)) * rating)
          + ((WEIGHTED_RATING_THRESHOLD / (reviewCount + WEIGHTED_RATING_THRESHOLD)) * averageRating);
        const normalizedPopularitySignal = normalizePopularitySignal(getPopularitySignal(place));
        const sentimentScore = getSentimentSignal(place);
        const mlScore = Number(mlScoreMap.get(place.place_id) || 0);
        const finalScore = (mlScore * 0.35)
          + (weightedRating * 0.30)
          + (normalizedPopularitySignal * 0.25)
          + (sentimentScore * 0.10)
          + (Math.random() * 0.02);

        return buildAttractionResponse(place, {
          mlScore,
          weightedRating,
          normalizedPopularitySignal,
          sentimentScore,
          finalScore,
        });
      })
      .sort((first, second) => {
        if (second.final_score !== first.final_score) {
          return second.final_score - first.final_score;
        }

        return (second.user_ratings_total || 0) - (first.user_ratings_total || 0);
      });
  }

  static buildRestaurants(restaurants) {
    const sampledRestaurants = sampleArray(restaurants, RESTAURANT_SAMPLE_SIZE)
      .sort((first, second) => {
        if ((second.rating || 0) !== (first.rating || 0)) {
          return (second.rating || 0) - (first.rating || 0);
        }

        return (second.user_ratings_total || 0) - (first.user_ratings_total || 0);
      })
      .slice(0, RESTAURANT_RETURN_COUNT);

    return sampledRestaurants.map(buildRestaurantResponse);
  }

  static async getRecommendationsForTrip(trip) {
    const totalAttractions = Math.max(PLACES_PER_DAY, Number(trip.days || 1) * PLACES_PER_DAY);
    const requiredAttractionCount = totalAttractions;
    const candidatePlaces = await this.fetchCandidatePlaces(trip.city);
    const { candidatePool, interestFilterApplied } = this.buildAttractionCandidatePool(
      candidatePlaces,
      trip.interests,
      requiredAttractionCount,
    );

    const dynamicSampleSize = Math.max(CANDIDATE_SAMPLE_SIZE, requiredAttractionCount * 3);
    const normalizedInterests = (trip.interests || []).map(normalizeInterest);
    const interestTypes = new Set(normalizedInterests.flatMap((interest) => INTEREST_TYPE_MAP[interest] || []));

    let sampledCandidates;

    if (interestTypes.size > 0) {
      const interestMatches = candidatePool.filter((place) =>
        getNormalizedTypes(place).some((type) => interestTypes.has(type)),
      );
      const otherPlaces = candidatePool.filter((place) => !interestMatches.includes(place));

      if (interestMatches.length > 0) {
        const interestSample = sampleArray(interestMatches, Math.floor(dynamicSampleSize * 0.7));
        const otherSample = sampleArray(otherPlaces, dynamicSampleSize - interestSample.length);
        sampledCandidates = [...interestSample, ...otherSample];
      } else {
        sampledCandidates = sampleArray(candidatePool, dynamicSampleSize);
      }
    } else {
      sampledCandidates = sampleArray(candidatePool, dynamicSampleSize);
    }

    console.log('[recommendations] sampled_candidates:', sampledCandidates.length);

    let mlScoreMap = new Map();
    if (sampledCandidates.length > 0) {
      try {
        const mlRecommendations = await this.fetchMlRecommendations(sampledCandidates);
        mlScoreMap = new Map(
          mlRecommendations.map((recommendation) => [
            recommendation.place_id,
            Number(recommendation.recommendation_score || 0),
          ]),
        );
      } catch (error) {
        const details = error.response?.data?.detail || error.message;
        throw new Error(`ML service unavailable: ${details}`);
      }
    }

    const rankedAttractions = this.rankAttractions(sampledCandidates, mlScoreMap);
    const selectedAttractions = rankedAttractions.slice(0, totalAttractions);
    console.log('[recommendations] final_attraction_count:', selectedAttractions.length);
    console.log('[recommendations] final_attraction_preview:', previewPlaceNames(selectedAttractions));

    const restaurantPool = this.buildRestaurantPool(candidatePlaces);
    const restaurants = this.buildRestaurants(restaurantPool);

    return {
      attractions: selectedAttractions,
      restaurants,
      metadata: {
        ranking_mode: (trip.interests || []).length > 0 ? 'hybrid' : 'popularity',
        total_candidates: candidatePlaces.length,
        interest_filter_applied: interestFilterApplied,
        ranking_strategy: 'dynamic multi-stage tourism ranking',
      },
    };
  }
}

module.exports = RecommendationService;
