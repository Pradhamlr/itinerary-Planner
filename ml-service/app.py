from flask import Flask, jsonify, request
import joblib
import numpy as np
import os

app = Flask(__name__)

sentiment_model = None
vectorizer = None
recommendation_model = None


def load_models():
	global sentiment_model, vectorizer, recommendation_model

	sentiment_path = 'models/sentiment_model.pkl'
	vectorizer_path = 'models/vectorizer.pkl'
	recommendation_path = 'models/recommendation_model.pkl'

	if not os.path.exists(sentiment_path) or not os.path.exists(vectorizer_path):
		raise FileNotFoundError('Sentiment artifacts missing. Run train_sentiment.py first.')

	if not os.path.exists(recommendation_path):
		raise FileNotFoundError('Recommendation model missing. Run train_recommendation.py first.')

	sentiment_model = joblib.load(sentiment_path)
	vectorizer = joblib.load(vectorizer_path)
	recommendation_model = joblib.load(recommendation_path)


@app.get('/health')
def health():
	return jsonify({'success': True, 'status': 'ok'})


@app.post('/predict/sentiment')
def predict_sentiment():
	payload = request.get_json(silent=True) or {}
	review = str(payload.get('review', '')).strip()

	if not review:
		return jsonify({'success': False, 'error': 'review is required'}), 400

	review_vec = vectorizer.transform([review])
	probabilities = sentiment_model.predict_proba(review_vec)[0]
	predicted_class = int(sentiment_model.predict(review_vec)[0])

	return jsonify({
		'success': True,
		'data': {
			'sentiment_label': 'positive' if predicted_class == 1 else 'negative',
			'sentiment_score': float(probabilities[1]),
		},
	})


@app.post('/predict/recommendation')
def predict_recommendation():
	payload = request.get_json(silent=True) or {}

	try:
		rating = float(payload.get('rating'))
		sentiment = float(payload.get('sentiment'))
	except (TypeError, ValueError):
		return jsonify({'success': False, 'error': 'rating and sentiment must be numeric'}), 400

	features = np.array([[rating, sentiment]])
	probabilities = recommendation_model.predict_proba(features)[0]
	prediction = int(recommendation_model.predict(features)[0])

	return jsonify({
		'success': True,
		'data': {
			'recommend': prediction,
			'confidence': float(max(probabilities)),
		},
	})


@app.post('/predict/place')
def predict_place():
	payload = request.get_json(silent=True) or {}
	review = str(payload.get('review', '')).strip()

	try:
		rating = float(payload.get('rating'))
	except (TypeError, ValueError):
		return jsonify({'success': False, 'error': 'rating must be numeric'}), 400

	sentiment = 0.5
	if review:
		review_vec = vectorizer.transform([review])
		sentiment = float(sentiment_model.predict_proba(review_vec)[0][1])

	features = np.array([[rating, sentiment]])
	probabilities = recommendation_model.predict_proba(features)[0]
	prediction = int(recommendation_model.predict(features)[0])

	return jsonify({
		'success': True,
		'data': {
			'sentiment_score': sentiment,
			'recommend': prediction,
			'confidence': float(max(probabilities)),
		},
	})


if __name__ == '__main__':
	load_models()
	app.run(host='0.0.0.0', port=5000, debug=False)
