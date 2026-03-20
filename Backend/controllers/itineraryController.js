const TripService = require('../services/tripService');
const ItineraryService = require('../services/itineraryService');

exports.getItinerary = async (req, res) => {
  try {
    const trip = await TripService.getTripById(req.params.tripId, req.user.userId);

    const result = await ItineraryService.generateItinerary(trip);

    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Trip not found') {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (error.message === 'Not authorized to access this trip') {
      return res.status(403).json({ message: 'Not authorized to access this trip' });
    }

    return res.status(500).json({ message: error.message || 'Failed to generate itinerary' });
  }
};
