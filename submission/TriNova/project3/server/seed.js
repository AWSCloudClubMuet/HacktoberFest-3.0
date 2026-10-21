/* Deterministic seed data: 8 camps, 12 items, 20 needs, 10 dispatches, 10 donations, 15 volunteers. */
'use strict';

function buildSeed() {
  const camps = [
    // id, name, district, capacity, current_families, status
    [1, 'Dadu Relief Camp A', 'Dadu', 120, 96, 'Open'],
    [2, 'Johi Flood Shelter', 'Dadu', 80, 80, 'Full'],                // Full: families == capacity
    [3, 'Jacobabad Central Camp', 'Jacobabad', 200, 150, 'Open'],
    [4, 'Thul Community Camp', 'Jacobabad', 90, 55, 'Open'],
    [5, 'Sukkur Barrage Camp', 'Sukkur', 150, 120, 'Open'],
    [6, 'Larkana Model School Camp', 'Larkana', 100, 0, 'Closed'],    // Closed
    [7, 'Qambar Relief Point', 'Larkana', 70, 48, 'Open'],
    [8, 'Thatta Coastal Camp', 'Thatta', 110, 62, 'Open'],
  ].map(([id, name, district, capacity, current_families, status]) =>
    ({ id, name, district, capacity, current_families, status }));

  const inventory = [
    // id, name, category, unit, stock, reorder_level
    [1, 'Rice', 'Food', 'kg', 1800, 500],
    [2, 'Wheat Flour', 'Food', 'kg', 2400, 600],
    [3, 'Cooking Oil', 'Food', 'litre', 150, 200],                    // LOW
    [4, 'Bottled Water', 'Water', 'bottle', 5000, 1500],
    [5, 'Water Purification Tablets', 'Water', 'strip', 300, 400],    // LOW
    [6, 'Paracetamol', 'Medical', 'box', 220, 100],
    [7, 'ORS Sachets', 'Medical', 'box', 90, 90],                     // LOW (equal to reorder level)
    [8, 'Family Tents', 'Shelter', 'piece', 120, 40],
    [9, 'Blankets', 'Shelter', 'piece', 600, 200],
    [10, 'Mosquito Nets', 'Shelter', 'piece', 140, 150],              // LOW
    [11, 'Hygiene Kits', 'Hygiene', 'kit', 350, 100],
    [12, "Children's Clothing", 'Clothing', 'set', 260, 80],
  ].map(([id, name, category, unit, stock, reorder_level]) =>
    ({ id, name, category, unit, stock, reorder_level }));

  const needs = [
    // id, camp_id, item_id, required, priority, fulfilled
    [1, 1, 1, 800, 'High', 600],
    [2, 1, 4, 2000, 'High', 500],      // CRITICAL 25%
    [3, 1, 6, 60, 'Medium', 40],
    [4, 2, 8, 40, 'High', 40],
    [5, 2, 9, 160, 'Medium', 100],
    [6, 3, 2, 1500, 'High', 400],      // CRITICAL 26.7%
    [7, 3, 3, 300, 'High', 100],       // CRITICAL 33.3%
    [8, 3, 7, 120, 'High', 90],
    [9, 3, 10, 150, 'Medium', 40],
    [10, 4, 4, 1200, 'Medium', 700],
    [11, 4, 11, 90, 'Low', 90],
    [12, 4, 8, 30, 'High', 10],        // CRITICAL 33.3%
    [13, 5, 1, 1000, 'High', 300],     // CRITICAL 30%
    [14, 5, 5, 250, 'High', 200],
    [15, 5, 9, 200, 'Medium', 80],
    [16, 6, 2, 100, 'Low', 100],
    [17, 7, 6, 50, 'High', 20],        // exactly 40% -> NOT critical (boundary)
    [18, 7, 12, 70, 'Low', 25],
    [19, 8, 4, 1500, 'High', 900],
    [20, 8, 10, 100, 'Medium', 20],
  ].map(([id, camp_id, inventory_item_id, required_quantity, priority, fulfilled_quantity]) =>
    ({ id, camp_id, inventory_item_id, required_quantity, priority, fulfilled_quantity }));

  const dispatches = [
    // id, camp_id, need_id, quantity, status
    [1, 1, 2, 300, 'Delivered'],
    [2, 1, 2, 400, 'In Transit'],
    [3, 3, 6, 250, 'Pending'],
    [4, 3, 7, 80, 'In Transit'],
    [5, 5, 13, 200, 'Pending'],
    [6, 4, 12, 10, 'Cancelled'],
    [7, 8, 19, 300, 'Delivered'],
    [8, 7, 17, 15, 'Pending'],
    [9, 3, 9, 40, 'Delivered'],
    [10, 5, 15, 60, 'In Transit'],
  ].map(([id, camp_id, need_id, quantity, status]) => ({ id, camp_id, need_id, quantity, status }));

  const donations = [
    // id, type, amount_or_quantity, item_id, category, donor, date
    [1, 'Cash', 250000, null, 'Food', 'Al-Khidmat Welfare Trust', '2026-10-02'],
    [2, 'Cash', 150000, null, 'Medical', 'Dr. Farhan Siddiqui', '2026-10-03'],
    [3, 'Cash', 80000, null, 'Shelter', 'Karachi Traders Association', '2026-10-05'],
    [4, 'Cash', 120000, null, 'General', 'Anonymous', '2026-10-07'],
    [5, 'Cash', 60000, null, 'Water', 'Mehran UET Alumni', '2026-10-09'],
    [6, 'In-Kind', 500, 1, 'Food', 'Sukkur Chamber of Commerce', '2026-10-04'],
    [7, 'In-Kind', 100, 6, 'Medical', 'Indus Pharma', '2026-10-06'],
    [8, 'In-Kind', 50, 8, 'Shelter', 'Hyderabad Rotary Club', '2026-10-08'],
    [9, 'In-Kind', 200, 4, 'Water', 'Local Bottling Co.', '2026-10-10'],
    [10, 'In-Kind', 40, 11, 'Hygiene', 'Student Volunteers Society', '2026-10-11'],
  ].map(([id, type, amount_or_quantity, item_id, category, donor, date]) =>
    ({ id, type, amount_or_quantity, item_id, category, donor, date }));

  const volunteers = [
    // id, name, skill, camp_id
    [1, 'Ayesha Memon', 'Medical', 1],
    [2, 'Bilal Chandio', 'Logistics', 1],
    [3, 'Sana Soomro', 'Counselling', 2],
    [4, 'Imran Jatoi', 'Driving', 3],
    [5, 'Hina Abro', 'Cooking', 3],
    [6, 'Zeeshan Khoso', 'Medical', 3],
    [7, 'Mehwish Shaikh', 'Counselling', 4],
    [8, 'Asif Mallah', 'Driving', 5],
    [9, 'Rabia Bhutto', 'Logistics', 5],
    [10, 'Kamran Lashari', 'Cooking', 7],
    [11, 'Farah Siyal', 'Medical', 8],
    [12, 'Tariq Rind', 'Driving', null],
    [13, 'Noor Fatima Leghari', 'Counselling', null],
    [14, 'Danish Panhwar', 'Logistics', null],
    [15, 'Saima Kalhoro', 'Cooking', null],
  ].map(([id, name, skill, camp_id]) => ({ id, name, skill, camp_id }));

  return { camps, inventory, needs, dispatches, donations, volunteers };
}

module.exports = { buildSeed };

if (require.main === module) {
  const store = require('./store');
  store.reset();
  const d = store.db;
  console.log('Seeded:', Object.entries(d).map(([k, v]) => `${k}=${v.length}`).join(', '));
}