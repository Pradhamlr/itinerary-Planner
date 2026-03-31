from __future__ import annotations

from collections import Counter
from pathlib import Path
import json
import re

import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
INPUT_PATH = BASE_DIR / "dataset" / "place_interest_labels_hf.csv"
OUTPUT_PATH = BASE_DIR / "dataset" / "place_interest_labels_hf_clean.csv"
SUMMARY_PATH = BASE_DIR / "dataset" / "place_interest_labels_hf_clean_summary.json"

ROOTS = [
    "adventure",
    "art",
    "beaches",
    "culture",
    "food",
    "history",
    "nature",
    "nightlife",
    "shopping",
    "sports",
]

INTENT_ROOT_MAP = {
    "mall shopping": {"shopping"},
    "street shopping": {"shopping"},
    "local shopping": {"shopping"},
    "souvenir shopping": {"shopping", "culture"},
    "fashion shopping": {"shopping"},
    "electronics shopping": {"shopping"},
    "jewelry shopping": {"shopping"},
    "budget shopping": {"shopping"},
    "premium": {"shopping", "food"},
    "tourist hotspot": {"culture", "history", "nature", "beaches"},
    "hidden gem": {"culture", "history", "nature", "beaches"},
    "local favorite": {"culture", "food", "shopping", "nature"},
    "family-friendly": {"nature", "shopping", "food", "culture"},
    "group-friendly": {"food", "nature", "adventure"},
    "couples": {"beaches", "nature", "food"},
    "romantic dinner": {"food", "nightlife"},
    "casual dining": {"food"},
    "fine dining": {"food", "nightlife"},
    "cafe stop": {"food"},
    "cozy": {"food", "culture"},
    "work-friendly": {"food"},
    "bakery stop": {"food"},
    "brunch spot": {"food"},
    "street food": {"food"},
    "seafood": {"food", "beaches"},
    "budget eats": {"food"},
    "nightlife": {"nightlife"},
    "bar hopping": {"nightlife"},
    "late-night": {"nightlife"},
    "live music": {"nightlife", "culture"},
    "museum visit": {"history", "culture", "art"},
    "heritage site": {"history", "culture"},
    "cultural landmark": {"culture", "history", "art"},
    "spiritual stop": {"culture", "history", "art"},
    "art experience": {"art", "culture"},
    "beach walk": {"beaches", "nature"},
    "waterfront": {"beaches", "nature"},
    "sunset spot": {"beaches", "nature"},
    "scenic views": {"nature", "beaches"},
    "relaxing": {"nature", "beaches", "culture"},
    "nature escape": {"nature", "beaches"},
    "outdoor activity": {"adventure", "nature", "sports"},
    "adventure": {"adventure"},
    "thrill": {"adventure"},
    "hiking": {"adventure", "nature"},
    "sports": {"sports", "adventure"},
}

SHOPPING_TYPES = {
    "shopping_mall", "store", "market", "clothing_store", "jewelry_store",
    "electronics_store", "department_store", "supermarket", "home_goods_store",
    "book_store", "shoe_store", "furniture_store",
}
FOOD_TYPES = {
    "restaurant", "cafe", "bakery", "meal_takeaway", "meal_delivery",
    "food_court", "bar",
}
RELIGIOUS_TYPES = {
    "church", "temple", "hindu_temple", "mosque", "synagogue", "place_of_worship",
}
HISTORY_TYPES = {
    "museum", "historical_landmark", "monument", "fort", "castle", "memorial",
}
ART_TYPES = {"art_gallery"}
BEACH_TYPES = {"beach", "natural_feature"}
NATURE_TYPES = {
    "park", "garden", "zoo", "aquarium", "campground", "rv_park",
    "wildlife_park", "tourist_attraction",
}
SPORTS_TYPES = {"stadium", "gym", "sports_complex"}
NON_TOURISM_TYPES = {
    "atm", "bank", "finance", "school", "storage", "lodging", "hotel",
    "hospital", "doctor", "dentist", "pharmacy", "accounting", "lawyer",
    "insurance_agency", "real_estate_agency", "car_repair", "gas_station",
    "courier_service", "post_office", "moving_company",
}

ROOT_KEYWORDS = {
    "shopping": ["mall", "market", "bazaar", "shopping", "store", "emporium", "souvenir"],
    "beaches": ["beach", "coast", "shore", "seaside", "waterfront", "harbor", "sunset"],
    "food": ["restaurant", "cafe", "bakery", "dining", "seafood", "street food", "brunch"],
    "history": ["history", "heritage", "fort", "palace", "museum", "monument", "memorial"],
    "culture": ["culture", "temple", "church", "spiritual", "tradition", "ritual", "architecture"],
    "art": ["art", "gallery", "mural", "exhibition", "craft", "performance"],
    "nature": ["park", "garden", "backwater", "lake", "hill", "forest", "viewpoint", "scenic"],
    "adventure": ["adventure", "trek", "hike", "kayak", "boating", "thrill", "ride"],
    "sports": ["sports", "stadium", "cricket", "football", "fitness"],
    "nightlife": ["bar", "pub", "club", "nightlife", "cocktail", "late-night"],
}


def parse_pipe_tags(value: str) -> list[str]:
    return [tag.strip() for tag in str(value or "").split("|") if tag.strip()]


def parse_json_scores(value: str) -> dict[str, float]:
    try:
        parsed = json.loads(value or "{}")
        return {str(key): float(score) for key, score in parsed.items()}
    except Exception:
        return {}


def tokenize_types(raw_types: str, raw_category: str) -> set[str]:
    tokens = {
        token.strip().lower().replace(" ", "_")
        for token in str(raw_types or "").split("|")
        if token.strip()
    }
    category = str(raw_category or "").strip().lower().replace(" ", "_")
    if category:
        tokens.add(category)
    return tokens


def build_place_text(row: pd.Series) -> str:
    return " ".join(
        str(value or "")
        for value in [
            row.get("name"),
            row.get("category"),
            row.get("types"),
            row.get("review"),
            row.get("city"),
        ]
    ).lower()


def get_allowed_roots(row: pd.Series) -> set[str]:
    types = tokenize_types(row.get("types", ""), row.get("category", ""))
    text = build_place_text(row)
    allowed = set()

    if types & NON_TOURISM_TYPES:
        if types & SHOPPING_TYPES:
            allowed.add("shopping")
        if types & FOOD_TYPES:
            allowed.add("food")
        return allowed

    if types & SHOPPING_TYPES:
        allowed.update({"shopping"})
    if types & FOOD_TYPES:
        allowed.update({"food", "nightlife"})
    if types & RELIGIOUS_TYPES:
        allowed.update({"culture", "history", "art"})
    if types & HISTORY_TYPES:
        allowed.update({"history", "culture", "art"})
    if types & ART_TYPES:
        allowed.update({"art", "culture", "history"})
    if types & BEACH_TYPES:
        allowed.update({"beaches", "nature", "adventure"})
    if types & NATURE_TYPES:
        allowed.update({"nature", "adventure"})
    if types & SPORTS_TYPES:
        allowed.update({"sports", "adventure"})

    for root, keywords in ROOT_KEYWORDS.items():
        if any(keyword in text for keyword in keywords):
            allowed.add(root)

    if "tourist_attraction" in types and not allowed:
        allowed.update({"culture", "history", "nature"})

    return allowed


def choose_clean_roots(row: pd.Series, allowed_roots: set[str]) -> list[str]:
    original_tags = [tag for tag in parse_pipe_tags(row.get("original_interest_tags", "")) if tag in ROOTS]
    hf_tags = [tag for tag in parse_pipe_tags(row.get("interest_tags", "")) if tag in ROOTS]
    scores = parse_json_scores(row.get("interest_scores_json", "{}"))

    if not allowed_roots:
        return []

    ranked = sorted(
        ((tag, float(scores.get(tag, 0))) for tag in allowed_roots),
        key=lambda item: item[1],
        reverse=True,
    )

    selected = [tag for tag, score in ranked if score >= 0.7][:3]
    if not selected:
        selected = [tag for tag, score in ranked if score >= 0.62][:2]
    if not selected:
        selected = [tag for tag in original_tags if tag in allowed_roots][:2]
    if not selected:
        selected = [tag for tag in hf_tags if tag in allowed_roots][:2]
    if not selected and ranked:
        selected = [ranked[0][0]]

    return selected[:3]


def choose_clean_intents(row: pd.Series, clean_roots: list[str]) -> list[str]:
    if not clean_roots:
        return []

    intent_tags = parse_pipe_tags(row.get("intent_tags", ""))
    intent_scores = parse_json_scores(row.get("intent_scores_json", "{}"))
    root_set = set(clean_roots)

    filtered = []
    for tag in intent_tags:
        mapped_roots = INTENT_ROOT_MAP.get(tag, set())
        if mapped_roots and mapped_roots & root_set:
            filtered.append(tag)

    if len(filtered) >= 3:
        return filtered[:8]

    ranked = sorted(
        (
            (tag, float(intent_scores.get(tag, 0)))
            for tag, mapped_roots in INTENT_ROOT_MAP.items()
            if mapped_roots & root_set
        ),
        key=lambda item: item[1],
        reverse=True,
    )
    for tag, score in ranked:
        if score < 0.6:
            continue
        if tag not in filtered:
            filtered.append(tag)
        if len(filtered) >= 8:
            break

    return filtered[:8]


def main() -> None:
    if not INPUT_PATH.exists():
        raise FileNotFoundError(f"Input file not found: {INPUT_PATH}")

    df = pd.read_csv(INPUT_PATH)
    output_rows = []
    changed_count = 0
    emptied_count = 0
    root_counter = Counter()
    intent_counter = Counter()

    for _, row in df.iterrows():
        allowed_roots = get_allowed_roots(row)
        clean_roots = choose_clean_roots(row, allowed_roots)
        clean_intents = choose_clean_intents(row, clean_roots)

        original_hf_roots = parse_pipe_tags(row.get("interest_tags", ""))
        if clean_roots != original_hf_roots:
            changed_count += 1
        if not clean_roots:
            emptied_count += 1

        root_counter.update(clean_roots)
        intent_counter.update(clean_intents)

        row_dict = row.to_dict()
        row_dict["hf_raw_interest_tags"] = row_dict.get("interest_tags", "")
        row_dict["hf_raw_intent_tags"] = row_dict.get("intent_tags", "")
        row_dict["clean_interest_tags"] = " | ".join(clean_roots)
        row_dict["clean_interest_tag_count"] = len(clean_roots)
        row_dict["clean_interest_tags_json"] = json.dumps(clean_roots)
        row_dict["clean_intent_tags"] = " | ".join(clean_intents)
        row_dict["clean_intent_tag_count"] = len(clean_intents)
        row_dict["clean_intent_tags_json"] = json.dumps(clean_intents)
        output_rows.append(row_dict)

    output_df = pd.DataFrame(output_rows)
    output_df.to_csv(OUTPUT_PATH, index=False, encoding="utf-8")

    summary = {
        "input_file": str(INPUT_PATH),
        "output_file": str(OUTPUT_PATH),
        "rows": len(output_rows),
        "changed_rows": changed_count,
        "emptied_rows": emptied_count,
        "top_clean_interest_tags": dict(root_counter.most_common()),
        "top_clean_intent_tags": dict(intent_counter.most_common(40)),
    }
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(f"Saved cleaned HF labels to {OUTPUT_PATH}")
    print(f"Saved summary to {SUMMARY_PATH}")


if __name__ == "__main__":
    main()
