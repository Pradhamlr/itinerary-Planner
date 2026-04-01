Expansion dataset workspace for non-curated cities.

Files here are intentionally separate from `ml-service/dataset/` so:

- curated cities can keep their stable HF-backed interest pipeline
- expansion cities can still get rating/review/popularity features
- `export-dataset` does not have to overwrite the curated universe

Expected files:

- `places_expansion.csv`
- `place_features_expansion.csv`
- `place_interest_labels_expansion.csv`

Generation flow:

1. Fetch planned cities into MongoDB with `Backend/scripts/fetchPlannedCities.js`
2. Export only expansion cities with `Backend/scripts/exportExpansionDataset.js`
3. Generate feature signals with `ml-service/create_expansion_features.py`
4. Generate lightweight heuristic interest labels with `ml-service/create_expansion_interest_labels.py`
