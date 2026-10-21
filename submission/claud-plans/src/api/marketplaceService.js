import { apiClient } from './client';

const mapListing = (listing, users, crops) => {
  const user = users.find((item) => item.id === listing.user_id);
  const crop = crops.find((item) => item.id === listing.crop_id);
  return {
    ...listing,
    userId: listing.user_id,
    farmerName: user?.name || 'Farmer',
    farmerPhone: user?.phone || '',
    cropId: listing.crop_id,
    cropName: crop?.name || 'Produce',
    category: crop?.category || '',
    variety: listing.grade,
    quantity: Number(listing.quantity),
    unit: '40kg maund',
    pricePerUnit: Number(listing.asking_price),
    marketLocation: listing.district,
    harvestDate: listing.available_from,
    status: listing.status === 'Active' ? 'available' : 'sold'
  };
};

const toApiListing = (listing) => {
  const payload = {};
  if (listing.userId !== undefined) payload.user_id = listing.userId;
  if (listing.cropId !== undefined) payload.crop_id = listing.cropId;
  if (listing.quantity !== undefined) payload.quantity = Number(listing.quantity);
  if (listing.pricePerUnit !== undefined) payload.asking_price = Number(listing.pricePerUnit);
  if (listing.district !== undefined) payload.district = listing.district;
  if (listing.variety !== undefined) {
    payload.grade = ['A', 'B', 'C'].includes(listing.variety) ? listing.variety : 'A';
  }
  if (listing.harvestDate !== undefined) payload.available_from = listing.harvestDate;
  if (listing.status !== undefined) {
    payload.status = listing.status === 'available' ? 'Active' : 'Sold';
  }
  return payload;
};

const getLookups = async () =>
  Promise.all([apiClient('/users'), apiClient('/crops')]);

export const marketplaceService = {
  getListings: async (params = {}) => {
    const { userId, _sort, _order, ...filters } = params;
    const query = { ...filters, _sort: 'id', _order: 'desc' };
    if (userId) {
      query.user_id = userId;
    }

    const [listings, [users, crops]] = await Promise.all([
      apiClient('/listings', { params: query }),
      getLookups()
    ]);
    return listings.map((listing) => mapListing(listing, users, crops));
  },

  getListingById: async (id) => {
    const [listing, [users, crops]] = await Promise.all([
      apiClient(`/listings/${id}`),
      getLookups()
    ]);
    return mapListing(listing, users, crops);
  },

  createListing: async (listingData) => {
    const created = await apiClient('/listings', {
      method: 'POST',
      body: {
        ...toApiListing(listingData),
        id: `lst-${Date.now()}`,
        status: 'Active'
      }
    });
    const [users, crops] = await getLookups();
    return mapListing(created, users, crops);
  },

  updateListing: async (id, updates) => {
    await apiClient(`/listings/${id}`, {
      method: 'PATCH',
      body: toApiListing(updates)
    });
    return await marketplaceService.getListingById(id);
  },

  deleteListing: async (id) =>
    await apiClient(`/listings/${id}`, { method: 'DELETE' })
};
