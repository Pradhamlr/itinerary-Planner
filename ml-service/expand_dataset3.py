"""
Third expansion: push to 530+ places with more coverage.
"""
import json, os

BATCH3 = [
    # ====== BIHAR ======
    {"name": "Nalanda University Ruins", "city": "nalanda", "state": "Bihar", "lat": 25.136, "lng": 85.443, "category": "historic", "subcategory": "ruins", "rating": 4.6, "description": "UNESCO ruins of the world's oldest university (5th century) that once hosted 10,000 scholars from across Asia.", "avg_cost": 25, "visit_duration": 2.0, "best_time": "morning", "tags": ["history", "culture", "architecture"], "budget_level": "low"},
    {"name": "Nalanda Museum", "city": "nalanda", "state": "Bihar", "lat": 25.137, "lng": 85.444, "category": "museum", "subcategory": "archaeological", "rating": 4.2, "description": "Museum housing excavated Buddhist bronzes, manuscripts, and terracotta artefacts from the ancient university.", "avg_cost": 15, "visit_duration": 1.0, "best_time": "afternoon", "tags": ["history", "art", "culture"], "budget_level": "low"},
    {"name": "Rajgir Hot Springs", "city": "nalanda", "state": "Bihar", "lat": 25.028, "lng": 85.416, "category": "nature", "subcategory": "hot_springs", "rating": 4.1, "description": "Sacred thermal springs where Buddha once bathed, with stepped pools at varying temperatures.", "avg_cost": 0, "visit_duration": 1.0, "best_time": "morning", "tags": ["nature", "spiritual"], "budget_level": "free"},

    # Bodhgaya expansion
    {"name": "Giant Buddha Statue", "city": "bodhgaya", "state": "Bihar", "lat": 24.689, "lng": 85.006, "category": "monument", "subcategory": "statue", "rating": 4.3, "description": "Magnificent 80-ft seated Buddha statue unveiled by the 14th Dalai Lama, visible across the plains.", "avg_cost": 0, "visit_duration": 0.5, "best_time": "morning", "tags": ["spiritual", "architecture", "photography"], "budget_level": "free"},
    {"name": "Royal Bhutan Monastery", "city": "bodhgaya", "state": "Bihar", "lat": 24.693, "lng": 84.99, "category": "religious", "subcategory": "monastery", "rating": 4.1, "description": "Ornate Bhutanese monastery showcasing traditional Bhutanese architecture and intricate wall paintings.", "avg_cost": 0, "visit_duration": 1.0, "best_time": "morning", "tags": ["spiritual", "culture", "architecture"], "budget_level": "free"},

    # ====== MEGHALAYA ======
    {"name": "Mawlynnong Village", "city": "shillong", "state": "Meghalaya", "lat": 25.197, "lng": 91.919, "category": "interesting_places", "subcategory": "village", "rating": 4.4, "description": "Asia's cleanest village with bamboo dustbins, living root bridges, and crystal-clear natural swimming pools.", "avg_cost": 0, "visit_duration": 3.0, "best_time": "morning", "tags": ["culture", "nature", "photography"], "budget_level": "free"},
    {"name": "Mawsmai Cave", "city": "shillong", "state": "Meghalaya", "lat": 25.261, "lng": 91.715, "category": "nature", "subcategory": "cave", "rating": 4.1, "description": "Well-lit limestone cave with spectacular formations, narrow passages, and dripping stalactites.", "avg_cost": 30, "visit_duration": 1.0, "best_time": "morning", "tags": ["nature", "adventure"], "budget_level": "low"},

    # ====== TRIPURA ======
    {"name": "Ujjayanta Palace", "city": "agartala", "state": "Tripura", "lat": 23.839, "lng": 91.28, "category": "monument", "subcategory": "palace", "rating": 4.2, "description": "Grand Mughal-style palace of the Tripura royals with tiled floors, throne room, and state museum inside.", "avg_cost": 20, "visit_duration": 1.5, "best_time": "morning", "tags": ["history", "architecture", "culture"], "budget_level": "low"},
    {"name": "Neermahal", "city": "agartala", "state": "Tripura", "lat": 23.507, "lng": 91.348, "category": "monument", "subcategory": "water_palace", "rating": 4.3, "description": "India's largest water palace built on Rudrasagar Lake, blending Hindu and Islamic architecture.", "avg_cost": 50, "visit_duration": 2.0, "best_time": "afternoon", "tags": ["history", "architecture", "nature", "photography"], "budget_level": "low"},
    {"name": "Unakoti", "city": "agartala", "state": "Tripura", "lat": 24.32, "lng": 92.07, "category": "historic", "subcategory": "rock_carvings", "rating": 4.4, "description": "Mysterious 7th-century rock-carved Shiva panels and massive reliefs in the jungle, India's best-kept archaeological secret.", "avg_cost": 0, "visit_duration": 2.0, "best_time": "morning", "tags": ["history", "spiritual", "adventure", "photography"], "budget_level": "free"},

    # ====== MANIPUR ======
    {"name": "Loktak Lake", "city": "imphal", "state": "Manipur", "lat": 24.569, "lng": 93.804, "category": "nature", "subcategory": "lake", "rating": 4.5, "description": "World's only floating lake with circular floating islands (phumdis) and the Keibul Lamjao floating national park.", "avg_cost": 50, "visit_duration": 3.0, "best_time": "morning", "tags": ["nature", "adventure", "photography"], "budget_level": "low"},
    {"name": "Kangla Fort", "city": "imphal", "state": "Manipur", "lat": 24.804, "lng": 93.941, "category": "monument", "subcategory": "fort", "rating": 4.2, "description": "Ancient seat of the Meitei kings surrounded by a moat, with the iconic twin dragon (Kangla Sha) statues.", "avg_cost": 0, "visit_duration": 1.5, "best_time": "morning", "tags": ["history", "culture"], "budget_level": "free"},
    {"name": "INA Memorial", "city": "imphal", "state": "Manipur", "lat": 24.87, "lng": 94.022, "category": "monument", "subcategory": "memorial", "rating": 4.1, "description": "Memorial at Moirang where the INA flag was first hoisted on Indian soil during WWII's Battle of Imphal.", "avg_cost": 0, "visit_duration": 1.0, "best_time": "afternoon", "tags": ["history", "culture"], "budget_level": "free"},

    # ====== NAGALAND ======
    {"name": "Kohima War Cemetery", "city": "kohima", "state": "Nagaland", "lat": 25.668, "lng": 94.107, "category": "monument", "subcategory": "war_cemetery", "rating": 4.5, "description": "Beautifully maintained WWII cemetery honouring 1,420 Allied soldiers with the famous 'When You Go Home' epitaph.", "avg_cost": 0, "visit_duration": 1.0, "best_time": "morning", "tags": ["history", "culture"], "budget_level": "free"},
    {"name": "Dzukou Valley", "city": "kohima", "state": "Nagaland", "lat": 25.518, "lng": 93.93, "category": "nature", "subcategory": "valley", "rating": 4.6, "description": "Valley of flowers of the Northeast at 2,452m, carpeted with exotic seasonal blooms and bamboo groves.", "avg_cost": 0, "visit_duration": 8.0, "best_time": "morning", "tags": ["nature", "adventure", "photography"], "budget_level": "free"},

    # ====== MIZORAM ======
    {"name": "Phawngpui (Blue Mountain)", "city": "aizawl", "state": "Mizoram", "lat": 21.989, "lng": 93.155, "category": "nature", "subcategory": "peak", "rating": 4.3, "description": "Mizoram's highest peak at 2,157m with rhododendron blooms, orchids, and panoramic views of Myanmar border.", "avg_cost": 0, "visit_duration": 5.0, "best_time": "morning", "tags": ["nature", "adventure", "photography"], "budget_level": "free"},
    {"name": "Durtlang Hills", "city": "aizawl", "state": "Mizoram", "lat": 23.79, "lng": 92.739, "category": "nature", "subcategory": "viewpoint", "rating": 4.1, "description": "Scenic viewpoint on the northern outskirts of Aizawl with sweeping views of the city and surrounding hills.", "avg_cost": 0, "visit_duration": 1.0, "best_time": "evening", "tags": ["nature", "photography"], "budget_level": "free"},

    # ====== MORE UTTARAKHAND ======
    {"name": "Valley of Flowers", "city": "uttarakhand_hills", "state": "Uttarakhand", "lat": 30.728, "lng": 79.606, "category": "nature", "subcategory": "national_park", "rating": 4.8, "description": "UNESCO World Heritage alpine meadow with 600+ flower species blooming July-September in the upper Himalayas.", "avg_cost": 350, "visit_duration": 6.0, "best_time": "morning", "tags": ["nature", "adventure", "photography"], "budget_level": "low"},
    {"name": "Auli", "city": "uttarakhand_hills", "state": "Uttarakhand", "lat": 30.529, "lng": 79.565, "category": "nature", "subcategory": "ski_resort", "rating": 4.5, "description": "India's premier ski resort at 2,500-3,050m with Asia's longest cable car and panoramic Nanda Devi views.", "avg_cost": 800, "visit_duration": 5.0, "best_time": "morning", "tags": ["adventure", "nature", "sports", "photography"], "budget_level": "medium"},
    {"name": "Chopta-Tungnath Trek", "city": "uttarakhand_hills", "state": "Uttarakhand", "lat": 30.485, "lng": 79.218, "category": "nature", "subcategory": "trek", "rating": 4.6, "description": "Trek to the world's highest Shiva temple at 3,680m through dense rhododendron forests with Himalayan views.", "avg_cost": 200, "visit_duration": 6.0, "best_time": "morning", "tags": ["adventure", "nature", "spiritual", "photography"], "budget_level": "low"},

    # ====== RAJASTHAN ======
    # Pushkar expansion
    {"name": "Savitri Temple", "city": "pushkar", "state": "Rajasthan", "lat": 26.484, "lng": 74.556, "category": "religious", "subcategory": "temple", "rating": 4.3, "description": "Hilltop temple reached by 1.5-hour hike or ropeway with stunning views over Pushkar Lake and the desert.", "avg_cost": 50, "visit_duration": 2.0, "best_time": "evening", "tags": ["spiritual", "adventure", "photography"], "budget_level": "low"},
    {"name": "Pushkar Camel Fair Grounds", "city": "pushkar", "state": "Rajasthan", "lat": 26.495, "lng": 74.55, "category": "interesting_places", "subcategory": "fairground", "rating": 4.4, "description": "Desert ground hosting the world's largest camel fair each November with races, folk performances, and trading.", "avg_cost": 0, "visit_duration": 3.0, "best_time": "morning", "tags": ["culture", "photography", "adventure"], "budget_level": "free"},

    # Mount Abu
    {"name": "Dilwara Jain Temples", "city": "mount_abu", "state": "Rajasthan", "lat": 24.613, "lng": 72.716, "category": "religious", "subcategory": "temple", "rating": 4.8, "description": "Five marble Jain temples renowned for the most intricate and detailed marble carvings in the world.", "avg_cost": 0, "visit_duration": 2.0, "best_time": "morning", "tags": ["spiritual", "architecture", "art"], "budget_level": "free"},
    {"name": "Nakki Lake", "city": "mount_abu", "state": "Rajasthan", "lat": 24.592, "lng": 72.71, "category": "nature", "subcategory": "lake", "rating": 4.1, "description": "Sacred lake in Rajasthan's only hill station with boating and Toad Rock viewpoint above.", "avg_cost": 50, "visit_duration": 1.5, "best_time": "evening", "tags": ["nature", "photography"], "budget_level": "low"},
    {"name": "Guru Shikhar", "city": "mount_abu", "state": "Rajasthan", "lat": 24.653, "lng": 72.765, "category": "nature", "subcategory": "peak", "rating": 4.3, "description": "Highest peak in the Aravalli Range at 1,722m with a Dattatreya temple and views stretching to the Thar Desert.", "avg_cost": 0, "visit_duration": 1.5, "best_time": "morning", "tags": ["nature", "adventure", "photography", "spiritual"], "budget_level": "free"},

    # ====== ANDAMAN EXPANSION ======
    {"name": "Radhanagar Beach", "city": "andaman", "state": "Andaman & Nicobar", "lat": 12.007, "lng": 92.975, "category": "nature", "subcategory": "beach", "rating": 4.7, "description": "Asia's Best Beach — pristine white sand stretch with turquoise waters, lush forest backdrop, and glowing sunsets.", "avg_cost": 0, "visit_duration": 3.0, "best_time": "afternoon", "tags": ["nature", "beaches", "photography"], "budget_level": "free"},
    {"name": "Cellular Jail", "city": "andaman", "state": "Andaman & Nicobar", "lat": 11.693, "lng": 92.739, "category": "historic", "subcategory": "prison", "rating": 4.6, "description": "Colonial-era solitary confinement prison known as 'Kala Pani', with a moving evening light and sound show.", "avg_cost": 30, "visit_duration": 2.0, "best_time": "evening", "tags": ["history", "culture"], "budget_level": "low"},
    {"name": "Scuba at Havelock", "city": "andaman", "state": "Andaman & Nicobar", "lat": 12.012, "lng": 92.99, "category": "adventure", "subcategory": "diving", "rating": 4.5, "description": "World-class scuba diving at coral reef walls with sea turtles, manta rays, and vibrant marine biodiversity.", "avg_cost": 3500, "visit_duration": 4.0, "best_time": "morning", "tags": ["adventure", "nature", "beaches"], "budget_level": "luxury"},

    # ====== KAZIRANGA EXPANSION ======
    {"name": "Kaziranga Elephant Safari", "city": "kaziranga", "state": "Assam", "lat": 26.583, "lng": 93.17, "category": "nature", "subcategory": "safari", "rating": 4.5, "description": "Early morning elephant-back safari through tall grasslands for close encounters with one-horned rhinoceros.", "avg_cost": 900, "visit_duration": 2.0, "best_time": "morning", "tags": ["nature", "adventure", "photography"], "budget_level": "medium"},
    {"name": "Kaziranga Orchid Park", "city": "kaziranga", "state": "Assam", "lat": 26.59, "lng": 93.36, "category": "nature", "subcategory": "garden", "rating": 4.0, "description": "Park showcasing 500+ orchid species native to Northeast India alongside exotic fish and butterflies.", "avg_cost": 50, "visit_duration": 1.5, "best_time": "morning", "tags": ["nature", "photography"], "budget_level": "low"},

    # ====== OOTY EXPANSION ======
    {"name": "Ooty Botanical Gardens", "city": "ooty", "state": "Tamil Nadu", "lat": 11.416, "lng": 76.71, "category": "park", "subcategory": "botanical_garden", "rating": 4.3, "description": "55-acre government garden with 1,000+ plant species, 20-million-year-old fossilised tree, and annual flower show.", "avg_cost": 30, "visit_duration": 2.0, "best_time": "morning", "tags": ["nature", "photography"], "budget_level": "low"},
    {"name": "Ooty Lake", "city": "ooty", "state": "Tamil Nadu", "lat": 11.412, "lng": 76.695, "category": "nature", "subcategory": "lake", "rating": 4.1, "description": "Artificial lake surrounded by eucalyptus trees with pedal and row boats and a miniature train along the shore.", "avg_cost": 50, "visit_duration": 1.5, "best_time": "morning", "tags": ["nature", "adventure"], "budget_level": "low"},
    {"name": "Nilgiri Mountain Railway", "city": "ooty", "state": "Tamil Nadu", "lat": 11.413, "lng": 76.7, "category": "interesting_places", "subcategory": "heritage_railway", "rating": 4.6, "description": "UNESCO World Heritage rack railway from Mettupalayam through 16 tunnels and 250 bridges to Ooty at 2,200m.", "avg_cost": 30, "visit_duration": 5.0, "best_time": "morning", "tags": ["adventure", "photography", "nature", "culture"], "budget_level": "low"},

    # ====== PURI EXPANSION ======
    {"name": "Chilika Lake", "city": "puri", "state": "Odisha", "lat": 19.726, "lng": 85.319, "category": "nature", "subcategory": "lagoon", "rating": 4.4, "description": "Asia's largest brackish water lagoon and Ramsar site, a birder's paradise hosting 1 million+ migratory birds.", "avg_cost": 200, "visit_duration": 3.0, "best_time": "morning", "tags": ["nature", "adventure", "photography"], "budget_level": "low"},
    {"name": "Raghurajpur Heritage Village", "city": "puri", "state": "Odisha", "lat": 19.911, "lng": 86.013, "category": "interesting_places", "subcategory": "craft_village", "rating": 4.3, "description": "Artisan village where every household practices Pattachitra painting, palm-leaf etching, and stone carving.", "avg_cost": 0, "visit_duration": 2.0, "best_time": "morning", "tags": ["art", "culture", "shopping"], "budget_level": "free"},

    # ====== RANTHAMBORE EXPANSION ======
    {"name": "Ranthambore Fort", "city": "ranthambore", "state": "Rajasthan", "lat": 26.013, "lng": 76.466, "category": "monument", "subcategory": "fort", "rating": 4.3, "description": "UNESCO 10th-century hilltop fort inside the tiger reserve with temples, lake views, and fort-top wildlife sightings.", "avg_cost": 50, "visit_duration": 2.0, "best_time": "morning", "tags": ["history", "architecture", "nature"], "budget_level": "low"},
    {"name": "Ranthambore Safari Zone 6", "city": "ranthambore", "state": "Rajasthan", "lat": 26.0, "lng": 76.5, "category": "nature", "subcategory": "safari", "rating": 4.6, "description": "Premium safari zone famous for tiger sightings near the three lakes inside the national park.", "avg_cost": 1500, "visit_duration": 3.0, "best_time": "morning", "tags": ["nature", "adventure", "photography"], "budget_level": "medium"},

    # ====== NEW CITIES ======
    # Ajmer
    {"name": "Ajmer Sharif Dargah", "city": "ajmer", "state": "Rajasthan", "lat": 26.457, "lng": 74.628, "category": "religious", "subcategory": "dargah", "rating": 4.6, "description": "One of India's most revered Sufi shrines housing the tomb of Khwaja Moinuddin Chishti, visited by millions.", "avg_cost": 0, "visit_duration": 2.0, "best_time": "afternoon", "tags": ["spiritual", "culture", "history"], "budget_level": "free"},
    {"name": "Ana Sagar Lake", "city": "ajmer", "state": "Rajasthan", "lat": 26.472, "lng": 74.626, "category": "nature", "subcategory": "lake", "rating": 4.1, "description": "12th-century artificial lake with marble pavilions built by Jahangir and Daulat Bagh gardens.", "avg_cost": 0, "visit_duration": 1.5, "best_time": "evening", "tags": ["nature", "photography", "history"], "budget_level": "free"},
    {"name": "Taragarh Fort", "city": "ajmer", "state": "Rajasthan", "lat": 26.46, "lng": 74.622, "category": "monument", "subcategory": "fort", "rating": 4.2, "description": "One of the oldest hill forts in India perched above the city with ancient water reservoirs and panoramic views.", "avg_cost": 25, "visit_duration": 1.5, "best_time": "morning", "tags": ["history", "adventure", "photography"], "budget_level": "low"},

    # Coimbatore
    {"name": "Isha Yoga Center", "city": "coimbatore", "state": "Tamil Nadu", "lat": 11.085, "lng": 76.736, "category": "religious", "subcategory": "ashram", "rating": 4.6, "description": "Home of Adiyogi Shiva statue (112 ft) — world's largest bust (Guinness record), with meditation programs.", "avg_cost": 0, "visit_duration": 3.0, "best_time": "morning", "tags": ["spiritual", "architecture", "culture"], "budget_level": "free"},
    {"name": "Marudamalai Temple", "city": "coimbatore", "state": "Tamil Nadu", "lat": 11.036, "lng": 76.924, "category": "religious", "subcategory": "temple", "rating": 4.2, "description": "Ancient Murugan temple on a 500-ft hillock in the Western Ghats foothills with panoramic valley views.", "avg_cost": 0, "visit_duration": 1.5, "best_time": "morning", "tags": ["spiritual", "nature", "photography"], "budget_level": "free"},

    # Ujjain
    {"name": "Mahakaleshwar Temple", "city": "ujjain", "state": "Madhya Pradesh", "lat": 23.183, "lng": 75.768, "category": "religious", "subcategory": "jyotirlinga", "rating": 4.7, "description": "One of the 12 sacred Jyotirlingas with the famous Bhasma Aarti — pre-dawn worship with sacred ash.", "avg_cost": 0, "visit_duration": 2.0, "best_time": "morning", "tags": ["spiritual", "culture", "history"], "budget_level": "free"},
    {"name": "Kal Bhairav Temple", "city": "ujjain", "state": "Madhya Pradesh", "lat": 23.185, "lng": 75.776, "category": "religious", "subcategory": "temple", "rating": 4.2, "description": "Unique temple where the deity is offered liquor as prasad, an ancient Tantric Shiva tradition.", "avg_cost": 0, "visit_duration": 1.0, "best_time": "afternoon", "tags": ["spiritual", "culture"], "budget_level": "free"},

    # Varanasi more places
    {"name": "Kashi Vishwanath Temple", "city": "varanasi", "state": "Uttar Pradesh", "lat": 25.311, "lng": 83.011, "category": "religious", "subcategory": "jyotirlinga", "rating": 4.7, "description": "Most sacred Jyotirlinga and holiest Shiva temple in India with a newly expanded grand temple corridor.", "avg_cost": 0, "visit_duration": 2.0, "best_time": "morning", "tags": ["spiritual", "history", "culture"], "budget_level": "free"},
    {"name": "Dashashwamedh Ghat Aarti", "city": "varanasi", "state": "Uttar Pradesh", "lat": 25.305, "lng": 83.011, "category": "interesting_places", "subcategory": "ceremony", "rating": 4.8, "description": "Mesmerizing nightly Ganga Aarti with synchronised fire rituals by trained priests on the steps of the Ganges.", "avg_cost": 0, "visit_duration": 1.5, "best_time": "evening", "tags": ["spiritual", "culture", "photography"], "budget_level": "free"},

    # Auroville (standalone)
    {"name": "Matrimandir", "city": "pondicherry", "state": "Puducherry", "lat": 12.007, "lng": 79.811, "category": "interesting_places", "subcategory": "meditation_sphere", "rating": 4.6, "description": "Golden dome meditation chamber at Auroville's heart with a crystal sphere bathed in sunlight — a spiritual marvel.", "avg_cost": 0, "visit_duration": 2.0, "best_time": "morning", "tags": ["spiritual", "architecture", "photography"], "budget_level": "free"},

    # Mysore more
    {"name": "St. Philomena's Cathedral", "city": "mysore", "state": "Karnataka", "lat": 12.316, "lng": 76.657, "category": "religious", "subcategory": "church", "rating": 4.2, "description": "One of India's tallest churches in Neo-Gothic style modelled after Cologne Cathedral, with stained glass windows.", "avg_cost": 0, "visit_duration": 1.0, "best_time": "morning", "tags": ["spiritual", "architecture"], "budget_level": "free"},

    # Amritsar more
    {"name": "Jallianwala Bagh", "city": "amritsar", "state": "Punjab", "lat": 31.621, "lng": 74.88, "category": "historic", "subcategory": "memorial", "rating": 4.5, "description": "Memorial garden at the site of the 1919 massacre with bullet-scarred walls and flame of liberty monument.", "avg_cost": 0, "visit_duration": 1.5, "best_time": "afternoon", "tags": ["history", "culture"], "budget_level": "free"},

    # Puri more
    {"name": "Puri Beach", "city": "puri", "state": "Odisha", "lat": 19.793, "lng": 85.84, "category": "nature", "subcategory": "beach", "rating": 4.2, "description": "Sacred beach near the Jagannath Temple famous for the annual sand art festival and Rath Yatra procession.", "avg_cost": 0, "visit_duration": 2.0, "best_time": "evening", "tags": ["nature", "beaches", "culture", "spiritual"], "budget_level": "free"},

    # Kolkata more
    {"name": "Howrah Bridge", "city": "kolkata", "state": "West Bengal", "lat": 22.585, "lng": 88.347, "category": "architecture", "subcategory": "bridge", "rating": 4.3, "description": "Iconic cantilever bridge over the Hooghly — the busiest and most photographed bridge in India with no nuts or bolts.", "avg_cost": 0, "visit_duration": 0.5, "best_time": "evening", "tags": ["architecture", "photography", "culture"], "budget_level": "free"},
    {"name": "Park Street", "city": "kolkata", "state": "West Bengal", "lat": 22.553, "lng": 88.357, "category": "interesting_places", "subcategory": "street", "rating": 4.1, "description": "Kolkata's iconic food and nightlife street with legendary restaurants, pubs, bookshops, and Christmas decorations.", "avg_cost": 500, "visit_duration": 2.5, "best_time": "evening", "tags": ["food", "culture", "nightlife", "shopping"], "budget_level": "medium"},

    # Delhi more
    {"name": "Humayun's Tomb", "city": "delhi", "state": "Delhi", "lat": 28.5933, "lng": 77.2507, "category": "monument", "subcategory": "tomb", "rating": 4.6, "description": "UNESCO World Heritage Mughal garden-tomb that inspired the Taj Mahal, with elegant Persian-style architecture.", "avg_cost": 35, "visit_duration": 1.5, "best_time": "morning", "tags": ["history", "architecture", "photography"], "budget_level": "low"},

    # Bangalore more
    {"name": "Cubbon Park", "city": "bangalore", "state": "Karnataka", "lat": 12.976, "lng": 77.593, "category": "park", "subcategory": "urban_park", "rating": 4.2, "description": "300-acre green lung of Bangalore with heritage buildings, flower shows, and walking trails among century-old trees.", "avg_cost": 0, "visit_duration": 1.5, "best_time": "morning", "tags": ["nature", "photography"], "budget_level": "free"},

    # Mumbai more
    {"name": "Haji Ali Dargah", "city": "mumbai", "state": "Maharashtra", "lat": 18.983, "lng": 72.81, "category": "religious", "subcategory": "dargah", "rating": 4.4, "description": "Iconic mosque and tomb on an islet connected by a 500m causeway submerged at high tide, a Mumbai landmark.", "avg_cost": 0, "visit_duration": 1.5, "best_time": "afternoon", "tags": ["spiritual", "architecture", "photography"], "budget_level": "free"},

    # Goa more
    {"name": "Anjuna Flea Market", "city": "goa", "state": "Goa", "lat": 15.574, "lng": 73.74, "category": "interesting_places", "subcategory": "market", "rating": 4.0, "description": "Legendary Wednesday flea market on Anjuna Beach with handmade jewellery, hippie fashion, and live music.", "avg_cost": 300, "visit_duration": 2.0, "best_time": "afternoon", "tags": ["shopping", "culture", "beaches"], "budget_level": "medium"},

    # Hyderabad more
    {"name": "Chowmahalla Palace", "city": "hyderabad", "state": "Telangana", "lat": 17.358, "lng": 78.474, "category": "monument", "subcategory": "palace", "rating": 4.4, "description": "Opulent Nizam-era palace inspired by Shah's palaces of Tehran with vintage cars, royal courtroom, and clock tower.", "avg_cost": 80, "visit_duration": 1.5, "best_time": "morning", "tags": ["history", "architecture", "culture"], "budget_level": "low"},

    # Chennai more
    {"name": "Government Museum Chennai", "city": "chennai", "state": "Tamil Nadu", "lat": 13.068, "lng": 80.257, "category": "museum", "subcategory": "general_museum", "rating": 4.1, "description": "Second oldest museum in India with world-class bronze gallery of Chola sculptures and Roman antiquities.", "avg_cost": 15, "visit_duration": 2.0, "best_time": "afternoon", "tags": ["history", "art", "culture"], "budget_level": "low"},
]

def main():
    dataset_path = os.path.join(os.path.dirname(__file__), 'data', 'places_dataset.json')
    with open(dataset_path, 'r', encoding='utf-8') as f:
        existing = json.load(f)
    existing_names = {(p['name'].lower(), p['city'].lower()) for p in existing}
    added = 0
    for place in BATCH3:
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
