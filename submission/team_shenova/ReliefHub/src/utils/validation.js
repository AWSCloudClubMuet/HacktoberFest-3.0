// Form and Data Validation Utilities for ReliefHub

export function validateCamp(camp) {
  const errors = {};

  if (!camp.name || !camp.name.trim()) {
    errors.name = 'Camp name is required';
  }

  if (!camp.district || !camp.district.trim()) {
    errors.district = 'District is required';
  }

  const capacity = Number(camp.capacity);
  if (isNaN(capacity) || capacity <= 0) {
    errors.capacity = 'Capacity must be a positive number';
  }

  const families = Number(camp.current_families);
  if (isNaN(families) || families < 0) {
    errors.current_families = 'Current families cannot be negative';
  } else if (!isNaN(capacity) && families > capacity) {
    errors.current_families = `Current families (${families}) cannot exceed total camp capacity (${capacity})`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateInventoryItem(item) {
  const errors = {};

  if (!item.name || !item.name.trim()) {
    errors.name = 'Item name is required';
  }

  if (!item.category || !item.category.trim()) {
    errors.category = 'Category is required';
  }

  if (!item.unit || !item.unit.trim()) {
    errors.unit = 'Unit of measurement is required';
  }

  const stock = Number(item.stock);
  if (isNaN(stock) || stock < 0) {
    errors.stock = 'Stock cannot be negative';
  }

  const reorder = Number(item.reorder_level);
  if (isNaN(reorder) || reorder < 0) {
    errors.reorder_level = 'Reorder level cannot be negative';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateNeed(need) {
  const errors = {};

  if (!need.camp_id) {
    errors.camp_id = 'Camp selection is required';
  }

  if (!need.inventory_item_id) {
    errors.inventory_item_id = 'Inventory item selection is required';
  }

  const reqQty = Number(need.required_quantity);
  if (isNaN(reqQty) || reqQty <= 0) {
    errors.required_quantity = 'Required quantity must be greater than zero';
  }

  const fulQty = Number(need.fulfilled_quantity || 0);
  if (isNaN(fulQty) || fulQty < 0) {
    errors.fulfilled_quantity = 'Fulfilled quantity cannot be negative';
  } else if (!isNaN(reqQty) && fulQty > reqQty) {
    errors.fulfilled_quantity = `Fulfilled quantity (${fulQty}) cannot exceed required quantity (${reqQty})`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateDispatch(dispatch, inventoryItem, remainingDemand) {
  const errors = {};

  if (!dispatch.camp_id) {
    errors.camp_id = 'Please select a destination camp';
  }

  if (!dispatch.need_id) {
    errors.need_id = 'Please select a camp need to fulfill';
  }

  const qty = Number(dispatch.quantity);
  if (isNaN(qty) || qty <= 0) {
    errors.quantity = 'Dispatch quantity must be a positive number';
  } else {
    if (inventoryItem && qty > inventoryItem.stock) {
      errors.quantity = `Dispatch quantity (${qty}) exceeds available warehouse stock (${inventoryItem.stock} ${inventoryItem.unit})`;
    } else if (remainingDemand !== undefined && qty > remainingDemand) {
      errors.quantity = `Dispatch quantity (${qty}) exceeds remaining unreserved demand (${remainingDemand})`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateDonation(donation) {
  const errors = {};

  if (!donation.type || (donation.type !== 'Cash' && donation.type !== 'In-Kind')) {
    errors.type = 'Select a valid donation type (Cash or In-Kind)';
  }

  const val = Number(donation.amount_or_quantity);
  if (isNaN(val) || val <= 0) {
    errors.amount_or_quantity = donation.type === 'Cash' 
      ? 'Amount must be greater than 0' 
      : 'Quantity must be greater than 0';
  }

  if (donation.type === 'In-Kind' && !donation.item_id) {
    errors.item_id = 'In-Kind donations require selecting an inventory item';
  }

  if (!donation.category || !donation.category.trim()) {
    errors.category = 'Donation category is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateVolunteer(volunteer, camps = []) {
  const errors = {};

  if (!volunteer.name || !volunteer.name.trim()) {
    errors.name = 'Volunteer full name is required';
  }

  const validSkills = ['Medical', 'Logistics', 'Cooking', 'Driving', 'Counselling'];
  if (!volunteer.skill || !validSkills.includes(volunteer.skill)) {
    errors.skill = 'Please select a valid operational skill';
  }

  if (volunteer.camp_id) {
    const assignedCamp = camps.find(c => String(c.id) === String(volunteer.camp_id));
    if (assignedCamp && assignedCamp.status === 'Closed') {
      errors.camp_id = `Cannot assign volunteer to "${assignedCamp.name}" because the camp is Closed.`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
