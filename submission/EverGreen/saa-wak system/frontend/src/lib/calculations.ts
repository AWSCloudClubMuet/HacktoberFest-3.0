import { DailyChange, PricePosition, PriceRecord, ProfitCalculationInput, ProfitCalculationResult } from '../types';

/**
 * Calculates day-over-day price difference according to TRD Section 7:
 * change = latestPrice - previousPrice
 * changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : null
 */
export function calculateDailyChange(records: PriceRecord[]): DailyChange | null {
  if (!records || records.length === 0) return null;

  // Sort ascending by date
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];

  if (sorted.length === 1) {
    return {
      latestPrice: latest.price,
      previousPrice: latest.price,
      absoluteChange: 0,
      percentageChange: 0,
      direction: 'neutral',
      date: latest.date,
      unit: latest.unit,
    };
  }

  const previous = sorted[sorted.length - 2];
  const absoluteChange = latest.price - previous.price;
  const percentageChange =
    previous.price !== 0 ? (absoluteChange / previous.price) * 100 : null;

  const direction =
    absoluteChange > 0 ? 'up' : absoluteChange < 0 ? 'down' : 'neutral';

  return {
    latestPrice: latest.price,
    previousPrice: previous.price,
    absoluteChange,
    percentageChange,
    direction,
    date: latest.date,
    unit: latest.unit,
  };
}

/**
 * Determines market price badge relative to the mean of available same-crop market prices for today:
 * - Below market: asking price < meanPrice * 0.95
 * - Near market: asking price within +/-5% (between 0.95 and 1.05 * meanPrice)
 * - Above market: asking price > meanPrice * 1.05
 * - If missing data: unavailable
 */
export function calculateMarketPositionBadge(
  askingPrice: number,
  cropId: string,
  allPrices: PriceRecord[],
  targetDate?: string
): {
  position: PricePosition;
  label: string;
  percentDiff: number | null;
  meanPrice: number | null;
} {
  // Find prices for this crop
  let cropPrices = allPrices.filter((p) => p.cropId === cropId);
  if (cropPrices.length === 0) {
    return {
      position: 'unavailable',
      label: 'Market comparison unavailable',
      percentDiff: null,
      meanPrice: null,
    };
  }

  // Find latest date if targetDate not provided
  const latestDate =
    targetDate ||
    cropPrices.map((p) => p.date).sort().reverse()[0];

  const todayCropPrices = cropPrices.filter((p) => p.date === latestDate);

  if (todayCropPrices.length === 0) {
    return {
      position: 'unavailable',
      label: 'Market comparison unavailable',
      percentDiff: null,
      meanPrice: null,
    };
  }

  // Calculate mean across available markets for this crop on latest date
  const sum = todayCropPrices.reduce((acc, curr) => acc + curr.price, 0);
  const meanPrice = sum / todayCropPrices.length;

  const lowerBound = meanPrice * 0.95;
  const upperBound = meanPrice * 1.05;

  const percentDiff = ((askingPrice - meanPrice) / meanPrice) * 100;

  if (askingPrice < lowerBound) {
    return {
      position: 'below',
      label: `Below market (${Math.abs(Math.round(percentDiff))}% lower)`,
      percentDiff,
      meanPrice,
    };
  } else if (askingPrice > upperBound) {
    return {
      position: 'above',
      label: `Above market (+${Math.round(percentDiff)}%)`,
      percentDiff,
      meanPrice,
    };
  } else {
    return {
      position: 'near',
      label: 'Near market (fair price)',
      percentDiff,
      meanPrice,
    };
  }
}

/**
 * Profit Calculator formulas (TRD Section 7):
 * revenue = quantity * sellingPricePerUnit
 * totalCost = quantity * costPerUnit
 * profit = revenue - totalCost
 * marginPercent = revenue > 0 ? profit / revenue * 100 : null
 * scenarioPrice = basePrice * (1 + sliderPercent / 100)
 */
export function calculateProfit(input: ProfitCalculationInput): ProfitCalculationResult {
  const { quantity, baselineSellingPrice, costPerUnit, adjustmentPercent } = input;

  const q = Math.max(0, quantity);
  const baseP = Math.max(0, baselineSellingPrice);
  const cost = Math.max(0, costPerUnit);

  const adjustedPrice = Math.max(0, baseP * (1 + adjustmentPercent / 100));

  const baselineRevenue = q * baseP;
  const adjustedRevenue = q * adjustedPrice;
  const totalCost = q * cost;

  const baselineProfit = baselineRevenue - totalCost;
  const adjustedProfit = adjustedRevenue - totalCost;

  const marginPercent =
    adjustedRevenue > 0 ? (adjustedProfit / adjustedRevenue) * 100 : null;

  const differenceOutcome = adjustedProfit - baselineProfit;

  return {
    quantity: q,
    baselinePrice: baseP,
    adjustedPrice,
    baselineRevenue,
    adjustedRevenue,
    totalCost,
    baselineProfit,
    adjustedProfit,
    marginPercent,
    differenceOutcome,
  };
}
