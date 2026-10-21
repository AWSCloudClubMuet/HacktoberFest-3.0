export interface ProfitParams {
  quantity: number
  price: number
  costPerUnit: number
  shiftPct?: number
}

export interface ProfitResult {
  adjustedPrice: number
  revenue: number
  totalCost: number
  profit: number
  marginPct: number | null
}

/**
 * Calculates profit, revenue, total cost, and profit margin.
 *
 * Rules (SPEC.md section 9):
 * - adjustedPrice = price * (1 + shiftPct / 100)
 * - revenue = quantity * adjustedPrice
 * - totalCost = quantity * costPerUnit
 * - profit = revenue - totalCost
 * - marginPct = revenue > 0 ? (profit / revenue) * 100 : null
 * - Never returns NaN or Infinity.
 */
export function calculateProfit({
  quantity,
  price,
  costPerUnit,
  shiftPct = 0,
}: ProfitParams): ProfitResult {
  const cleanQty = Math.max(0, isNaN(quantity) || !isFinite(quantity) ? 0 : quantity)
  const cleanPrice = Math.max(0, isNaN(price) || !isFinite(price) ? 0 : price)
  const cleanCost = Math.max(0, isNaN(costPerUnit) || !isFinite(costPerUnit) ? 0 : costPerUnit)
  const cleanShift = isNaN(shiftPct) || !isFinite(shiftPct) ? 0 : shiftPct

  const adjustedPrice = Math.round(cleanPrice * (1 + cleanShift / 100))
  const revenue = Math.round(cleanQty * adjustedPrice)
  const totalCost = Math.round(cleanQty * cleanCost)
  const profit = revenue - totalCost

  let marginPct: number | null = null
  if (revenue > 0) {
    const rawMargin = (profit / revenue) * 100
    marginPct = Number(rawMargin.toFixed(1))
  }

  return {
    adjustedPrice,
    revenue,
    totalCost,
    profit,
    marginPct,
  }
}
