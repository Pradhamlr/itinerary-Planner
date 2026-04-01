"""
Heuristic interest labels for expansion cities.

This is the lightweight alternative to HF labeling for non-curated cities.
It produces root interests, simple confidence-style scores, and a few intent
tags from category/type/name/review heuristics.
"""

from pathlib import Path
from collections import Counter
import json
import re

import pandas as pd

DATASET_PATH = Path("dataset_expansion/places_expansion.csv")
OUTPUT_PATH = Path("dataset_expansion/place_interest_labels_expansion.csv")
SUMMARY_PATH = Path("dataset_expansion/place_interest_labels_expansion_summary.json")

ROOTS = ["history", "nature", "culture", "food", "art", "beaches", "shopping"]

INTEREST_RULES = {
    "beaches": {
        "categories": {"beach", "natural_feature"},
        "types": {"beach", "natural_feature"},
        "name_keywords": {"beach", "coast", "coastal", "shore", "shoreline", "sea", "seaside", "ocean", "waterfront"},
        "review_keywords": {"beach", "shore", "seaside", "coast", "coastal", "waves", "sand"},
        "strong_name_keywords": {"beach", "coast", "shore", "bay"},
        "intents": {
            "beach walk": {"beach", "shore", "sand", "walk"},
            "waterfront": {"waterfront", "harbor", "harbour", "shore"},
            "sunset spot": {"sunset", "sunrise", "view"},
        },
    },
    "shopping": {
        "categories": {"shopping_mall", "market", "clothing_store", "jewelry_store"},
        "types": {"shopping_mall", "market", "clothing_store", "jewelry_store", "book_store", "shoe_store"},
        "name_keywords": {"mall", "shopping", "market", "bazaar", "bazar", "jew town", "broadway", "emporium", "lulu"},
        "review_keywords": {"shopping", "market", "bazaar", "stores", "souvenir", "shopping street"},
        "strong_name_keywords": {"mall", "market", "bazaar", "bazar", "broadway", "emporium", "lulu"},
        "intents": {
            "street shopping": {"street", "bazaar", "bazar", "market", "broadway"},
            "local shopping": {"market", "souvenir", "local", "craft"},
            "fashion shopping": {"fashion", "clothing", "apparel", "boutique"},
            "jewelry shopping": {"jewelry", "jewellery", "gold", "silver"},
        },
    },
    "culture": {
        "categories": {"museum", "art_gallery", "church", "hindu_temple", "temple", "monument", "mosque", "synagogue"},
        "types": {"museum", "art_gallery", "church", "hindu_temple", "temple", "mosque", "synagogue", "monument"},
        "name_keywords": {"culture", "cultural", "heritage", "cathedral", "basilica", "temple", "mosque", "church", "synagogue", "spiritual"},
        "review_keywords": {"culture", "heritage", "cathedral", "basilica", "temple", "mosque", "church", "synagogue", "spiritual"},
        "strong_name_keywords": {"temple", "church", "mosque", "synagogue", "cathedral", "basilica", "ghat"},
        "intents": {
            "cultural landmark": {"heritage", "cultural", "landmark", "iconic"},
            "spiritual stop": {"temple", "church", "mosque", "synagogue", "spiritual"},
            "local favorite": {"local", "popular", "famous"},
        },
    },
    "history": {
        "categories": {"museum", "historical_landmark", "monument", "church", "synagogue", "temple"},
        "types": {"museum", "historical_landmark", "monument", "landmark", "fort", "palace", "memorial"},
        "name_keywords": {"history", "historic", "heritage", "fort", "palace", "colonial", "ancient", "royal", "museum", "memorial"},
        "review_keywords": {"history", "historic", "heritage", "fort", "palace", "colonial", "ancient", "royal", "museum", "memorial"},
        "strong_name_keywords": {"fort", "palace", "museum", "memorial", "mahal"},
        "intents": {
            "heritage site": {"heritage", "historic", "fort", "palace", "memorial"},
            "museum visit": {"museum", "gallery", "exhibit"},
            "tourist hotspot": {"iconic", "must visit", "famous"},
        },
    },
    "nature": {
        "categories": {"park", "zoo", "garden", "natural_feature"},
        "types": {"park", "zoo", "garden", "natural_feature", "aquarium"},
        "name_keywords": {"park", "garden", "nature", "green", "lake", "island", "waterfront", "backwater", "botanical"},
        "review_keywords": {"park", "garden", "nature", "green", "lake", "island", "view", "scenic"},
        "strong_name_keywords": {"garden", "botanical", "lake", "island", "hill", "falls", "waterfall"},
        "intents": {
            "nature escape": {"nature", "green", "calm", "quiet"},
            "scenic views": {"scenic", "view", "panoramic", "sunset"},
            "family-friendly": {"family", "kids", "children"},
        },
    },
    "food": {
        "categories": {"restaurant", "cafe", "bakery"},
        "types": {"restaurant", "cafe", "bakery", "meal_takeaway"},
        "name_keywords": {"restaurant", "cafe", "bakery", "food", "dining", "eatery", "bistro", "coffee"},
        "review_keywords": {"restaurant", "cafe", "bakery", "food", "dining", "meal", "breakfast", "brunch", "seafood"},
        "intents": {
            "cafe stop": {"cafe", "coffee", "tea"},
            "street food": {"street food", "snack", "chaat", "food stall"},
            "seafood": {"seafood", "fish", "prawn"},
        },
    },
    "art": {
        "categories": {"art_gallery", "museum"},
        "types": {"art_gallery", "museum"},
        "name_keywords": {"art", "gallery", "exhibition", "mural", "painting", "craft"},
        "review_keywords": {"art", "gallery", "exhibition", "mural", "painting", "craft"},
        "strong_name_keywords": {"art", "gallery", "museum", "craft"},
        "intents": {
            "art experience": {"art", "gallery", "exhibition", "craft"},
            "museum visit": {"museum", "exhibit", "collection"},
            "craft shopping": {"craft", "artisan", "handicraft"},
        },
    },
}


def normalize_text(value):
    return str(value or "").strip().lower()


def tokenize_types(value):
    raw = normalize_text(value)
    if not raw:
        return set()
    return {
        part.strip().replace(" ", "_")
        for part in re.split(r"\||,|;", raw)
        if part.strip()
    }


def has_keyword(text, keywords):
    return any(keyword in text for keyword in keywords)


def count_keyword_hits(text, keywords):
    return sum(1 for keyword in keywords if keyword in text)


def get_quality_bonus(row):
    rating = float(row.get("rating") or 0)
    user_ratings_total = int(row.get("user_ratings_total") or 0)

    if rating >= 4.6 and user_ratings_total >= 10000:
        return 0.14
    if rating >= 4.4 and user_ratings_total >= 2500:
        return 0.10
    if rating >= 4.2 and user_ratings_total >= 1000:
        return 0.06
    return 0.0


def make_score(category_match, type_match, name_hits, review_hits, strong_name_hits, quality_bonus):
    score = 0.0
    if category_match:
        score += 0.42
    if type_match:
        score += 0.33
    if name_hits > 0:
        score += min(0.15 + (0.04 * (name_hits - 1)), 0.23)
    if review_hits > 0:
        score += min(0.08 + (0.03 * (review_hits - 1)), 0.14)
    if strong_name_hits > 0:
        score += min(0.12 + (0.04 * (strong_name_hits - 1)), 0.18)
    score += quality_bonus
    return round(min(score, 1.0), 4)


def infer_interest_scores(row):
    category = normalize_text(row.get("category")).replace(" ", "_")
    types = tokenize_types(row.get("types"))
    name_text = " ".join(
        part for part in [
            normalize_text(row.get("name")),
            normalize_text(row.get("category")),
            normalize_text(row.get("types")),
        ]
        if part
    )
    review_text = normalize_text(row.get("review"))

    scores = {}
    for interest, rules in INTEREST_RULES.items():
        category_match = category in rules["categories"]
        type_match = bool(types & rules["types"])
        name_hits = count_keyword_hits(name_text, rules["name_keywords"])
        review_hits = count_keyword_hits(review_text, rules["review_keywords"])
        strong_name_hits = count_keyword_hits(name_text, rules.get("strong_name_keywords", set()))
        quality_bonus = get_quality_bonus(row)
        score = make_score(category_match, type_match, name_hits, review_hits, strong_name_hits, quality_bonus)
        if score >= 0.5:
            scores[interest] = score

    return scores


def infer_intent_scores(row, active_roots):
    if not active_roots:
        return {}

    full_text = " ".join(
        part for part in [
            normalize_text(row.get("name")),
            normalize_text(row.get("category")),
            normalize_text(row.get("types")),
            normalize_text(row.get("review")),
        ]
        if part
    )

    intents = {}
    for root in active_roots:
        rules = INTEREST_RULES.get(root, {})
        for intent, keywords in rules.get("intents", {}).items():
            hits = sum(1 for keyword in keywords if keyword in full_text)
            if hits <= 0:
                continue
            intents[intent] = round(min(0.55 + (0.12 * hits), 0.95), 4)

    return intents


def main():
    print("\n" + "=" * 60)
    print("EXPANSION INTEREST LABEL GENERATION")
    print("=" * 60 + "\n")

    if not DATASET_PATH.exists():
        print("Error: dataset_expansion/places_expansion.csv not found")
        raise SystemExit(1)

    df = pd.read_csv(DATASET_PATH)
    required_columns = {"name", "category", "rating", "review", "city", "lat", "lng"}
    missing_columns = required_columns - set(df.columns)
    if missing_columns:
        print(f"Error: Missing columns in dataset: {sorted(missing_columns)}")
        raise SystemExit(1)

    if "types" not in df.columns:
        df["types"] = ""

    score_rows = df.apply(infer_interest_scores, axis=1)
    df["interest_scores_json"] = score_rows.apply(lambda value: json.dumps(value, ensure_ascii=True))
    df["interest_tags_list"] = score_rows.apply(lambda value: sorted(value.keys()))
    df["interest_tags"] = df["interest_tags_list"].apply(lambda tags: " | ".join(tags))
    df["interest_tag_count"] = df["interest_tags_list"].apply(len)
    df["interest_tags_json"] = df["interest_tags_list"].apply(json.dumps)

    intent_rows = []
    for _, row in df.iterrows():
        root_list = row["interest_tags_list"]
        intent_scores = infer_intent_scores(row, root_list)
        intent_rows.append(intent_scores)

    df["intent_scores_json"] = [json.dumps(value, ensure_ascii=True) for value in intent_rows]
    df["intent_tags_list"] = [sorted(value.keys()) for value in intent_rows]
    df["intent_tags"] = df["intent_tags_list"].apply(lambda tags: " | ".join(tags))
    df["intent_tag_count"] = df["intent_tags_list"].apply(len)
    df["intent_tags_json"] = df["intent_tags_list"].apply(json.dumps)

    # Keep clean_* aliases so this file can be used in a similar spirit to the HF-clean one.
    df["clean_interest_tags"] = df["interest_tags"]
    df["clean_interest_tag_count"] = df["interest_tag_count"]
    df["clean_interest_tags_json"] = df["interest_tags_json"]
    df["clean_intent_tags"] = df["intent_tags"]
    df["clean_intent_tag_count"] = df["intent_tag_count"]
    df["clean_intent_tags_json"] = df["intent_tags_json"]

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.drop(columns=["interest_tags_list", "intent_tags_list"]).to_csv(OUTPUT_PATH, index=False)

    root_counter = Counter()
    intent_counter = Counter()
    for tags in df["interest_tags"].tolist():
        root_counter.update([tag.strip() for tag in str(tags).split("|") if tag.strip()])
    for tags in df["intent_tags"].tolist():
        intent_counter.update([tag.strip() for tag in str(tags).split("|") if tag.strip()])

    summary = {
        "rows": int(len(df)),
        "labeled_rows": int((df["interest_tag_count"] > 0).sum()),
        "intent_labeled_rows": int((df["intent_tag_count"] > 0).sum()),
        "top_interest_tags": dict(root_counter.most_common()),
        "top_intent_tags": dict(intent_counter.most_common(40)),
    }
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(f"Saved: {OUTPUT_PATH}")
    print(f"Saved summary: {SUMMARY_PATH}")
    print(f"Rows: {len(df)}")
    print(f"Labeled rows: {summary['labeled_rows']}")
    print(f"Intent-labeled rows: {summary['intent_labeled_rows']}")
    print("\nExpansion interest label generation complete\n")


if __name__ == "__main__":
    main()
