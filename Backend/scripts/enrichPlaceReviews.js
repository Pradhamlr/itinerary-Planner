require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

const Place = require('../models/Place');

const MONGO_URI = process.env.MONGO_URI;
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY;
const PLACE_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
const REQUEST_DELAY_MS = 300;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_REVIEWS = 5;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ MongoDB connected');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const getPlacesNeedingEnrichmentQuery = () => ({
  place_id: { $exists: true, $ne: '' },
  $or: [
    { reviews: { $exists: false } },
    { reviews: { $size: 0 } },
  ],
});

const fetchPlaceReviews = async (placeId) => {
  const response = await axios.get(PLACE_DETAILS_URL, {
    timeout: REQUEST_TIMEOUT_MS,
    params: {
      place_id: placeId,
      fields: 'reviews,rating',
      key: GOOGLE_API_KEY,
    },
  });

  return response.data;
};

const normalizeReviews = (reviews) => {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return [];
  }

  return reviews
    .slice(0, MAX_REVIEWS)
    .map((review) => {
      const text = typeof review?.text === 'string' ? review.text.trim() : '';

      if (!text) {
        return null;
      }

      return {
        author_name: typeof review.author_name === 'string' ? review.author_name : 'Google user',
        rating: Number.isFinite(review.rating) ? review.rating : undefined,
        text,
        time: Number.isFinite(review.time) ? review.time : undefined,
      };
    })
    .filter(Boolean);
};

const enrichPlaceReviews = async () => {
  if (!GOOGLE_API_KEY) {
    console.error('✗ Missing Google API key. Set GOOGLE_MAPS_API_KEY in Backend/.env');
    process.exit(1);
  }

  const query = getPlacesNeedingEnrichmentQuery();
  const totalPlaces = await Place.countDocuments(query);

  if (totalPlaces === 0) {
    console.log('✓ No places need review enrichment');
    return;
  }

  console.log(`✓ Places needing enrichment: ${totalPlaces}`);

  let processed = 0;
  let enrichedPlaces = 0;
  let skippedPlaces = 0;
  let failedRequests = 0;

  const cursor = Place.find(query)
    .select({ place_id: 1, name: 1, rating: 1, reviews: 1 })
    .lean()
    .cursor();

  for await (const place of cursor) {
    processed += 1;

    try {
      const apiResponse = await fetchPlaceReviews(place.place_id);

      if (apiResponse.status !== 'OK') {
        failedRequests += 1;
        console.error(`✗ Failed for ${place.place_id}: ${apiResponse.status}`);
      } else {
        const reviewDocs = normalizeReviews(apiResponse.result?.reviews);
        const update = {
          reviews: reviewDocs,
        };

        if (Number.isFinite(apiResponse.result?.rating)) {
          update.rating = apiResponse.result.rating;
        }

        await Place.updateOne(
          { place_id: place.place_id },
          { $set: update },
        );

        if (reviewDocs.length > 0) {
          enrichedPlaces += 1;
        } else {
          skippedPlaces += 1;
        }
      }
    } catch (error) {
      failedRequests += 1;
      console.error(`✗ Request error for ${place.place_id}: ${error.message}`);
    }

    console.log(`Processed: ${processed} / ${totalPlaces}`);
    await delay(REQUEST_DELAY_MS);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✓ Review enrichment complete');
  console.log(`📊 Processed: ${processed}`);
  console.log(`📝 Enriched places: ${enrichedPlaces}`);
  console.log(`⏭️  Skipped places: ${skippedPlaces}`);
  console.log(`⚠️  Failed requests: ${failedRequests}`);
  console.log('='.repeat(60) + '\n');
};

const main = async () => {
  try {
    await connectDB();
    await enrichPlaceReviews();
    await mongoose.connection.close();
    console.log('✓ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    try {
      await mongoose.connection.close();
    } catch (closeError) {
      // Ignore close failures during fatal shutdown.
    }
    process.exit(1);
  }
};

main();