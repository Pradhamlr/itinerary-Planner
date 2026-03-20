const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getItinerary } = require('../controllers/itineraryController');

router.use(authMiddleware);

router.get('/:tripId', getItinerary);

module.exports = router;
