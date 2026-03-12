require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const placesRoutes = require('./routes/placesRoutes');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Itinerary Planner API running',
    version: '1.0.0',
    phase: '2',
    endpoints: {
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login',
      },
      trips: {
        create: 'POST /api/trips',
        getAll: 'GET /api/trips',
        getOne: 'GET /api/trips/:id',
        update: 'PUT /api/trips/:id',
        delete: 'DELETE /api/trips/:id',
      },
      places: {
        fetchByCity: 'GET /api/places/:city (fetches from API + caches)',
        cachedByCity: 'GET /api/places/city/:city (cached only)',
        byCategory: 'GET /api/places/category/:city/:category',
      },
    },
  });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/places', placesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
