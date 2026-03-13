const express = require('express');
const router = express.Router();
const {
  getModelInfo,
  recommendDemo,
  sentimentDemo,
  optimizeRouteStandalone,
} = require('../controllers/mlController');

// All routes are public (for showcase/demo purposes)
router.get('/model-info', getModelInfo);
router.post('/recommend-demo', recommendDemo);
router.post('/sentiment-demo', sentimentDemo);
router.post('/optimize-route', optimizeRouteStandalone);

module.exports = router;
