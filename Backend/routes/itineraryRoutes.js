const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  generateItinerary,
  optimizeRoute,
  estimateCost,
} = require('../controllers/itineraryController');

// Protected routes
router.post('/generate', authMiddleware, generateItinerary);
router.post('/optimize-route', authMiddleware, optimizeRoute);

// Public route (cost estimation doesn't need auth)
router.post('/estimate-cost', estimateCost);

module.exports = router;
