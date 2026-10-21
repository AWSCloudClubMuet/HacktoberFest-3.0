/**
 * KisanMandi Core Business Logic & Calculations
 * As specified in KisanMandi Build Plan (Rules Cheat Sheet)
 */

/**
 * Daily change = today minus yesterday, as amount AND percentage
 * amount = today - yesterday; percent = (amount / yesterday) * 100
 */
export function priceChange(today, yesterday) {
  const t = typeof today === 'object' && today !== null ? Number(today.price ?? today.modalPrice ?? 0) : Number(today || 0);
  const y = typeof yesterday === 'object' && yesterday !== null ? Number(yesterday.price ?? yesterday.modalPrice ?? 0) : Number(yesterday || 0);
  const amount = t - y;
  const percent = y !== 0 ? (amount / y) * 100 : 0;
  return { amount, percent };
}

/**
 * 14-day stats: min, max and average of the 14 prices for that crop in that market
 */
export function stats14Days(priceList) {
  if (!priceList || priceList.length === 0) {
    return { min: 0, max: 0, avg: 0 };
  }
  const values = priceList.map((p) =>
    typeof p === 'object' && p !== null ? Number(p.price) : Number(p)
  );
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const avg = Math.round(sum / values.length);
  return { min, max, avg };
}

/**
 * Best market to sell: the market with the HIGHEST price today
 */
export function bestMarket(cropPricesToday) {
  if (!cropPricesToday || cropPricesToday.length === 0) return null;
  const sorted = [...cropPricesToday].sort((a, b) => {
    const priceA = typeof a === 'object' ? Number(a.price ?? a.modalPrice ?? 0) : Number(a);
    const priceB = typeof b === 'object' ? Number(b.price ?? b.modalPrice ?? 0) : Number(b);
    return priceB - priceA;
  });
  return sorted[0];
}

/**
 * Alert evaluation:
 * Alert Above: triggered when latest price >= target (only if active)
 * Alert Below: triggered when latest price <= target (only if active)
 */
export function isTriggered(alert, latestPrice) {
  if (!alert) return false;
  const isActive = alert.active_status === true || alert.active === true;
  if (!isActive) return false;

  const current = typeof latestPrice === 'object' && latestPrice !== null
    ? Number(latestPrice.price ?? latestPrice.modalPrice ?? 0)
    : Number(latestPrice ?? 0);
  const target = Number(alert.target_price ?? alert.targetPrice ?? 0);
  const condition = String(alert.condition || '').toLowerCase();

  if (condition === 'above') {
    return current >= target;
  }
  if (condition === 'below') {
    return current <= target;
  }
  return false;
}

/**
 * Market label:
 * avg = mean of today's price across all markets; diff% = (asking - avg) / avg * 100
 * within -5 to +5 (inclusive) = "At market"; above +5 = "Above market"; below -5 = "Below market"
 */
export function marketLabel(asking, avg) {
  const askingPrice = Number(asking || 0);
  const averagePrice = Number(avg || 0);
  if (averagePrice <= 0) return 'At market';

  const diffPercent = ((askingPrice - averagePrice) / averagePrice) * 100;
  if (diffPercent > 5) return 'Above market';
  if (diffPercent < -5) return 'Below market';
  return 'At market';
}

/**
 * Listing form validation:
 * quantity > 0, asking_price > 0, available_from today or later, phone required, grade A/B/C
 */
export function validateListing(form, todayDateStr) {
  const errors = {};

  const qty = Number(form.quantity);
  if (isNaN(qty) || qty <= 0) {
    errors.quantity = 'Quantity must be greater than 0';
  }

  const askingPrice = Number(form.asking_price ?? form.pricePerUnit);
  if (isNaN(askingPrice) || askingPrice <= 0) {
    errors.asking_price = 'Asking price must be greater than 0';
  }

  const grade = form.grade ?? form.variety;
  if (!grade || !['A', 'B', 'C'].includes(String(grade).trim())) {
    errors.grade = 'Grade is required (A, B, or C)';
  }

  const phone = form.phone ?? form.farmerPhone ?? form.contact_phone;
  if (!phone || !String(phone).trim()) {
    errors.phone = 'Contact phone is required';
  }

  const availableFrom = form.available_from ?? form.harvestDate;
  if (!availableFrom) {
    errors.available_from = 'Available date is required';
  } else {
    const today = todayDateStr || new Date().toISOString().split('T')[0];
    if (availableFrom < today) {
      errors.available_from = 'Available date cannot be in the past';
    }
  }

  if (!form.crop_id && !form.cropId) {
    errors.crop_id = 'Crop selection is required';
  }

  if (!form.district) {
    errors.district = 'District is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Ownership safeguard:
 * Edit / Mark Sold / Delete only when listing.user_id = current user id
 */
export function validateOwnership(listing, currentUserId) {
  if (!listing || !currentUserId) return false;
  const listingOwnerId = listing.user_id ?? listing.userId;
  return String(listingOwnerId) === String(currentUserId);
}

/**
 * Profit Calculator:
 * revenue = qty * price; cost = qty * cost per unit; profit = revenue - cost; margin = profit / revenue * 100
 * What-if: price * (1 + slider / 100), slider from -20 to +20
 */
export function profitCalc(qty, cost, price, slider = 0) {
  const quantity = Number(qty || 0);
  const unitCost = Number(cost || 0);
  const basePrice = Number(price || 0);
  const sliderShift = Number(slider || 0);

  const adjustedPrice = Math.round(basePrice * (1 + sliderShift / 100));
  const revenue = quantity * adjustedPrice;
  const totalCost = quantity * unitCost;
  const profit = revenue - totalCost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return {
    basePrice,
    sliderShift,
    adjustedPrice,
    revenue,
    totalCost,
    profit,
    margin,
    isProfitable: profit >= 0
  };
}

export default {
  priceChange,
  stats14Days,
  bestMarket,
  isTriggered,
  marketLabel,
  validateListing,
  validateOwnership,
  profitCalc
};
