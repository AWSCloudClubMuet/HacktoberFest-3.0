import { apiClient } from './client';

const mapCrop = (crop) => ({ ...crop, unit: '40kg maund' });
const mapMarket = (market) => ({ ...market, shortName: market.name });
const formatDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const mapMarketPrices = async (params = {}) => {
  const [records, crops, markets] = await Promise.all([
    apiClient('/prices'),
    apiClient('/crops'),
    apiClient('/markets')
  ]);
  if (records.length === 0) return [];

  const latestDate = records.reduce(
    (latest, record) => (record.date > latest ? record.date : latest),
    records[0].date
  );
  const startDate = new Date(`${latestDate}T00:00:00`);
  startDate.setDate(startDate.getDate() - 13);
  const firstDate = formatDate(startDate);

  const cropById = new Map(crops.map((crop) => [crop.id, crop]));
  const marketById = new Map(markets.map((market) => [market.id, market]));
  const groups = new Map();

  for (const record of records) {
    if (record.date < firstDate || record.date > latestDate) continue;
    const key = `${record.crop_id}:${record.market_id}`;
    const group = groups.get(key) || [];
    group.push(record);
    groups.set(key, group);
  }

  return [...groups.entries()].flatMap(([key, history]) => {
    const [cropId, marketId] = key.split(':');
    const crop = cropById.get(cropId);
    const market = marketById.get(marketId);
    if (!crop || !market) return [];
    history.sort((a, b) => a.date.localeCompare(b.date));
    const latest = history.at(-1);
    const previous = history.at(-2);
    if (!latest || !previous) return [];

    const priceValues = history.map((item) => Number(item.price));
    const row = {
      id: `${cropId}-${marketId}`,
      cropId,
      cropName: crop.name,
      category: crop.category,
      marketId,
      marketName: market.name,
      unit: '40kg maund',
      minPrice: Math.min(...priceValues),
      maxPrice: Math.max(...priceValues),
      modalPrice: Number(latest.price),
      previousPrice: Number(previous.price),
      dailyChangePercent:
        ((Number(latest.price) - Number(previous.price)) / Number(previous.price)) * 100,
      date: latest.date,
      history14Days: history.map((item) => ({
        date: item.date,
        day: new Date(`${item.date}T00:00:00`).toLocaleDateString('en', { weekday: 'short' }),
        price: Number(item.price)
      }))
    };

    if (params.cropId && params.cropId !== cropId) return [];
    if (params.marketId && params.marketId !== marketId) return [];
    if (params.category && params.category !== crop.category) return [];
    return [row];
  });
};

export const mandiService = {
  // Fetch all market prices with optional filters (category, marketId, cropId, search)
  getMarketPrices: async (params = {}) => {
    return await mapMarketPrices(params);
  },

  // Get specific price record
  getPriceById: async (id) => {
    return (await mapMarketPrices()).find((record) => record.id === id) || null;
  },

  // Fetch list of crops
  getCrops: async () => {
    return (await apiClient('/crops')).map(mapCrop);
  },

  // Fetch all registered markets
  getMarkets: async () => {
    return (await apiClient('/markets')).map(mapMarket);
  },

  // Compare prices of a single crop across all markets
  getPricesForCropAcrossMarkets: async (cropId) => {
    return await mapMarketPrices({ cropId });
  }
};
