// KisanMandi Seed Data Generator
// Run: node seed.js
// WARNING: This will overwrite db.json completely. Run only when you want to reset data.

import { writeFileSync } from 'fs';
const fs = { writeFileSync };

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function dateStr(daysAgo) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

// ── USERS ────────────────────────────────────────────────────────────────────
const users = [
  { id: 'u1', name: 'Ali Hassan',     phone: '03001234567', district: 'Hyderabad',  role: 'farmer' },
  { id: 'u2', name: 'Fatima Bibi',    phone: '03112345678', district: 'Sukkur',     role: 'farmer' },
  { id: 'u3', name: 'Muhammad Raza',  phone: '03213456789', district: 'Larkana',    role: 'farmer' },
  { id: 'u4', name: 'Zainab Soomro',  phone: '03334567890', district: 'Mirpurkhas', role: 'buyer'  },
  { id: 'u5', name: 'Ghulam Nabi',    phone: '03445678901', district: 'Nawabshah',  role: 'farmer' },
  { id: 'u6', name: 'Saira Memon',    phone: '03556789012', district: 'Hyderabad',  role: 'buyer'  },
];

// ── CROPS ─────────────────────────────────────────────────────────────────────
const crops = [
  { id: 'c1', name: 'Wheat',      category: 'Grains',      unit: 'maund' },
  { id: 'c2', name: 'Rice',       category: 'Grains',      unit: 'maund' },
  { id: 'c3', name: 'Cotton',     category: 'Cash Crops',  unit: 'maund' },
  { id: 'c4', name: 'Sugarcane',  category: 'Cash Crops',  unit: 'maund' },
  { id: 'c5', name: 'Onion',      category: 'Vegetables',  unit: 'maund' },
  { id: 'c6', name: 'Tomato',     category: 'Vegetables',  unit: 'maund' },
  { id: 'c7', name: 'Mango',      category: 'Fruits',      unit: 'maund' },
  { id: 'c8', name: 'Banana',     category: 'Fruits',      unit: 'dozen' },
];

// ── MARKETS ───────────────────────────────────────────────────────────────────
const markets = [
  { id: 'm1', name: 'Hyderabad Sabzi Mandi',  district: 'Hyderabad'  },
  { id: 'm2', name: 'Sukkur Anaj Mandi',      district: 'Sukkur'     },
  { id: 'm3', name: 'Larkana Fruit Market',   district: 'Larkana'    },
];

// ── PRICE GENERATOR ──────────────────────────────────────────────────────────
// Base prices (PKR per unit) per crop at each market with slight variation
const basePrices = {
  c1: { m1: 1800, m2: 1750, m3: 1820 },
  c2: { m1: 2800, m2: 2850, m3: 2780 },
  c3: { m1: 8500, m2: 8400, m3: 8600 },
  c4: { m1:  420, m2:  410, m3:  430 },
  c5: { m1: 1200, m2: 1150, m3: 1250 },
  c6: { m1:  950, m2:  900, m3:  980 },
  c7: { m1: 3200, m2: 3100, m3: 3300 },
  c8: { m1:  560, m2:  540, m3:  580 },
};

// Deterministic pseudo-random using seed
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

let prices = [];
let priceId = 1;

crops.forEach(crop => {
  markets.forEach(market => {
    let currentPrice = basePrices[crop.id][market.id];
    for (let day = 13; day >= 0; day--) {
      const seed = priceId * 37 + day * 13;
      const fluctuation = (seededRandom(seed) - 0.5) * 0.08; // ±4% daily
      currentPrice = Math.round(currentPrice * (1 + fluctuation));
      prices.push({
        id: `p${priceId}`,
        cropId: crop.id,
        marketId: market.id,
        date: dateStr(day),
        price: currentPrice,
      });
      priceId++;
    }
  });
});

// ── LISTINGS ──────────────────────────────────────────────────────────────────
function futureDate(daysFromNow) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

const listings = [
  { id: 'l1',  sellerId: 'u1', cropId: 'c1', district: 'Hyderabad',  quantity: 500,  askingPrice: 1850, grade: 'A', availableFrom: futureDate(0), contactPhone: '03001234567', status: 'active',  createdAt: new Date(TODAY.getTime() - 86400000*2).toISOString() },
  { id: 'l2',  sellerId: 'u1', cropId: 'c5', district: 'Hyderabad',  quantity: 200,  askingPrice: 1100, grade: 'B', availableFrom: futureDate(2), contactPhone: '03001234567', status: 'active',  createdAt: new Date(TODAY.getTime() - 86400000*1).toISOString() },
  { id: 'l3',  sellerId: 'u2', cropId: 'c2', district: 'Sukkur',     quantity: 300,  askingPrice: 2900, grade: 'A', availableFrom: futureDate(1), contactPhone: '03112345678', status: 'active',  createdAt: new Date(TODAY.getTime() - 86400000*3).toISOString() },
  { id: 'l4',  sellerId: 'u2', cropId: 'c3', district: 'Sukkur',     quantity: 150,  askingPrice: 8800, grade: 'A', availableFrom: futureDate(0), contactPhone: '03112345678', status: 'active',  createdAt: new Date(TODAY.getTime() - 86400000*0).toISOString() },
  { id: 'l5',  sellerId: 'u3', cropId: 'c7', district: 'Larkana',    quantity: 100,  askingPrice: 3000, grade: 'B', availableFrom: futureDate(3), contactPhone: '03213456789', status: 'active',  createdAt: new Date(TODAY.getTime() - 86400000*1).toISOString() },
  { id: 'l6',  sellerId: 'u3', cropId: 'c8', district: 'Larkana',    quantity: 400,  askingPrice:  520, grade: 'C', availableFrom: futureDate(0), contactPhone: '03213456789', status: 'active',  createdAt: new Date(TODAY.getTime() - 86400000*5).toISOString() },
  { id: 'l7',  sellerId: 'u5', cropId: 'c4', district: 'Nawabshah',  quantity: 1000, askingPrice:  440, grade: 'A', availableFrom: futureDate(5), contactPhone: '03445678901', status: 'active',  createdAt: new Date(TODAY.getTime() - 86400000*0).toISOString() },
  { id: 'l8',  sellerId: 'u5', cropId: 'c6', district: 'Nawabshah',  quantity: 250,  askingPrice:  920, grade: 'B', availableFrom: futureDate(1), contactPhone: '03445678901', status: 'active',  createdAt: new Date(TODAY.getTime() - 86400000*2).toISOString() },
  { id: 'l9',  sellerId: 'u1', cropId: 'c2', district: 'Hyderabad',  quantity: 200,  askingPrice: 2750, grade: 'C', availableFrom: futureDate(0), contactPhone: '03001234567', status: 'active',  createdAt: new Date(TODAY.getTime() - 86400000*4).toISOString() },
  { id: 'l10', sellerId: 'u3', cropId: 'c5', district: 'Larkana',    quantity: 180,  askingPrice: 1180, grade: 'A', availableFrom: futureDate(2), contactPhone: '03213456789', status: 'active',  createdAt: new Date(TODAY.getTime() - 86400000*1).toISOString() },
  { id: 'l11', sellerId: 'u2', cropId: 'c7', district: 'Sukkur',     quantity: 80,   askingPrice: 3250, grade: 'A', availableFrom: futureDate(0), contactPhone: '03112345678', status: 'sold',    createdAt: new Date(TODAY.getTime() - 86400000*7).toISOString() },
  { id: 'l12', sellerId: 'u5', cropId: 'c1', district: 'Nawabshah',  quantity: 600,  askingPrice: 1780, grade: 'B', availableFrom: futureDate(4), contactPhone: '03445678901', status: 'active',  createdAt: new Date(TODAY.getTime() - 86400000*3).toISOString() },
];

// ── ALERTS ────────────────────────────────────────────────────────────────────
const alerts = [
  { id: 'a1', userId: 'u1', cropId: 'c1', marketId: 'm1', condition: 'above', targetPrice: 1900, active: true,  triggered: false },
  { id: 'a2', userId: 'u1', cropId: 'c5', marketId: 'm1', condition: 'below', targetPrice: 1000, active: true,  triggered: false },
  { id: 'a3', userId: 'u2', cropId: 'c3', marketId: 'm2', condition: 'above', targetPrice: 9000, active: false, triggered: false },
  { id: 'a4', userId: 'u3', cropId: 'c7', marketId: 'm3', condition: 'below', targetPrice: 3500, active: true,  triggered: false },
  { id: 'a5', userId: 'u5', cropId: 'c4', marketId: 'm2', condition: 'above', targetPrice: 400,  active: true,  triggered: false },
];

// ── WRITE DB.JSON ──────────────────────────────────────────────────────────────
const db = { users, crops, markets, prices, listings, alerts };

// Verify counts
console.log('=== KisanMandi Seed Data Generator ===');
console.log(`Users:    ${users.length}   (min: 6)`);
console.log(`Crops:    ${crops.length}   (min: 8)`);
console.log(`Markets:  ${markets.length}   (min: 3)`);
console.log(`Prices:   ${prices.length} (min: 336 = 8 crops × 3 markets × 14 days)`);
console.log(`Listings: ${listings.length}  (min: 12)`);
console.log(`Alerts:   ${alerts.length}   (min: 5)`);
console.log(`Total:    ${users.length + crops.length + markets.length + prices.length + listings.length + alerts.length} (min: 369)`);
console.log('');
console.log('Date range covered:');
console.log(`  From: ${dateStr(13)}  To: ${dateStr(0)}`);
console.log('');
console.log('Writing db.json...');

fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
console.log('Done. db.json written successfully.');
console.log('');
console.log('To start the API server: npm run api');
