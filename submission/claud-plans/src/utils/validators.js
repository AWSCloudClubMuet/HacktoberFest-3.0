/**
 * Form field validation utilities
 */

export const validateListing = (formData) => {
  const errors = {};
  if (!formData.cropName || !formData.cropName.trim()) {
    errors.cropName = 'Crop name is required';
  }
  if (!formData.quantity || Number(formData.quantity) <= 0) {
    errors.quantity = 'Quantity must be greater than 0';
  }
  if (!formData.pricePerUnit || Number(formData.pricePerUnit) <= 0) {
    errors.pricePerUnit = 'Price per unit must be greater than 0';
  }
  if (!formData.district || !formData.district.trim()) {
    errors.district = 'District is required';
  }
  if (!formData.marketLocation || !formData.marketLocation.trim()) {
    errors.marketLocation = 'Pickup or farm location is required';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateAlert = (formData) => {
  const errors = {};
  if (!formData.cropId) {
    errors.cropId = 'Please select a crop';
  }
  if (!formData.marketId) {
    errors.marketId = 'Please select a mandi/market';
  }
  if (!formData.targetPrice || Number(formData.targetPrice) <= 0) {
    errors.targetPrice = 'Target price must be greater than 0';
  }
  if (!formData.condition) {
    errors.condition = 'Condition is required';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateUser = (formData) => {
  const errors = {};
  if (!formData.name || formData.name.trim().length < 3) {
    errors.name = 'Full name must be at least 3 characters';
  }
  if (!formData.phone || !/^(\+92|0)?3[0-9]{9}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
    errors.phone = 'Please enter a valid Pakistani mobile number (e.g. 03001234567)';
  }
  if (!formData.district) {
    errors.district = 'District is required';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
