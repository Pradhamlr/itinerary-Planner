require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Place = require('../models/Place');
const { CITY_EXPANSION_PLAN, CITY_LOOKUP } = require('../config/cityExpansionPlan');

const CORE_COLUMNS = ['name', 'category', 'types', 'rating', 'review', 'city', 'lat', 'lng'];
const ENRICHED_COLUMNS = ['review_count', 'review_avg_rating', 'user_ratings_total'];
const OUTPUT_PATH = path.join(__dirname, '../../ml-service/dataset_expansion/places_expansion.csv');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    city: '',
    priority: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--city') {
      options.city = args[index + 1] || '';
      index += 1;
    } else if (arg === '--priority') {
      options.priority = Number(args[index + 1] || 0) || null;
      index += 1;
    }
  }

  return options;
};

const resolveCities = ({ city, priority }) => {
  if (city) {
    const match = CITY_LOOKUP.get(String(city).trim().toLowerCase());
    return match ? [match.city.toLowerCase()] : [];
  }

  if (priority) {
    return CITY_EXPANSION_PLAN
      .filter((entry) => entry.priority === priority)
      .map((entry) => entry.city.toLowerCase());
  }

  return CITY_EXPANSION_PLAN.map((entry) => entry.city.toLowerCase());
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const escapeCsv = (value) => {
  if (value === null || value === undefined) {
    return '""';
  }

  const sanitized = String(value)
    .replace(/"/g, '""')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ');

  return `"${sanitized}"`;
};

const normalizeCategory = (types) => {
  if (!Array.isArray(types) || types.length === 0) {
    return 'other';
  }

  return String(types[0]).replace(/_/g, ' ').trim() || 'other';
};

const extractReviewSignals = (place) => {
  const reviews = Array.isArray(place.reviews) ? place.reviews : [];
  const normalizedReviews = reviews
    .map((review) => {
      if (typeof review === 'string') {
        return {
          text: review.trim(),
          rating: null,
        };
      }

      return {
        text: typeof review?.text === 'string' ? review.text.trim() : '',
        rating: Number.isFinite(review?.rating) ? Number(review.rating) : null,
      };
    })
    .filter((review) => review.text.length > 0);

  const reviewText = normalizedReviews.map((review) => review.text).join(' || ');
  const ratings = normalizedReviews
    .map((review) => review.rating)
    .filter((rating) => Number.isFinite(rating));

  const reviewCount = normalizedReviews.length;
  const reviewAvgRating = ratings.length > 0
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    : (Number.isFinite(place.rating) ? place.rating : 0);

  return {
    reviewText,
    reviewCount,
    reviewAvgRating,
  };
};

const exportDataset = async (cities) => {
  console.log('\nStarting expansion dataset export...\n');
  console.log('='.repeat(60));
  console.log(`Target cities: ${cities.join(', ')}`);

  const places = await Place.find({ city: { $in: cities } });
  console.log(`Fetched ${places.length} places from MongoDB`);

  if (places.length === 0) {
    console.log('No places found for the selected expansion cities.');
    process.exit(1);
  }

  const csvRows = [];
  csvRows.push([...CORE_COLUMNS, ...ENRICHED_COLUMNS].join(','));

  let skippedInvalidRows = 0;

  for (const place of places) {
    const category = normalizeCategory(place.types);
    const { reviewText, reviewCount, reviewAvgRating } = extractReviewSignals(place);
    const rating = Number.isFinite(place.rating) ? Math.max(0, Math.min(5, place.rating)) : 0;
    const lat = Number.isFinite(place.lat) ? place.lat : null;
    const lng = Number.isFinite(place.lng) ? place.lng : null;
    const userRatingsTotal = Number.isFinite(place.user_ratings_total) ? place.user_ratings_total : 0;

    if (lat === null || lng === null) {
      skippedInvalidRows += 1;
      continue;
    }

    const row = [
      escapeCsv(place.name || 'Unknown'),
      escapeCsv(category),
      escapeCsv(Array.isArray(place.types) ? place.types.join(' | ') : ''),
      rating,
      escapeCsv(reviewText),
      escapeCsv(place.city || 'unknown'),
      lat,
      lng,
      reviewCount,
      Number(reviewAvgRating.toFixed(4)),
      userRatingsTotal,
    ].join(',');

    csvRows.push(row);
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  const csvContent = csvRows.join('\n');
  fs.writeFileSync(OUTPUT_PATH, csvContent, 'utf-8');

  console.log('\n' + '='.repeat(60));
  console.log('Expansion dataset exported successfully');
  console.log(`Output file: ${OUTPUT_PATH}`);
  console.log(`Total places fetched: ${places.length}`);
  console.log(`Skipped invalid rows: ${skippedInvalidRows}`);
  console.log(`Exported rows: ${csvRows.length - 1}`);
  console.log(`File size: ${(csvContent.length / 1024).toFixed(2)} KB`);
  console.log('\nReady for expansion feature generation\n');
};

const main = async () => {
  const options = parseArgs();
  const cities = resolveCities(options);

  if (cities.length === 0) {
    console.log('No matching cities found in the expansion plan.');
    process.exit(1);
  }

  try {
    await connectDB();
    await exportDataset(cities);
    await mongoose.connection.close();
    console.log('MongoDB connection closed\n');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
};

main();
