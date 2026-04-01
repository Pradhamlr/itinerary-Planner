const Place = require('../models/Place');
const { CITY_LOOKUP } = require('../config/cityExpansionPlan');

const MAX_CITY_FEED_SIZE = 100;
const EXPANSION_CITY_FETCH_SIZE = 260;
const RANDOM_CANDIDATE_MULTIPLIER = 6;
const EXPANSION_GENERAL_MIN_REVIEWS = 1000;
const EXPANSION_RELIGIOUS_SUBTYPE_CAP = 1;
const EXPANSION_RELIGIOUS_TOTAL_CAP = 3;
const EXPANSION_PARK_CAP = 4;

function isExpansionCity(city) {
  return CITY_LOOKUP.has(String(city || '').toLowerCase());
}

function getPrimaryType(place) {
  if (!place || !Array.isArray(place.types)) {
    return '';
  }

  const priorityTypes = [
    'tourist_attraction',
    'historical_landmark',
    'landmark',
    'monument',
    'museum',
    'art_gallery',
    'beach',
    'market',
    'shopping_mall',
    'park',
    'hindu_temple',
    'church',
    'mosque',
    'synagogue',
  ];

  const match = priorityTypes.find((type) => place.types.includes(type));
  return match || place.types[0] || '';
}

function getExpansionTheme(place) {
  const primaryType = getPrimaryType(place);

  if (['hindu_temple', 'church', 'mosque', 'synagogue'].includes(primaryType)) {
    return primaryType;
  }

  if (primaryType === 'park') {
    return 'park';
  }

  if (['tourist_attraction', 'historical_landmark', 'landmark', 'monument'].includes(primaryType)) {
    return 'headline';
  }

  if (['museum', 'art_gallery', 'beach', 'market', 'shopping_mall'].includes(primaryType)) {
    return primaryType;
  }

  return 'general';
}

function getExpansionPriority(place) {
  const theme = getExpansionTheme(place);

  switch (theme) {
    case 'headline':
      return 0;
    case 'museum':
    case 'art_gallery':
    case 'beach':
      return 1;
    case 'market':
    case 'shopping_mall':
      return 2;
    case 'general':
      return 3;
    case 'park':
      return 4;
    case 'hindu_temple':
    case 'church':
    case 'mosque':
    case 'synagogue':
      return 5;
    default:
      return 6;
  }
}

function getQualityScore(place) {
  const rating = Number(place?.rating || 0);
  const reviews = Number(place?.user_ratings_total || 0);
  const reviewSignal = Math.log10(reviews + 1) * 2.2;
  return (rating * 10) + reviewSignal;
}

function sortPlacesForExpansionFeed(places) {
  return [...places].sort((a, b) => {
    const priorityDiff = getExpansionPriority(a) - getExpansionPriority(b);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    const qualityDiff = getQualityScore(b) - getQualityScore(a);
    if (qualityDiff !== 0) {
      return qualityDiff;
    }

    return Number(b.user_ratings_total || 0) - Number(a.user_ratings_total || 0);
  });
}

function curateExpansionPlaces(places, limit = MAX_CITY_FEED_SIZE) {
  const eligiblePlaces = places.filter((place) => Number(place?.user_ratings_total || 0) >= EXPANSION_GENERAL_MIN_REVIEWS);
  const topParkPlaceIds = new Set(
    eligiblePlaces
      .filter((place) => getExpansionTheme(place) === 'park')
      .sort((first, second) => Number(second.user_ratings_total || 0) - Number(first.user_ratings_total || 0))
      .slice(0, EXPANSION_PARK_CAP)
      .map((place) => place.place_id),
  );
  const sortedPlaces = sortPlacesForExpansionFeed(eligiblePlaces);
  const selected = [];
  const religiousSubtypeCounts = {
    hindu_temple: 0,
    church: 0,
    mosque: 0,
    synagogue: 0,
  };
  let religiousTotal = 0;
  let parkCount = 0;

  for (const place of sortedPlaces) {
    if (selected.length >= limit) {
      break;
    }

    const theme = getExpansionTheme(place);

    if (theme === 'park') {
      if (!topParkPlaceIds.has(place.place_id) || parkCount >= EXPANSION_PARK_CAP) {
        continue;
      }
    }

    if (['hindu_temple', 'church', 'mosque', 'synagogue'].includes(theme)) {
      if (religiousTotal >= EXPANSION_RELIGIOUS_TOTAL_CAP) {
        continue;
      }

      if (religiousSubtypeCounts[theme] >= EXPANSION_RELIGIOUS_SUBTYPE_CAP) {
        continue;
      }

      religiousSubtypeCounts[theme] += 1;
      religiousTotal += 1;
    }

    if (theme === 'park') {
      parkCount += 1;
    }

    selected.push(place);
  }

  return selected;
}

class PlacesService {
  /**
   * Get places by city from database (Google Places data)
   */
  static async getPlacesByCity(city) {
    try {
      const cityLower = city.toLowerCase();
      const expansionCity = isExpansionCity(cityLower);

      const places = await Place.find({ city: cityLower })
        .sort({ rating: -1, user_ratings_total: -1 })
        .limit(expansionCity ? EXPANSION_CITY_FETCH_SIZE : MAX_CITY_FEED_SIZE)
        .lean();

      if (!expansionCity) {
        return places;
      }

      return curateExpansionPlaces(places, MAX_CITY_FEED_SIZE);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get places filtered by type
   */
  static async getPlacesByType(city, type) {
    try {
      const cityLower = city.toLowerCase();
      const places = await Place.find({
        city: cityLower,
        types: type,
      }).limit(50);
      return places;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get places with minimum rating
   */
  static async getPlacesByRating(city, minRating = 4.0) {
    try {
      const cityLower = city.toLowerCase();
      const places = await Place.find({
        city: cityLower,
        rating: { $gte: minRating },
      })
        .sort({ rating: -1, user_ratings_total: -1 })
        .limit(50);
      return places;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all unique cities in database
   */
  static async getAllCities() {
    try {
      const cities = await Place.distinct('city');
      return cities;
    } catch (error) {
      throw error;
    }
  }

  static async getRandomPlaces(limit = 80) {
    try {
      const parsedLimit = Math.max(10, Math.min(Number(limit) || 40, 120));
      const sampleSize = Math.max(parsedLimit * RANDOM_CANDIDATE_MULTIPLIER, 120);
      const places = await Place.aggregate([
        { $match: { rating: { $gt: 0 } } },
        { $sample: { size: sampleSize } },
      ]);

      return curateExpansionPlaces(places, parsedLimit);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get statistics for a city
   */
  static async getCityStats(city) {
    try {
      const cityLower = city.toLowerCase();
      const totalPlaces = await Place.countDocuments({ city: cityLower });
      const avgRating = await Place.aggregate([
        { $match: { city: cityLower, rating: { $gt: 0 } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } },
      ]);

      const typeDistribution = await Place.aggregate([
        { $match: { city: cityLower } },
        { $unwind: '$types' },
        { $group: { _id: '$types', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      return {
        city: cityLower,
        totalPlaces,
        averageRating: avgRating.length > 0 ? avgRating[0].avgRating.toFixed(2) : 0,
        typeDistribution,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PlacesService;
