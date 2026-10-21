// Relief Allocation Advisor — explainable dispatch suggestions computed from
// the current API data. It never creates anything: each suggestion opens the
// normal dispatch form, the coordinator approves it, and the API validates it.
//
// Ranking: urgency = priority weight × uncovered share, where
//   priority weight = High 3, Medium 2, Low 1
//   uncovered share = remaining unreserved ÷ required
//                     (required − fulfilled − Pending/In Transit dispatches)
// Ties go to the larger remaining quantity.
//
// Allocation: stock is handed out in rank order, so a suggestion never
// exceeds the item's stock left after higher-ranked suggestions, nor the
// need's remaining unreserved quantity.

import { findById, isCampOpen, isCriticalGap, needFulfilmentPct, remainingUnreserved, reservedForNeed } from './domain.js';

export const PRIORITY_WEIGHT = { High: 3, Medium: 2, Low: 1 };

function rankCandidates({ camps = [], inventory = [], needs = [], dispatches = [] }) {
  return needs
    .map((need) => {
      const camp = findById(camps, need.camp_id);
      const item = findById(inventory, need.inventory_item_id);
      const remaining = remainingUnreserved(need, dispatches);
      if (!camp || !isCampOpen(camp) || !item || remaining <= 0) return null;
      const uncoveredShare = remaining / Number(need.required_quantity);
      return {
        need,
        camp,
        item,
        remaining,
        reserved: reservedForNeed(need.id, dispatches),
        pct: needFulfilmentPct(need),
        critical: isCriticalGap(need),
        uncoveredShare,
        score: (PRIORITY_WEIGHT[need.priority] ?? 1) * uncoveredShare,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || b.remaining - a.remaining || Number(a.need.id) - Number(b.need.id));
}

function reasonsFor(c, quantity, stockLeft) {
  const unit = c.item.unit;
  const reasons = [`${c.need.priority} priority`, `${Math.round(c.pct)}% fulfilled${c.critical ? ' (critical gap)' : ''}`];
  reasons.push(c.reserved > 0 ? `${c.reserved.toLocaleString('en-US')} ${unit} already on the way` : 'Nothing on the way yet');
  reasons.push(
    quantity < c.remaining
      ? `Stock limits this to ${quantity.toLocaleString('en-US')} of ${c.remaining.toLocaleString('en-US')} ${unit} still needed`
      : `Covers the full ${c.remaining.toLocaleString('en-US')} ${unit} still needed`,
  );
  if (stockLeft < Number(c.item.stock)) reasons.push('Shares stock with higher-ranked needs');
  return reasons;
}

export function recommendAllocations(data, { limit = 5 } = {}) {
  const stockLeft = new Map((data.inventory || []).map((i) => [String(i.id), Math.max(0, Number(i.stock))]));
  const recommendations = [];
  const blocked = [];

  for (const c of rankCandidates(data)) {
    if (recommendations.length >= limit) break;
    const available = stockLeft.get(String(c.item.id)) ?? 0;
    const quantity = Math.min(c.remaining, available);
    if (quantity <= 0) {
      blocked.push({ ...c, reason: Number(c.item.stock) <= 0 ? `${c.item.name} is out of stock` : `Remaining ${c.item.name} is allocated to higher-ranked needs` });
      continue;
    }
    stockLeft.set(String(c.item.id), available - quantity);
    recommendations.push({ ...c, quantity, limitedByStock: quantity < c.remaining, reasons: reasonsFor(c, quantity, available) });
  }
  return { recommendations, blocked };
}
