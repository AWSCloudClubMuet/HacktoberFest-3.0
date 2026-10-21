const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'public', 'db', 'db.json');
const backupPath = path.join(__dirname, '..', 'public', 'db', 'db.json.backup');

const seedData = {
  camps: [
    {
      id: "camp-1",
      name: "Khairpur Relief Camp",
      district: "Khairpur",
      capacity: 500,
      current_families: 450,
      status: "Active",
      created_at: "2024-07-15T10:00:00Z"
    },
    {
      id: "camp-2",
      name: "Sukkur Main Camp",
      district: "Sukkur",
      capacity: 800,
      current_families: 800,
      status: "Full",
      created_at: "2024-07-16T09:00:00Z"
    },
    {
      id: "camp-3",
      name: "Larkana Riverside Camp",
      district: "Larkana",
      capacity: 600,
      current_families: 300,
      status: "Active",
      created_at: "2024-07-17T14:00:00Z"
    },
    {
      id: "camp-4",
      name: "Dadu District Camp",
      district: "Dadu",
      capacity: 400,
      current_families: 0,
      status: "Closed",
      created_at: "2024-07-18T11:00:00Z"
    },
    {
      id: "camp-5",
      name: "Shikarpur Emergency Camp",
      district: "Shikarpur",
      capacity: 350,
      current_families: 320,
      status: "Active",
      created_at: "2024-07-19T08:00:00Z"
    },
    {
      id: "camp-6",
      name: "Jacobabad Central Camp",
      district: "Jacobabad",
      capacity: 700,
      current_families: 700,
      status: "Full",
      created_at: "2024-07-20T10:30:00Z"
    },
    {
      id: "camp-7",
      name: "Ghotki Relief Camp",
      district: "Ghotki",
      capacity: 450,
      current_families: 280,
      status: "Active",
      created_at: "2024-07-21T12:00:00Z"
    },
    {
      id: "camp-8",
      name: "Naushahro Feroze Camp",
      district: "Naushahro Feroze",
      capacity: 550,
      current_families: 550,
      status: "Full",
      created_at: "2024-07-22T09:00:00Z"
    }
  ],
  inventory: [
    { id: "item-1", name: "Rice Bags (25kg)", category: "Food", unit: "bags", stock: 1200, reorder_level: 200, created_at: "2024-07-01T00:00:00Z" },
    { id: "item-2", name: "Wheat Flour (20kg)", category: "Food", unit: "bags", stock: 800, reorder_level: 150, created_at: "2024-07-01T00:00:00Z" },
    { id: "item-3", name: "Bottled Water (1.5L)", category: "Water", unit: "bottles", stock: 5000, reorder_level: 1000, created_at: "2024-07-01T00:00:00Z" },
    { id: "item-4", name: "Water Purification Tablets", category: "Water", unit: "packets", stock: 200, reorder_level: 500, created_at: "2024-07-01T00:00:00Z" },
    { id: "item-5", name: "ORS Packets", category: "Medicine", unit: "packets", stock: 3000, reorder_level: 500, created_at: "2024-07-01T00:00:00Z" },
    { id: "item-6", name: "Antibiotics (Amoxicillin)", category: "Medicine", unit: "boxes", stock: 80, reorder_level: 100, created_at: "2024-07-01T00:00:00Z" },
    { id: "item-7", name: "Pain Relievers (Paracetamol)", category: "Medicine", unit: "boxes", stock: 200, reorder_level: 100, created_at: "2024-07-01T00:00:00Z" },
    { id: "item-8", name: "Family Tents", category: "Shelter", unit: "units", stock: 150, reorder_level: 50, created_at: "2024-07-01T00:00:00Z" },
    { id: "item-9", name: "Tarpaulin Sheets", category: "Shelter", unit: "sheets", stock: 300, reorder_level: 100, created_at: "2024-07-01T00:00:00Z" },
    { id: "item-10", name: "Blankets", category: "Shelter", unit: "units", stock: 500, reorder_level: 150, created_at: "2024-07-01T00:00:00Z" },
    { id: "item-11", name: "Soap Bars", category: "Hygiene", unit: "units", stock: 2000, reorder_level: 500, created_at: "2024-07-01T00:00:00Z" },
    { id: "item-12", name: "Sanitary Pads", category: "Hygiene", unit: "packets", stock: 150, reorder_level: 300, created_at: "2024-07-01T00:00:00Z" },
    { id: "item-13", name: "Mosquito Nets", category: "Hygiene", unit: "units", stock: 400, reorder_level: 100, created_at: "2024-07-01T00:00:00Z" },
    { id: "item-14", name: "Cooking Oil (5L)", category: "Food", unit: "cans", stock: 300, reorder_level: 100, created_at: "2024-07-01T00:00:00Z" }
  ],
  needs: [
    { id: "need-1", camp_id: "camp-1", inventory_item_id: "item-1", required_quantity: 500, priority: "High", fulfilled_quantity: 200, created_at: "2024-07-15T10:30:00Z" },
    { id: "need-2", camp_id: "camp-1", inventory_item_id: "item-3", required_quantity: 2000, priority: "High", fulfilled_quantity: 800, created_at: "2024-07-15T10:30:00Z" },
    { id: "need-3", camp_id: "camp-1", inventory_item_id: "item-5", required_quantity: 1000, priority: "Medium", fulfilled_quantity: 500, created_at: "2024-07-15T10:30:00Z" },
    { id: "need-4", camp_id: "camp-1", inventory_item_id: "item-8", required_quantity: 200, priority: "High", fulfilled_quantity: 50, created_at: "2024-07-15T10:30:00Z" },
    { id: "need-5", camp_id: "camp-2", inventory_item_id: "item-2", required_quantity: 800, priority: "High", fulfilled_quantity: 400, created_at: "2024-07-16T09:30:00Z" },
    { id: "need-6", camp_id: "camp-2", inventory_item_id: "item-4", required_quantity: 1000, priority: "High", fulfilled_quantity: 100, created_at: "2024-07-16T09:30:00Z" },
    { id: "need-7", camp_id: "camp-2", inventory_item_id: "item-6", required_quantity: 200, priority: "Medium", fulfilled_quantity: 50, created_at: "2024-07-16T09:30:00Z" },
    { id: "need-8", camp_id: "camp-3", inventory_item_id: "item-1", required_quantity: 300, priority: "Medium", fulfilled_quantity: 150, created_at: "2024-07-17T14:30:00Z" },
    { id: "need-9", camp_id: "camp-3", inventory_item_id: "item-3", required_quantity: 1500, priority: "High", fulfilled_quantity: 500, created_at: "2024-07-17T14:30:00Z" },
    { id: "need-10", camp_id: "camp-3", inventory_item_id: "item-10", required_quantity: 300, priority: "Low", fulfilled_quantity: 100, created_at: "2024-07-17T14:30:00Z" },
    { id: "need-11", camp_id: "camp-4", inventory_item_id: "item-1", required_quantity: 200, priority: "Low", fulfilled_quantity: 200, created_at: "2024-07-18T11:30:00Z" },
    { id: "need-12", camp_id: "camp-5", inventory_item_id: "item-1", required_quantity: 350, priority: "High", fulfilled_quantity: 100, created_at: "2024-07-19T08:30:00Z" },
    { id: "need-13", camp_id: "camp-5", inventory_item_id: "item-6", required_quantity: 150, priority: "High", fulfilled_quantity: 20, created_at: "2024-07-19T08:30:00Z" },
    { id: "need-14", camp_id: "camp-5", inventory_item_id: "item-11", required_quantity: 500, priority: "Medium", fulfilled_quantity: 200, created_at: "2024-07-19T08:30:00Z" },
    { id: "need-15", camp_id: "camp-6", inventory_item_id: "item-2", required_quantity: 700, priority: "High", fulfilled_quantity: 300, created_at: "2024-07-20T11:00:00Z" },
    { id: "need-16", camp_id: "camp-6", inventory_item_id: "item-5", required_quantity: 1500, priority: "High", fulfilled_quantity: 400, created_at: "2024-07-20T11:00:00Z" },
    { id: "need-17", camp_id: "camp-6", inventory_item_id: "item-9", required_quantity: 400, priority: "Medium", fulfilled_quantity: 100, created_at: "2024-07-20T11:00:00Z" },
    { id: "need-18", camp_id: "camp-7", inventory_item_id: "item-3", required_quantity: 1000, priority: "Medium", fulfilled_quantity: 400, created_at: "2024-07-21T12:30:00Z" },
    { id: "need-19", camp_id: "camp-7", inventory_item_id: "item-12", required_quantity: 500, priority: "High", fulfilled_quantity: 50, created_at: "2024-07-21T12:30:00Z" },
    { id: "need-20", camp_id: "camp-8", inventory_item_id: "item-1", required_quantity: 550, priority: "High", fulfilled_quantity: 200, created_at: "2024-07-22T09:30:00Z" },
    { id: "need-21", camp_id: "camp-8", inventory_item_id: "item-7", required_quantity: 300, priority: "Medium", fulfilled_quantity: 100, created_at: "2024-07-22T09:30:00Z" },
    { id: "need-22", camp_id: "camp-8", inventory_item_id: "item-13", required_quantity: 550, priority: "High", fulfilled_quantity: 100, created_at: "2024-07-22T09:30:00Z" }
  ],
  dispatches: [
    { id: "dispatch-1", camp_id: "camp-1", need_id: "need-1", quantity: 100, status: "Delivered", created_at: "2024-07-16T08:00:00Z", delivered_at: "2024-07-16T14:00:00Z" },
    { id: "dispatch-2", camp_id: "camp-1", need_id: "need-1", quantity: 100, status: "Delivered", created_at: "2024-07-17T08:00:00Z", delivered_at: "2024-07-17T12:00:00Z" },
    { id: "dispatch-3", camp_id: "camp-1", need_id: "need-2", quantity: 400, status: "Delivered", created_at: "2024-07-16T10:00:00Z", delivered_at: "2024-07-16T16:00:00Z" },
    { id: "dispatch-4", camp_id: "camp-1", need_id: "need-2", quantity: 400, status: "In Transit", created_at: "2024-07-18T08:00:00Z" },
    { id: "dispatch-5", camp_id: "camp-2", need_id: "need-5", quantity: 200, status: "Delivered", created_at: "2024-07-17T09:00:00Z", delivered_at: "2024-07-17T15:00:00Z" },
    { id: "dispatch-6", camp_id: "camp-2", need_id: "need-5", quantity: 200, status: "Delivered", created_at: "2024-07-18T09:00:00Z", delivered_at: "2024-07-18T14:00:00Z" },
    { id: "dispatch-7", camp_id: "camp-2", need_id: "need-6", quantity: 100, status: "Pending", created_at: "2024-07-19T08:00:00Z" },
    { id: "dispatch-8", camp_id: "camp-3", need_id: "need-8", quantity: 100, status: "Delivered", created_at: "2024-07-18T10:00:00Z", delivered_at: "2024-07-18T16:00:00Z" },
    { id: "dispatch-9", camp_id: "camp-3", need_id: "need-8", quantity: 50, status: "Delivered", created_at: "2024-07-19T10:00:00Z", delivered_at: "2024-07-19T14:00:00Z" },
    { id: "dispatch-10", camp_id: "camp-5", need_id: "need-12", quantity: 100, status: "Delivered", created_at: "2024-07-20T08:00:00Z", delivered_at: "2024-07-20T13:00:00Z" },
    { id: "dispatch-11", camp_id: "camp-6", need_id: "need-15", quantity: 150, status: "Delivered", created_at: "2024-07-21T09:00:00Z", delivered_at: "2024-07-21T14:00:00Z" },
    { id: "dispatch-12", camp_id: "camp-6", need_id: "need-15", quantity: 150, status: "Delivered", created_at: "2024-07-22T09:00:00Z", delivered_at: "2024-07-22T13:00:00Z" },
    { id: "dispatch-13", camp_id: "camp-6", need_id: "need-16", quantity: 200, status: "In Transit", created_at: "2024-07-22T10:00:00Z" },
    { id: "dispatch-14", camp_id: "camp-7", need_id: "need-19", quantity: 50, status: "Delivered", created_at: "2024-07-22T11:00:00Z", delivered_at: "2024-07-22T15:00:00Z" },
    { id: "dispatch-15", camp_id: "camp-8", need_id: "need-20", quantity: 100, status: "Delivered", created_at: "2024-07-23T08:00:00Z", delivered_at: "2024-07-23T12:00:00Z" },
    { id: "dispatch-16", camp_id: "camp-8", need_id: "need-20", quantity: 100, status: "Delivered", created_at: "2024-07-24T08:00:00Z", delivered_at: "2024-07-24T12:00:00Z" },
    { id: "dispatch-17", camp_id: "camp-1", need_id: "need-4", quantity: 50, status: "Cancelled", created_at: "2024-07-18T08:00:00Z", cancelled_at: "2024-07-18T10:00:00Z" },
    { id: "dispatch-18", camp_id: "camp-2", need_id: "need-7", quantity: 50, status: "Cancelled", created_at: "2024-07-19T09:00:00Z", cancelled_at: "2024-07-19T11:00:00Z" }
  ],
  donations: [
    { id: "donation-1", type: "Cash", amount_or_quantity: 500000, item_id: null, category: "Emergency Relief", donor: "Sindh Government", created_at: "2024-07-15T12:00:00Z" },
    { id: "donation-2", type: "Cash", amount_or_quantity: 250000, item_id: null, category: "Medical Supplies", donor: "NGO Alliance", created_at: "2024-07-16T10:00:00Z" },
    { id: "donation-3", type: "In-Kind", amount_or_quantity: 200, item_id: "item-1", category: "Food", donor: "Local Business Association", created_at: "2024-07-17T09:00:00Z" },
    { id: "donation-4", type: "In-Kind", amount_or_quantity: 1000, item_id: "item-3", category: "Water", donor: "WaterAid Pakistan", created_at: "2024-07-17T11:00:00Z" },
    { id: "donation-5", type: "In-Kind", amount_or_quantity: 50, item_id: "item-8", category: "Shelter", donor: "Red Crescent", created_at: "2024-07-18T10:00:00Z" },
    { id: "donation-6", type: "Cash", amount_or_quantity: 1000000, item_id: null, category: "General Relief", donor: "International Donor", created_at: "2024-07-19T14:00:00Z" },
    { id: "donation-7", type: "In-Kind", amount_or_quantity: 300, item_id: "item-5", category: "Medicine", donor: "PharmaCorp", created_at: "2024-07-20T09:00:00Z" },
    { id: "donation-8", type: "In-Kind", amount_or_quantity: 100, item_id: "item-10", category: "Shelter", donor: "Community Group", created_at: "2024-07-21T10:00:00Z" },
    { id: "donation-9", type: "In-Kind", amount_or_quantity: 200, item_id: "item-11", category: "Hygiene", donor: "Hygiene Products Ltd", created_at: "2024-07-22T11:00:00Z" },
    { id: "donation-10", type: "In-Kind", amount_or_quantity: 50, item_id: "item-12", category: "Hygiene", donor: "Women's Welfare Org", created_at: "2024-07-23T09:00:00Z" }
  ],
  volunteers: [
    { id: "vol-1", name: "Dr. Ahmed Khan", skill: "Medical", camp_id: "camp-1", created_at: "2024-07-15T10:00:00Z" },
    { id: "vol-2", name: "Sarah Ali", skill: "Medical", camp_id: "camp-2", created_at: "2024-07-16T09:00:00Z" },
    { id: "vol-3", name: "Mohammed Hassan", skill: "Logistics", camp_id: "camp-1", created_at: "2024-07-15T11:00:00Z" },
    { id: "vol-4", name: "Fatima Sheikh", skill: "Cooking", camp_id: "camp-3", created_at: "2024-07-17T14:00:00Z" },
    { id: "vol-5", name: "Usman Tariq", skill: "Driving", camp_id: "camp-2", created_at: "2024-07-16T10:00:00Z" },
    { id: "vol-6", name: "Ayesha Malik", skill: "Counselling", camp_id: "camp-5", created_at: "2024-07-19T08:00:00Z" },
    { id: "vol-7", name: "Bilal Ahmed", skill: "Logistics", camp_id: "camp-6", created_at: "2024-07-20T10:00:00Z" },
    { id: "vol-8", name: "Zainab Raza", skill: "Medical", camp_id: "camp-7", created_at: "2024-07-21T12:00:00Z" },
    { id: "vol-9", name: "Kamran Shah", skill: "Cooking", camp_id: "camp-8", created_at: "2024-07-22T09:00:00Z" },
    { id: "vol-10", name: "Hira Noor", skill: "Driving", camp_id: null, created_at: "2024-07-23T08:00:00Z" },
    { id: "vol-11", name: "Danish Qureshi", skill: "Logistics", camp_id: null, created_at: "2024-07-23T09:00:00Z" },
    { id: "vol-12", name: "Maria Khan", skill: "Medical", camp_id: null, created_at: "2024-07-24T10:00:00Z" },
    { id: "vol-13", name: "Omar Farooq", skill: "Counselling", camp_id: null, created_at: "2024-07-24T11:00:00Z" },
    { id: "vol-14", name: "Sanaullah Memon", skill: "Driving", camp_id: "camp-3", created_at: "2024-07-17T15:00:00Z" },
    { id: "vol-15", name: "Lubna Soomro", skill: "Cooking", camp_id: null, created_at: "2024-07-25T09:00:00Z" }
  ]
};

function seedDatabase() {
  try {
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
      console.log('Backup created at:', backupPath);
    }
    
    fs.writeFileSync(dbPath, JSON.stringify(seedData, null, 2));
    console.log('Database seeded successfully!');
    console.log('- 8 camps across 4+ Sindh districts');
    console.log('- 14 inventory items (Food, Water, Medicine, Shelter, Hygiene)');
    console.log('- 22 camp needs with various priorities');
    console.log('- 18 dispatches with different statuses');
    console.log('- 10 donations (Cash and In-Kind)');
    console.log('- 15 volunteers with all 5 skills');
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  }
}

seedDatabase();