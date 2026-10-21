import api from '../api/client';
import { donationsApi } from '../api/donations.api';
import { inventoryApi } from '../api/inventory.api';

const pendingDonations = new Set();

export const donationsService = {
  async createDonation(donationData) {
    const opKey = `create-${donationData.type}-${donationData.item_id || 'cash'}-${donationData.amount_or_quantity}`;
    if (pendingDonations.has(opKey)) {
      throw new Error('Donation creation already in progress');
    }
    pendingDonations.add(opKey);
    
    try {
      const newDonation = {
        ...donationData,
        id: `donation-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      
      const res = await donationsApi.create(newDonation);
      
      if (donationData.type === 'In-Kind' && donationData.item_id) {
        const itemRes = await inventoryApi.getById(donationData.item_id);
        const item = itemRes.data;
        const newStock = (Number(item.stock) || 0) + (Number(donationData.amount_or_quantity) || 0);
        await inventoryApi.patch(item.id, { stock: newStock });
      }
      
      return res.data;
    } finally {
      pendingDonations.delete(opKey);
    }
  },
};