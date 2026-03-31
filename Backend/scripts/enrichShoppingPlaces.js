require('dotenv').config();
const mongoose = require('mongoose');
const Place = require('../models/Place');
const { fetchPlacesForCity } = require('../services/googlePlacesService');

const KERALA_CITIES = [
  'Kochi',
  'Thiruvananthapuram',
  'Kozhikode',
  'Alappuzha',
  'Munnar',
  'Wayanad',
  'Thrissur',
  'Kannur',
];

const SHOPPING_PLACE_TYPES = [
  'shopping_mall',
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const savePlacesToDatabase = async (places) => {
  let savedCount = 0;
  let skippedCount = 0;

  for (const place of places) {
    try {
      const existingPlace = await Place.findOne({ place_id: place.place_id });

      if (existingPlace) {
        skippedCount += 1;
        continue;
      }

      await Place.create(place);
      savedCount += 1;
    } catch (error) {
      if (error.code === 11000) {
        skippedCount += 1;
      } else {
        console.error(`  Error saving ${place.name}:`, error.message);
      }
    }
  }

  return { savedCount, skippedCount };
};

const enrichShoppingPlaces = async () => {
  console.log('\nStarting shopping-place enrichment...\n');

  let totalFetched = 0;
  let totalSaved = 0;
  let totalSkipped = 0;

  for (const city of KERALA_CITIES) {
    console.log(`\n=== ${city} ===`);
    const places = await fetchPlacesForCity(city, SHOPPING_PLACE_TYPES);
    totalFetched += places.length;

    const { savedCount, skippedCount } = await savePlacesToDatabase(places);
    totalSaved += savedCount;
    totalSkipped += skippedCount;

    console.log(`Fetched: ${places.length}`);
    console.log(`Saved: ${savedCount}`);
    console.log(`Skipped: ${skippedCount}`);
  }

  console.log('\nShopping enrichment complete.');
  console.log(`Total fetched: ${totalFetched}`);
  console.log(`Total saved: ${totalSaved}`);
  console.log(`Total skipped: ${totalSkipped}`);
}

const main = async () => {
  try {
    await connectDB();
    await enrichShoppingPlaces();
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Shopping enrichment failed:', error);
    process.exit(1);
  }
};

main();
