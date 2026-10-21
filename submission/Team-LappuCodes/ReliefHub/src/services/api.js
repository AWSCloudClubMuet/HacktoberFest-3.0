const API_BASE = 'http://localhost:5000';

export const api = {
  get: async (endpoint) => {
    const res = await fetch(`${API_BASE}/${endpoint}`);
    if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
    return res.json();
  },
  post: async (endpoint, data) => {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  patch: async (endpoint, data) => {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  delete: async (endpoint) => {
    const res = await fetch(`${API_BASE}/${endpoint}`, { method: 'DELETE' });
    return res.json();
  },
  
  createDispatch: async (dispatchData) => {
    return api.post('dispatches', dispatchData);
  },
  
  updateDispatchStatus: async (dispatch, newStatus) => {
    return api.patch(`dispatches/${dispatch.id}`, { status: newStatus });
  },

  recordDonation: async (donationData, stockItem) => {
    if (donationData.type === 'In-Kind' && stockItem) {
      const updatedStock = Number(stockItem.stock) + Number(donationData.amountorquantity);
      await api.patch(`inventory/${stockItem.id}`, { stock: updatedStock });
    }
    return api.post('donations', donationData);
  }
};