export const calculateFulfillmentPercentage = (required, fulfilled) => {
  if (!required || required <= 0) return 0;
  const percentage = (fulfilled / required) * 100;
  return Math.min(Math.max(percentage, 0), 100);
};

export const calculateRemainingDemand = (need, dispatches) => {
  if (!need) return 0;
  const required = Number(need.required_quantity) || 0;
  const fulfilled = Number(need.fulfilled_quantity) || 0;
  
  const activeDispatches = dispatches
    .filter(d => d.need_id === need.id && ['Pending', 'In Transit'].includes(d.status))
    .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
  
  return Math.max(required - fulfilled - activeDispatches, 0);
};

export const calculateAvailableStock = (item, dispatches) => {
  if (!item) return 0;
  const stock = Number(item.stock) || 0;
  
  const reservedStock = dispatches
    .filter(d => {
      const need = d.need;
      return need && need.inventory_item_id === item.id && ['Pending', 'In Transit'].includes(d.status);
    })
    .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
  
  return Math.max(stock - reservedStock, 0);
};

export const calculateOverallFulfillment = (needs) => {
  if (!needs || needs.length === 0) return 0;
  const totalRequired = needs.reduce((sum, n) => sum + (Number(n.required_quantity) || 0), 0);
  const totalFulfilled = needs.reduce((sum, n) => sum + (Number(n.fulfilled_quantity) || 0), 0);
  if (totalRequired === 0) return 0;
  return Math.min((totalFulfilled / totalRequired) * 100, 100);
};

export const calculateFulfillmentByCategory = (needs, inventory) => {
  const categoryMap = {};
  
  needs.forEach(need => {
    const item = inventory.find(i => i.id === need.inventory_item_id);
    if (!item) return;
    
    const category = item.category;
    if (!categoryMap[category]) {
      categoryMap[category] = { required: 0, fulfilled: 0 };
    }
    categoryMap[category].required += Number(need.required_quantity) || 0;
    categoryMap[category].fulfilled += Number(need.fulfilled_quantity) || 0;
  });
  
  return Object.entries(categoryMap).map(([category, data]) => ({
    category,
    percentage: data.required > 0 ? Math.min((data.fulfilled / data.required) * 100, 100) : 0,
    required: data.required,
    fulfilled: data.fulfilled,
  }));
};

export const getCriticalGaps = (needs, inventory, camps) => {
  return needs
    .filter(need => need.priority === 'High')
    .map(need => {
      const item = inventory.find(i => i.id === need.inventory_item_id);
      const camp = camps.find(c => c.id === need.camp_id);
      const required = Number(need.required_quantity) || 0;
      const fulfilled = Number(need.fulfilled_quantity) || 0;
      const percentage = calculateFulfillmentPercentage(required, fulfilled);
      const shortage = required - fulfilled;
      
      return {
        ...need,
        itemName: item?.name || 'Unknown',
        itemCategory: item?.category || 'Unknown',
        campName: camp?.name || 'Unknown',
        campDistrict: camp?.district || 'Unknown',
        percentage,
        shortage,
      };
    })
    .filter(gap => gap.percentage < 40)
    .sort((a, b) => a.percentage - b.percentage);
};

export const getActiveCampsCount = (camps) => {
  return camps.filter(c => ['Active', 'Full'].includes(c.status)).length;
};

export const getTotalFamiliesSheltered = (camps) => {
  return camps.reduce((sum, c) => sum + (Number(c.current_families) || 0), 0);
};

export const getLowStockItemsCount = (inventory) => {
  return inventory.filter(i => (Number(i.stock) || 0) <= (Number(i.reorder_level) || 0)).length;
};

export const getLowStockItems = (inventory) => {
  return inventory
    .filter(i => (Number(i.stock) || 0) <= (Number(i.reorder_level) || 0))
    .map(item => {
      const stock = Number(item.stock) || 0;
      const reorder = Number(item.reorder_level) || 0;
      const ratio = reorder > 0 ? stock / reorder : 1;
      let severity = 'At Reorder';
      if (ratio <= 0.5) severity = 'Critical';
      else if (ratio <= 1) severity = 'Low';
      return { ...item, severity };
    })
    .sort((a, b) => {
      const aRatio = (Number(a.reorder_level) || 1) > 0 ? (Number(a.stock) || 0) / (Number(a.reorder_level) || 1) : 1;
      const bRatio = (Number(b.reorder_level) || 1) > 0 ? (Number(b.stock) || 0) / (Number(b.reorder_level) || 1) : 1;
      return aRatio - bRatio;
    });
};

export const getDeployedVolunteersCount = (volunteers, camps) => {
  const activeCampIds = new Set(
    camps.filter(c => ['Active', 'Full'].includes(c.status)).map(c => c.id)
  );
  return volunteers.filter(v => v.camp_id && activeCampIds.has(v.camp_id)).length;
};

export const getTotalCashDonations = (donations) => {
  return donations
    .filter(d => d.type === 'Cash')
    .reduce((sum, d) => sum + (Number(d.amount_or_quantity) || 0), 0);
};

export const getDonationsByCategory = (donations) => {
  const categoryMap = {};
  donations.forEach(d => {
    const cat = d.category || 'Other';
    if (!categoryMap[cat]) categoryMap[cat] = { cash: 0, inKind: 0 };
    if (d.type === 'Cash') {
      categoryMap[cat].cash += Number(d.amount_or_quantity) || 0;
    } else {
      categoryMap[cat].inKind += Number(d.amount_or_quantity) || 0;
    }
  });
  return Object.entries(categoryMap).map(([category, data]) => ({
    category,
    ...data,
  }));
};