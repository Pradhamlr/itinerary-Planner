const { kmeans } = require('ml-kmeans');
const RecommendationService = require('./recommendationService');

function haversineDistance(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const c = sinLat * sinLat
    + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  const d = 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));

  return R * d;
}

function solveTSP(points) {
  if (points.length <= 2) {
    return points;
  }

  const visited = new Set();
  const route = [];
  const start = [...points].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))[0];

  let current = start;
  route.push(current);
  visited.add(current.place_id);

  while (route.length < points.length) {
    let nearest = null;
    let minDistance = Infinity;

    for (const point of points) {
      if (visited.has(point.place_id)) {
        continue;
      }

      const distance = haversineDistance(current, point);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = point;
      }
    }

    if (!nearest) {
      break;
    }

    route.push(nearest);
    visited.add(nearest.place_id);
    current = nearest;
  }

  return route;
}

function getClusterCenter(cluster) {
  if (cluster.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const totals = cluster.reduce(
    (accumulator, place) => ({
      lat: accumulator.lat + Number(place.lat || 0),
      lng: accumulator.lng + Number(place.lng || 0),
    }),
    { lat: 0, lng: 0 },
  );

  return {
    lat: totals.lat / cluster.length,
    lng: totals.lng / cluster.length,
  };
}

function rebalanceClusters(clusters, placesPerDay) {
  const balanced = clusters.map((cluster) => [...cluster]);

  let changed = true;
  while (changed) {
    changed = false;

    const largestIndex = balanced.reduce(
      (bestIndex, cluster, index, items) => (cluster.length > items[bestIndex].length ? index : bestIndex),
      0,
    );
    const smallestIndex = balanced.reduce(
      (bestIndex, cluster, index, items) => (cluster.length < items[bestIndex].length ? index : bestIndex),
      0,
    );

    const largestCluster = balanced[largestIndex];
    const smallestCluster = balanced[smallestIndex];

    if (!largestCluster || !smallestCluster) {
      break;
    }

    if (largestCluster.length <= placesPerDay || largestCluster.length - smallestCluster.length <= 1) {
      break;
    }

    const smallestCenter = getClusterCenter(smallestCluster);
    let farthestIndex = 0;
    let farthestDistance = -1;

    largestCluster.forEach((place, index) => {
      const distance = haversineDistance(place, smallestCenter);
      if (distance > farthestDistance) {
        farthestDistance = distance;
        farthestIndex = index;
      }
    });

    const [movedPlace] = largestCluster.splice(farthestIndex, 1);
    if (movedPlace) {
      smallestCluster.push(movedPlace);
      changed = true;
    }
  }

  return balanced;
}

function clusterAttractions(attractions, days) {
  if (attractions.length === 0) {
    return [];
  }

  const clusterCount = Math.max(1, Math.min(days, attractions.length));
  const placesPerDay = Math.ceil(attractions.length / clusterCount);
  const coordinates = attractions.map((place) => [place.lat, place.lng]);
  const result = kmeans(coordinates, clusterCount);

  const clusters = Array.from({ length: clusterCount }, () => []);

  attractions.forEach((place, index) => {
    const clusterId = result.clusters[index];
    clusters[clusterId].push(place);
  });

  return rebalanceClusters(clusters, placesPerDay)
    .filter((cluster) => cluster.length > 0);
}

class ItineraryService {
  static async generateItinerary(trip) {
    const recommendation = await RecommendationService.getRecommendationsForTrip(trip);
    const attractions = recommendation.attractions || [];
    const clusters = clusterAttractions(attractions, trip.days);

    const itinerary = clusters.map((cluster, index) => {
      const route = solveTSP(cluster);
      return {
        day: index + 1,
        route,
        center: getClusterCenter(cluster),
      };
    });

    return {
      itinerary,
      restaurants: recommendation.restaurants || [],
      metadata: recommendation.metadata || {},
    };
  }
}

module.exports = ItineraryService;
