export const validateCamp = (data) => {
  const errors = {};
  
  if (!data.name?.trim()) {
    errors.name = 'Camp name is required';
  }
  
  if (!data.district?.trim()) {
    errors.district = 'District is required';
  }
  
  const capacity = Number(data.capacity);
  if (!capacity || capacity <= 0) {
    errors.capacity = 'Capacity must be a positive number';
  }
  
  const currentFamilies = Number(data.current_families);
  if (currentFamilies < 0) {
    errors.current_families = 'Current families cannot be negative';
  }
  
  if (capacity > 0 && currentFamilies > capacity) {
    errors.current_families = 'Current families cannot exceed capacity';
  }
  
  if (!['Active', 'Full', 'Closed'].includes(data.status)) {
    errors.status = 'Invalid status';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateInventoryItem = (data) => {
  const errors = {};
  
  if (!data.name?.trim()) {
    errors.name = 'Item name is required';
  }
  
  if (!data.category?.trim()) {
    errors.category = 'Category is required';
  }
  
  if (!data.unit?.trim()) {
    errors.unit = 'Unit is required';
  }
  
  const stock = Number(data.stock);
  if (stock < 0 || isNaN(stock)) {
    errors.stock = 'Stock cannot be negative';
  }
  
  const reorderLevel = Number(data.reorder_level);
  if (reorderLevel < 0 || isNaN(reorderLevel)) {
    errors.reorder_level = 'Reorder level cannot be negative';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateNeed = (data) => {
  const errors = {};
  
  if (!data.camp_id) {
    errors.camp_id = 'Camp is required';
  }
  
  if (!data.inventory_item_id) {
    errors.inventory_item_id = 'Inventory item is required';
  }
  
  const requiredQuantity = Number(data.required_quantity);
  if (!requiredQuantity || requiredQuantity <= 0) {
    errors.required_quantity = 'Required quantity must be positive';
  }
  
  if (!['High', 'Medium', 'Low'].includes(data.priority)) {
    errors.priority = 'Priority must be High, Medium, or Low';
  }
  
  const fulfilledQuantity = Number(data.fulfilled_quantity) || 0;
  if (fulfilledQuantity < 0) {
    errors.fulfilled_quantity = 'Fulfilled quantity cannot be negative';
  }
  
  if (requiredQuantity > 0 && fulfilledQuantity > requiredQuantity) {
    errors.fulfilled_quantity = 'Fulfilled quantity cannot exceed required quantity';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateDispatch = (data) => {
  const errors = {};
  
  if (!data.camp_id) {
    errors.camp_id = 'Camp is required';
  }
  
  if (!data.need_id) {
    errors.need_id = 'Need is required';
  }
  
  const quantity = Number(data.quantity);
  if (!quantity || quantity <= 0) {
    errors.quantity = 'Quantity must be positive';
  }
  
  if (!['Pending', 'In Transit', 'Delivered', 'Cancelled'].includes(data.status)) {
    errors.status = 'Invalid status';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateDonation = (data) => {
  const errors = {};
  
  if (!['Cash', 'In-Kind'].includes(data.type)) {
    errors.type = 'Type must be Cash or In-Kind';
  }
  
  const amount = Number(data.amount_or_quantity);
  if (!amount || amount <= 0) {
    errors.amount_or_quantity = 'Amount/quantity must be positive';
  }
  
  if (data.type === 'In-Kind' && !data.item_id) {
    errors.item_id = 'Inventory item is required for in-kind donations';
  }
  
  if (data.type === 'Cash' && data.item_id) {
    errors.item_id = 'Cash donations should not have an item';
  }
  
  if (!data.category?.trim()) {
    errors.category = 'Category is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateVolunteer = (data, existingVolunteers = [], currentId = null) => {
  const errors = {};
  
  if (!data.name?.trim()) {
    errors.name = 'Name is required';
  }
  
  if (!['Medical', 'Logistics', 'Cooking', 'Driving', 'Counselling'].includes(data.skill)) {
    errors.skill = 'Invalid skill';
  }
  
  if (data.camp_id) {
    const duplicate = existingVolunteers.find(v => 
      v.id !== currentId && v.camp_id === data.camp_id && v.name === data.name
    );
    if (duplicate) {
      errors.name = 'A volunteer with this name is already assigned to this camp';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};