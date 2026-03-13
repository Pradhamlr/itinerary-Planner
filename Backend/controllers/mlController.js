const axios = require('axios');
const RoutingService = require('../services/routingService');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Geocode a place name → { lat, lng } using Google Maps Geocoding API
 */
async function geocodePlace(placeName) {
  const url = 'https://maps.googleapis.com/maps/api/geocode/json';
  const response = await axios.get(url, {
    params: { address: placeName, key: GOOGLE_MAPS_API_KEY },
    timeout: 10000,
  });

  if (
    response.data.status !== 'OK' ||
    !response.data.results ||
    response.data.results.length === 0
  ) {
    throw new Error(`Could not geocode "${placeName}"`);
  }

  const loc = response.data.results[0].geometry.location;
  return {
    lat: loc.lat,
    lng: loc.lng,
    formattedAddress: response.data.results[0].formatted_address,
  };
}

// @route   GET /api/ml/model-info
// @desc    Get ML model details (for showcase)
// @access  Public
exports.getModelInfo = async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/model-info`);
    res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch model info from ML service',
    });
  }
};

// @route   POST /api/ml/recommend-demo
// @desc    Live recommendation demo (for showcase)
// @access  Public
exports.recommendDemo = async (req, res) => {
  try {
    const { city, interests, budget_category, top_n } = req.body;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City is required',
      });
    }

    const response = await axios.post(`${ML_SERVICE_URL}/recommend`, {
      city,
      interests: interests || [],
      budget_category: budget_category || 'medium',
      top_n: Math.min(top_n || 10, 20),
    });

    res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.response?.data?.error || 'Recommendation failed',
    });
  }
};

// @route   POST /api/ml/sentiment-demo
// @desc    Live sentiment analysis demo (for showcase)
// @access  Public
exports.sentimentDemo = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required',
      });
    }

    const response = await axios.post(`${ML_SERVICE_URL}/sentiment`, { text });

    res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sentiment analysis failed',
    });
  }
};

// @route   POST /api/ml/optimize-route
// @desc    Standalone route optimizer — input place names, geocode via Google Maps, get optimal path
// @access  Public
exports.optimizeRouteStandalone = async (req, res) => {
  try {
    const { places, startIndex } = req.body;

    if (!places || !Array.isArray(places) || places.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least 2 places with a name',
      });
    }

    if (places.length > 15) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 15 places allowed',
      });
    }

    // Geocode all place names in parallel via Google Maps API (with per-place error handling)
    const geocodeResults = await Promise.all(
      places.map(async (p) => {
        const name = (typeof p === 'string' ? p : p.name || '').trim();
        if (!name) return null;

        // If lat/lng already provided, skip geocoding
        if (p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng)) {
          return { name, lat: parseFloat(p.lat), lng: parseFloat(p.lng), formattedAddress: name };
        }

        try {
          const geo = await geocodePlace(name);
          return { name, lat: geo.lat, lng: geo.lng, formattedAddress: geo.formattedAddress };
        } catch {
          return null; // Skip places that fail to geocode instead of crashing the batch
        }
      })
    );

    const validPlaces = geocodeResults.filter(Boolean);

    if (validPlaces.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Could not geocode enough places. At least 2 valid places required.',
      });
    }

    const result = RoutingService.optimizeRoute(validPlaces, {
      algorithm: 'auto',
      startIndex: typeof startIndex === 'number' ? startIndex : 0,
    });

    // Build distance matrix for display
    const distMatrix = RoutingService.buildDistanceMatrix(validPlaces);

    res.status(200).json({
      success: true,
      message: 'Route optimized successfully',
      data: {
        ...result,
        distanceMatrix: distMatrix,
        inputPlaces: validPlaces.length,
        geocodedPlaces: validPlaces,
        algorithmDetails: {
          name: result.algorithm === 'dynamic-programming'
            ? 'Held-Karp Dynamic Programming'
            : 'Nearest Neighbor Heuristic',
          complexity: result.algorithm === 'dynamic-programming'
            ? 'O(2^n × n)'
            : 'O(n²)',
          optimal: result.algorithm === 'dynamic-programming',
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Route optimization failed',
    });
  }
};
