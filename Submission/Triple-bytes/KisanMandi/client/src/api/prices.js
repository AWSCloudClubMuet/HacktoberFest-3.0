import { api } from './client.js';

export async function getCrops() {
  return (await api.get('/crops')).data.data;
}

export async function getMarkets() {
  return (await api.get('/markets')).data.data;
}

export async function getLatestPrices(params) {
  return (await api.get('/prices/latest', { params })).data.data;
}

export async function getPriceHistory(params) {
  return (await api.get('/prices', { params })).data.data;
}

export async function compareMarkets(cropId) {
  return (await api.get('/prices/compare', { params: { crop_id: cropId } })).data.data;
}
