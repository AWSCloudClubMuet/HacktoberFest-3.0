import type { Alert } from '../types'

/**
 * Evaluates whether an alert is currently triggered.
 *
 * Rules (SPEC.md section 7 & section 15):
 * - Only alerts with active_status === true can trigger.
 * - Above condition triggers when latestPrice >= target_price (equality triggers).
 * - Below condition triggers when latestPrice <= target_price (equality triggers).
 * - If latestPrice is missing/null/undefined, returns false.
 */
export function isTriggered(
  alert: Alert,
  latestPrice: number | null | undefined,
): boolean {
  if (!alert.active_status || latestPrice === null || latestPrice === undefined) {
    return false
  }

  if (alert.condition === 'Above') {
    return latestPrice >= alert.target_price
  }

  if (alert.condition === 'Below') {
    return latestPrice <= alert.target_price
  }

  return false
}

export type AlertStatusLabel = 'Triggered' | 'Waiting' | 'Inactive'

export function getAlertStatus(
  alert: Alert,
  latestPrice: number | null | undefined,
): AlertStatusLabel {
  if (!alert.active_status) {
    return 'Inactive'
  }
  return isTriggered(alert, latestPrice) ? 'Triggered' : 'Waiting'
}
