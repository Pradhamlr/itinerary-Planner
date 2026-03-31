# Voyager Itinerary Platform

Voyager is a full-stack AI-assisted travel planning application that helps users create trips, choose interests, generate recommendations, build itineraries, optimize routes, manage stays, and store travel documents.

The system is intentionally hybrid:
- rule-based where travel logic should stay interpretable
- ML-assisted where ranking and semantic tagging add value
- data-quality-aware so recommendations improve as the place universe improves

This README is the primary project guide. For a longer viva-style explanation, see [FINAL_APPLICATION_SUMMARY.md](/c:/Users/pradh/Desktop/Itinerary/FINAL_APPLICATION_SUMMARY.md).

## Project Structure

- [Client](/c:/Users/pradh/Desktop/Itinerary/Client): React frontend
- [Backend](/c:/Users/pradh/Desktop/Itinerary/Backend): Express API and recommendation/itinerary engine
- [ml-service](/c:/Users/pradh/Desktop/Itinerary/ml-service): FastAPI ML service and dataset/model pipeline
- [scripts](/c:/Users/pradh/Desktop/Itinerary/scripts): utility scripts

## Tech Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express, MongoDB, Mongoose
- ML service: Python, FastAPI, pandas, scikit-learn, joblib
- External services: Google Maps Places APIs

## Core Features

- user signup, login, forgot-password flow
- trip creation with city, days, budget, interests, and optional hotel/start point
- recommendation generation for attractions and restaurants
- strict and soft interest-aware recommendation tracks
- itinerary generation with editing, swapping, and regeneration
- route optimizer
- static and dynamic hotel/stay planning
- travel document vault
- recommendation snapshot and itinerary snapshot persistence

## Runtime Architecture

### Frontend

The frontend is the trip workspace. It lets users:
- create trips
- view recommendations
- pair interests
- request softer matches
- generate itineraries
- select static or dynamic stays
- swap or lock itinerary stops

Important pages/components:
- [App.jsx](/c:/Users/pradh/Desktop/Itinerary/Client/src/App.jsx)
- [CreateTrip.jsx](/c:/Users/pradh/Desktop/Itinerary/Client/src/pages/CreateTrip.jsx)
- [TripDetails.jsx](/c:/Users/pradh/Desktop/Itinerary/Client/src/pages/TripDetails.jsx)
- [TripDetailsPanels.jsx](/c:/Users/pradh/Desktop/Itinerary/Client/src/components/TripDetailsPanels.jsx)
- [PlaceCard.jsx](/c:/Users/pradh/Desktop/Itinerary/Client/src/components/PlaceCard.jsx)
- [Navbar.jsx](/c:/Users/pradh/Desktop/Itinerary/Client/src/components/Navbar.jsx)

### Backend

The backend is the orchestration layer. It:
- loads candidate places for a city
- enriches them with interest predictions
- applies recommendation tracks and thresholds
- builds attraction pools
- ranks places
- generates itineraries
- saves recommendation and itinerary snapshots

Important files:
- [recommendationService.js](/c:/Users/pradh/Desktop/Itinerary/Backend/services/recommendationService.js)
- [itineraryService.js](/c:/Users/pradh/Desktop/Itinerary/Backend/services/itineraryService.js)
- [recommendationController.js](/c:/Users/pradh/Desktop/Itinerary/Backend/controllers/recommendationController.js)
- [itineraryController.js](/c:/Users/pradh/Desktop/Itinerary/Backend/controllers/itineraryController.js)
- [recommendationConfig.js](/c:/Users/pradh/Desktop/Itinerary/Backend/config/recommendationConfig.js)
- [Trip.js](/c:/Users/pradh/Desktop/Itinerary/Backend/models/Trip.js)
- [Place.js](/c:/Users/pradh/Desktop/Itinerary/Backend/models/Place.js)

### ML Service

The ML service provides:
- recommendation model scoring
- sentiment scoring
- live interest lookup via the cleaned HF file

At runtime, the most important interest source is:
- [place_interest_labels_hf_clean.csv](/c:/Users/pradh/Desktop/Itinerary/ml-service/dataset/place_interest_labels_hf_clean.csv)

Important files:
- [app.py](/c:/Users/pradh/Desktop/Itinerary/ml-service/app.py)
- [create_features.py](/c:/Users/pradh/Desktop/Itinerary/ml-service/create_features.py)
- [train_recommendation.py](/c:/Users/pradh/Desktop/Itinerary/ml-service/train_recommendation.py)

## Data Pipeline

The stable place universe should keep these aligned:

1. [places.csv](/c:/Users/pradh/Desktop/Itinerary/ml-service/dataset/places.csv)
2. [place_features.csv](/c:/Users/pradh/Desktop/Itinerary/ml-service/dataset/place_features.csv)
3. recommendation model artifacts in [models](/c:/Users/pradh/Desktop/Itinerary/ml-service/models)
4. [place_interest_labels_hf_clean.csv](/c:/Users/pradh/Desktop/Itinerary/ml-service/dataset/place_interest_labels_hf_clean.csv)

Important lesson from development:
- mismatched place universes cause subtle recommendation drift
- if `places.csv` changes, regenerate features and the recommendation model
- if only the cleaned HF file changes, restart services so runtime interest lookup uses the new file

## Recommendation Tracks

### Track A: No Interests Selected

Purpose:
- generic sightseeing
- quality-first
- popularity-aware
- stable full itinerary coverage

Behavior:
- uses allowed attraction types only
- removes blocked utility-like types
- uses a strong quality pool and a stricter exploration pool
- blends popular and exploration candidates
- uses floor-fill/backfill to avoid sparse results

Track A excludes:
- `shopping_mall`
- `store`
- `clothing_store`
- `jewelry_store`

Track A may still allow:
- `market`

### Track B: Interests Selected

Purpose:
- strict personalization
- no silent dilution into generic tourism

Behavior:
- attaches interest predictions from the ML service
- filters candidates by selected interests
- ranks with stronger interest weight
- allows explicit pairing or softer matching when strict results are sparse

## Current Thresholds

### Track A quality

- primary attraction rating: `>= 4.2`
- primary attraction reviews: `>= 500`
- exploration rating: `>= 3.9`
- exploration reviews: `>= 500`

### Track B weighted rating

- primary weighted rating cutoff: `4.15`
- fallback weighted rating cutoff: `3.5`

### Track B strict thresholds

- general non-shopping interests: `0.85`
- beaches: `0.90`
- shopping direct retail types: `0.62`
- shopping semantic non-retail matches: `0.85`

### Track B softer thresholds

- general non-shopping interests: `0.80`
- beaches: `0.85`

## Shopping Logic

Shopping required a dedicated track because raw semantic scoring alone was too noisy.

Direct shopping types:
- `shopping_mall`
- `market`
- `clothing_store`
- `jewelry_store`

Hard-suppressed from shopping:
- `grocery_or_supermarket`
- `supermarket`
- `real_estate_agency`
- `electronics_store`

Street-shopping support:
- `street shopping`
- `local shopping`
- `souvenir shopping`
- `fashion shopping`

Why this design was chosen:
- generic commerce types polluted recommendations
- malls and markets needed lower thresholds than non-direct semantic matches
- street-shopping places needed intent support to compete with malls

## Pairing and Softer Matches

When strict Track B does not return enough places, the frontend exposes two explicit choices:

### Pairing

Pairing broadens the trip by adding a related interest. Examples:
- beaches -> nature
- culture -> history or art
- art -> history or culture
- shopping -> culture or history

Pairing updates trip interests, regenerates recommendations, and regenerates the itinerary.

### Softer Matches

Softer matches keep the same interest but rerun with a lower threshold:
- `0.85 -> 0.80` for most non-shopping interests
- `0.90 -> 0.85` for beaches

This exists so pairing stays meaningful. The system does not silently soften by default.

## Why the Hybrid Design Was Chosen

This project deliberately avoids being a pure ML recommender.

Reasons:
- users need interpretable recommendation behavior
- place data quality varies by city
- travel planning benefits from explicit quality gates
- shopping, beaches, and cultural interests behave differently

So the final result comes from:
- semantic interest scores
- cleaned interest tags
- intent tags
- weighted rating
- popularity
- must-see boosts
- route and itinerary rules

## Itinerary Design

The itinerary service uses the broader recommendation universe, not just the top visible shortlist.

Important behaviors:
- recommendations and itinerary are kept more consistent by exposing the extended pool
- swap flow preserves the rest of the day
- locked places remain stable
- day regeneration updates only the relevant day
- static and dynamic stay planning persist

## Auth and Session

Auth is handled in the frontend via [AuthContext.jsx](/c:/Users/pradh/Desktop/Itinerary/Client/src/context/AuthContext.jsx).

Stored in local storage:
- `token`
- `user`

Logout now exists globally in the navbar beside the Home button.

## Development Commands

### Backend

From [Backend](/c:/Users/pradh/Desktop/Itinerary/Backend):

```bash
npm install
npm run dev
```

### Frontend

From [Client](/c:/Users/pradh/Desktop/Itinerary/Client):

```bash
npm install
npm run dev
```

### ML service

From [ml-service](/c:/Users/pradh/Desktop/Itinerary/ml-service):

```bash
python create_features.py
python train_recommendation.py
```

If only the cleaned HF file changes:
- do not retrain by default
- restart ML service and backend so runtime lookup refreshes

## Recommended Final Pre-Commit Checks

- no-interest trips generate stable Track A results
- strict single-interest Track B works for history, culture, art, nature, beaches, shopping
- pairing buttons regenerate trips correctly
- `See softer matches` actually widens sparse strict-interest results
- shopping excludes supermarkets, real estate, and electronics
- itinerary places come from selected or extended recommendation pools
- swap flow preserves unswapped places
- dynamic stay choices persist after reload
- ML `/health` reports the correct cleaned HF file as the active source

## Next Expansion Strategy

The recommended rollout path is two-tier:

### Standard city coverage
- use strong generic/no-interest flow first
- onboard cities faster

### Curated interest coverage
- enable richer Track B behavior later for selected cities

This keeps expansion practical without waiting for perfect semantic tagging for every new city.

## Notes

- The cleaned HF file is currently the most important live interest artifact.
- Recommendation-model retraining matters when the place universe changes.
- Thresholds are intentionally explicit so recommendation behavior stays explainable.

