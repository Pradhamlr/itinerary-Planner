import json, os

BATCH4 = [
    # Corbett expansion
    {"name": "Jim Corbett Museum", "city": "corbett", "state": "Uttarakhand", "lat": 29.393, "lng": 79.116, "category": "museum", "subcategory": "wildlife", "rating": 4.1, "description": "Museum in the bungalow of legendary hunter-conservationist Jim Corbett with his rifles, cameras, and writings.", "avg_cost": 30, "visit_duration": 1.0, "best_time": "afternoon", "tags": ["history", "nature", "culture"], "budget_level": "low"},
    {"name": "Corbett Jeep Safari", "city": "corbett", "state": "Uttarakhand", "lat": 29.54, "lng": 78.77, "category": "nature", "subcategory": "safari", "rating": 4.6, "description": "4x4 jungle safari through Dhikala and Bijrani zones spotting Bengal tigers, elephants, and crocodiles.", "avg_cost": 2000, "visit_duration": 4.0, "best_time": "morning", "tags": ["nature", "adventure", "photography"], "budget_level": "medium"},

    # More Agra
    {"name": "Agra Fort", "city": "agra", "state": "Uttar Pradesh", "lat": 27.179, "lng": 78.021, "category": "monument", "subcategory": "fort", "rating": 4.6, "description": "UNESCO-listed 16th-century Mughal fortress with palaces, mosques, and the room where Shah Jahan was imprisoned.", "avg_cost": 50, "visit_duration": 2.0, "best_time": "morning", "tags": ["history", "architecture", "culture"], "budget_level": "low"},

    # Coorg more
    {"name": "Coffee Plantation Walk", "city": "coorg", "state": "Karnataka", "lat": 12.42, "lng": 75.74, "category": "nature", "subcategory": "plantation", "rating": 4.2, "description": "Guided walk through Arabica coffee estates learning harvest-to-cup process with pepper and cardamom plants.", "avg_cost": 200, "visit_duration": 2.0, "best_time": "morning", "tags": ["nature", "culture", "food"], "budget_level": "low"},

    # Jim Corbett NP for existing
    {"name": "Garjiya Devi Temple", "city": "corbett", "state": "Uttarakhand", "lat": 29.483, "lng": 78.98, "category": "religious", "subcategory": "temple", "rating": 4.0, "description": "Parvati temple on a large rock in the middle of Kosi River near Corbett National Park, lit up during Diwali.", "avg_cost": 0, "visit_duration": 1.0, "best_time": "evening", "tags": ["spiritual", "nature", "photography"], "budget_level": "free"},

    # Kullu expansion
    {"name": "Great Himalayan National Park", "city": "kullu", "state": "Himachal Pradesh", "lat": 31.76, "lng": 77.45, "category": "nature", "subcategory": "national_park", "rating": 4.6, "description": "UNESCO World Heritage biodiversity hotspot with glaciers, alpine meadows, and 375+ fauna species including snow leopard.", "avg_cost": 100, "visit_duration": 6.0, "best_time": "morning", "tags": ["nature", "adventure", "photography"], "budget_level": "low"},
    {"name": "Naggar Castle", "city": "kullu", "state": "Himachal Pradesh", "lat": 32.134, "lng": 77.169, "category": "monument", "subcategory": "castle", "rating": 4.2, "description": "Medieval stone-and-wood castle of the Kullu rajas with an art gallery and views of snow-capped peaks.", "avg_cost": 15, "visit_duration": 1.5, "best_time": "morning", "tags": ["history", "architecture", "photography"], "budget_level": "low"},

    # Mysore more
    {"name": "Devaraja Market", "city": "mysore", "state": "Karnataka", "lat": 12.309, "lng": 76.656, "category": "interesting_places", "subcategory": "market", "rating": 4.1, "description": "120-year-old vibrant market overflowing with sandalwood, fresh flowers, spices, and silk saris.", "avg_cost": 300, "visit_duration": 1.5, "best_time": "morning", "tags": ["shopping", "culture", "food"], "budget_level": "low"},

    # Alleppey more
    {"name": "Houseboat Cruise", "city": "alleppey", "state": "Kerala", "lat": 9.49, "lng": 76.36, "category": "adventure", "subcategory": "cruise", "rating": 4.6, "description": "Signature Kerala experience — overnight stay in a Kettuvallam houseboat cruising palm-fringed backwater canals.", "avg_cost": 5000, "visit_duration": 20.0, "best_time": "afternoon", "tags": ["adventure", "nature", "culture", "food"], "budget_level": "luxury"},

    # Kochi more
    {"name": "Chinese Fishing Nets", "city": "kochi", "state": "Kerala", "lat": 9.967, "lng": 76.24, "category": "interesting_places", "subcategory": "landmark", "rating": 4.3, "description": "Cantilevered nets introduced by Chinese traders in 14th century, now iconic Fort Kochi landmark silhouetted at sunset.", "avg_cost": 0, "visit_duration": 1.0, "best_time": "evening", "tags": ["culture", "photography", "history"], "budget_level": "free"},

    # Bangalore more
    {"name": "Bangalore Palace", "city": "bangalore", "state": "Karnataka", "lat": 12.998, "lng": 77.592, "category": "monument", "subcategory": "palace", "rating": 4.1, "description": "Tudor-style palace inspired by Windsor Castle with Gothic windows, fortified towers, and elegant woodwork.", "avg_cost": 230, "visit_duration": 1.5, "best_time": "morning", "tags": ["history", "architecture", "culture"], "budget_level": "medium"},

    # More Delhi
    {"name": "Jama Masjid", "city": "delhi", "state": "Delhi", "lat": 28.6507, "lng": 77.2334, "category": "religious", "subcategory": "mosque", "rating": 4.5, "description": "India's largest mosque built by Shah Jahan in 1644 with courtyard holding 25,000 devotees and minaret views.", "avg_cost": 0, "visit_duration": 1.0, "best_time": "morning", "tags": ["spiritual", "architecture", "history", "photography"], "budget_level": "free"},
    {"name": "Gurudwara Bangla Sahib", "city": "delhi", "state": "Delhi", "lat": 28.6264, "lng": 77.209, "category": "religious", "subcategory": "gurudwara", "rating": 4.6, "description": "Golden-domed Sikh gurudwara known for its sacred pool, massive community kitchen feeding 10,000+ daily, and serene atmosphere.", "avg_cost": 0, "visit_duration": 1.5, "best_time": "morning", "tags": ["spiritual", "culture", "food"], "budget_level": "free"},

    # Goa more
    {"name": "Palolem Beach", "city": "goa", "state": "Goa", "lat": 15.01, "lng": 74.023, "category": "nature", "subcategory": "beach", "rating": 4.4, "description": "Crescent-shaped South Goa beach with calm waters, beach huts, silent disco headphone parties, and dolphin trips.", "avg_cost": 300, "visit_duration": 3.0, "best_time": "afternoon", "tags": ["nature", "beaches", "adventure", "nightlife"], "budget_level": "medium"},

    # Jaipur more
    {"name": "Albert Hall Museum", "city": "jaipur", "state": "Rajasthan", "lat": 26.912, "lng": 75.813, "category": "museum", "subcategory": "general_museum", "rating": 4.3, "description": "Indo-Saracenic museum in Ram Niwas Garden with Egyptian mummy, Persian miniatures, and illuminated night facade.", "avg_cost": 40, "visit_duration": 1.5, "best_time": "afternoon", "tags": ["history", "art", "culture", "photography"], "budget_level": "low"},

    # Mumbai more
    {"name": "Chhatrapati Shivaji Terminus", "city": "mumbai", "state": "Maharashtra", "lat": 18.94, "lng": 72.836, "category": "architecture", "subcategory": "railway_station", "rating": 4.5, "description": "UNESCO-listed Victorian Gothic railway station with stained glass, turrets, and carved stone — Mumbai's architectural crown.", "avg_cost": 0, "visit_duration": 0.5, "best_time": "morning", "tags": ["architecture", "history", "photography"], "budget_level": "free"},

    # Kolkata more
    {"name": "Mother House", "city": "kolkata", "state": "West Bengal", "lat": 22.546, "lng": 88.363, "category": "religious", "subcategory": "convent", "rating": 4.4, "description": "Headquarters of Mother Teresa's Missionaries of Charity, housing her tomb and a small moving museum.", "avg_cost": 0, "visit_duration": 1.0, "best_time": "morning", "tags": ["spiritual", "culture", "history"], "budget_level": "free"},

    # Hyderabad more
    {"name": "Salar Jung Museum", "city": "hyderabad", "state": "Telangana", "lat": 17.371, "lng": 78.48, "category": "museum", "subcategory": "art_museum", "rating": 4.4, "description": "One of the world's largest one-man art collections with Veiled Rebecca sculpture, Mughal daggers, and jade artefacts.", "avg_cost": 20, "visit_duration": 2.5, "best_time": "afternoon", "tags": ["art", "history", "culture"], "budget_level": "low"},

    # Ahmedabad more
    {"name": "Kankaria Lake", "city": "ahmedabad", "state": "Gujarat", "lat": 23.007, "lng": 72.599, "category": "park", "subcategory": "lakefront", "rating": 4.1, "description": "15th-century lake with lakefront promenade, zoo, kids' city, balloon rides, and weekend cultural events.", "avg_cost": 50, "visit_duration": 2.5, "best_time": "evening", "tags": ["nature", "adventure", "culture"], "budget_level": "low"},

    # Jaisalmer more
    {"name": "Nathmal Ji Ki Haveli", "city": "jaisalmer", "state": "Rajasthan", "lat": 26.913, "lng": 70.914, "category": "architecture", "subcategory": "haveli", "rating": 4.2, "description": "Unique 19th-century sandstone haveli with asymmetric design — built by two brothers simultaneously from opposite sides.", "avg_cost": 50, "visit_duration": 0.5, "best_time": "morning", "tags": ["architecture", "history", "art"], "budget_level": "low"},

    # Chennai more
    {"name": "Elliot's Beach", "city": "chennai", "state": "Tamil Nadu", "lat": 13.002, "lng": 80.272, "category": "nature", "subcategory": "beach", "rating": 4.1, "description": "Quieter alternative to Marina Beach popular for morning walks, surfing lessons, and evening food trucks.", "avg_cost": 0, "visit_duration": 1.5, "best_time": "evening", "tags": ["nature", "beaches", "food"], "budget_level": "free"},
]

def main():
    dataset_path = os.path.join(os.path.dirname(__file__), 'data', 'places_dataset.json')
    with open(dataset_path, 'r', encoding='utf-8') as f:
        existing = json.load(f)
    existing_names = {(p['name'].lower(), p['city'].lower()) for p in existing}
    added = 0
    for place in BATCH4:
        key = (place['name'].lower(), place['city'].lower())
        if key not in existing_names:
            existing.append(place)
            existing_names.add(key)
            added += 1
    with open(dataset_path, 'w', encoding='utf-8') as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)
    cities = set(p['city'] for p in existing)
    print(f"Added {added} new places. Total: {len(existing)} places across {len(cities)} cities")

if __name__ == '__main__':
    main()
