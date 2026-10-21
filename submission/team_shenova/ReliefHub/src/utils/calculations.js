// Calculation utilities for ReliefHub

/**
 * Calculate fulfilment percentage safely handling zero/empty inputs
 */
export function calculateFulfilmentPercentage(fulfilled, required) {
  const req = Number(required);
  const ful = Number(fulfilled);
  if (!req || req <= 0) return 0;
  const pct = (ful / req) * 100;
  return Math.min(100, Math.round(pct * 10) / 10);
}

/**
 * Calculate remaining unreserved demand for a need
 * remaining = required - fulfilled - (active pending & in transit dispatches)
 */
export function calculateRemainingDemand(need, dispatches = []) {
  if (!need) return 0;
  const req = Number(need.required_quantity) || 0;
  const ful = Number(need.fulfilled_quantity) || 0;

  // Active dispatches reserving this need
  const activeReservations = dispatches
    .filter(d => String(d.need_id) === String(need.id) && (d.status === 'Pending' || d.status === 'In Transit'))
    .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);

  const remaining = req - ful - activeReservations;
  return Math.max(0, remaining);
}

/**
 * Calculate dashboard summary KPIs from active API data
 */
export function calculateDashboardKPIs(camps = [], inventory = [], needs = [], volunteers = []) {
  // 1. Active camps: neither Full nor Closed
  const activeCampsCount = camps.filter(c => c.status === 'Active').length;

  // 2. Families sheltered: sum of current_families across camps
  const totalFamiliesSheltered = camps.reduce((sum, c) => sum + (Number(c.current_families) || 0), 0);

  // 3. Overall fulfilment: total fulfilled / total required * 100
  const totalRequired = needs.reduce((sum, n) => sum + (Number(n.required_quantity) || 0), 0);
  const totalFulfilled = needs.reduce((sum, n) => sum + (Number(n.fulfilled_quantity) || 0), 0);
  const overallFulfilment = totalRequired > 0 
    ? Math.round((totalFulfilled / totalRequired) * 1000) / 10 
    : 0;

  // 4. Low-stock items: stock <= reorder_level
  const lowStockCount = inventory.filter(i => (Number(i.stock) || 0) <= (Number(i.reorder_level) || 0)).length;

  // 5. Volunteers deployed: count with valid active camp assignment
  const deployedVolunteersCount = volunteers.filter(v => v.camp_id && String(v.camp_id).trim() !== '').length;

  return {
    activeCampsCount,
    totalFamiliesSheltered,
    overallFulfilment,
    totalRequired,
    totalFulfilled,
    lowStockCount,
    deployedVolunteersCount
  };
}

/**
 * Aggregate required and fulfilled quantities by inventory category, then calculate percentage
 */
export function calculateCategoryFulfilment(inventory = [], needs = []) {
  // Map item id to category
  const itemCategoryMap = {};
  inventory.forEach(item => {
    itemCategoryMap[String(item.id)] = item.category || 'General';
  });

  const categoryAggregates = {};

  needs.forEach(need => {
    const category = itemCategoryMap[String(need.inventory_item_id)] || 'Other';
    if (!categoryAggregates[category]) {
      categoryAggregates[category] = { required: 0, fulfilled: 0 };
    }
    categoryAggregates[category].required += (Number(need.required_quantity) || 0);
    categoryAggregates[category].fulfilled += (Number(need.fulfilled_quantity) || 0);
  });

  return Object.keys(categoryAggregates).map(category => {
    const data = categoryAggregates[category];
    const percentage = data.required > 0 
      ? Math.round((data.fulfilled / data.required) * 1000) / 10 
      : 0;
    return {
      category,
      required: data.required,
      fulfilled: data.fulfilled,
      percentage
    };
  });
}

/**
 * Filter and sort Critical Gaps
 * High Priority AND Fulfilment strictly < 40%
 * Sorted lowest fulfilment percentage to highest
 */
export function getCriticalGaps(needs = [], camps = [], inventory = [], dispatches = []) {
  const campMap = {};
  camps.forEach(c => { campMap[String(c.id)] = c; });

  const invMap = {};
  inventory.forEach(i => { invMap[String(i.id)] = i; });

  return needs
    .filter(need => {
      if (need.priority !== 'High') return false;
      const req = Number(need.required_quantity);
      const ful = Number(need.fulfilled_quantity);
      if (isNaN(req) || isNaN(ful) || req <= 0 || ful < 0) return false;
      // Raw unrounded ratio comparison (strictly < 40%)
      return (ful / req) < 0.40;
    })
    .map(need => {
      const camp = campMap[String(need.camp_id)] || {};
      const item = invMap[String(need.inventory_item_id)] || {};
      const pct = calculateFulfilmentPercentage(need.fulfilled_quantity, need.required_quantity);
      const remainingDemand = calculateRemainingDemand(need, dispatches);

      return {
        ...need,
        campName: camp.name || 'Unknown Camp',
        district: camp.district || 'N/A',
        itemName: item.name || 'Unknown Item',
        unit: item.unit || 'units',
        fulfilmentPercentage: pct,
        remainingDemand
      };
    })
    .sort((a, b) => {
      const ratioA = Number(a.fulfilled_quantity) / Number(a.required_quantity);
      const ratioB = Number(b.fulfilled_quantity) / Number(b.required_quantity);
      return ratioA - ratioB;
    });
}

