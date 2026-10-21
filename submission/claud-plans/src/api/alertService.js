import { apiClient } from './client';

const mapAlert = (alert, crops, markets) => ({
  ...alert,
  userId: alert.user_id,
  cropId: alert.crop_id,
  cropName: crops.find((crop) => crop.id === alert.crop_id)?.name || 'Produce',
  marketId: alert.market_id,
  marketName: markets.find((market) => market.id === alert.market_id)?.name || 'Market',
  condition: alert.condition.toLowerCase(),
  targetPrice: Number(alert.target_price),
  active: alert.active_status
});

const toApiAlert = (alert) => {
  const payload = {};
  if (alert.userId !== undefined) payload.user_id = alert.userId;
  if (alert.cropId !== undefined) payload.crop_id = alert.cropId;
  if (alert.marketId !== undefined) payload.market_id = alert.marketId;
  if (alert.condition !== undefined) {
    payload.condition = alert.condition === 'above' ? 'Above' : 'Below';
  }
  if (alert.targetPrice !== undefined) payload.target_price = Number(alert.targetPrice);
  if (alert.active !== undefined) payload.active_status = Boolean(alert.active);
  return payload;
};

const getLookups = async () =>
  Promise.all([apiClient('/crops'), apiClient('/markets')]);

export const alertService = {
  getAlerts: async (params = {}) => {
    const { userId, ...filters } = params;
    if (userId) filters.user_id = userId;
    const [alerts, [crops, markets]] = await Promise.all([
      apiClient('/alerts', { params: filters }),
      getLookups()
    ]);
    return alerts.map((alert) => mapAlert(alert, crops, markets));
  },

  createAlert: async (alertData) => {
    const created = await apiClient('/alerts', {
      method: 'POST',
      body: {
        ...toApiAlert(alertData),
        id: `alt-${Date.now()}`,
        active_status: true
      }
    });
    const [crops, markets] = await getLookups();
    return mapAlert(created, crops, markets);
  },

  updateAlert: async (id, updates) => {
    await apiClient(`/alerts/${id}`, {
      method: 'PATCH',
      body: toApiAlert(updates)
    });
    return (await alertService.getAlerts()).find((alert) => alert.id === id);
  },

  deleteAlert: async (id) =>
    await apiClient(`/alerts/${id}`, { method: 'DELETE' }),

  evaluateAlertRules: async (alerts, marketPrices) =>
    alerts.map((alert) => {
      const price = marketPrices.find(
        (item) => item.cropId === alert.cropId && item.marketId === alert.marketId
      );
      const currentPrice = price?.modalPrice;
      const triggered =
        alert.active &&
        currentPrice !== undefined &&
        (alert.condition === 'above'
          ? currentPrice >= alert.targetPrice
          : currentPrice <= alert.targetPrice);
      return {
        ...alert,
        triggered,
        message: triggered
          ? `${alert.cropName} in ${alert.marketName} is Rs. ${currentPrice.toLocaleString()}`
          : ''
      };
    })
};
