require('dotenv').config();
const path = require('path');
const { spawnSync } = require('child_process');

const NEXT_BATCH_CITIES = [
  'Udaipur',
  'Goa',
  'Manali',
  'Puducherry',
  'Delhi',
  'Mumbai',
  'Pune',
  'Jaipur',
];

const passthroughArgs = process.argv.slice(2);
const dryRunArgs = passthroughArgs.includes('--dry-run') ? ['--dry-run'] : [];

for (const city of NEXT_BATCH_CITIES) {
  console.log(`\n=== Fetching ${city} ===`);
  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, 'fetchPlannedCities.js'), '--city', city, ...dryRunArgs],
    { stdio: 'inherit' },
  );

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log('\nNext expansion batch fetch complete.');
