"""
Recommendation Model Training
Smart Itinerary Planner - Phase 2

Trains a Random Forest classifier to predict high-quality places.
Uses rating and sentiment as features.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib
import os
import warnings
warnings.filterwarnings('ignore')

QUALITY_THRESHOLD = 4.0

print("\n" + "="*60)
print("RECOMMENDATION MODEL TRAINING - Smart Itinerary Planner")
print("="*60 + "\n")

# Step 1: Load feature dataset
print("📂 Loading feature dataset...")
try:
    df = pd.read_csv('dataset/place_features.csv')
    print(f"✓ Loaded {len(df)} places with features")
except FileNotFoundError:
    print("✗ Error: dataset/place_features.csv not found!")
    print("  Run: python create_features.py")
    exit(1)

required_columns = {'rating', 'sentiment'}
missing_columns = required_columns - set(df.columns)
if missing_columns:
    print(f"✗ Error: Missing columns in feature dataset: {sorted(missing_columns)}")
    exit(1)

df['rating'] = pd.to_numeric(df['rating'], errors='coerce')
df['sentiment'] = pd.to_numeric(df['sentiment'], errors='coerce')
df = df.dropna(subset=['rating', 'sentiment'])

if len(df) < 20:
    print("✗ Error: Not enough valid samples to train recommendation model")
    exit(1)

# Step 2: Prepare features and labels
print("\n🎯 Preparing training data...")

# Features: rating and sentiment
X = df[['rating', 'sentiment']].values

# Target: rating > QUALITY_THRESHOLD (good places = 1, others = 0)
y = (df['rating'] > QUALITY_THRESHOLD).astype(int).values

print(f"✓ Features (X): {X.shape}")
print(f"  - rating: continuous (0-5)")
print(f"  - sentiment: continuous (0-1)")
print(f"\n✓ Labels (y): {len(y)} places")
print(f"  - Good places (rating > {QUALITY_THRESHOLD}): {sum(y)} ({sum(y)/len(y)*100:.1f}%)")
print(f"  - Other places (rating ≤ {QUALITY_THRESHOLD}): {len(y) - sum(y)} ({(len(y)-sum(y))/len(y)*100:.1f}%)")

# Check class balance
if sum(y) < 10 or (len(y) - sum(y)) < 10:
    print("\n⚠️  Warning: Imbalanced dataset detected")
    print("   Consider collecting more data for better model performance")

# Step 3: Split dataset
print("\n✂️  Splitting dataset...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"✓ Training set: {len(X_train)} samples")
print(f"✓ Test set: {len(X_test)} samples")

# Step 4: Train Random Forest model
print("\n🌲 Training Random Forest Classifier...")
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)
print("✓ Model training complete")

# Step 5: Evaluate model
print("\n📊 Evaluating model performance...")
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"\n✓ Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")

# Cross-validation
print("\n🔄 Cross-validation (5-fold)...")
cv_scores = cross_val_score(model, X_train, y_train, cv=5)
print(f"✓ CV Scores: {cv_scores}")
print(f"✓ Mean CV Score: {cv_scores.mean():.4f} (±{cv_scores.std()*2:.4f})")

print("\n📈 Classification Report:")
print(classification_report(y_test, y_pred, 
                          target_names=['Other Places', 'Good Places'],
                          digits=4))

print("🔢 Confusion Matrix:")
cm = confusion_matrix(y_test, y_pred)
print(f"  True Negative: {cm[0][0]}, False Positive: {cm[0][1]}")
print(f"  False Negative: {cm[1][0]}, True Positive: {cm[1][1]}")

# Step 6: Feature importance
print("\n🎯 Feature Importance:")
feature_names = ['rating', 'sentiment']
importances = model.feature_importances_
for name, importance in zip(feature_names, importances):
    print(f"  {name}: {importance:.4f} ({importance*100:.1f}%)")

# Step 7: Save model
print("\n💾 Saving recommendation model...")
os.makedirs('models', exist_ok=True)

joblib.dump(model, 'models/recommendation_model.pkl')
print("✓ Saved: models/recommendation_model.pkl")

# Step 8: Test predictions
print("\n🧪 Testing predictions...")
test_cases = [
    {'rating': 4.8, 'sentiment': 0.95, 'desc': 'High rating, very positive'},
    {'rating': 4.2, 'sentiment': 0.75, 'desc': 'Good rating, positive'},
    {'rating': 3.5, 'sentiment': 0.50, 'desc': 'Average rating, neutral'},
    {'rating': 2.8, 'sentiment': 0.30, 'desc': 'Low rating, negative'},
]

for case in test_cases:
    X_test_case = np.array([[case['rating'], case['sentiment']]])
    prediction = model.predict(X_test_case)[0]
    probability = model.predict_proba(X_test_case)[0]
    
    result = "✓ Recommend" if prediction == 1 else "✗ Don't recommend"
    confidence = max(probability) * 100
    
    print(f"\nTest: {case['desc']}")
    print(f"  Rating: {case['rating']}, Sentiment: {case['sentiment']}")
    print(f"  → {result} (confidence: {confidence:.1f}%)")

print("\n" + "="*60)
print("✅ RECOMMENDATION MODEL TRAINED SUCCESSFULLY!")
print("="*60 + "\n")

# Step 9: Model summary
print("📦 Model Summary:")
print(f"  Algorithm: Random Forest Classifier")
print(f"  Trees: {model.n_estimators}")
print(f"  Features: rating, sentiment")
print(f"  Training samples: {len(X_train)}")
print(f"  Test accuracy: {accuracy*100:.2f}%")
print(f"  Model file: models/recommendation_model.pkl")
print()
