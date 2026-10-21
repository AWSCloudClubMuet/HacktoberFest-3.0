import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'db.json');

const camps = [
  { id: 1, name: "Sukkur Barrage Relief Camp", district: "Sukkur", capacity: 500, current_families: 420, status: "Open" },
  { id: 2, name: "Rohri Railway Ground Shelter", district: "Sukkur", capacity: 300, current_families: 300, status: "Full" },
  { id: 3, name: "Larkana Degree College Camp", district: "Larkana", capacity: 450, current_families: 380, status: "Open" },
  { id: 4, name: "Ratodero Sports Complex", district: "Larkana", capacity: 250, current_families: 190, status: "Open" },
  { id: 5, name: "Dadu High School Shelter", district: "Dadu", capacity: 400, current_families: 390, status: "Open" },
  { id: 6, name: "Johi Embankment Relief Point", district: "Dadu", capacity: 200, current_families: 0, status: "Closed" },
  { id: 7, name: "Jacobabad Municipal Stadium", district: "Jacobabad", capacity: 350, current_families: 280, status: "Open" },
  { id: 8, name: "Khairpur Industrial Zone Camp", district: "Khairpur", capacity: 600, current_families: 480, status: "Open" }
];

const inventory = [
  { id: 1, name: "Wheat Flour (20kg Bag)", category: "Food", unit: "Bags", stock: 85, reorder_level: 100 }, // Low Stock
  { id: 2, name: "Rice (10kg Bag)", category: "Food", unit: "Bags", stock: 240, reorder_level: 80 },
  { id: 3, name: "Cooking Oil (5L)", category: "Food", unit: "Cans", stock: 150, reorder_level: 60 },
  { id: 4, name: "Mineral Water (19L)", category: "Water", unit: "Bottles", stock: 45, reorder_level: 90 }, // Low Stock
  { id: 5, name: "Water Purification Tablets", category: "Water", unit: "Strips", stock: 800, reorder_level: 200 },
  { id: 6, name: "ORS Hydration Sachets", category: "Medicine", unit: "Boxes", stock: 350, reorder_level: 100 },
  { id: 7, name: "Antibiotics & First Aid Kits", category: "Medicine", unit: "Kits", stock: 40, reorder_level: 50 }, // Low Stock
  { id: 8, name: "Family Relief Tents", category: "Shelter", unit: "Units", stock: 95, reorder_level: 50 },
  { id: 9, name: "Tarpaulin Waterproof Sheets", category: "Shelter", unit: "Sheets", stock: 320, reorder_level: 100 },
  { id: 10, name: "Thermal Blankets", category: "Shelter", unit: "Pieces", stock: 410, reorder_level: 150 },
  { id: 11, name: "Hygiene & Sanitation Kits", category: "Hygiene", unit: "Kits", stock: 180, reorder_level: 75 },
  { id: 12, name: "Mosquito Nets (Treated)", category: "Hygiene", unit: "Pieces", stock: 520, reorder_level: 120 }
];

// Needs: At least 20 needs, with at least 3 Critical Gaps (priority === 'High' && fulfilled_quantity / required_quantity < 0.4)
const needs = [
  // Critical Gap 1: Camp 5 (Dadu), First Aid Kits (Medicine), 20/120 = 16.7%
  { id: 1, camp_id: 5, inventory_item_id: 7, required_quantity: 120, priority: "High", fulfilled_quantity: 20 },
  // Critical Gap 2: Camp 7 (Jacobabad), Mineral Water (Water), 50/250 = 20.0%
  { id: 2, camp_id: 7, inventory_item_id: 4, required_quantity: 250, priority: "High", fulfilled_quantity: 50 },
  // Critical Gap 3: Camp 3 (Larkana), Family Tents (Shelter), 30/100 = 30.0%
  { id: 3, camp_id: 3, inventory_item_id: 8, required_quantity: 100, priority: "High", fulfilled_quantity: 30 },
  // Critical Gap 4: Camp 8 (Khairpur), Wheat Flour (Food), 40/150 = 26.7%
  { id: 4, camp_id: 8, inventory_item_id: 1, required_quantity: 150, priority: "High", fulfilled_quantity: 40 },
  
  // Other needs with varied fulfilment
  { id: 5, camp_id: 1, inventory_item_id: 1, required_quantity: 200, priority: "High", fulfilled_quantity: 180 },
  { id: 6, camp_id: 1, inventory_item_id: 4, required_quantity: 300, priority: "Medium", fulfilled_quantity: 260 },
  { id: 7, camp_id: 1, inventory_item_id: 11, required_quantity: 150, priority: "Low", fulfilled_quantity: 150 },
  
  { id: 8, camp_id: 2, inventory_item_id: 2, required_quantity: 160, priority: "Medium", fulfilled_quantity: 120 },
  { id: 9, camp_id: 2, inventory_item_id: 6, required_quantity: 100, priority: "High", fulfilled_quantity: 85 },
  { id: 10, camp_id: 2, inventory_item_id: 12, required_quantity: 200, priority: "Low", fulfilled_quantity: 160 },
  
  { id: 11, camp_id: 3, inventory_item_id: 5, required_quantity: 400, priority: "High", fulfilled_quantity: 320 },
  { id: 12, camp_id: 3, inventory_item_id: 3, required_quantity: 80, priority: "Medium", fulfilled_quantity: 70 },
  
  { id: 13, camp_id: 4, inventory_item_id: 9, required_quantity: 120, priority: "Medium", fulfilled_quantity: 90 },
  { id: 14, camp_id: 4, inventory_item_id: 10, required_quantity: 150, priority: "Low", fulfilled_quantity: 110 },
  
  { id: 15, camp_id: 5, inventory_item_id: 5, required_quantity: 300, priority: "High", fulfilled_quantity: 240 },
  { id: 16, camp_id: 5, inventory_item_id: 11, required_quantity: 90, priority: "Medium", fulfilled_quantity: 60 },
  
  { id: 17, camp_id: 7, inventory_item_id: 2, required_quantity: 140, priority: "Medium", fulfilled_quantity: 100 },
  { id: 18, camp_id: 7, inventory_item_id: 6, required_quantity: 110, priority: "High", fulfilled_quantity: 70 },
  
  { id: 19, camp_id: 8, inventory_item_id: 9, required_quantity: 180, priority: "Low", fulfilled_quantity: 130 },
  { id: 20, camp_id: 8, inventory_item_id: 12, required_quantity: 220, priority: "Medium", fulfilled_quantity: 160 }
];

// Dispatches: 10 dispatches covering Pending, In Transit, Delivered, Cancelled
const dispatches = [
  { id: 1, camp_id: 1, need_id: 5, quantity: 20, status: "Delivered" },
  { id: 2, camp_id: 1, need_id: 6, quantity: 30, status: "In Transit" },
  { id: 3, camp_id: 2, need_id: 8, quantity: 25, status: "Pending" },
  { id: 4, camp_id: 3, need_id: 3, quantity: 20, status: "Pending" },
  { id: 5, camp_id: 5, need_id: 1, quantity: 15, status: "In Transit" },
  { id: 6, camp_id: 7, need_id: 2, quantity: 40, status: "Pending" },
  { id: 7, camp_id: 8, need_id: 4, quantity: 30, status: "In Transit" },
  { id: 8, camp_id: 4, need_id: 13, quantity: 20, status: "Delivered" },
  { id: 9, camp_id: 2, need_id: 10, quantity: 20, status: "Cancelled" },
  { id: 10, camp_id: 8, need_id: 19, quantity: 15, status: "Cancelled" }
];

// Donations: 10 donations (Cash and In-Kind)
const donations = [
  { id: 1, type: "Cash", amount_or_quantity: 250000, item_id: null, category: "Emergency Relief Fund" },
  { id: 2, type: "In-Kind", amount_or_quantity: 50, item_id: 1, category: "Food" },
  { id: 3, type: "Cash", amount_or_quantity: 120000, item_id: null, category: "Medical Aid" },
  { id: 4, type: "In-Kind", amount_or_quantity: 100, item_id: 4, category: "Water" },
  { id: 5, type: "Cash", amount_or_quantity: 500000, item_id: null, category: "General Flood Support" },
  { id: 6, type: "In-Kind", amount_or_quantity: 40, item_id: 8, category: "Shelter" },
  { id: 7, type: "Cash", amount_or_quantity: 75000, item_id: null, category: "Child Nutrition" },
  { id: 8, type: "In-Kind", amount_or_quantity: 80, item_id: 11, category: "Hygiene" },
  { id: 9, type: "In-Kind", amount_or_quantity: 20, item_id: 7, category: "Medicine" },
  { id: 10, type: "Cash", amount_or_quantity: 300000, item_id: null, category: "Shelter Rehabilitation" }
];

// Volunteers: 15 volunteers covering all five skills (Medical, Logistics, Cooking, Driving, Counselling), some unassigned
const volunteers = [
  { id: 1, name: "Dr. Ayesha Memon", skill: "Medical", camp_id: 1 },
  { id: 2, name: "Tariq Shah", skill: "Logistics", camp_id: 1 },
  { id: 3, name: "Bilal Soomro", skill: "Driving", camp_id: 2 },
  { id: 4, name: "Zainab Solangi", skill: "Cooking", camp_id: 3 },
  { id: 5, name: "Farhan Bhutto", skill: "Medical", camp_id: 3 },
  { id: 6, name: "Noreen Chandio", skill: "Counselling", camp_id: 4 },
  { id: 7, name: "Rashid Ali", skill: "Driving", camp_id: 5 },
  { id: 8, name: "Dr. Kamran Qureshi", skill: "Medical", camp_id: 5 },
  { id: 9, name: "Sajid Kalhoro", skill: "Logistics", camp_id: 7 },
  { id: 10, name: "Hina Rind", skill: "Cooking", camp_id: 8 },
  { id: 11, name: "Majid Jamali", skill: "Logistics", camp_id: 8 },
  { id: 12, name: "Sadia Abbasi", skill: "Counselling", camp_id: 7 },
  // Unassigned volunteers:
  { id: 13, name: "Waqas Junejo", skill: "Driving", camp_id: null },
  { id: 14, name: "Faryal Talpur", skill: "Medical", camp_id: null },
  { id: 15, name: "Usman Wassan", skill: "Cooking", camp_id: null }
];

const database = {
  camps,
  inventory,
  needs,
  dispatches,
  donations,
  volunteers
};

fs.writeFileSync(dbPath, JSON.stringify(database, null, 2), 'utf-8');
console.log(`✅ Seed database successfully written to ${dbPath}`);
console.log(`Summary:`);
console.log(`- Camps: ${camps.length} (Districts: ${[...new Set(camps.map(c => c.district))].join(', ')})`);
console.log(`- Inventory items: ${inventory.length} (Low stock: ${inventory.filter(i => i.stock <= i.reorder_level).length})`);
console.log(`- Needs: ${needs.length} (Critical gaps: ${needs.filter(n => n.priority === 'High' && (n.fulfilled_quantity / n.required_quantity) < 0.4).length})`);
console.log(`- Dispatches: ${dispatches.length} (Statuses: ${[...new Set(dispatches.map(d => d.status))].join(', ')})`);
console.log(`- Donations: ${donations.length}`);
console.log(`- Volunteers: ${volunteers.length} (Unassigned: ${volunteers.filter(v => v.camp_id === null).length})`);
