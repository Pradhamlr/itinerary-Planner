const PlacesService = require('../services/placesService');

// @route   GET /api/places/:city
// @desc    Fetch places for a city (with API fallback if not cached)
// @access  Public
exports.getPlacesByCity = async (req, res) => {
  try {
    const { city } = req.params;
    const { refresh } = req.query;

    if (!city || city.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a city name',
      });
    }

    const forceRefresh = refresh === 'true';
    const places = await PlacesService.getPlacesByCity(city, forceRefresh);

    res.status(200).json({
      success: true,
      message: `Found ${places.length} places in ${city}`,
      data: places,
      count: places.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch places',
    });
  }
};

// @route   GET /api/places/city/:city
// @desc    Get cached places for a city (no API call)
// @access  Public
exports.getCachedPlacesByCity = async (req, res) => {
  try {
    const { city } = req.params;

    if (!city || city.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a city name',
      });
    }

    const places = await PlacesService.getPlacesFromCache(city);

    if (places.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No cached places found for ${city}. Use /api/places/:city to fetch from API.`,
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: `Found ${places.length} cached places in ${city}`,
      data: places,
      count: places.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch cached places',
    });
  }
};

// @route   GET /api/places/category/:city/:category
// @desc    Get places filtered by category
// @access  Public
exports.getPlacesByCategory = async (req, res) => {
  try {
    const { city, category } = req.params;

    if (!city || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both city and category',
      });
    }

    const Place = require('../models/Place');
    const places = await Place.find({
      city: city.toLowerCase(),
      category: category.toLowerCase(),
    }).limit(50);

    res.status(200).json({
      success: true,
      message: `Found ${places.length} ${category} places in ${city}`,
      data: places,
      count: places.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch places by category',
    });
  }
};
