"""
Review Sentiment Model Training
Smart Itinerary Planner - Phase 2

Trains a sentiment classifier using review text to predict positive/negative sentiment.
Uses TF-IDF vectorization + Logistic Regression.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib
import os
import warnings
warnings.filterwarnings('ignore')

QUALITY_THRESHOLD = 4.0
MIN_REVIEW_SAMPLES = 50


def has_review_text(value):
    return pd.notna(value) and str(value).strip() != ''

print("\n" + "="*60)
print("SENTIMENT MODEL TRAINING - Smart Itinerary Planner")
print("="*60 + "\n")

# Step 1: Load Dataset
print("📂 Loading dataset...")
try:
    df = pd.read_csv('dataset/places.csv')
    print(f"✓ Loaded {len(df)} places from dataset")
except FileNotFoundError:
    print("✗ Error: dataset/places.csv not found!")
    print("  Run: node ../Backend/scripts/exportPlacesDataset.js")
    exit(1)

required_columns = {'name', 'category', 'rating', 'review', 'city', 'lat', 'lng'}
missing_columns = required_columns - set(df.columns)
if missing_columns:
    print(f"✗ Error: Missing columns in dataset: {sorted(missing_columns)}")
    exit(1)

df['rating'] = pd.to_numeric(df['rating'], errors='coerce')
df = df.dropna(subset=['rating'])

# Step 2: Filter places with reviews
print("\n📝 Filtering places with reviews...")
df_with_reviews = df[df['review'].apply(has_review_text)]
print(f"✓ Found {len(df_with_reviews)} places with reviews")

if len(df_with_reviews) < MIN_REVIEW_SAMPLES:
    print(f"⚠️  Only {len(df_with_reviews)} reviews found (minimum {MIN_REVIEW_SAMPLES} required)")
    print("  Skipping TF-IDF sentiment model — no review text available from Google Places API.")
    print("  Feature generation will assign neutral sentiment (0.5) to all places.")
    print("  Recommendation model will train on ratings only.")
    os.makedirs('models', exist_ok=True)
    with open('models/sentiment_skipped.flag', 'w') as f:
        f.write('skipped: insufficient reviews')
    print("\n" + "="*60)
    print("⚠️  SENTIMENT STEP SKIPPED — NO REVIEWS IN DATASET")
    print("="*60 + "\n")
    exit(0)

# Step 3: Prepare features and labels
print("\n🎯 Preparing training data...")

# X = review text
X = df_with_reviews['review'].values

# y = rating > QUALITY_THRESHOLD (positive: 1, negative: 0)
y = (df_with_reviews['rating'] > QUALITY_THRESHOLD).astype(int).values

print(f"✓ Features (X): {len(X)} reviews")
print(f"✓ Labels (y): {len(y)} sentiment labels")
print(f"  - Positive (rating > {QUALITY_THRESHOLD}): {sum(y)} places")
print(f"  - Negative (rating ≤ {QUALITY_THRESHOLD}): {len(y) - sum(y)} places")

# Step 4: Split dataset
print("\n✂️  Splitting dataset...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"✓ Training set: {len(X_train)} samples")
print(f"✓ Test set: {len(X_test)} samples")

# Step 5: Vectorize text using TF-IDF
print("\n🔤 Vectorizing text with TF-IDF...")
vectorizer = TfidfVectorizer(
    max_features=5000,
    min_df=2,
    max_df=0.8,
    ngram_range=(1, 2),
    stop_words='english'
)

X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

print(f"✓ Vocabulary size: {len(vectorizer.vocabulary_)}")
print(f"✓ Feature matrix shape: {X_train_vec.shape}")

# Step 6: Train Logistic Regression model
print("\n🤖 Training Logistic Regression model...")
model = LogisticRegression(
    random_state=42,
    max_iter=1000,
    C=1.0
)

model.fit(X_train_vec, y_train)
print("✓ Model training complete")

# Step 7: Evaluate model
print("\n📊 Evaluating model performance...")
y_pred = model.predict(X_test_vec)
accuracy = accuracy_score(y_test, y_pred)

print(f"\n✓ Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")

print("\n📈 Classification Report:")
print(classification_report(y_test, y_pred, 
                          target_names=['Negative', 'Positive'],
                          digits=4))

print("🔢 Confusion Matrix:")
cm = confusion_matrix(y_test, y_pred)
print(f"  True Negative: {cm[0][0]}, False Positive: {cm[0][1]}")
print(f"  False Negative: {cm[1][0]}, True Positive: {cm[1][1]}")

# Step 8: Save models
print("\n💾 Saving models...")
os.makedirs('models', exist_ok=True)

joblib.dump(model, 'models/sentiment_model.pkl')
print("✓ Saved: models/sentiment_model.pkl")

joblib.dump(vectorizer, 'models/vectorizer.pkl')
print("✓ Saved: models/vectorizer.pkl")

# Step 9: Test prediction
print("\n🧪 Testing prediction...")
test_reviews = [
    "Amazing place! Beautiful views and great atmosphere.",
    "Terrible experience. Very crowded and dirty.",
    "It's okay, nothing special."
]

for review in test_reviews:
    review_vec = vectorizer.transform([review])
    prediction = model.predict(review_vec)[0]
    probability = model.predict_proba(review_vec)[0]
    sentiment = "Positive" if prediction == 1 else "Negative"
    confidence = max(probability) * 100
    
    print(f"\nReview: \"{review}\"")
    print(f"  → Sentiment: {sentiment} (confidence: {confidence:.1f}%)")

print("\n" + "="*60)
print("✅ SENTIMENT MODEL TRAINED SUCCESSFULLY!")
print("="*60 + "\n")
