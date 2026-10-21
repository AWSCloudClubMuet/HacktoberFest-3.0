import {
  Camp,
  InventoryItem,
  CampNeed,
  Dispatch,
  Donation,
  Volunteer,
} from '../src/types/index.ts';

export function getInitialSeedData(): {
  camps: Camp[];
  inventory: InventoryItem[];
  needs: CampNeed[];
  dispatches: Dispatch[];
  donations: Donation[];
  volunteers: Volunteer[];
} {
  const now = new Date().toISOString();
  const pastDay = (daysAgo: number) =>
    new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  // 1. CAMPS (8 camps across 5 Sindh districts; includes 1 Full, 1 Closed)
  const camps: Camp[] = [
    {
      id: 'camp-1',
      name: 'Dadu Central Flood Shelter',
      district: 'Dadu',
      capacity: 350,
      current_families: 285,
      status: 'Open',
      created_at: pastDay(14),
      updated_at: pastDay(1),
    },
    {
      id: 'camp-2',
      name: 'Mehar Bypass Tent City',
      district: 'Dadu',
      capacity: 220,
      current_families: 220, // Full
      status: 'Full',
      created_at: pastDay(12),
      updated_at: pastDay(2),
    },
    {
      id: 'camp-3',
      name: 'Badin Coastal Relief Base',
      district: 'Badin',
      capacity: 450,
      current_families: 390,
      status: 'Open',
      created_at: pastDay(15),
      updated_at: pastDay(3),
    },
    {
      id: 'camp-4',
      name: 'Larkana Degree College Camp',
      district: 'Larkana',
      capacity: 500,
      current_families: 420,
      status: 'Open',
      created_at: pastDay(18),
      updated_at: pastDay(1),
    },
    {
      id: 'camp-5',
      name: 'Thatta Makli Relief Ground',
      district: 'Thatta',
      capacity: 300,
      current_families: 240,
      status: 'Open',
      created_at: pastDay(10),
      updated_at: pastDay(2),
    },
    {
      id: 'camp-6',
      name: 'Sukkur Barrage Camp 1',
      district: 'Sukkur',
      capacity: 600,
      current_families: 510,
      status: 'Open',
      created_at: pastDay(20),
      updated_at: pastDay(1),
    },
    {
      id: 'camp-7',
      name: 'Hyderabad Sports Complex Camp',
      district: 'Hyderabad',
      capacity: 400,
      current_families: 310,
      status: 'Open',
      created_at: pastDay(16),
      updated_at: pastDay(4),
    },
    {
      id: 'camp-8',
      name: 'Kotri Flood Basin Camp',
      district: 'Hyderabad',
      capacity: 150,
      current_families: 0, // Closed due to floodwaters
      status: 'Closed',
      created_at: pastDay(16),
      updated_at: pastDay(5),
    },
  ];

  // 2. INVENTORY (12 items across multiple categories; 3 low-stock items)
  const inventory: InventoryItem[] = [
    {
      id: 'inv-1',
      name: 'Water Purification Tablets (Strip/50)',
      category: 'Clean Water',
      unit: 'packets',
      stock: 450,
      reorder_level: 200,
      created_at: pastDay(20),
      updated_at: pastDay(1),
    },
    {
      id: 'inv-2',
      name: 'Clean Drinking Water Cans (20L)',
      category: 'Clean Water',
      unit: 'litres',
      stock: 1200,
      reorder_level: 500,
      created_at: pastDay(20),
      updated_at: pastDay(2),
    },
    {
      id: 'inv-3',
      name: 'Family Ration Packs (Flour, Rice, Pulses, Oil)',
      category: 'Food',
      unit: 'kits',
      stock: 180,
      reorder_level: 100,
      created_at: pastDay(20),
      updated_at: pastDay(1),
    },
    {
      id: 'inv-4',
      name: 'High Energy Biscuits (Carton/100)',
      category: 'Food',
      unit: 'boxes',
      stock: 320,
      reorder_level: 150,
      created_at: pastDay(19),
      updated_at: pastDay(3),
    },
    {
      id: 'inv-5',
      name: 'Oral Rehydration Salts (ORS Sachets)',
      category: 'Medicine',
      unit: 'packets',
      stock: 80, // LOW STOCK (<= 150)
      reorder_level: 150,
      created_at: pastDay(20),
      updated_at: pastDay(1),
    },
    {
      id: 'inv-6',
      name: 'Emergency Medical & Antibiotic First Aid Kits',
      category: 'Medicine',
      unit: 'kits',
      stock: 35, // LOW STOCK (<= 50)
      reorder_level: 50,
      created_at: pastDay(18),
      updated_at: pastDay(2),
    },
    {
      id: 'inv-7',
      name: 'Weatherproof Heavy-Duty Family Tents',
      category: 'Shelter',
      unit: 'pieces',
      stock: 22, // LOW STOCK (<= 40)
      reorder_level: 40,
      created_at: pastDay(20),
      updated_at: pastDay(1),
    },
    {
      id: 'inv-8',
      name: 'Waterproof Ground Plastic Tarpaulins',
      category: 'Shelter',
      unit: 'pieces',
      stock: 190,
      reorder_level: 80,
      created_at: pastDay(15),
      updated_at: pastDay(3),
    },
    {
      id: 'inv-9',
      name: 'Family Hygiene & Antiseptic Soap Kits',
      category: 'Hygiene',
      unit: 'kits',
      stock: 210,
      reorder_level: 120,
      created_at: pastDay(17),
      updated_at: pastDay(2),
    },
    {
      id: 'inv-10',
      name: 'Anti-Malarial Long-Lasting Mosquito Nets',
      category: 'Hygiene',
      unit: 'pieces',
      stock: 340,
      reorder_level: 150,
      created_at: pastDay(16),
      updated_at: pastDay(2),
    },
    {
      id: 'inv-11',
      name: 'Thermal Blankets & Bedding Wraps',
      category: 'Clothing',
      unit: 'blankets',
      stock: 280,
      reorder_level: 100,
      created_at: pastDay(19),
      updated_at: pastDay(1),
    },
    {
      id: 'inv-12',
      name: 'Emergency Solar Lanterns with Phone Charger',
      category: 'Other',
      unit: 'pieces',
      stock: 140,
      reorder_level: 60,
      created_at: pastDay(14),
      updated_at: pastDay(4),
    },
  ];

  // 3. NEEDS (20 needs linked to camps and items; at least 3 High priority with < 40% fulfilment)
  // Note: Delivered dispatches below contribute to fulfilled_quantity
  const needs: CampNeed[] = [
    // 1. Critical gap: Dadu ORS need (High priority, 20% fulfilled)
    {
      id: 'need-1',
      camp_id: 'camp-1',
      inventory_item_id: 'inv-5', // ORS
      required_quantity: 250,
      priority: 'High',
      fulfilled_quantity: 50, // 20% (< 40%)
      created_at: pastDay(10),
      updated_at: pastDay(2),
    },
    // 2. Critical gap: Badin Tents need (High priority, 16.7% fulfilled)
    {
      id: 'need-2',
      camp_id: 'camp-3',
      inventory_item_id: 'inv-7', // Tents
      required_quantity: 60,
      priority: 'High',
      fulfilled_quantity: 10, // 16.7% (< 40%)
      created_at: pastDay(12),
      updated_at: pastDay(3),
    },
    // 3. Critical gap: Larkana Medical Kits need (High priority, 25% fulfilled)
    {
      id: 'need-3',
      camp_id: 'camp-4',
      inventory_item_id: 'inv-6', // Med kits
      required_quantity: 40,
      priority: 'High',
      fulfilled_quantity: 10, // 25% (< 40%)
      created_at: pastDay(8),
      updated_at: pastDay(1),
    },
    // 4. Critical gap: Thatta Water Tablets (High priority, 30% fulfilled)
    {
      id: 'need-4',
      camp_id: 'camp-5',
      inventory_item_id: 'inv-1', // Water tablets
      required_quantity: 300,
      priority: 'High',
      fulfilled_quantity: 90, // 30% (< 40%)
      created_at: pastDay(9),
      updated_at: pastDay(2),
    },
    // 5. Moderate fulfilment: Dadu Ration packs (High priority, 66.7% fulfilled)
    {
      id: 'need-5',
      camp_id: 'camp-1',
      inventory_item_id: 'inv-3', // Ration
      required_quantity: 150,
      priority: 'High',
      fulfilled_quantity: 100, // 66.7%
      created_at: pastDay(11),
      updated_at: pastDay(4),
    },
    // 6. Mehar bypass camp needs
    {
      id: 'need-6',
      camp_id: 'camp-2',
      inventory_item_id: 'inv-2', // Clean water
      required_quantity: 500,
      priority: 'Medium',
      fulfilled_quantity: 350,
      created_at: pastDay(10),
      updated_at: pastDay(3),
    },
    {
      id: 'need-7',
      camp_id: 'camp-2',
      inventory_item_id: 'inv-9', // Hygiene kits
      required_quantity: 100,
      priority: 'Medium',
      fulfilled_quantity: 80,
      created_at: pastDay(9),
      updated_at: pastDay(2),
    },
    // 7. Badin camp needs
    {
      id: 'need-8',
      camp_id: 'camp-3',
      inventory_item_id: 'inv-10', // Mosquito nets
      required_quantity: 200,
      priority: 'High',
      fulfilled_quantity: 140, // 70%
      created_at: pastDay(14),
      updated_at: pastDay(5),
    },
    {
      id: 'need-9',
      camp_id: 'camp-3',
      inventory_item_id: 'inv-3', // Food ration
      required_quantity: 250,
      priority: 'High',
      fulfilled_quantity: 180,
      created_at: pastDay(13),
      updated_at: pastDay(4),
    },
    // 8. Larkana needs
    {
      id: 'need-10',
      camp_id: 'camp-4',
      inventory_item_id: 'inv-11', // Thermal blankets
      required_quantity: 200,
      priority: 'Medium',
      fulfilled_quantity: 150,
      created_at: pastDay(10),
      updated_at: pastDay(3),
    },
    {
      id: 'need-11',
      camp_id: 'camp-4',
      inventory_item_id: 'inv-4', // Biscuits
      required_quantity: 150,
      priority: 'Low',
      fulfilled_quantity: 150, // 100%
      created_at: pastDay(12),
      updated_at: pastDay(6),
    },
    // 9. Thatta needs
    {
      id: 'need-12',
      camp_id: 'camp-5',
      inventory_item_id: 'inv-8', // Tarpaulins
      required_quantity: 100,
      priority: 'Medium',
      fulfilled_quantity: 60,
      created_at: pastDay(8),
      updated_at: pastDay(2),
    },
    {
      id: 'need-13',
      camp_id: 'camp-5',
      inventory_item_id: 'inv-12', // Solar lanterns
      required_quantity: 50,
      priority: 'Low',
      fulfilled_quantity: 25,
      created_at: pastDay(7),
      updated_at: pastDay(1),
    },
    // 10. Sukkur Barrage needs
    {
      id: 'need-14',
      camp_id: 'camp-6',
      inventory_item_id: 'inv-1', // Water tablets
      required_quantity: 400,
      priority: 'High',
      fulfilled_quantity: 250,
      created_at: pastDay(15),
      updated_at: pastDay(4),
    },
    {
      id: 'need-15',
      camp_id: 'camp-6',
      inventory_item_id: 'inv-5', // ORS
      required_quantity: 200,
      priority: 'High',
      fulfilled_quantity: 120,
      created_at: pastDay(14),
      updated_at: pastDay(2),
    },
    {
      id: 'need-16',
      camp_id: 'camp-6',
      inventory_item_id: 'inv-3', // Ration
      required_quantity: 300,
      priority: 'High',
      fulfilled_quantity: 220,
      created_at: pastDay(16),
      updated_at: pastDay(5),
    },
    // 11. Hyderabad Sports Complex needs
    {
      id: 'need-17',
      camp_id: 'camp-7',
      inventory_item_id: 'inv-9', // Hygiene
      required_quantity: 150,
      priority: 'Medium',
      fulfilled_quantity: 100,
      created_at: pastDay(11),
      updated_at: pastDay(3),
    },
    {
      id: 'need-18',
      camp_id: 'camp-7',
      inventory_item_id: 'inv-11', // Blankets
      required_quantity: 120,
      priority: 'Low',
      fulfilled_quantity: 80,
      created_at: pastDay(10),
      updated_at: pastDay(4),
    },
    {
      id: 'need-19',
      camp_id: 'camp-7',
      inventory_item_id: 'inv-2', // Drinking water
      required_quantity: 400,
      priority: 'Medium',
      fulfilled_quantity: 300,
      created_at: pastDay(9),
      updated_at: pastDay(2),
    },
    // 20. Dadu Secondary Need
    {
      id: 'need-20',
      camp_id: 'camp-1',
      inventory_item_id: 'inv-8', // Tarpaulins
      required_quantity: 80,
      priority: 'Medium',
      fulfilled_quantity: 50,
      created_at: pastDay(7),
      updated_at: pastDay(1),
    },
  ];

  // 4. DISPATCHES (10 dispatches with coherent accounting across Pending, In Transit, Delivered, Cancelled)
  // In our model: Delivered dispatches already increased fulfilled_quantity in needs above.
  // Pending and In Transit dispatches hold active reservations.
  const dispatches: Dispatch[] = [
    {
      id: 'disp-1',
      camp_id: 'camp-1',
      need_id: 'need-1', // ORS need (50 fulfilled, 250 required)
      quantity: 30, // Currently reserving 30
      status: 'Pending',
      created_at: pastDay(1),
      updated_at: pastDay(1),
      delivered_at: null,
      cancelled_at: null,
    },
    {
      id: 'disp-2',
      camp_id: 'camp-3',
      need_id: 'need-2', // Tents need (10 fulfilled, 60 required)
      quantity: 12, // Currently in transit
      status: 'In Transit',
      created_at: pastDay(2),
      updated_at: pastDay(1),
      delivered_at: null,
      cancelled_at: null,
    },
    {
      id: 'disp-3',
      camp_id: 'camp-4',
      need_id: 'need-3', // Med kit need (10 fulfilled, 40 required)
      quantity: 10,
      status: 'Delivered', // Accounted in need-3 fulfilled (10)
      created_at: pastDay(5),
      updated_at: pastDay(4),
      delivered_at: pastDay(4),
      cancelled_at: null,
    },
    {
      id: 'disp-4',
      camp_id: 'camp-5',
      need_id: 'need-4', // Water tablets (90 fulfilled)
      quantity: 50,
      status: 'Delivered',
      created_at: pastDay(4),
      updated_at: pastDay(3),
      delivered_at: pastDay(3),
      cancelled_at: null,
    },
    {
      id: 'disp-5',
      camp_id: 'camp-1',
      need_id: 'need-5', // Food ration (100 fulfilled)
      quantity: 40,
      status: 'Delivered',
      created_at: pastDay(6),
      updated_at: pastDay(5),
      delivered_at: pastDay(5),
      cancelled_at: null,
    },
    {
      id: 'disp-6',
      camp_id: 'camp-2',
      need_id: 'need-6', // Clean water (350 fulfilled)
      quantity: 100,
      status: 'Delivered',
      created_at: pastDay(7),
      updated_at: pastDay(6),
      delivered_at: pastDay(6),
      cancelled_at: null,
    },
    {
      id: 'disp-7',
      camp_id: 'camp-3',
      need_id: 'need-8', // Mosquito nets (140 fulfilled)
      quantity: 25,
      status: 'In Transit',
      created_at: pastDay(1),
      updated_at: pastDay(1),
      delivered_at: null,
      cancelled_at: null,
    },
    {
      id: 'disp-8',
      camp_id: 'camp-6',
      need_id: 'need-14', // Water tablets (250 fulfilled)
      quantity: 35,
      status: 'Pending',
      created_at: pastDay(1),
      updated_at: pastDay(1),
      delivered_at: null,
      cancelled_at: null,
    },
    {
      id: 'disp-9',
      camp_id: 'camp-6',
      need_id: 'need-15', // ORS need (120 fulfilled)
      quantity: 20,
      status: 'Cancelled', // Cancelled earlier, stock released
      created_at: pastDay(4),
      updated_at: pastDay(3),
      delivered_at: null,
      cancelled_at: pastDay(3),
    },
    {
      id: 'disp-10',
      camp_id: 'camp-7',
      need_id: 'need-17', // Hygiene (100 fulfilled)
      quantity: 30,
      status: 'Delivered',
      created_at: pastDay(5),
      updated_at: pastDay(4),
      delivered_at: pastDay(4),
      cancelled_at: null,
    },
  ];

  // 5. DONATIONS (10 donations, Cash & In-Kind)
  const donations: Donation[] = [
    {
      id: 'don-1',
      type: 'Cash',
      category: 'Medical Relief Fund',
      amount_or_quantity: 500000, // PKR 500,000
      item_id: null,
      donor_name: 'Sindh Diaspora Relief Trust',
      notes: 'Emergency medicines and mobile clinic support in Dadu',
      created_at: pastDay(14),
    },
    {
      id: 'don-2',
      type: 'Cash',
      category: 'General Humanitarian Aid',
      amount_or_quantity: 1250000, // PKR 1,250,000
      item_id: null,
      donor_name: 'Habib Foundation Pakistan',
      notes: 'Unrestricted flood relief allocation',
      created_at: pastDay(12),
    },
    {
      id: 'don-3',
      type: 'Cash',
      category: 'Clean Water Initiative',
      amount_or_quantity: 350000, // PKR 350,000
      item_id: null,
      donor_name: 'Karachi Philanthropists Guild',
      notes: 'Water filtration logistics and reverse osmosis support',
      created_at: pastDay(10),
    },
    {
      id: 'don-4',
      type: 'In-Kind',
      category: 'Clean Water',
      amount_or_quantity: 200, // 200 packets
      item_id: 'inv-1',
      donor_name: 'AquaSafe Pakistan Ltd',
      notes: '200 packets of water purification tablets',
      created_at: pastDay(9),
    },
    {
      id: 'don-5',
      type: 'In-Kind',
      category: 'Food',
      amount_or_quantity: 100, // 100 ration kits
      item_id: 'inv-3',
      donor_name: 'Engro Food Security Relief',
      notes: '100 family ration hampers delivered to Sukkur depot',
      created_at: pastDay(8),
    },
    {
      id: 'don-6',
      type: 'Cash',
      category: 'Child Health & Nutrition',
      amount_or_quantity: 400000, // PKR 400,000
      item_id: null,
      donor_name: 'Friends of Sindh Healthcare',
      notes: 'Pediatric rehydration solutions and mother kits',
      created_at: pastDay(7),
    },
    {
      id: 'don-7',
      type: 'In-Kind',
      category: 'Clothing',
      amount_or_quantity: 150, // 150 blankets
      item_id: 'inv-11',
      donor_name: 'Al-Khidmat Foundation',
      notes: 'Winterized thermal fleece blankets',
      created_at: pastDay(5),
    },
    {
      id: 'don-8',
      type: 'In-Kind',
      category: 'Hygiene',
      amount_or_quantity: 80, // 80 hygiene kits
      item_id: 'inv-9',
      donor_name: 'Unilever Pakistan Relief Fleet',
      notes: 'Sanitation hampers for women and children',
      created_at: pastDay(4),
    },
    {
      id: 'don-9',
      type: 'Cash',
      category: 'Shelter Reconstruction',
      amount_or_quantity: 800000, // PKR 800,000
      item_id: null,
      donor_name: 'Indus Basin Welfare Association',
      notes: 'Temporary tent city infrastructure support',
      created_at: pastDay(3),
    },
    {
      id: 'don-10',
      type: 'In-Kind',
      category: 'Hygiene',
      amount_or_quantity: 120, // 120 mosquito nets
      item_id: 'inv-10',
      donor_name: 'National Malaria Control Drive',
      notes: 'Insecticide-treated nets for Thatta and Badin',
      created_at: pastDay(2),
    },
  ];

  // 6. VOLUNTEERS (15 volunteers with 5 varied skills, mixed assignments)
  const volunteers: Volunteer[] = [
    {
      id: 'vol-1',
      name: 'Dr. Tariq Memon',
      skill: 'Medical',
      camp_id: 'camp-1', // Assigned to Dadu
      created_at: pastDay(15),
      updated_at: pastDay(10),
    },
    {
      id: 'vol-2',
      name: 'Dr. Samina Junejo',
      skill: 'Medical',
      camp_id: 'camp-4', // Assigned to Larkana
      created_at: pastDay(14),
      updated_at: pastDay(8),
    },
    {
      id: 'vol-3',
      name: 'Waqas Ali Soomro',
      skill: 'Logistics',
      camp_id: 'camp-3', // Assigned to Badin
      created_at: pastDay(12),
      updated_at: pastDay(6),
    },
    {
      id: 'vol-4',
      name: 'Farhan Bhutto',
      skill: 'Logistics',
      camp_id: 'camp-6', // Assigned to Sukkur
      created_at: pastDay(11),
      updated_at: pastDay(5),
    },
    {
      id: 'vol-5',
      name: 'Kashif Chandio',
      skill: 'Driving',
      camp_id: 'camp-1', // Assigned to Dadu
      created_at: pastDay(13),
      updated_at: pastDay(9),
    },
    {
      id: 'vol-6',
      name: 'Rasheed Solangi',
      skill: 'Driving',
      camp_id: 'camp-7', // Assigned to Hyderabad
      created_at: pastDay(10),
      updated_at: pastDay(4),
    },
    {
      id: 'vol-7',
      name: 'Mai Bakhshani',
      skill: 'Cooking',
      camp_id: 'camp-2', // Assigned to Mehar (Full camp)
      created_at: pastDay(9),
      updated_at: pastDay(3),
    },
    {
      id: 'vol-8',
      name: 'Suleman Kalhoro',
      skill: 'Cooking',
      camp_id: 'camp-5', // Assigned to Thatta
      created_at: pastDay(8),
      updated_at: pastDay(2),
    },
    {
      id: 'vol-9',
      name: 'Zahida Parveen',
      skill: 'Counselling',
      camp_id: 'camp-4', // Assigned to Larkana
      created_at: pastDay(11),
      updated_at: pastDay(7),
    },
    {
      id: 'vol-10',
      name: 'Naveed Jamali',
      skill: 'Counselling',
      camp_id: 'camp-6', // Assigned to Sukkur
      created_at: pastDay(10),
      updated_at: pastDay(5),
    },
    // Available / Unassigned volunteers (5 volunteers ready for deployment)
    {
      id: 'vol-11',
      name: 'Dr. Bilal Qureshi',
      skill: 'Medical',
      camp_id: null,
      created_at: pastDay(4),
      updated_at: pastDay(4),
    },
    {
      id: 'vol-12',
      name: 'Asadullah Rind',
      skill: 'Logistics',
      camp_id: null,
      created_at: pastDay(3),
      updated_at: pastDay(3),
    },
    {
      id: 'vol-13',
      name: 'Ghulam Mustafa Shah',
      skill: 'Driving',
      camp_id: null,
      created_at: pastDay(2),
      updated_at: pastDay(2),
    },
    {
      id: 'vol-14',
      name: 'Farzana Brohi',
      skill: 'Cooking',
      camp_id: null,
      created_at: pastDay(2),
      updated_at: pastDay(2),
    },
    {
      id: 'vol-15',
      name: 'Mehwish Laghari',
      skill: 'Counselling',
      camp_id: null,
      created_at: pastDay(1),
      updated_at: pastDay(1),
    },
  ];

  return { camps, inventory, needs, dispatches, donations, volunteers };
}
