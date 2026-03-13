"""
Smart Itinerary Planner - ML Service API
==========================================
Flask API serving the trained recommendation and sentiment models.

Endpoints:
  POST /recommend          - Get place recommendations
  GET  /places/<city>      - Get all places for a city
  GET  /cities             - List all available cities
  POST /sentiment          - Analyze sentiment of review text
  GET  /health             - Health check
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

# Global model storage
recommendation_model = None
sentiment_model = None
places_df = None


def load_models():
    """Load all trained models on startup."""
    global recommendation_model, sentiment_model, places_df

    # Load recommendation model
    rec_path = os.path.join(MODEL_DIR, 'recommendation_model.pkl')
    if os.path.exists(rec_path):
        with open(rec_path, 'rb') as f:
            recommendation_model = pickle.load(f)
        print("[OK] Recommendation model loaded")
    else:
        print("[WARN] Recommendation model not found. Run train_recommendation.py first.")

    # Load sentiment model
    sent_path = os.path.join(MODEL_DIR, 'sentiment_model.pkl')
    if os.path.exists(sent_path):
        with open(sent_path, 'rb') as f:
            sentiment_model = pickle.load(f)
        print("[OK] Sentiment model loaded")
    else:
        print("[WARN] Sentiment model not found. Run train_sentiment.py first.")

    # Load places data
    places_path = os.path.join(MODEL_DIR, 'places_data.pkl')
    if os.path.exists(places_path):
        places_df = pd.read_pickle(places_path)
        print(f"[OK] Places data loaded: {len(places_df)} places, {places_df['city'].nunique()} cities")
    else:
        # Fallback: load from raw JSON
        json_path = os.path.join(DATA_DIR, 'places_dataset.json')
        if os.path.exists(json_path):
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            places_df = pd.DataFrame(data)
            places_df['city'] = places_df['city'].str.lower().str.strip()
            print(f"[OK] Places loaded from JSON: {len(places_df)} places")
        else:
            print("[WARN] No places data found.")


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'models': {
            'recommendation': recommendation_model is not None,
            'sentiment': sentiment_model is not None
        },
        'places_count': len(places_df) if places_df is not None else 0,
        'cities_count': places_df['city'].nunique() if places_df is not None else 0
    })


@app.route('/model-info', methods=['GET'])
def model_info():
    """Return detailed information about the trained ML models for showcase."""
    info = {
        'recommendation_model': None,
        'sentiment_model': None,
        'dataset_stats': None
    }

    if recommendation_model is not None:
        vectorizer = recommendation_model['vectorizer']
        tfidf_matrix = recommendation_model['tfidf_matrix']
        interest_profiles = recommendation_model['interest_profiles']

        top_features = sorted(vectorizer.vocabulary_.items(), key=lambda x: x[1])[:30]

        rec_metrics = recommendation_model.get('metrics', {})
        info['recommendation_model'] = {
            'type': 'Content-Based Filtering',
            'algorithm': 'TF-IDF Vectorization + Cosine Similarity',
            'tfidf_matrix_shape': list(tfidf_matrix.shape),
            'vocabulary_size': len(vectorizer.vocabulary_),
            'max_features': vectorizer.max_features,
            'ngram_range': list(vectorizer.ngram_range),
            'interest_profiles_count': len(interest_profiles),
            'interest_tags': sorted(interest_profiles.keys()),
            'scoring_weights': {
                'interest_match': 0.45,
                'budget_score': 0.25,
                'rating_score': 0.30
            },
            'sample_vocabulary': [f[0] for f in top_features],
            'training_library': 'scikit-learn (sklearn)',
            'model_file_size_kb': round(os.path.getsize(
                os.path.join(MODEL_DIR, 'recommendation_model.pkl')
            ) / 1024, 1) if os.path.exists(os.path.join(MODEL_DIR, 'recommendation_model.pkl')) else 0,
            'metrics': rec_metrics
        }

    if sentiment_model is not None:
        classifier = sentiment_model['classifier']
        sent_vectorizer = sentiment_model['vectorizer']
        sent_metrics = sentiment_model.get('metrics', {})

        info['sentiment_model'] = {
            'type': 'Text Classification',
            'algorithm': 'Multinomial Naive Bayes with TF-IDF',
            'classes': list(classifier.classes_),
            'vocabulary_size': len(sent_vectorizer.vocabulary_),
            'max_features': sent_vectorizer.max_features,
            'training_library': 'scikit-learn (sklearn)',
            'model_file_size_kb': round(os.path.getsize(
                os.path.join(MODEL_DIR, 'sentiment_model.pkl')
            ) / 1024, 1) if os.path.exists(os.path.join(MODEL_DIR, 'sentiment_model.pkl')) else 0,
            'metrics': sent_metrics
        }

    if places_df is not None:
        city_stats = []
        for city in sorted(places_df['city'].unique()):
            city_data = places_df[places_df['city'] == city]
            city_stats.append({
                'city': city.title(),
                'count': len(city_data),
                'categories': sorted(city_data['category'].unique().tolist()),
                'avg_rating': round(float(city_data['rating'].mean()), 2)
            })

        info['dataset_stats'] = {
            'total_places': len(places_df),
            'total_cities': places_df['city'].nunique(),
            'categories': sorted(places_df['category'].unique().tolist()),
            'total_categories': places_df['category'].nunique(),
            'avg_rating': round(float(places_df['rating'].mean()), 2),
            'city_breakdown': city_stats
        }

    return jsonify(info)


@app.route('/cities', methods=['GET'])
def get_cities():
    """List all available cities with their place counts."""
    if places_df is None:
        return jsonify({'error': 'Places data not loaded'}), 500

    city_info = []
    for city in sorted(places_df['city'].unique()):
        city_data = places_df[places_df['city'] == city]
        # Get approximate center coordinates
        center_lat = float(city_data['lat'].mean())
        center_lng = float(city_data['lng'].mean())
        city_info.append({
            'name': city,
            'display_name': city.title(),
            'state': city_data.iloc[0]['state'],
            'place_count': len(city_data),
            'lat': center_lat,
            'lng': center_lng,
            'categories': sorted(city_data['category'].unique().tolist())
        })

    return jsonify({'cities': city_info})


@app.route('/places/<city>', methods=['GET'])
def get_places(city):
    """Get all places for a specific city."""
    if places_df is None:
        return jsonify({'error': 'Places data not loaded'}), 500

    city_lower = city.lower().strip()
    city_data = places_df[places_df['city'] == city_lower]

    if city_data.empty:
        return jsonify({'error': f'No places found for city: {city}', 'places': []}), 404

    places = []
    for _, row in city_data.iterrows():
        places.append({
            'name': row['name'],
            'city': row['city'],
            'state': row['state'],
            'lat': float(row['lat']),
            'lng': float(row['lng']),
            'category': row['category'],
            'subcategory': row['subcategory'],
            'rating': float(row['rating']),
            'description': row['description'],
            'avg_cost': float(row['avg_cost']),
            'visit_duration': float(row['visit_duration']),
            'best_time': row['best_time'],
            'tags': row['tags'],
            'budget_level': str(row.get('budget_level', 'medium'))
        })

    return jsonify({
        'city': city_lower,
        'total': len(places),
        'places': places
    })


@app.route('/recommend', methods=['POST'])
def recommend():
    """
    Get ML-powered place recommendations.

    Request body:
    {
        "city": "jaipur",
        "interests": ["history", "food", "culture"],
        "budget_category": "medium",  // low, medium, luxury
        "top_n": 15
    }
    """
    if recommendation_model is None or places_df is None:
        return jsonify({'error': 'Recommendation model not loaded'}), 500

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    city = data.get('city', '').lower().strip()
    interests = data.get('interests', [])
    budget_category = data.get('budget_category', 'medium')
    top_n = min(data.get('top_n', 15), 50)

    if not city:
        return jsonify({'error': 'City is required'}), 400

    # Get model components
    vectorizer = recommendation_model['vectorizer']
    tfidf_matrix = recommendation_model['tfidf_matrix']
    interest_profiles = recommendation_model['interest_profiles']

    # Filter places for this city using positional indices (not DataFrame labels)
    city_mask = places_df['city'] == city
    city_df = places_df[city_mask].copy()

    if city_df.empty:
        return jsonify({
            'error': f'No places found for city: {city}',
            'recommendations': []
        }), 404

    # Use positional indices to slice TF-IDF matrix (safe regardless of DataFrame index)
    city_positions = [i for i, m in enumerate(city_mask) if m]
    city_tfidf = tfidf_matrix[city_positions]

    # Build user interest vector
    user_vector = np.zeros(tfidf_matrix.shape[1])
    matched_interests = 0
    for interest in interests:
        interest_lower = interest.lower().strip()
        if interest_lower in interest_profiles:
            user_vector += interest_profiles[interest_lower]
            matched_interests += 1

    if matched_interests > 0:
        user_vector /= matched_interests

    # Compute similarity
    from sklearn.metrics.pairwise import cosine_similarity
    similarity_scores = cosine_similarity(
        user_vector.reshape(1, -1), city_tfidf
    ).flatten()

    city_df.loc[:, 'interest_score'] = similarity_scores

    # Budget scoring
    budget_map = {
        'low': {'free': 1.0, 'low': 0.8, 'medium': 0.3, 'luxury': 0.1},
        'medium': {'free': 0.7, 'low': 0.8, 'medium': 1.0, 'luxury': 0.5},
        'luxury': {'free': 0.3, 'low': 0.4, 'medium': 0.7, 'luxury': 1.0}
    }
    budget_scores = budget_map.get(budget_category, budget_map['medium'])
    city_df['budget_score'] = city_df['budget_level'].astype(str).map(budget_scores).fillna(0.5)
    city_df['rating_score'] = city_df['rating'] / 5.0

    # Weighted final score
    city_df['final_score'] = (
        0.45 * city_df['interest_score'] +
        0.25 * city_df['budget_score'] +
        0.30 * city_df['rating_score']
    )

    city_df = city_df.sort_values('final_score', ascending=False).head(top_n)

    # Format response
    recommendations = []
    for _, row in city_df.iterrows():
        recommendations.append({
            'name': row['name'],
            'city': row['city'],
            'state': row['state'],
            'lat': float(row['lat']),
            'lng': float(row['lng']),
            'category': row['category'],
            'subcategory': row['subcategory'],
            'rating': float(row['rating']),
            'description': row['description'],
            'avg_cost': float(row['avg_cost']),
            'visit_duration': float(row['visit_duration']),
            'best_time': row['best_time'],
            'tags': row['tags'],
            'budget_level': str(row['budget_level']),
            'score': round(float(row['final_score']), 4),
            'interest_match': round(float(row['interest_score']), 4)
        })

    return jsonify({
        'city': city,
        'interests': interests,
        'budget_category': budget_category,
        'total_recommendations': len(recommendations),
        'model_info': {
            'type': 'content_based_filtering',
            'algorithm': 'TF-IDF + Cosine Similarity',
            'matched_interests': matched_interests,
            'total_city_places': len(places_df[places_df['city'] == city])
        },
        'recommendations': recommendations
    })


@app.route('/sentiment', methods=['POST'])
def analyze_sentiment():
    """
    Analyze sentiment of review text.

    Request body:
    {
        "text": "Beautiful temple with amazing architecture"
    }
    """
    if sentiment_model is None:
        return jsonify({'error': 'Sentiment model not loaded'}), 500

    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'Text field is required'}), 400

    text = data['text']
    vectorizer = sentiment_model['vectorizer']
    classifier = sentiment_model['classifier']

    X = vectorizer.transform([text])
    prediction = classifier.predict(X)[0]
    probabilities = classifier.predict_proba(X)[0]

    prob_dict = {}
    for label, prob in zip(classifier.classes_, probabilities):
        prob_dict[label] = round(float(prob), 4)

    return jsonify({
        'text': text,
        'sentiment': prediction,
        'confidence': prob_dict
    })


if __name__ == '__main__':
    print("Loading ML models...")
    load_models()
    print(f"\nStarting ML Service on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=False)
