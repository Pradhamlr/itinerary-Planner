const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createTrip,
  getUserTrips,
  getTripById,
  updateTrip,
  deleteTrip,
} = require('../controllers/tripController');

// All trip routes are protected with auth middleware
router.use(authMiddleware);

// POST /api/trips - Create a new trip
router.post('/', createTrip);

// GET /api/trips - Get all trips for user
router.get('/', getUserTrips);

// GET /api/trips/:id - Get single trip
router.get('/:id', getTripById);

// PUT /api/trips/:id - Update trip
router.put('/:id', updateTrip);

// DELETE /api/trips/:id - Delete trip
router.delete('/:id', deleteTrip);

module.exports = router;
