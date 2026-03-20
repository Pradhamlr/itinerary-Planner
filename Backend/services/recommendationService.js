const axios = require('axios');
const Place = require('../models/Place');
const {
  recommendationConfig,
  interestTypeMap,
  allowedAttractionTypes,
  blockedAttractionTypes,
  genericPlaceTypes,
  restaurantTypes,
  blockedRestaurantTypes,
} = require('../config/recommendationConfig');

const normalizeInterest = (interest) => String(interest || '').trim().toLowerCase();
const normalizeType = (type) => String(type || '').trim().toLowerCase();

const getNormalizedTypes = (place) => (place.types || []).map(normalizeType);

const getPrimaryCategory = (place) => {
  const types = getNormalizedTypes(place);
  const category = types.find((type) => allowedAttractionTypes.has(type))
    || types.find((type) => restaurantTypes.has(type))
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
  const specificTypes = normalizedTypes.filter((type) => !genericPlaceTypes.has(type));

  return specificTypes.some((type) => allowedAttractionTypes.has(type))
    && !specificTypes.some((type) => blockedAttractionTypes.has(type));
};

const isBlockedRestaurant = (place) => getNormalizedTypes(place).some((type) => blockedRestaurantTypes.has(type));

const filterByInterests = (places, tripInterests, requiredAttractionCount) => {
  const normalizedInterests = (tripInterests || []).map(normalizeInterest).filter(Boolean);
  if (normalizedInterests.length === 0) {
    return {
      places,
      interestFilterApplied: false,
    };
  }

  const allowedTypes = new Set(normalizedInterests.flatMap((interest) => interestTypeMap[interest] || []));
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
      .limit(recommendationConfig.candidateFetchLimit);
  }

  static async fetchMlRecommendations(places) {
    const response = await axios.post(
      `${recommendationConfig.mlServiceUrl}/recommend`,
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
      .filter((place) => Number(place.rating || 0) >= recommendationConfig.minAttractionRating)
      .filter((place) => Number(place.user_ratings_total || 0) >= recommendationConfig.minAttractionReviews);

    let afterPopularityFilter = afterQualityFilter
      .filter((place) => getPopularitySignal(place) >= recommendationConfig.popularityGatePrimary);

    if (afterPopularityFilter.length < recommendationConfig.popularityGateMinResults) {
      afterPopularityFilter = afterQualityFilter
        .filter((place) => getPopularitySignal(place) >= recommendationConfig.popularityGateFallback);
    }

    const candidatePool = afterPopularityFilter
      .sort((a, b) => {
        const scoreA = (getPopularitySignal(a) * 0.7) + ((a.rating || 0) * 0.3);
        const scoreB = (getPopularitySignal(b) * 0.7) + ((b.rating || 0) * 0.3);
        return scoreB - scoreA;
      })
      .slice(0, recommendationConfig.candidatePoolLimit);

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
      .filter((place) => hasAnyType(place, restaurantTypes))
      .filter((place) => !isBlockedRestaurant(place))
      .filter((place) => Number(place.rating || 0) >= recommendationConfig.minRestaurantRating)
      .filter((place) => Number(place.user_ratings_total || 0) >= recommendationConfig.minRestaurantReviews)
      .sort((first, second) => {
        if ((second.rating || 0) !== (first.rating || 0)) {
          return (second.rating || 0) - (first.rating || 0);
        }

        return (second.user_ratings_total || 0) - (first.user_ratings_total || 0);
      })
      .slice(0, recommendationConfig.restaurantPoolLimit);
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
        const weightedRating = ((reviewCount / (reviewCount + recommendationConfig.weightedRatingThreshold)) * rating)
          + ((recommendationConfig.weightedRatingThreshold / (reviewCount + recommendationConfig.weightedRatingThreshold)) * averageRating);
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
    const sampledRestaurants = sampleArray(restaurants, recommendationConfig.restaurantSampleSize)
      .sort((first, second) => {
        if ((second.rating || 0) !== (first.rating || 0)) {
          return (second.rating || 0) - (first.rating || 0);
        }

        return (second.user_ratings_total || 0) - (first.user_ratings_total || 0);
      })
      .slice(0, recommendationConfig.restaurantReturnCount);

    return sampledRestaurants.map(buildRestaurantResponse);
  }

  static async getRecommendationsForTrip(trip) {
    const totalAttractions = Math.max(
      recommendationConfig.placesPerDay,
      Number(trip.days || 1) * recommendationConfig.placesPerDay,
    );
    const requiredAttractionCount = totalAttractions;
    const candidatePlaces = await this.fetchCandidatePlaces(trip.city);
    const { candidatePool, interestFilterApplied } = this.buildAttractionCandidatePool(
      candidatePlaces,
      trip.interests,
      requiredAttractionCount,
    );

    const dynamicSampleSize = Math.max(recommendationConfig.candidateSampleSize, requiredAttractionCount * 3);
    const normalizedInterests = (trip.interests || []).map(normalizeInterest);
    const interestTypes = new Set(normalizedInterests.flatMap((interest) => interestTypeMap[interest] || []));

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
        console.warn(`[recommendations] ML scoring fallback active: ${details}`);
        mlScoreMap = new Map(
          sampledCandidates.map((place) => [place.place_id, recommendationConfig.mlFallbackScore]),
        );
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
        ml_service_fallback: sampledCandidates.length > 0 && sampledCandidates.every((place) =>
          Number(mlScoreMap.get(place.place_id)) === recommendationConfig.mlFallbackScore),
      },
    };
  }
}

module.exports = RecommendationService;
