const ItineraryService = require('../services/itineraryService');
const RoutingService = require('../services/routingService');
const CostEstimatorService = require('../services/costEstimatorService');

// @route   POST /api/itinerary/generate
// @desc    Generate a complete day-wise itinerary
// @access  Private
exports.generateItinerary = async (req, res) => {
  try {
    const { city, days, budget, interests, pace, budgetCategory } = req.body;

    if (!city || !days) {
      return res.status(400).json({
        success: false,
        message: 'Please provide city and number of days',
      });
    }

    const itinerary = await ItineraryService.generateItinerary({
      city,
      days: Number(days),
      budget: Number(budget) || 0,
      interests: interests || [],
      pace: pace || 'moderate',
      budgetCategory: budgetCategory || 'medium',
    });

    res.status(200).json({
      success: true,
      message: 'Itinerary generated successfully',
      data: itinerary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate itinerary',
    });
  }
};

// @route   POST /api/itinerary/optimize-route
// @desc    Optimize visit order for selected places (TSP)
// @access  Private
exports.optimizeRoute = async (req, res) => {
  try {
    const { places, algorithm } = req.body;

    if (!places || !Array.isArray(places) || places.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 2 places with lat/lng coordinates',
      });
    }

    // Validate coordinates
    const validPlaces = places.filter((p) => p.lat != null && p.lng != null);
    if (validPlaces.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 places must have valid coordinates',
      });
    }

    const result = RoutingService.optimizeRoute(validPlaces, {
      algorithm: algorithm || 'auto',
    });

    res.status(200).json({
      success: true,
      message: 'Route optimized successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to optimize route',
    });
  }
};

// @route   POST /api/itinerary/estimate-cost
// @desc    Get cost estimation for a trip
// @access  Public
exports.estimateCost = async (req, res) => {
  try {
    const { city, days, budgetCategory, numPlaces } = req.body;

    if (!city || !days) {
      return res.status(400).json({
        success: false,
        message: 'Please provide city and number of days',
      });
    }

    const cost = CostEstimatorService.estimate(
      city,
      Number(days),
      budgetCategory || 'medium',
      Number(numPlaces) || 0
    );

    res.status(200).json({
      success: true,
      message: 'Cost estimated successfully',
      data: cost,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to estimate cost',
    });
  }
};
