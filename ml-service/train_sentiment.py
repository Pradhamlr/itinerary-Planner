"""
Smart Itinerary Planner - Sentiment Analysis Model Training
============================================================
Trains a sentiment classifier on travel/place review text
using a Naive Bayes model with TF-IDF features.

Model output:
  - models/sentiment_model.pkl  (vectorizer + classifier + eval metrics)
"""

import os
import json
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    precision_score, recall_score, f1_score
)

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')

# Training data: synthetic review-like sentences for travel places
TRAINING_DATA = [
    # ============ POSITIVE REVIEWS (80) ============
    ("Amazing place, absolutely beautiful architecture and history", "positive"),
    ("The sunset view was breathtaking, must visit!", "positive"),
    ("Wonderful experience, the guide was knowledgeable", "positive"),
    ("Best temple I have ever visited, very peaceful", "positive"),
    ("The food was incredible, authentic local flavors", "positive"),
    ("Great for families, kids loved the boat ride", "positive"),
    ("Stunning views, worth the climb to the top", "positive"),
    ("The palace was magnificent, well maintained", "positive"),
    ("Beautiful gardens, a perfect morning walk", "positive"),
    ("The museum has an excellent collection of artifacts", "positive"),
    ("Clean beach, nice water, good facilities", "positive"),
    ("Top notch restaurant, delicious biryani", "positive"),
    ("Incredible fort, panoramic views of the city", "positive"),
    ("The spiritual atmosphere was very calming", "positive"),
    ("Perfect place for photography, every angle is beautiful", "positive"),
    ("We had an amazing time, highly recommend!", "positive"),
    ("The cultural show was entertaining and informative", "positive"),
    ("Excellent street food, very affordable", "positive"),
    ("The night view of the monument was spectacular", "positive"),
    ("A hidden gem, not too crowded, very serene", "positive"),
    ("Well organized, good signage, informative displays", "positive"),
    ("The boat ride was magical, especially at sunrise", "positive"),
    ("Loved the shopping, great handicrafts and textiles", "positive"),
    ("One of the best experiences in India", "positive"),
    ("Historical significance combined with natural beauty", "positive"),
    ("The tea gardens were lush and green, great photos", "positive"),
    ("Adventure activities were thrilling and safe", "positive"),
    ("Romantic dinner by the lake, unforgettable", "positive"),
    ("The architecture is a blend of cultures, fascinating", "positive"),
    ("Friendly locals, great hospitality", "positive"),
    ("The waterfall was majestic and the trek worth every step", "positive"),
    ("Superb heritage walk, learned so much about local culture", "positive"),
    ("The cave paintings were awe-inspiring, truly ancient art", "positive"),
    ("Loved the houseboat experience on the backwaters", "positive"),
    ("The monastery was tranquil and the monks were welcoming", "positive"),
    ("Safari was extraordinary, spotted a tiger close up!", "positive"),
    ("The Ganga aarti ceremony was mesmerizing and emotional", "positive"),
    ("Excellent museum with interactive exhibits for all ages", "positive"),
    ("The spice plantation tour was fragrant and educational", "positive"),
    ("Gorgeous viewpoint with 360-degree mountain panorama", "positive"),
    ("Best biryani in the world, absolutely divine taste", "positive"),
    ("The sound and light show brought history alive", "positive"),
    ("Crystal clear water, perfect snorkeling conditions", "positive"),
    ("The fort is well-preserved and the guides are fantastic", "positive"),
    ("Absolutely loved the local Rajasthani folk music performance", "positive"),
    ("The stepwell architecture was mind-blowingly intricate", "positive"),
    ("Great ropeway ride with stunning valley views below", "positive"),
    ("The night market was vibrant, colourful, and delicious", "positive"),
    ("Camping under the stars in the desert was magical", "positive"),
    ("The toy train ride through the hills was delightful", "positive"),
    ("Very well-maintained national park with good infrastructure", "positive"),
    ("The temple carvings are extraordinarily detailed and beautiful", "positive"),
    ("What a wonderful place to meditate and find inner peace", "positive"),
    ("Kayaking through the mangroves was an unforgettable experience", "positive"),
    ("The flower valley was a paradise of colours in full bloom", "positive"),
    ("Loved every moment of the camel ride through the dunes", "positive"),
    ("The palace museum had rare collection of royal artifacts", "positive"),
    ("The shikara ride on Dal Lake at dawn was picture perfect", "positive"),
    ("Such a well-curated heritage trail through the old city", "positive"),
    ("The zip-lining across the valley was an incredible rush", "positive"),
    ("Phenomenal seafood at the beach shack, fresh and tasty", "positive"),
    ("The snow-capped peaks were stunning from the viewpoint", "positive"),
    ("An architectural marvel that exceeded all expectations", "positive"),
    ("Kids had a blast at the adventure park, great family outing", "positive"),
    ("The tribal art and craft market had unique souvenirs", "positive"),
    ("Excellent birdwatching spot, saw kingfisher and eagles", "positive"),
    ("The colonial-era library was charming and well-stocked", "positive"),
    ("The dam and reservoir area was breathtakingly scenic", "positive"),
    ("Outstanding Ayurvedic spa experience, deeply rejuvenating", "positive"),
    ("The rock-cut temple is a masterpiece of ancient engineering", "positive"),
    ("Trekking to the summit was challenging but SO rewarding", "positive"),
    ("The local dhaba food was hands down the best meal of the trip", "positive"),
    ("Paragliding over the valley was the highlight of my life", "positive"),
    ("The floating market is unique and a photographer dream", "positive"),
    ("Beautifully restored heritage hotel with old world charm", "positive"),
    ("The sunrise from the hilltop temple was divine and peaceful", "positive"),
    ("The coral reef diving was world-class, vibrant marine life", "positive"),
    ("The evening cruise on the river was romantic and lovely", "positive"),
    ("Loved the traditional dance performance, so energetic and colourful", "positive"),
    ("The glacier trek was once-in-a-lifetime adventure, breathtaking", "positive"),

    # ============ NEGATIVE REVIEWS (65) ============
    ("Very crowded, could not enjoy properly", "negative"),
    ("The place was dirty, trash everywhere", "negative"),
    ("Overpriced entry ticket, not worth the money", "negative"),
    ("Disappointing, nothing much to see", "negative"),
    ("Long queues, wasted half the day waiting", "negative"),
    ("The guide was rude and unhelpful", "negative"),
    ("Food was stale and overpriced", "negative"),
    ("The roads to reach are terrible", "negative"),
    ("Poorly maintained, needs renovation", "negative"),
    ("Too commercialized, lost its charm", "negative"),
    ("The beach was polluted, not safe for swimming", "negative"),
    ("Scammers everywhere, be very careful", "negative"),
    ("Closed for renovation without prior notice", "negative"),
    ("The hotel nearby was terrible", "negative"),
    ("Not accessible for elderly or disabled", "negative"),
    ("Way too touristy, avoid during holidays", "negative"),
    ("The parking was chaotic and expensive", "negative"),
    ("Mosquitoes everywhere in the evening", "negative"),
    ("The monument was under scaffolding", "negative"),
    ("Waste of time and money, skip this place", "negative"),
    ("No proper washroom facilities", "negative"),
    ("The water sports were overpriced and unsafe", "negative"),
    ("Could not see anything due to fog", "negative"),
    ("The restaurant served cold food", "negative"),
    ("Harassment from street vendors", "negative"),
    ("Horrible experience, rude staff and dirty rooms", "negative"),
    ("The trek was poorly marked, we got lost twice", "negative"),
    ("Entry ticket is a ripoff for what you actually see", "negative"),
    ("Garbage floating in the lake, very disappointing", "negative"),
    ("The safari was a waste, didn't spot any animals", "negative"),
    ("Temple was extremely crowded and chaotic during festival", "negative"),
    ("The AC in the bus broke down in 40 degree heat", "negative"),
    ("Food poisoning from the local restaurant, terrible hygiene", "negative"),
    ("The monument is crumbling and nobody cares about preservation", "negative"),
    ("Touts and hawkers won't leave you alone, very annoying", "negative"),
    ("The cable car broke down midway, terrifying experience", "negative"),
    ("No shade anywhere, unbearable in summer heat", "negative"),
    ("The boat was leaking and overcrowded, unsafe conditions", "negative"),
    ("Photography charges at every corner, feels like a money trap", "negative"),
    ("The guide made up half the history, very inaccurate", "negative"),
    ("Roads were so bad our car broke down twice getting there", "negative"),
    ("Complete scam, the tour company disappeared after taking money", "negative"),
    ("The waterfall had almost no water, complete letdown", "negative"),
    ("Hotel room had bed bugs, worst stay ever", "negative"),
    ("The noise level was unbearable with loudspeakers everywhere", "negative"),
    ("Zero crowd management, dangerously overcrowded", "negative"),
    ("The beach is eroding and nothing is being done about it", "negative"),
    ("Fake handicrafts sold at outrageous prices to tourists", "negative"),
    ("The museum was closed on the day we visited, poor coordination", "negative"),
    ("Smells terrible near the river, sewage draining directly into it", "negative"),
    ("The viewpoint had a concrete jungle blocking the actual view", "negative"),
    ("WiFi and mobile signal were nonexistent, felt completely cut off", "negative"),
    ("Security was lax and I had my wallet stolen", "negative"),
    ("The ferry was delayed by four hours with no explanation", "negative"),
    ("Plastic waste everywhere on the trail, shameful littering", "negative"),
    ("The so-called resort was a rundown shack with no amenities", "negative"),
    ("Snake encounter on the poorly maintained hiking trail", "negative"),
    ("They charge foreigners ten times the Indian price, unfair", "negative"),
    ("The camping ground was muddy and had no toilet facilities", "negative"),
    ("Night safari was pitch dark, couldn't see a thing", "negative"),
    ("The ancient ruins are being encroached by illegal construction", "negative"),
    ("Worst customer service at the ticket counter, rude and slow", "negative"),
    ("The adventure sports equipment looked old and dangerous", "negative"),
    ("The promised sunrise point was blocked by a new building", "negative"),
    ("Absolutely no accessibility ramps or wheelchair facilities", "negative"),

    # ============ NEUTRAL REVIEWS (55) ============
    ("It is an average place, nothing special", "neutral"),
    ("The place was okay, can visit if you have time", "neutral"),
    ("Decent for a quick visit but not a must-see", "neutral"),
    ("Typical tourist spot, expected experience", "neutral"),
    ("The food was average, regular menu", "neutral"),
    ("It was fine, not great not terrible", "neutral"),
    ("Moderately interesting, good for one visit", "neutral"),
    ("The place has historical value but upkeep is average", "neutral"),
    ("Nothing extraordinary but worth seeing once", "neutral"),
    ("Standard market, some good deals available", "neutral"),
    ("Basic facilities available, nothing luxury", "neutral"),
    ("Okay for a short stop, not a full day place", "neutral"),
    ("The view was decent, slightly hazy", "neutral"),
    ("Regular garden, good for morning walks", "neutral"),
    ("The museum was informative but small", "neutral"),
    ("It is a regular lake, good for photography though", "neutral"),
    ("The temple is well known but the experience was ordinary", "neutral"),
    ("Accessible but nothing unique compared to other forts", "neutral"),
    ("Prices are standard for a tourist area", "neutral"),
    ("The beach is decent, not the cleanest but swimmable", "neutral"),
    ("The market has variety but bargaining is exhausting", "neutral"),
    ("Food courts serve standard fare, nothing gourmet", "neutral"),
    ("The hotel was clean and functional, nothing fancy", "neutral"),
    ("Guide was knowledgeable but rushed through everything", "neutral"),
    ("Good for a day trip from the city, nothing more", "neutral"),
    ("The park is well laid out but can get boring after an hour", "neutral"),
    ("Entry fee is reasonable, experience matches the price", "neutral"),
    ("Some parts are interesting, others can be skipped", "neutral"),
    ("The architecture is standard for this era, nothing rare", "neutral"),
    ("It is a famous place so worth checking off the list", "neutral"),
    ("The wildlife sanctuary was quiet, saw a few birds only", "neutral"),
    ("Standard religious site, respectful atmosphere", "neutral"),
    ("The caves were interesting but poorly lit inside", "neutral"),
    ("A reasonable option if you have nothing else planned", "neutral"),
    ("The fort is in ruins but the view from top is okay", "neutral"),
    ("Average street food, some stalls better than others", "neutral"),
    ("The boat ride was short for the price, just adequate", "neutral"),
    ("The monastery is peaceful but quite small", "neutral"),
    ("The trek difficulty was moderate, neither easy nor hard", "neutral"),
    ("Parking was available but far from the entrance", "neutral"),
    ("The cultural program was okay, more for tourists than locals", "neutral"),
    ("The waterfall was nice in monsoon, dry otherwise", "neutral"),
    ("Souvenir shops have typical items found everywhere", "neutral"),
    ("The road journey was scenic but tiring", "neutral"),
    ("Could be better maintained but overall not bad", "neutral"),
    ("Neither impressed nor disappointed, it was just fine", "neutral"),
    ("The camping experience was basic but acceptable", "neutral"),
    ("A typical hill station experience, pleasant weather", "neutral"),
    ("The palace has some interesting rooms but many are closed", "neutral"),
    ("The local transport is functional but not comfortable", "neutral"),
    ("An educational visit more than an exciting one", "neutral"),
    ("The festival was lively but overcrowded in parts", "neutral"),
    ("The zoo was standard, a few interesting animals", "neutral"),
    ("The dam area is scenic for photos, that's about it", "neutral"),
    ("Overall an acceptable experience for the budget", "neutral"),
]


def train_and_save():
    """Train the sentiment analysis model with comprehensive evaluation."""
    print("=" * 60)
    print("Smart Itinerary Planner - Sentiment Model Training")
    print("=" * 60)

    texts = [text for text, _ in TRAINING_DATA]
    labels = [label for _, label in TRAINING_DATA]
    label_names = ['positive', 'negative', 'neutral']

    print(f"\n[1/5] Dataset: {len(texts)} samples")
    for lbl in label_names:
        print(f"  {lbl.capitalize()}: {labels.count(lbl)}")

    # TF-IDF Vectorization
    print("\n[2/5] Building TF-IDF features...")
    vectorizer = TfidfVectorizer(max_features=300, stop_words='english', ngram_range=(1, 2))
    X = vectorizer.fit_transform(texts)
    print(f"  Feature matrix shape: {X.shape}")
    print(f"  Vocabulary size: {len(vectorizer.vocabulary_)}")

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, labels, test_size=0.2, random_state=42, stratify=labels
    )
    print(f"  Train set: {X_train.shape[0]} | Test set: {X_test.shape[0]}")

    # Train Naive Bayes classifier
    print("\n[3/5] Training Multinomial Naive Bayes...")
    model = MultinomialNB(alpha=0.5)
    model.fit(X_train, y_train)

    # ── Evaluation Metrics ──
    print("\n[4/5] Evaluating model...")

    y_pred = model.predict(X_test)
    test_accuracy = accuracy_score(y_test, y_pred)

    # Per-class precision / recall / f1
    precision_per_class = precision_score(y_test, y_pred, labels=label_names,
                                          average=None, zero_division=0)
    recall_per_class    = recall_score(y_test, y_pred, labels=label_names,
                                       average=None, zero_division=0)
    f1_per_class        = f1_score(y_test, y_pred, labels=label_names,
                                    average=None, zero_division=0)

    # Weighted averages
    precision_weighted = float(precision_score(y_test, y_pred, average='weighted', zero_division=0))
    recall_weighted    = float(recall_score(y_test, y_pred, average='weighted', zero_division=0))
    f1_weighted        = float(f1_score(y_test, y_pred, average='weighted', zero_division=0))

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred, labels=label_names)

    # Stratified 5-fold cross-validation on FULL dataset
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(MultinomialNB(alpha=0.5), X, labels, cv=skf, scoring='accuracy')

    # Print results
    print(f"\n  Test Accuracy : {test_accuracy:.4f} ({test_accuracy:.2%})")
    print(f"  CV Accuracy   : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    print(f"  Precision (W) : {precision_weighted:.4f}")
    print(f"  Recall    (W) : {recall_weighted:.4f}")
    print(f"  F1-Score  (W) : {f1_weighted:.4f}")

    print(f"\n  Per-class metrics:")
    for i, lbl in enumerate(label_names):
        print(f"    {lbl:>10s}  P={precision_per_class[i]:.3f}  "
              f"R={recall_per_class[i]:.3f}  F1={f1_per_class[i]:.3f}")

    print(f"\n  Confusion Matrix (rows=actual, cols=predicted):")
    print(f"  {'':>12s} {'positive':>10s} {'negative':>10s} {'neutral':>10s}")
    for i, lbl in enumerate(label_names):
        print(f"  {lbl:>12s} {cm[i][0]:>10d} {cm[i][1]:>10d} {cm[i][2]:>10d}")

    report_dict = classification_report(y_test, y_pred, labels=label_names,
                                        output_dict=True, zero_division=0)
    print(f"\n  Full Classification Report:")
    print(classification_report(y_test, y_pred, labels=label_names, zero_division=0))

    # Build metrics dict to save
    metrics = {
        'test_accuracy': round(float(test_accuracy), 4),
        'cv_accuracy_mean': round(float(cv_scores.mean()), 4),
        'cv_accuracy_std': round(float(cv_scores.std()), 4),
        'cv_fold_scores': [round(float(s), 4) for s in cv_scores],
        'precision_weighted': round(precision_weighted, 4),
        'recall_weighted': round(recall_weighted, 4),
        'f1_weighted': round(f1_weighted, 4),
        'per_class': {},
        'confusion_matrix': cm.tolist(),
        'confusion_labels': label_names,
        'training_samples': len(texts),
        'test_samples': X_test.shape[0],
        'train_samples': X_train.shape[0],
        'classification_report': report_dict,
    }
    for i, lbl in enumerate(label_names):
        metrics['per_class'][lbl] = {
            'precision': round(float(precision_per_class[i]), 4),
            'recall': round(float(recall_per_class[i]), 4),
            'f1': round(float(f1_per_class[i]), 4),
            'support': int(cm[i].sum()),
        }

    # ── Save model + metrics ──
    print("[5/5] Saving model...")
    os.makedirs(MODEL_DIR, exist_ok=True)
    model_data = {
        'vectorizer': vectorizer,
        'classifier': model,
        'labels': label_names,
        'metrics': metrics,
    }
    model_path = os.path.join(MODEL_DIR, 'sentiment_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(model_data, f)
    print(f"  Model saved to: {model_path}")

    # Also save metrics as standalone JSON for easy access
    metrics_path = os.path.join(MODEL_DIR, 'sentiment_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"  Metrics saved to: {metrics_path}")

    # ── Validation predictions ──
    print(f"\n{'=' * 60}")
    print("Validation Test")
    print(f"{'=' * 60}")
    test_sentences = [
        "Beautiful temple with amazing architecture",
        "Very crowded and dirty, waste of time",
        "Decent place for a quick visit",
        "The fort was incredible, loved every minute",
        "Overpriced and underwhelming experience",
        "It was okay, nothing special but not bad",
    ]
    for sent in test_sentences:
        proba = model.predict_proba(vectorizer.transform([sent]))[0]
        pred = model.classes_[np.argmax(proba)]
        conf = np.max(proba)
        print(f"  '{sent}'\n    => {pred} (confidence: {conf:.2%})")

    print(f"\n{'=' * 60}")
    print("Sentiment model training complete!")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    train_and_save()
