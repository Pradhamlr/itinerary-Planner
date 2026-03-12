const express = require('express');
const router = express.Router();
const { getPlacesByCity, getCachedPlacesByCity, getPlacesByCategory } = require('../controllers/placesController');

// GET /api/places/:city - Fetch places with API fallback
router.get('/:city', getPlacesByCity);

// GET /api/places/city/:city - Get only cached places (no API call)
router.get('/city/:city', getCachedPlacesByCity);

// GET /api/places/category/:city/:category - Get places by category
router.get('/category/:city/:category', getPlacesByCategory);

module.exports = router;
