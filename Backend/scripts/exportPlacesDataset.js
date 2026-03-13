require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Place = require('../models/Place');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ MongoDB connected');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Export dataset to CSV
const exportDataset = async () => {
  try {
    console.log('\n📊 Starting dataset export...\n');
    console.log('='.repeat(60));

    // Fetch all places from MongoDB
    const places = await Place.find({});
    console.log(`✓ Fetched ${places.length} places from MongoDB`);

    if (places.length === 0) {
      console.log('✗ No places found in database. Run the seeder first.');
      process.exit(1);
    }

    // Prepare CSV data
    const csvRows = [];
    
    // CSV Header
    csvRows.push('name,category,rating,review,city,lat,lng');

    // Process each place
    let placesWithReviews = 0;
    let placesWithoutReviews = 0;
    let skippedInvalidRows = 0;

    for (const place of places) {
      // Get primary category from types array
      const category = place.types && place.types.length > 0 
        ? place.types[0].replace(/_/g, ' ') 
        : 'other';

      // Aggregate all review text into one training field.
      let reviewText = '';
      if (place.reviews && place.reviews.length > 0) {
        const reviewSnippets = place.reviews
          .map((review) => {
            if (typeof review === 'string') {
              return review.trim();
            }

            if (review && review.text) {
              return String(review.text).trim();
            }

            return '';
          })
          .filter((text) => text.length > 0);

        reviewText = reviewSnippets
          .join(' || ')
          .replace(/"/g, '""')
          .replace(/\n/g, ' ')
          .replace(/\r/g, ' ');

        if (reviewText) {
          placesWithReviews++;
        } else {
          placesWithoutReviews++;
        }
      } else {
        placesWithoutReviews++;
      }

      // Escape name for CSV
      const name = place.name ? place.name.replace(/"/g, '""') : 'Unknown';
      const city = place.city || 'unknown';
      const rating = Number.isFinite(place.rating) ? place.rating : 0;
      const lat = Number.isFinite(place.lat) ? place.lat : null;
      const lng = Number.isFinite(place.lng) ? place.lng : null;

      // Skip malformed coordinate rows because downstream ML assumes numeric coordinates.
      if (lat === null || lng === null) {
        skippedInvalidRows++;
        continue;
      }

      const boundedRating = Math.max(0, Math.min(5, rating));

      // Create CSV row
      const row = `"${name}","${category}",${boundedRating},"${reviewText}","${city}",${lat},${lng}`;
      csvRows.push(row);
    }

    // Write to CSV file
    const outputPath = path.join(__dirname, '../../ml-service/dataset/places.csv');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const csvContent = csvRows.join('\n');
    
    fs.writeFileSync(outputPath, csvContent, 'utf-8');

    console.log('\n' + '='.repeat(60));
    console.log('✓ Dataset exported successfully!');
    console.log(`\n📁 Output file: ${outputPath}`);
    console.log(`📊 Total places: ${places.length}`);
    console.log(`⚠️ Skipped invalid rows: ${skippedInvalidRows}`);
    console.log(`📊 Exported rows: ${csvRows.length - 1}`);
    console.log(`📝 Places with reviews: ${placesWithReviews}`);
    console.log(`📝 Places without reviews: ${placesWithoutReviews}`);
    console.log(`💾 File size: ${(csvContent.length / 1024).toFixed(2)} KB`);
    console.log('\n✅ Ready for ML training!\n');

  } catch (error) {
    console.error('\n✗ Export failed:', error.message);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await exportDataset();
    await mongoose.connection.close();
    console.log('✓ MongoDB connection closed\n');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
};

main();
