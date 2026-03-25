const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { optimizeRoute } = require('../controllers/routeOptimizerController');

const router = express.Router();

router.use(authMiddleware);

router.post('/optimize', optimizeRoute);

module.exports = router;
