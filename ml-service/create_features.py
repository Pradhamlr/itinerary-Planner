"""
Feature Dataset Generation
Smart Itinerary Planner - Phase 2

Loads the trained sentiment model and generates sentiment scores for all places.
Creates a feature dataset with: category, rating, sentiment
"""

import pandas as pd
import numpy as np
import joblib
import os
import warnings
warnings.filterwarnings('ignore')


def has_review_text(value):
    return pd.notna(value) and str(value).strip() != ''

print("\n" + "="*60)
print("FEATURE DATASET GENERATION - Smart Itinerary Planner")
print("="*60 + "\n")

# Step 1: Load original dataset
print("📂 Loading original dataset...")
try:
    df = pd.read_csv('dataset/places.csv')
    print(f"✓ Loaded {len(df)} places")
except FileNotFoundError:
    print("✗ Error: dataset/places.csv not found!")
    exit(1)

required_columns = {'name', 'category', 'rating', 'review', 'city', 'lat', 'lng'}
missing_columns = required_columns - set(df.columns)
if missing_columns:
    print(f"✗ Error: Missing columns in dataset: {sorted(missing_columns)}")
    exit(1)

df['rating'] = pd.to_numeric(df['rating'], errors='coerce')
df = df.dropna(subset=['rating']).copy()

# Step 2: Load trained sentiment model (optional — skipped when no reviews)
print("\n🤖 Loading trained sentiment model...")
sentiment_model = None
vectorizer = None

if os.path.exists('models/sentiment_skipped.flag'):
    print("⚠️  Sentiment model was skipped (no review text in dataset)")
    print("  All places will receive neutral sentiment score (0.5)")
elif os.path.exists('models/sentiment_model.pkl') and os.path.exists('models/vectorizer.pkl'):
    try:
        sentiment_model = joblib.load('models/sentiment_model.pkl')
        vectorizer = joblib.load('models/vectorizer.pkl')
        print("✓ Sentiment model loaded")
        print("✓ Vectorizer loaded")
    except Exception as e:
        print(f"⚠️  Could not load sentiment model: {e}")
        print("  Falling back to neutral sentiment (0.5) for all places")
else:
    print("⚠️  Sentiment model not found — using neutral sentiment (0.5) for all places")

# Step 3: Generate sentiment scores
print("\n🎯 Generating sentiment scores...")

sentiment_scores = []
places_with_reviews = 0
places_without_reviews = 0

for idx, row in df.iterrows():
    review = row['review']
    
    if not has_review_text(review) or sentiment_model is None or vectorizer is None:
        # No review text, or no trained model: use neutral sentiment
        sentiment = 0.5
        places_without_reviews += 1
    else:
        # Has review and model: predict sentiment
        review_vec = vectorizer.transform([str(review).strip()])
        prediction_proba = sentiment_model.predict_proba(review_vec)[0]
        sentiment = prediction_proba[1]  # Probability of positive class
        places_with_reviews += 1
    
    sentiment_scores.append(sentiment)
    
    # Progress indicator
    if (idx + 1) % 1000 == 0:
        print(f"  Processed {idx + 1}/{len(df)} places...")

print(f"\n✓ Generated sentiment scores for {len(df)} places")
print(f"  - With reviews: {places_with_reviews}")
print(f"  - Without reviews: {places_without_reviews}")

# Step 4: Create feature dataset
print("\n📊 Creating feature dataset...")

feature_df = pd.DataFrame({
    'name': df['name'],
    'category': df['category'],
    'rating': df['rating'],
    'sentiment': sentiment_scores,
    'city': df['city'],
    'lat': df['lat'],
    'lng': df['lng']
})

# Step 5: Display statistics
print("\n📈 Dataset Statistics:")
print(f"  Total places: {len(feature_df)}")
print(f"  Average rating: {feature_df['rating'].mean():.2f}")
print(f"  Average sentiment: {feature_df['sentiment'].mean():.2f}")
print(f"\n  Sentiment distribution:")
print(f"    High (>0.7): {len(feature_df[feature_df['sentiment'] > 0.7])}")
print(f"    Medium (0.4-0.7): {len(feature_df[(feature_df['sentiment'] >= 0.4) & (feature_df['sentiment'] <= 0.7)])}")
print(f"    Low (<0.4): {len(feature_df[feature_df['sentiment'] < 0.4])}")

# Step 6: Save feature dataset
print("\n💾 Saving feature dataset...")
output_path = 'dataset/place_features.csv'
os.makedirs('dataset', exist_ok=True)
feature_df.to_csv(output_path, index=False)
print(f"✓ Saved: {output_path}")

# Step 7: Display sample data
print("\n📋 Sample data (first 5 rows):")
print(feature_df[['name', 'category', 'rating', 'sentiment']].head())

print("\n" + "="*60)
print("✅ FEATURE DATASET CREATED SUCCESSFULLY!")
print("="*60 + "\n")
