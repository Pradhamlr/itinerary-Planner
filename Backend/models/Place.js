const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a place name'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'Please provide a city'],
      lowercase: true,
      trim: true,
    },
    lat: {
      type: Number,
      required: [true, 'Please provide latitude'],
    },
    lng: {
      type: Number,
      required: [true, 'Please provide longitude'],
    },
    category: {
      type: String,
      enum: [
        'museum',
        'monument',
        'historic',
        'nature',
        'religious',
        'architecture',
        'entertainment',
        'restaurant',
        'park',
        'interesting_places',
        'other',
      ],
      default: 'other',
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
    },
    description: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ['opentripmap', 'google', 'osm', 'manual', 'ml_model'],
      default: 'ml_model',
    },
    place_id: {
      type: String,
      unique: true,
      sparse: true,
    },
    avg_cost: {
      type: Number,
      default: 0,
    },
    visit_duration: {
      type: Number,
      default: 1.0,
    },
    best_time: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'any'],
      default: 'any',
    },
    tags: {
      type: [String],
      default: [],
    },
    budget_level: {
      type: String,
      enum: ['free', 'low', 'medium', 'luxury'],
      default: 'medium',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
placeSchema.index({ city: 1, category: 1 });
placeSchema.index({ place_id: 1 });

module.exports = mongoose.model('Place', placeSchema);
