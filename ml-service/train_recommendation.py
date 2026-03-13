"""
Smart Itinerary Planner - Place Recommendation Model Training
=============================================================
Trains a content-based recommendation system using TF-IDF vectorization
and cosine similarity to recommend places based on user interests, budget,
and city preferences.

Model outputs:
  - models/recommendation_model.pkl  (TF-IDF vectorizer + place features matrix)
  - models/places_data.pkl           (processed places dataframe)
"""

import json
import os
import pickle
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')


def load_dataset():
    """Load the places dataset from JSON."""
    dataset_path = os.path.join(DATA_DIR, 'places_dataset.json')
    with open(dataset_path, 'r', encoding='utf-8') as f:
        places = json.load(f)
    return pd.DataFrame(places)


def preprocess_data(df):
    """Clean and preprocess the places dataframe."""
    # Normalize city names to lowercase
    df['city'] = df['city'].str.lower().str.strip()

    # Create a combined text feature for TF-IDF
    # This combines tags, category, subcategory, and description
    df['tags_str'] = df['tags'].apply(lambda x: ' '.join(x))
    df['combined_features'] = (
        df['category'] + ' ' +
        df['subcategory'] + ' ' +
        df['tags_str'] + ' ' +
        df['description'].str.lower()
    )

    # Create budget level based on average cost
    df['budget_level'] = pd.cut(
        df['avg_cost'],
        bins=[-1, 0, 100, 500, float('inf')],
        labels=['free', 'low', 'medium', 'luxury']
    )

    return df


def build_tfidf_model(df):
    """Build TF-IDF vectorizer and compute feature matrix."""
    vectorizer = TfidfVectorizer(
        max_features=500,
        stop_words='english',
        ngram_range=(1, 2)
    )
    tfidf_matrix = vectorizer.fit_transform(df['combined_features'])
    return vectorizer, tfidf_matrix


def compute_interest_profiles(df, vectorizer, tfidf_matrix):
    """
    Pre-compute interest profiles for each interest tag.
    For each interest, find the average TF-IDF vector of all places
    that match that interest.
    """
    all_interests = set()
    for tags in df['tags']:
        all_interests.update(tags)

    interest_profiles = {}
    for interest in all_interests:
        mask = df['tags'].apply(lambda x: interest in x).values
        if mask.sum() > 0:
            profile = tfidf_matrix[mask].mean(axis=0)
            interest_profiles[interest] = np.asarray(profile).flatten()

    return interest_profiles


def recommend_places(df, vectorizer, tfidf_matrix, interest_profiles,
                     city, interests, budget_category='medium', top_n=20):
    """
    Recommend places for a given city based on user interests.

    Args:
        city: Target city name
        interests: List of interest tags (e.g., ['history', 'food', 'nature'])
        budget_category: 'low', 'medium', or 'luxury'
        top_n: Number of recommendations to return

    Returns:
        DataFrame of recommended places sorted by score
    """
    # Filter by city
    city_mask = df['city'] == city.lower().strip()
    city_df = df[city_mask].copy()

    if city_df.empty:
        return pd.DataFrame()

    city_indices = city_df.index.tolist()
    city_tfidf = tfidf_matrix[city_indices]

    # Build user interest vector by averaging interest profiles
    user_vector = np.zeros(tfidf_matrix.shape[1])
    matched_interests = 0
    for interest in interests:
        interest_lower = interest.lower().strip()
        if interest_lower in interest_profiles:
            user_vector += interest_profiles[interest_lower]
            matched_interests += 1

    if matched_interests > 0:
        user_vector /= matched_interests

    # Compute cosine similarity between user interests and city places
    similarity_scores = cosine_similarity(
        user_vector.reshape(1, -1), city_tfidf
    ).flatten()

    city_df = city_df.copy()
    city_df['interest_score'] = similarity_scores

    # Budget scoring
    budget_map = {
        'low': {'free': 1.0, 'low': 0.8, 'medium': 0.3, 'luxury': 0.1},
        'medium': {'free': 0.7, 'low': 0.8, 'medium': 1.0, 'luxury': 0.5},
        'luxury': {'free': 0.3, 'low': 0.4, 'medium': 0.7, 'luxury': 1.0}
    }
    budget_scores = budget_map.get(budget_category, budget_map['medium'])
    city_df['budget_score'] = city_df['budget_level'].astype(str).map(budget_scores).fillna(0.5)

    # Normalize rating to 0-1
    city_df['rating_score'] = city_df['rating'] / 5.0

    # Combined score (weighted)
    city_df['final_score'] = (
        0.45 * city_df['interest_score'] +
        0.25 * city_df['budget_score'] +
        0.30 * city_df['rating_score']
    )

    # Sort by final score
    city_df = city_df.sort_values('final_score', ascending=False)

    return city_df.head(top_n)


def evaluate_recommendation_model(df, vectorizer, tfidf_matrix, interest_profiles):
    """
    Compute recommendation-system evaluation metrics:
      - Coverage:   % of unique places that appear in at least one top-10 result
      - Diversity:  average intra-list pairwise cosine distance
      - Avg Score:  mean final_score across all test queries
      - Precision@K: % of top-K items judged relevant (rating >= 4.0)
    """
    cities = df['city'].unique().tolist()
    test_interests_pool = [
        ['history', 'culture'],
        ['nature', 'trekking'],
        ['food', 'shopping'],
        ['spiritual', 'pilgrimage'],
        ['adventure', 'outdoor'],
        ['beach', 'water'],
        ['wildlife', 'nature'],
        ['art', 'heritage'],
    ]

    recommended_ids = set()
    all_scores = []
    intra_diversity_scores = []
    precision_at_5 = []
    precision_at_10 = []

    query_count = 0
    for city in cities:
        city_places = df[df['city'] == city]
        if len(city_places) < 3:
            continue
        for interests in test_interests_pool[:4]:   # 4 interest combos per city
            for budget in ['medium']:               # 1 budget per combo to keep it fast
                results = recommend_places(
                    df, vectorizer, tfidf_matrix, interest_profiles,
                    city=city, interests=interests,
                    budget_category=budget, top_n=10
                )
                if results.empty:
                    continue
                query_count += 1
                indices = results.index.tolist()
                recommended_ids.update(indices)
                all_scores.extend(results['final_score'].tolist())

                # Precision@K — relevant = rating >= 4.0
                ratings = results['rating'].values
                p5  = (ratings[:5] >= 4.0).mean()  if len(ratings) >= 5  else (ratings >= 4.0).mean()
                p10 = (ratings[:10] >= 4.0).mean() if len(ratings) >= 10 else (ratings >= 4.0).mean()
                precision_at_5.append(float(p5))
                precision_at_10.append(float(p10))

                # Intra-list diversity: avg pairwise (1 - cosine_similarity) among top-10
                city_indices = results.index.tolist()
                result_tfidf = tfidf_matrix[city_indices]
                sim_matrix = cosine_similarity(result_tfidf)
                n = len(city_indices)
                if n >= 2:
                    upper_triangle = [sim_matrix[i][j]
                                      for i in range(n) for j in range(i+1, n)]
                    avg_sim = np.mean(upper_triangle)
                    intra_diversity_scores.append(float(1.0 - avg_sim))

    coverage = len(recommended_ids) / len(df) if len(df) > 0 else 0.0
    avg_score = np.mean(all_scores) if all_scores else 0.0
    avg_diversity = np.mean(intra_diversity_scores) if intra_diversity_scores else 0.0
    avg_p5 = np.mean(precision_at_5) if precision_at_5 else 0.0
    avg_p10 = np.mean(precision_at_10) if precision_at_10 else 0.0

    metrics = {
        'coverage': round(float(coverage), 4),
        'coverage_pct': f"{coverage * 100:.1f}%",
        'avg_relevance_score': round(float(avg_score), 4),
        'intra_list_diversity': round(float(avg_diversity), 4),
        'precision_at_5': round(float(avg_p5), 4),
        'precision_at_10': round(float(avg_p10), 4),
        'total_queries_evaluated': query_count,
        'unique_places_recommended': len(recommended_ids),
        'total_places': len(df),
        'scoring_weights': {'interest': 0.45, 'budget': 0.25, 'rating': 0.30},
    }
    return metrics


def train_and_save():
    """Main training pipeline with evaluation metrics."""
    print("=" * 60)
    print("Smart Itinerary Planner - ML Model Training")
    print("=" * 60)

    # Step 1: Load data
    print("\n[1/6] Loading dataset...")
    df = load_dataset()
    print(f"  Loaded {len(df)} places across {df['city'].nunique()} cities")

    # Step 2: Preprocess
    print("\n[2/6] Preprocessing data...")
    df = preprocess_data(df)
    cities = df['city'].unique()
    print(f"  Cities ({len(cities)}): {', '.join(sorted(cities))}")
    print(f"  Categories: {', '.join(sorted(df['category'].unique()))}")

    # Step 3: Build TF-IDF model
    print("\n[3/6] Building TF-IDF model...")
    vectorizer, tfidf_matrix = build_tfidf_model(df)
    print(f"  TF-IDF matrix shape: {tfidf_matrix.shape}")
    print(f"  Vocabulary size: {len(vectorizer.vocabulary_)}")

    # Step 4: Compute interest profiles
    print("\n[4/6] Computing interest profiles...")
    interest_profiles = compute_interest_profiles(df, vectorizer, tfidf_matrix)
    print(f"  Interest tags found ({len(interest_profiles)}): "
          f"{', '.join(sorted(interest_profiles.keys()))}")

    # Step 5: Evaluate model
    print("\n[5/6] Evaluating recommendation model...")
    metrics = evaluate_recommendation_model(df, vectorizer, tfidf_matrix, interest_profiles)
    print(f"  Coverage       : {metrics['coverage_pct']}  "
          f"({metrics['unique_places_recommended']}/{metrics['total_places']} places)")
    print(f"  Avg Relevance  : {metrics['avg_relevance_score']:.4f}")
    print(f"  Diversity      : {metrics['intra_list_diversity']:.4f}  "
          f"(higher = more diverse)")
    print(f"  Precision@5    : {metrics['precision_at_5']:.4f}  "
          f"({metrics['precision_at_5']*100:.1f}% of top-5 are high-rated)")
    print(f"  Precision@10   : {metrics['precision_at_10']:.4f}")
    print(f"  Queries run    : {metrics['total_queries_evaluated']}")

    # Step 6: Save model
    print("\n[6/6] Saving trained model...")
    os.makedirs(MODEL_DIR, exist_ok=True)

    model_data = {
        'vectorizer': vectorizer,
        'tfidf_matrix': tfidf_matrix,
        'interest_profiles': interest_profiles,
        'metrics': metrics,
    }
    model_path = os.path.join(MODEL_DIR, 'recommendation_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(model_data, f)
    print(f"  Model saved to: {model_path}")

    places_path = os.path.join(MODEL_DIR, 'places_data.pkl')
    df.to_pickle(places_path)
    print(f"  Places data saved to: {places_path}")

    # Also save metrics as standalone JSON
    metrics_path = os.path.join(MODEL_DIR, 'recommendation_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"  Metrics saved to: {metrics_path}")

    # Validation: test recommendation
    print("\n" + "=" * 60)
    print("Validation Test")
    print("=" * 60)
    test_city = 'jaipur'
    test_interests = ['history', 'food']
    print(f"\n  Query: city={test_city}, interests={test_interests}, budget=medium")
    results = recommend_places(
        df, vectorizer, tfidf_matrix, interest_profiles,
        city=test_city, interests=test_interests, budget_category='medium', top_n=5
    )
    if not results.empty:
        print(f"\n  Top 5 Recommendations:")
        for i, (_, row) in enumerate(results.iterrows(), 1):
            print(f"    {i}. {row['name']} (score: {row['final_score']:.3f}, "
                  f"category: {row['category']}, rating: {row['rating']})")
    else:
        print("  No results found for test query.")

    print(f"\n{'=' * 60}")
    print("Training complete!")
    print(f"{'=' * 60}")

    return df, vectorizer, tfidf_matrix, interest_profiles


if __name__ == '__main__':
    train_and_save()
