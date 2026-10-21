import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(process.env.SUPABASE_URL, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const crops = [
  ['Wheat', 'گندم', 'Grains', 4100], ['Rice', 'چاول', 'Grains', 5200],
  ['Tomato', 'ٹماٹر', 'Vegetables', 2400], ['Onion', 'پیاز', 'Vegetables', 2800],
  ['Mango', 'آم', 'Fruits', 6000], ['Banana', 'کیلا', 'Fruits', 3200],
  ['Cotton', 'کپاس', 'Cash Crops', 8500], ['Red Chilli', 'سرخ مرچ', 'Spices', 11000],
];
const markets = [
  ['Hyderabad Mandi', 'حیدرآباد منڈی', 'Hyderabad', 0],
  ['Sukkur Mandi', 'سکھر منڈی', 'Sukkur', 140],
  ['Mirpurkhas Mandi', 'میرپورخاص منڈی', 'Mirpurkhas', -90],
];
const users = [
  ['Ali Raza', '03001234567', 'Hyderabad', 'Farmer'],
  ['Fatima Bibi', '03111234567', 'Sukkur', 'Farmer'],
  ['Ghulam Mustafa', '03221234567', 'Mirpurkhas', 'Farmer'],
  ['Sana Ahmed', '03331234567', 'Hyderabad', 'Farmer'],
  ['Bilal Traders', '03441234567', 'Karachi', 'Buyer'],
  ['Mehran Foods', '03551234567', 'Sukkur', 'Buyer'],
];

function isoDate(offset = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

async function insert(table, rows) {
  const { data, error } = await supabase.from(table).insert(rows).select();
  if (error) throw error;
  return data;
}

async function clear() {
  for (const table of ['alerts', 'listings', 'prices', 'markets', 'crops', 'users']) {
    const { error } = await supabase.from(table).delete().gt('id', 0);
    if (error) throw error;
  }
}

async function seed() {
  if (!process.env.SUPABASE_URL || !secretKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required');
  }
  await clear();
  const cropRows = await insert('crops', crops.map(([name, name_ur, category]) => ({ name, name_ur, category })));
  const marketRows = await insert('markets', markets.map(([name, name_ur, district]) => ({ name, name_ur, district })));
  const userRows = await insert('users', users.map(([name, phone, district, role]) => ({ name, phone, district, role })));

  const prices = [];
  cropRows.forEach((crop, cropIndex) => marketRows.forEach((market, marketIndex) => {
    for (let day = 0; day < 14; day += 1) {
      prices.push({
        crop_id: crop.id,
        market_id: market.id,
        date: isoDate(day - 13),
        price: crops[cropIndex][3] + markets[marketIndex][3]
          + (((day * 7 + (cropIndex + 1) * 3 + (marketIndex + 1) * 5) % 9) - 4) * 20,
      });
    }
  }));
  await insert('prices', prices);

  const [u1, u2, u3, u4] = userRows;
  const listingSpecs = [
    [u1, 0, 50, 4200, 'Hyderabad', 'A', 0, 'Active'], [u1, 2, 30, 2350, 'Hyderabad', 'B', 1, 'Active'],
    [u1, 6, 20, 8800, 'Hyderabad', 'A', 2, 'Sold'], [u2, 1, 45, 5250, 'Sukkur', 'A', 0, 'Active'],
    [u2, 3, 25, 2650, 'Sukkur', 'B', 1, 'Active'], [u2, 5, 35, 3100, 'Sukkur', 'C', 3, 'Active'],
    [u3, 4, 60, 6150, 'Mirpurkhas', 'A', 0, 'Active'], [u3, 7, 15, 10800, 'Mirpurkhas', 'A', 2, 'Active'],
    [u3, 2, 40, 2500, 'Mirpurkhas', 'B', 1, 'Sold'], [u4, 0, 70, 3950, 'Hyderabad', 'B', 0, 'Active'],
    [u4, 6, 28, 8400, 'Hyderabad', 'A', 4, 'Active'], [u4, 7, 18, 11500, 'Hyderabad', 'C', 2, 'Active'],
  ];
  await insert('listings', listingSpecs.map(([user, cropIndex, quantity, asking_price, district, grade, offset, status]) => ({
    user_id: user.id, crop_id: cropRows[cropIndex].id, quantity, asking_price, district, grade,
    available_from: isoDate(offset), contact_phone: user.phone, status,
  })));
  await insert('alerts', [
    { user_id: u1.id, crop_id: cropRows[0].id, market_id: marketRows[0].id, condition: 'Above', target_price: 4000, active_status: true },
    { user_id: u1.id, crop_id: cropRows[2].id, market_id: marketRows[1].id, condition: 'Below', target_price: 2500, active_status: true },
    { user_id: u2.id, crop_id: cropRows[1].id, market_id: marketRows[1].id, condition: 'Above', target_price: 5400, active_status: true },
    { user_id: u3.id, crop_id: cropRows[4].id, market_id: marketRows[2].id, condition: 'Above', target_price: 6200, active_status: false },
    { user_id: u4.id, crop_id: cropRows[7].id, market_id: marketRows[0].id, condition: 'Below', target_price: 11200, active_status: true },
  ]);
  console.log('Seeded 8 crops, 3 markets, 336 prices, 6 users, 12 listings and 5 alerts.');
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
