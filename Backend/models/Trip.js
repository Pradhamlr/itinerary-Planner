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
      ],
      default: [],
    },
    places: [
      {
        name: String,
        category: String,
        rating: Number,
        visitDate: Date,
        notes: String,
      },
    ],
    optimizedRoute: [
      {
        place: String,
        dayNumber: Number,
        order: Number,
        duration: Number, // in hours
      },
    ],
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
