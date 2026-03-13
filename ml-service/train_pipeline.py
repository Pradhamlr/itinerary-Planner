"""
Complete ML Training Pipeline
Smart Itinerary Planner - Phase 2

Runs the complete training pipeline:
1. Train sentiment model
2. Generate features
3. Train recommendation model
"""

import subprocess
import sys
import os

print("\n" + "="*70)
print(" "*15 + "ML TRAINING PIPELINE")
print(" "*10 + "Smart Itinerary Planner - Phase 2")
print("="*70 + "\n")

def run_script(script_name, description):
    """Run a Python script and handle errors"""
    print(f"\n{'='*70}")
    print(f"STEP: {description}")
    print(f"{'='*70}\n")
    
    try:
        result = subprocess.run(
            [sys.executable, script_name],
            check=True,
            capture_output=False
        )
        print(f"\n✅ {description} - COMPLETED")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ {description} - FAILED")
        print(f"Error: {e}")
        return False
    except FileNotFoundError:
        print(f"\n❌ Script not found: {script_name}")
        return False

def check_dataset():
    """Check if dataset exists"""
    if not os.path.exists('dataset/places.csv'):
        print("❌ Dataset not found: dataset/places.csv")
        print("\n📋 Please run the export script first:")
        print("   cd ../Backend")
        print("   node scripts/exportPlacesDataset.js")
        return False
    return True


def check_columns(file_path, required_columns):
    import pandas as pd

    try:
        df = pd.read_csv(file_path)
    except Exception as error:
        print(f"❌ Unable to read {file_path}: {error}")
        return False

    missing = set(required_columns) - set(df.columns)
    if missing:
        print(f"❌ {file_path} missing columns: {sorted(missing)}")
        return False

    if len(df) == 0:
        print(f"❌ {file_path} has no rows")
        return False

    return True


def check_artifacts(paths):
    missing = [path for path in paths if not os.path.exists(path)]
    if missing:
        print(f"❌ Missing required artifacts: {missing}")
        return False
    return True

def main():
    """Run complete training pipeline"""
    
    # Check if dataset exists
    print("🔍 Checking for dataset...")
    if not check_dataset():
        print("\n❌ Pipeline aborted - dataset missing\n")
        sys.exit(1)

    if not check_columns('dataset/places.csv', ['name', 'category', 'rating', 'review', 'city', 'lat', 'lng']):
        print("\n❌ Pipeline aborted - dataset schema invalid\n")
        sys.exit(1)

    print("✅ Dataset found\n")
    
    # Step 1: Train sentiment model
    if not run_script('train_sentiment.py', 'Training Sentiment Model'):
        print("\n❌ Pipeline failed at sentiment training\n")
        sys.exit(1)

    if not check_artifacts(['models/sentiment_model.pkl', 'models/vectorizer.pkl']):
        print("\n❌ Pipeline aborted - sentiment artifacts missing\n")
        sys.exit(1)
    
    # Step 2: Generate features
    if not run_script('create_features.py', 'Generating Feature Dataset'):
        print("\n❌ Pipeline failed at feature generation\n")
        sys.exit(1)

    if not check_artifacts(['dataset/place_features.csv']):
        print("\n❌ Pipeline aborted - feature dataset missing\n")
        sys.exit(1)

    if not check_columns('dataset/place_features.csv', ['name', 'category', 'rating', 'sentiment', 'city', 'lat', 'lng']):
        print("\n❌ Pipeline aborted - feature dataset schema invalid\n")
        sys.exit(1)
    
    # Step 3: Train recommendation model
    if not run_script('train_recommendation.py', 'Training Recommendation Model'):
        print("\n❌ Pipeline failed at recommendation training\n")
        sys.exit(1)

    if not check_artifacts(['models/recommendation_model.pkl']):
        print("\n❌ Pipeline aborted - recommendation artifact missing\n")
        sys.exit(1)
    
    # Success summary
    print("\n" + "="*70)
    print(" "*20 + "🎉 PIPELINE COMPLETE! 🎉")
    print("="*70 + "\n")
    
    print("✅ All models trained successfully!\n")
    print("📦 Generated files:")
    print("   ├── models/sentiment_model.pkl")
    print("   ├── models/vectorizer.pkl")
    print("   ├── models/recommendation_model.pkl")
    print("   └── dataset/place_features.csv")
    
    print("\n🚀 Next steps:")
    print("   1. Verify models in models/ directory")
    print("   2. Test models with app.py")
    print("   3. Integrate with backend API")
    print()

if __name__ == "__main__":
    main()
