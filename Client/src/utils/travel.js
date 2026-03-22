export const INTEREST_OPTIONS = [
  { value: 'history', label: 'History', accent: 'bg-[#eadcba] text-[#5f3b12]' },
  { value: 'nature', label: 'Nature', accent: 'bg-[#dce9d8] text-[#1e4f36]' },
  { value: 'culture', label: 'Culture', accent: 'bg-[#efe2ce] text-[#6e4518]' },
  { value: 'food', label: 'Food', accent: 'bg-[#f5d9c2] text-[#7a3d11]' },
  { value: 'shopping', label: 'Shopping', accent: 'bg-[#e6e0cd] text-[#5f5638]' },
  { value: 'adventure', label: 'Adventure', accent: 'bg-[#f0cfac] text-[#7a3d11]' },
  { value: 'art', label: 'Art', accent: 'bg-[#e9dbc3] text-[#6c4c1c]' },
  { value: 'beaches', label: 'Beaches', accent: 'bg-[#d8e7df] text-[#1e4f36]' },
  { value: 'nightlife', label: 'Nightlife', accent: 'bg-[#e7e3ca] text-[#464129]' },
  { value: 'sports', label: 'Sports', accent: 'bg-[#dde7cf] text-[#365129]' },
];

export const getInterestMeta = (interest) =>
  INTEREST_OPTIONS.find((option) => option.value === interest) || {
    value: interest,
    label: interest,
    accent: 'bg-[#e7e3ca] text-[#1d1c0d]',
  };

export const getCityGradient = (seed = '') => {
  const gradients = [
    'from-[#012d1d] via-[#1b4332] to-[#2d6a4f]',
    'from-[#0b3d2e] via-[#2d6a4f] to-[#588157]',
    'from-[#22333b] via-[#1b4332] to-[#4f6f52]',
    'from-[#0a2f28] via-[#27524a] to-[#4b715a]',
    'from-[#1c3b2f] via-[#355b49] to-[#6a8b67]',
  ];

  const normalized = String(seed).trim().toLowerCase();
  const hash = [...normalized].reduce((total, char) => total + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const formatCategory = (category) =>
  String(category || 'place')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const getPrimaryPlaceType = (place) => {
  if (place.category) {
    return String(place.category).replace(/\s+/g, '_').toLowerCase();
  }

  if (!place.types || place.types.length === 0) {
    return 'place';
  }

  const relevantTypes = [
    'tourist_attraction',
    'museum',
    'park',
    'beach',
    'church',
    'hindu_temple',
    'restaurant',
    'art_gallery',
    'zoo',
    'campground',
    'shopping_mall',
  ];

  return place.types.find((type) => relevantTypes.includes(type)) || place.types[0];
};

export const getPlaceTypeTheme = (type) => {
  const themes = {
    tourist_attraction: 'bg-[#eadcba] text-[#5f3b12]',
    museum: 'bg-[#e5dfc9] text-[#5b5130]',
    park: 'bg-[#dce9d8] text-[#1e4f36]',
    beach: 'bg-[#d8e7df] text-[#1e4f36]',
    church: 'bg-[#e8e2d1] text-[#554a2c]',
    hindu_temple: 'bg-[#f0cfac] text-[#7a3d11]',
    restaurant: 'bg-[#f5d9c2] text-[#7a3d11]',
    art_gallery: 'bg-[#e9dbc3] text-[#6c4c1c]',
    zoo: 'bg-[#dde7cf] text-[#365129]',
    campground: 'bg-[#dce9d8] text-[#1e4f36]',
    shopping_mall: 'bg-[#e6e0cd] text-[#5f5638]',
    place: 'bg-[#e7e3ca] text-[#1d1c0d]',
  };

  return themes[type] || themes.place;
};

export const getPlaceVisual = (place) => {
  const type = getPrimaryPlaceType(place);
  const visuals = {
    tourist_attraction: { icon: 'Compass', gradient: 'from-[#1b4332] to-[#355b49]' },
    museum: { icon: 'Gallery', gradient: 'from-[#22333b] to-[#355b49]' },
    park: { icon: 'Forest', gradient: 'from-[#1e4f36] to-[#4f6f52]' },
    beach: { icon: 'Coast', gradient: 'from-[#27524a] to-[#4b715a]' },
    church: { icon: 'Heritage', gradient: 'from-[#2e3e39] to-[#4f6f52]' },
    hindu_temple: { icon: 'Temple', gradient: 'from-[#7a3d11] to-[#924c00]' },
    restaurant: { icon: 'Cuisine', gradient: 'from-[#924c00] to-[#703800]' },
    art_gallery: { icon: 'Studio', gradient: 'from-[#6c4c1c] to-[#924c00]' },
    zoo: { icon: 'Safari', gradient: 'from-[#365129] to-[#4f6f52]' },
    shopping_mall: { icon: 'Market', gradient: 'from-[#5f5638] to-[#6c4c1c]' },
  };

  return visuals[type] || { icon: 'Explore', gradient: 'from-[#355b49] to-[#1d1c0d]' };
};

export const renderStars = (rating) => {
  const numericRating = Number(rating || 0);
  const filled = Math.round(numericRating);
  return Array.from({ length: 5 }, (_, index) => (index < filled ? '*' : '-')).join('');
};
