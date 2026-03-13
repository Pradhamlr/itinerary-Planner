/**
 * Cost Estimator Service
 * Provides approximate cost breakdowns for travel itineraries.
 * Budget categories: low, medium, luxury
 * India-focused pricing with global extensibility.
 */

class CostEstimatorService {
  // Cost multipliers per city tier (India-focused)
  static cityTiers = {
    // Tier 1 - Metro cities
    mumbai: 1.4, delhi: 1.3, bangalore: 1.3, chennai: 1.1, kolkata: 1.0, hyderabad: 1.1,
    // Tier 2 - Popular tourist cities
    jaipur: 0.9, goa: 1.2, udaipur: 1.0, varanasi: 0.8, agra: 0.9, kochi: 0.9,
    shimla: 1.0, manali: 1.0, darjeeling: 0.9, ooty: 0.9, mysore: 0.85,
    rishikesh: 0.85, amritsar: 0.8, jodhpur: 0.85, pushkar: 0.8,
    // International
    dubai: 3.0, singapore: 2.8, bangkok: 1.5, london: 4.0, paris: 4.0, new_york: 4.5,
    tokyo: 3.5, bali: 1.2, rome: 3.0,
  };

  // Base daily costs in INR for medium budget
  static baseCosts = {
    stay: { low: 800, medium: 2500, luxury: 8000 },
    food: { low: 400, medium: 1000, luxury: 3000 },
    transport: { low: 200, medium: 600, luxury: 2000 },
    entryTickets: { low: 100, medium: 300, luxury: 500 },
  };

  /**
   * Estimate total trip cost.
   * @param {string} city
   * @param {number} days
   * @param {string} budgetCategory - 'low' | 'medium' | 'luxury'
   * @param {number} numPlaces
   * @returns {Object} Cost breakdown
   */
  static estimate(city, days, budgetCategory = 'medium', numPlaces = 0) {
    const category = ['low', 'medium', 'luxury'].includes(budgetCategory)
      ? budgetCategory
      : 'medium';

    const cityKey = city.toLowerCase().replace(/\s+/g, '_');
    const multiplier = this.cityTiers[cityKey] || 1.0;

    const dailyStay = Math.round(this.baseCosts.stay[category] * multiplier);
    const dailyFood = Math.round(this.baseCosts.food[category] * multiplier);
    const dailyTransport = Math.round(this.baseCosts.transport[category] * multiplier);
    const perPlaceEntry = Math.round(this.baseCosts.entryTickets[category] * multiplier);

    const totalStay = dailyStay * days;
    const totalFood = dailyFood * days;
    const totalTransport = dailyTransport * days;
    const totalEntryTickets = perPlaceEntry * (numPlaces || days * 3);
    const miscellaneous = Math.round((totalStay + totalFood) * 0.1);

    const totalEstimate = totalStay + totalFood + totalTransport + totalEntryTickets + miscellaneous;

    return {
      currency: 'INR',
      budgetCategory: category,
      breakdown: {
        stay: { daily: dailyStay, total: totalStay },
        food: { daily: dailyFood, total: totalFood },
        transport: { daily: dailyTransport, total: totalTransport },
        entryTickets: { perPlace: perPlaceEntry, total: totalEntryTickets },
        miscellaneous,
      },
      totalEstimate,
      perDay: Math.round(totalEstimate / days),
      cityMultiplier: multiplier,
    };
  }
}

module.exports = CostEstimatorService;
