const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

class GeocodingService {
  /**
   * Get coordinates for a city from the ML service dataset.
   * No external API calls - uses locally stored city data.
   */
  static async getCoordinates(city) {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/cities`, {
        timeout: 10000,
      });

      if (!response.data || !response.data.cities) {
        throw new Error('Failed to fetch city data from ML service.');
      }

      const cityLower = city.toLowerCase().trim();
      const cityData = response.data.cities.find(
        (c) => c.name === cityLower || c.display_name.toLowerCase() === cityLower
      );

      if (!cityData) {
        throw new Error(
          `City "${city}" not found in our dataset. Available cities: ${response.data.cities.map((c) => c.display_name).join(', ')}`
        );
      }

      return {
        city: cityData.name,
        latitude: cityData.lat,
        longitude: cityData.lng,
        displayName: `${cityData.display_name}, ${cityData.state}`,
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('ML Service is not running. Please start it with: python app.py');
      }
      throw error;
    }
  }
}

module.exports = GeocodingService;
