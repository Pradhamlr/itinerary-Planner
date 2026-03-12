const axios = require('axios');

class GeocodingService {
  static async getCoordinates(city) {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: city,
          format: 'json',
          limit: 1,
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Smart-Itinerary-Planner/1.0',
        },
      });

      if (!response.data || response.data.length === 0) {
        throw new Error(`City "${city}" not found. Please check the spelling.`);
      }

      const result = response.data[0];

      return {
        city: city.toLowerCase(),
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        displayName: result.display_name,
      };
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('Nominatim rate limit exceeded. Please try again later.');
      }
      throw error;
    }
  }
}

module.exports = GeocodingService;
