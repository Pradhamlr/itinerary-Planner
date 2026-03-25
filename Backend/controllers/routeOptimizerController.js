const ItineraryService = require('../services/itineraryService');

exports.optimizeRoute = async (req, res) => {
  try {
    const { places, startLocation, optimizationMode } = req.body;

    if (!Array.isArray(places) || places.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 2 destinations to optimize.',
      });
    }

    const optimizedRoute = await ItineraryService.optimizeCustomRoute({
      places,
      startLocation,
      optimizationMode,
    });

    res.status(200).json({
      success: true,
      message: 'Route optimized successfully',
      data: optimizedRoute,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to optimize route',
    });
  }
};
