const axios = require('axios');
const Place = require('../models/Place');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

class PlacesService {
  /**
   * Fetch places from the local ML recommendation service.
   */
  static async fetchPlacesFromMLService(city) {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/places/${encodeURIComponent(city)}`, {
        timeout: 10000,
      });

      if (!response.data || !response.data.places) {
        return [];
      }

      return response.data.places.map((place) => ({
        name: place.name,
        city: place.city,
        lat: place.lat,
        lng: place.lng,
        category: place.category,
        rating: place.rating,
        description: place.description,
        source: 'ml_model',
        place_id: `ml_${place.city}_${place.name.replace(/\s+/g, '_').toLowerCase()}`,
        avg_cost: place.avg_cost,
        visit_duration: place.visit_duration,
        best_time: place.best_time,
        tags: place.tags,
        budget_level: place.budget_level,
      }));
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('ML Service is not running. Please start it with: python app.py');
      }
      throw error;
    }
  }

  /**
   * Get ML-powered recommendations for a city with interest matching.
   */
  static async getRecommendations(city, interests = [], budgetCategory = 'medium', topN = 15) {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/recommend`, {
        city,
        interests,
        budget_category: budgetCategory,
        top_n: topN,
      }, { timeout: 10000 });

      if (!response.data || !response.data.recommendations) {
        return [];
      }

      return response.data.recommendations.map((place) => ({
        name: place.name,
        city: place.city,
        lat: place.lat,
        lng: place.lng,
        category: place.category,
        rating: place.rating,
        description: place.description,
        source: 'ml_model',
        place_id: `ml_${place.city}_${place.name.replace(/\s+/g, '_').toLowerCase()}`,
        avg_cost: place.avg_cost,
        visit_duration: place.visit_duration,
        best_time: place.best_time,
        tags: place.tags,
        budget_level: place.budget_level,
        score: place.score,
        interest_match: place.interest_match,
      }));
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('ML Service is not running. Please start it with: python app.py');
      }
      throw error;
    }
  }

  /**
   * Get places for a city - uses ML service, caches in MongoDB.
   */
  static async getPlacesByCity(city, forceRefresh = false) {
    try {
      const cityLower = city.toLowerCase().trim();

      // Check MongoDB cache first
      if (!forceRefresh) {
        const cachedPlaces = await Place.find({ city: cityLower });
        if (cachedPlaces.length > 0) {
          return cachedPlaces;
        }
      }

      // Fetch from ML service
      const places = await this.fetchPlacesFromMLService(cityLower);

      if (places.length === 0) {
        throw new Error(`No places found for "${city}". This city may not be in our dataset.`);
      }

      // Store in database for caching
      const placesToInsert = places.map((place) => ({
        ...place,
        city: cityLower,
      }));

      await Place.deleteMany({ city: cityLower });
      await Place.insertMany(placesToInsert, { ordered: false }).catch((err) => {
        if (err.code !== 11000) throw err;
      });

      return await Place.find({ city: cityLower }).limit(50);
    } catch (error) {
      throw error;
    }
  }

  static async getPlacesFromCache(city) {
    try {
      const cityLower = city.toLowerCase().trim();
      const places = await Place.find({ city: cityLower }).limit(50);
      return places;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PlacesService;
