require('dotenv').config();

const connectDB = require('../config/db');
const HotelService = require('../services/hotelService');
const logger = require('../utils/logger');
const { CITY_EXPANSION_PLAN, CITY_LOOKUP } = require('../config/cityExpansionPlan');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    city: '',
    priority: null,
    allCities: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--city') {
      options.city = args[index + 1] || '';
      index += 1;
    } else if (arg === '--priority') {
      options.priority = Number(args[index + 1] || 0) || null;
      index += 1;
    } else if (arg === '--all-cities') {
      options.allCities = true;
    }
  }

  return options;
}

function resolveTargetCities({ city, priority, allCities }) {
  if (allCities) {
    return null;
  }

  if (city) {
    const match = CITY_LOOKUP.get(String(city).trim().toLowerCase());
    return match ? [match.city.toLowerCase()] : [];
  }

  if (priority) {
    return CITY_EXPANSION_PLAN
      .filter((entry) => entry.priority === priority)
      .map((entry) => entry.city.toLowerCase());
  }

  return CITY_EXPANSION_PLAN
    .filter((entry) => entry.priority === 1)
    .map((entry) => entry.city.toLowerCase());
}

async function run() {
  const options = parseArgs();
  const targetCities = resolveTargetCities(options);

  try {
    await connectDB();
    const result = targetCities === null
      ? await HotelService.syncHotelsForAllCities()
      : {
          cities: targetCities,
          summary: await Promise.all(targetCities.map((city) => HotelService.syncHotelsForCity(city))),
        };

    if (Array.isArray(targetCities) && targetCities.length === 0) {
      throw new Error('No matching expansion cities found for hotel sync.');
    }

    logger.info('Hotel sync complete', {
      cities: result.cities,
      summary: result.summary,
    });

    console.log(JSON.stringify({
      success: true,
      cities: result.cities,
      summary: result.summary,
    }, null, 2));
    process.exit(0);
  } catch (error) {
    logger.error('Hotel sync failed', {
      message: error.message,
    });
    console.error(error);
    process.exit(1);
  }
}

run();
