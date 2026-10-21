// src/services/alertService.js
import { getAlertsByUser, updateAlert } from './api';

let isEvaluating = false;

/**
 * Evaluates active alerts for a user against current price records.
 * Persists triggered state changes via HTTP PATCH.
 * Returns the count of currently triggered active alerts.
 */
export async function evaluateUserAlerts(userId, prices) {
  if (!userId || !prices || !prices.length) return 0;
  if (isEvaluating) return 0;

  isEvaluating = true;
  try {
    const alerts = await getAlertsByUser(userId);
    let triggeredCount = 0;

    for (const alert of alerts) {
      if (!alert.active) {
        if (alert.triggered) {
          await updateAlert(alert.id, { triggered: false }).catch(() => {});
        }
        continue;
      }

      // Find latest price for this crop & market
      const matchingPrices = prices
        .filter(p => p.cropId === alert.cropId && p.marketId === alert.marketId)
        .sort((a, b) => b.date.localeCompare(a.date));

      const latest = matchingPrices[0];
      if (!latest || latest.price == null) {
        // Safe handling of missing price
        if (alert.triggered) triggeredCount++;
        continue;
      }

      // Inclusive condition evaluation
      const shouldTrigger = alert.condition === 'above'
        ? latest.price >= alert.targetPrice
        : latest.price <= alert.targetPrice;

      if (shouldTrigger !== alert.triggered) {
        await updateAlert(alert.id, { triggered: shouldTrigger }).catch(() => {});
      }

      if (shouldTrigger) {
        triggeredCount++;
      }
    }

    return triggeredCount;
  } catch (err) {
    console.error('[AlertService] Error evaluating alerts:', err);
    return 0;
  } finally {
    isEvaluating = false;
  }
}

