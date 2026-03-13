const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Trip must belong to a user'],
    },
    city: {
      type: String,
      required: [true, 'Please provide a city name'],
      trim: true,
    },
    days: {
      type: Number,
      required: [true, 'Please provide number of days'],
      min: [1, 'Trip must be at least 1 day'],
      max: [365, 'Trip cannot exceed 365 days'],
    },
    budget: {
      type: Number,
      required: [true, 'Please provide a budget'],
      min: [0, 'Budget cannot be negative'],
    },
    budgetCategory: {
      type: String,
      enum: ['low', 'medium', 'luxury'],
      default: 'medium',
    },
    pace: {
      type: String,
      enum: ['relaxed', 'moderate', 'packed'],
      default: 'moderate',
    },
    interests: {
      type: [String],
      enum: [
        'adventure',
        'culture',
        'food',
        'nature',
        'history',
        'shopping',
        'nightlife',
        'beaches',
        'art',
        'sports',
        'spiritual',
      ],
      default: [],
    },
    places: [
      {
        name: String,
        category: String,
        rating: Number,
        lat: Number,
        lng: Number,
        description: String,
        place_id: String,
        visitDate: Date,
        notes: String,
      },
    ],
    itinerary: [
      {
        day: Number,
        label: String,
        places: [
          {
            name: String,
            category: String,
            rating: Number,
            lat: Number,
            lng: Number,
            description: String,
            order: Number,
            dayNumber: Number,
          },
        ],
      },
    ],
    optimizedRoute: [
      {
        place: String,
        dayNumber: Number,
        order: Number,
        duration: Number,
      },
    ],
    restaurants: [
      {
        name: String,
        category: String,
        rating: Number,
        lat: Number,
        lng: Number,
      },
    ],
    estimatedCost: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    optimizationInfo: {
      algorithm: String,
      totalDistance: Number,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
tripSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Trip', tripSchema);
