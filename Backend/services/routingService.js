/**
 * Routing Service - TSP-based Route Optimization
 * 
 * Phase 1: Nearest Neighbor heuristic (O(n²)) for scalability
 * Phase 2: Exact DP-based TSP (O(2^n * n)) for n ≤ 10
 * 
 * Designed as a modular engine reusable for:
 * - Travel itinerary optimization
 * - School bus routing
 * - Delivery fleet optimization
 * - Logistics route planning
 */

class RoutingService {
  /**
   * Compute optimized visit order for a set of places.
   * Automatically selects algorithm based on input size.
   * @param {Array} places - Array of { name, lat, lng, ... }
   * @param {Object} options - { algorithm: 'auto' | 'nearest' | 'dp', startIndex: 0 }
   * @returns {{ orderedPlaces: Array, totalDistance: number, algorithm: string }}
   */
  static optimizeRoute(places, options = {}) {
    if (!places || places.length === 0) {
      return { orderedPlaces: [], totalDistance: 0, algorithm: 'none' };
    }

    if (places.length === 1) {
      return { orderedPlaces: [...places], totalDistance: 0, algorithm: 'trivial', visitOrder: [0] };
    }

    const { algorithm = 'auto', startIndex = 0 } = options;

    // Build distance matrix
    const distMatrix = this.buildDistanceMatrix(places);

    let result;
    if (algorithm === 'dp' || (algorithm === 'auto' && places.length <= 10)) {
      result = this.tspDynamicProgramming(distMatrix, startIndex);
    } else {
      result = this.tspNearestNeighbor(distMatrix, startIndex);
    }

    const orderedPlaces = result.path.map((idx) => places[idx]);

    return {
      orderedPlaces,
      totalDistance: Math.round(result.totalDistance * 100) / 100,
      algorithm: result.algorithm,
      visitOrder: result.path,
    };
  }

  /**
   * Build a distance matrix using Haversine formula.
   * Can be replaced with Google Distance Matrix API for real road distances.
   */
  static buildDistanceMatrix(places) {
    const n = places.length;
    const matrix = Array.from({ length: n }, () => new Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const lat1 = places[i].lat, lng1 = places[i].lng;
        const lat2 = places[j].lat, lng2 = places[j].lng;
        if (lat1 == null || lng1 == null || lat2 == null || lng2 == null ||
            isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
          matrix[i][j] = 0;
          matrix[j][i] = 0;
          continue;
        }
        const dist = this.haversineDistance(lat1, lng1, lat2, lng2);
        matrix[i][j] = dist;
        matrix[j][i] = dist;
      }
    }

    return matrix;
  }

  /**
   * Haversine formula - distance between two GPS coordinates in km.
   */
  static haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static toRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Phase 1: Nearest Neighbor Heuristic
   * Time: O(n²), Space: O(n)
   * Greedy approach - always visit the closest unvisited node.
   */
  static tspNearestNeighbor(distMatrix, startIndex = 0) {
    const n = distMatrix.length;
    const visited = new Set();
    const path = [startIndex];
    visited.add(startIndex);
    let totalDistance = 0;
    let current = startIndex;

    while (visited.size < n) {
      let nearest = -1;
      let nearestDist = Infinity;

      for (let i = 0; i < n; i++) {
        if (!visited.has(i) && distMatrix[current][i] < nearestDist) {
          nearest = i;
          nearestDist = distMatrix[current][i];
        }
      }

      if (nearest === -1) break;

      path.push(nearest);
      visited.add(nearest);
      totalDistance += nearestDist;
      current = nearest;
    }

    return { path, totalDistance, algorithm: 'nearest-neighbor' };
  }

  /**
   * Phase 2: Exact TSP via Dynamic Programming (Held-Karp)
   * Time: O(2^n * n²), Space: O(2^n * n)
   * Optimal solution for n ≤ 10 destinations.
   */
  static tspDynamicProgramming(distMatrix, startIndex = 0) {
    const n = distMatrix.length;

    if (n > 15) {
      // Fallback to heuristic for safety
      return this.tspNearestNeighbor(distMatrix, startIndex);
    }

    const VISITED_ALL = (1 << n) - 1;
    // dp[mask][i] = minimum distance to visit all nodes in mask, ending at i
    const dp = Array.from({ length: 1 << n }, () => new Array(n).fill(Infinity));
    const parent = Array.from({ length: 1 << n }, () => new Array(n).fill(-1));

    dp[1 << startIndex][startIndex] = 0;

    for (let mask = 0; mask <= VISITED_ALL; mask++) {
      for (let u = 0; u < n; u++) {
        if (!(mask & (1 << u))) continue;
        if (dp[mask][u] === Infinity) continue;

        for (let v = 0; v < n; v++) {
          if (mask & (1 << v)) continue;

          const newMask = mask | (1 << v);
          const newDist = dp[mask][u] + distMatrix[u][v];

          if (newDist < dp[newMask][v]) {
            dp[newMask][v] = newDist;
            parent[newMask][v] = u;
          }
        }
      }
    }

    // Find the optimal ending node
    let minDist = Infinity;
    let lastNode = -1;

    for (let i = 0; i < n; i++) {
      if (dp[VISITED_ALL][i] < minDist) {
        minDist = dp[VISITED_ALL][i];
        lastNode = i;
      }
    }

    // Reconstruct path
    const path = [];
    let mask = VISITED_ALL;
    let current = lastNode;

    while (current !== -1) {
      path.push(current);
      const prev = parent[mask][current];
      mask = mask ^ (1 << current);
      current = prev;
    }

    path.reverse();

    return { path, totalDistance: minDist, algorithm: 'dynamic-programming' };
  }

  /**
   * Distribute places across days for itinerary planning.
   * @param {Array} orderedPlaces - TSP-optimized ordered places
   * @param {number} totalDays - Number of travel days
   * @param {string} pace - 'relaxed' | 'moderate' | 'packed'
   * @returns {Array} dayWise itinerary
   */
  static distributeAcrossDays(orderedPlaces, totalDays, pace = 'moderate') {
    const placesPerDay = {
      relaxed: 3,
      moderate: 5,
      packed: 7,
    };

    const maxPerDay = placesPerDay[pace] || 5;
    const days = [];

    for (let d = 0; d < totalDays; d++) {
      const startIdx = d * maxPerDay;
      const endIdx = Math.min(startIdx + maxPerDay, orderedPlaces.length);

      if (startIdx >= orderedPlaces.length) {
        days.push({ day: d + 1, places: [], label: 'Free Day' });
      } else {
        const dayPlaces = orderedPlaces.slice(startIdx, endIdx).map((place, order) => ({
          ...place,
          order: order + 1,
          dayNumber: d + 1,
        }));
        days.push({ day: d + 1, places: dayPlaces, label: `Day ${d + 1}` });
      }
    }

    return days;
  }
}

module.exports = RoutingService;
