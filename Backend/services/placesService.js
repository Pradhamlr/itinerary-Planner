const axios = require('axios');
const Place = require('../models/Place');

class PlacesService {
  static async fetchPlacesFromAPI(lat, lon, radius = 10000) {
    try {
      const apiKey = process.env.OPENTRIPMAP_API_KEY;

      if (!apiKey || apiKey === 'your_opentripmap_api_key_here') {
        throw new Error('OpenTripMap API key not configured. Please add OPENTRIPMAP_API_KEY to .env');
      }

      const response = await axios.get('https://api.opentripmap.com/0.1/en/places/radius', {
        params: {
          lat,
          lon,
          radius,
          kinds: 'interesting_places',
          limit: 40,
          apikey: apiKey,
        },
        timeout: 15000,
      });

      if (!response.data || !response.data.features) {
        return [];
      }

      return response.data.features.map((feature) => ({
        name: feature.properties.name || 'Unnamed Place',
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
        category: this.mapCategory(feature.properties.kinds),
        rating: feature.properties.rate || null,
        description: feature.properties.wikipedia_extracts?.text || '',
        source: 'opentripmap',
        place_id: feature.properties.xid,
      }));
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('OpenTripMap rate limit exceeded. Please try again later.');
      }
      throw error;
    }
  }

  static mapCategory(kinds) {
    if (!kinds) return 'other';

    const categoryMap = {
      museum: 'museum',
      monument: 'monument',
      historic: 'historic',
      'natural': 'nature',
      'nature': 'nature',
      religious: 'religious',
      architecture: 'architecture',
      restaurants: 'restaurant',
      'eating': 'restaurant',
      entertainment: 'entertainment',
      parks: 'park',
      'park': 'park',
    };

    // Check if kinds contains any mapped category
    const kindsArray = kinds.split(',');
    for (let kind of kindsArray) {
      kind = kind.trim().toLowerCase();
      if (categoryMap[kind]) {
        return categoryMap[kind];
      }
    }

    return 'interesting_places';
  }

  static async getPlacesByCity(city, forceRefresh = false) {
    try {
      const cityLower = city.toLowerCase();

      // Check if places exist in cache (unless force refresh)
      if (!forceRefresh) {
        const cachedPlaces = await Place.find({ city: cityLower });
        if (cachedPlaces.length > 0) {
          return cachedPlaces;
        }
      }

      // Import here to avoid circular dependency
      const GeocodingService = require('./geocodingService');

      // Get coordinates from Nominatim
      const coordinates = await GeocodingService.getCoordinates(city);

      // Fetch places from OpenTripMap
      const places = await this.fetchPlacesFromAPI(coordinates.latitude, coordinates.longitude);

      // Store in database
      const placesToInsert = places.map((place) => ({
        ...place,
        city: cityLower,
      }));

      // Use insertMany with ordered: false to skip duplicates
      await Place.insertMany(placesToInsert, { ordered: false }).catch((err) => {
        // Ignore duplicate key errors
        if (err.code !== 11000) {
          throw err;
        }
      });

      // Return all places for this city
      const allPlaces = await Place.find({ city: cityLower }).limit(50);
      return allPlaces;
    } catch (error) {
      throw error;
    }
  }

  static async getPlacesFromCache(city) {
    try {
      const cityLower = city.toLowerCase();
      const places = await Place.find({ city: cityLower }).limit(50);
      return places;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PlacesService;
