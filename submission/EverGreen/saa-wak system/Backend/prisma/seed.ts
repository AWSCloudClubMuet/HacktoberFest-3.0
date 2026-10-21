// ============================================================
// saa-wak (ساوڪ) — Prisma Seed Script
// Idempotent: safe to run multiple times
// 8 crops × 3 markets × 14 days = 336 price records
// ============================================================
import 'dotenv/config';
import { PrismaClient, UserRole, CropCategory, ListingGrade, ListingStatus, AlertCondition } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── Dates: 14 consecutive days ending today(ish) ─────────────
const BASE_DATE = new Date('2026-10-08');
const DATES: Date[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() + i);
  return d;
});

const DATE_STRINGS = DATES.map((d) => d.toISOString().slice(0, 10));

// ── Seed data definitions ─────────────────────────────────────

const USERS = [
  { id: 'user-01', email: 'farmer.ali@demo.saawak', displayName: 'Wadero Ali Nawaz', role: 'farmer' as UserRole, district: 'Hyderabad', phone: '0300-1234001' },
  { id: 'user-02', email: 'farmer.bachal@demo.saawak', displayName: 'Bachal Khan Brohi', role: 'farmer' as UserRole, district: 'Mirpur Khas', phone: '0301-2345002' },
  { id: 'user-03', email: 'farmer.gulzar@demo.saawak', displayName: 'Gulzar Ahmed Soomro', role: 'farmer' as UserRole, district: 'Sukkur', phone: '0302-3456003' },
  { id: 'user-04', email: 'buyer.tariq@demo.saawak', displayName: 'Tariq Mehmood Traders', role: 'buyer' as UserRole, district: 'Hyderabad', phone: '0333-4567004' },
  { id: 'user-05', email: 'buyer.sajjad@demo.saawak', displayName: 'Sajjad Agro Commodities', role: 'buyer' as UserRole, district: 'Sukkur', phone: '0334-5678005' },
  { id: 'user-06', email: 'buyer.mumtaz@demo.saawak', displayName: 'Mumtaz Wholesale Mandi', role: 'buyer' as UserRole, district: 'Mirpur Khas', phone: '0335-6789006' },
];

const DEMO_PASSWORD = 'Demo@1234'; // All demo users share this password

const CROPS = [
  { id: 'crop-wheat',     name: 'Wheat (گندم)',              sindhiName: 'ڪڻڪ',         category: CropCategory.Grains,    unit: 'PKR per 40 kg', symbol: '🌾', description: 'Sindh staple golden grain, fresh harvest sample data.' },
  { id: 'crop-rice',      name: 'Basmati Rice (چانوَن)',     sindhiName: 'چانور',         category: CropCategory.Grains,    unit: 'PKR per 40 kg', symbol: '🍚', description: 'Long-grain aromatic rice cultivated across northern & central Sindh.' },
  { id: 'crop-cotton',    name: 'Seed Cotton / Phutti (ڪپھ)', sindhiName: 'ڪپهه',        category: CropCategory.CashCrops, unit: 'PKR per 40 kg', symbol: '☁️', description: 'High-grade Sindh cotton crop vital for local textile ginneries.' },
  { id: 'crop-sugarcane', name: 'Sugarcane (ڪمند)',          sindhiName: 'ڪمند',          category: CropCategory.CashCrops, unit: 'PKR per 40 kg', symbol: '🎋', description: 'Juicy commercial canes supplying mills across Lower & Upper Sindh.' },
  { id: 'crop-onion',     name: 'Red Onion (بصر)',           sindhiName: 'بصر',           category: CropCategory.Vegetables, unit: 'PKR per 40 kg', symbol: '🧅', description: 'Pungent red onion crop harvested extensively in southern Sindh.' },
  { id: 'crop-tomato',    name: 'Farm Tomato (ٽماٽر)',       sindhiName: 'ٽماٽر',         category: CropCategory.Vegetables, unit: 'PKR per 40 kg', symbol: '🍅', description: 'Crisp field-grown tomatoes with fluctuating daily market prices.' },
  { id: 'crop-chilli',    name: 'Red Chilli (ڳاڙهي مرچ)',   sindhiName: 'ڳاڙهي مرچ',   category: CropCategory.Spices,    unit: 'PKR per 40 kg', symbol: '🌶️', description: 'Famous Kunri / Mirpur Khas sun-dried premium red chillies.' },
  { id: 'crop-mango',     name: 'Sindhri Mango (سنڌڙي انب)', sindhiName: 'سنڌڙي انب',  category: CropCategory.Fruits,    unit: 'PKR per 40 kg', symbol: '🥭', description: 'Queen of mangoes from Mirpur Khas and Tando Allahyar orchards.' },
];

const MARKETS = [
  { id: 'market-hyd', name: 'Hyderabad Mandi',               sindhiName: 'حيدرآباد منڊي',       district: 'Hyderabad',  province: 'Sindh', distanceKmApprox: 0 },
  { id: 'market-suk', name: 'Sukkur Grain & Fruit Market',   sindhiName: 'سکر اَن ۽ ميوو مارڪيٽ', district: 'Sukkur',    province: 'Sindh', distanceKmApprox: 310 },
  { id: 'market-mpk', name: 'Mirpur Khas Agricultural Market', sindhiName: 'ميرپورخاص زراعت منڊي', district: 'Mirpur Khas', province: 'Sindh', distanceKmApprox: 68 },
];

// Price waves — 14 day series per crop (Hyderabad baseline)
const PRICE_WAVES: Record<string, number[]> = {
  'crop-wheat':     [4080, 4100, 4120, 4140, 4130, 4150, 4180, 4200, 4190, 4220, 4250, 4270, 4260, 4300],
  'crop-rice':      [4980, 5020, 5050, 5030, 5080, 5120, 5150, 5180, 5160, 5200, 5240, 5280, 5290, 5320],
  'crop-cotton':    [8250, 8300, 8320, 8280, 8350, 8400, 8450, 8500, 8480, 8550, 8600, 8650, 8620, 8700],
  'crop-sugarcane': [465,  470,  472,  475,  474,  478,  480,  482,  485,  488,  490,  492,  495,  500],
  'crop-onion':     [3350, 3300, 3250, 3220, 3180, 3150, 3120, 3080, 3050, 3020, 2980, 2950, 2920, 2900],
  'crop-tomato':    [2400, 2350, 2280, 2250, 2300, 2350, 2380, 2320, 2260, 2200, 2150, 2100, 2140, 2180],
  'crop-chilli':    [18100,18200,18250,18350,18400,18500,18550,18600,18700,18750,18850,18900,18950,19100],
  'crop-mango':     [6500, 6550, 6600, 6650, 6700, 6750, 6800, 6820, 6880, 6900, 6950, 7000, 7050, 7100],
};

const MARKET_OFFSET: Record<string, number> = {
  'market-hyd': 0,
  'market-suk': 40,
  'market-mpk': -30,
};

function buildPriceId(cropId: string, marketId: string, date: string): string {
  return `price-${cropId}-${marketId}-${date}`;
}

function calcPrice(cropId: string, marketId: string, dayIdx: number): number {
  const wave = PRICE_WAVES[cropId];
  const base = wave[dayIdx];
  let p = base + (MARKET_OFFSET[marketId] || 0);
  if (cropId === 'crop-chilli' && marketId === 'market-mpk') p -= 150;
  if (cropId === 'crop-mango' && marketId === 'market-mpk') p -= 100;
  return Math.max(10, Math.round(p));
}

// ── Main seed function ────────────────────────────────────────

async function main() {
  console.log('🌱 Starting saa-wak seed...');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // ── Users ──────────────────────────────────────────────────
  console.log('  Seeding users...');
  for (const u of USERS) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: { displayName: u.displayName, district: u.district, phone: u.phone, role: u.role },
      create: { ...u, passwordHash },
    });
  }
  console.log(`  ✓ ${USERS.length} users`);

  // ── Crops ──────────────────────────────────────────────────
  console.log('  Seeding crops...');
  for (const c of CROPS) {
    await prisma.crop.upsert({
      where: { id: c.id },
      update: { name: c.name, sindhiName: c.sindhiName, category: c.category, unit: c.unit, symbol: c.symbol, description: c.description },
      create: { ...c, isActive: true },
    });
  }
  console.log(`  ✓ ${CROPS.length} crops (${[...new Set(CROPS.map((c) => c.category))].length} categories)`);

  // ── Markets ────────────────────────────────────────────────
  console.log('  Seeding markets...');
  for (const m of MARKETS) {
    await prisma.market.upsert({
      where: { id: m.id },
      update: { name: m.name, sindhiName: m.sindhiName, district: m.district },
      create: { ...m, isActive: true },
    });
  }
  console.log(`  ✓ ${MARKETS.length} markets`);

  // ── Prices (336 records) ───────────────────────────────────
  console.log('  Seeding 336 price records...');
  let priceCount = 0;
  for (const crop of CROPS) {
    for (const market of MARKETS) {
      for (let i = 0; i < DATES.length; i++) {
        const date = DATES[i];
        const dateStr = DATE_STRINGS[i];
        const priceId = buildPriceId(crop.id, market.id, dateStr);
        const price = calcPrice(crop.id, market.id, i);

        await prisma.price.upsert({
          where: { id: priceId },
          update: { price },
          create: {
            id: priceId,
            cropId: crop.id,
            marketId: market.id,
            date,
            price,
            unit: crop.unit,
            sourceLabel: 'Fictional demo data — Sindh Agri Mandi simulation',
          },
        });
        priceCount++;
      }
    }
  }
  console.log(`  ✓ ${priceCount} price records (${CROPS.length} crops × ${MARKETS.length} markets × ${DATES.length} days)`);

  // ── Listings ───────────────────────────────────────────────
  console.log('  Seeding listings...');
  const LISTINGS = [
    { id: 'listing-01', sellerId: 'user-01', cropId: 'crop-wheat',     marketId: 'market-hyd', quantity: 250, unit: '40 kg', grade: ListingGrade.ExportQuality, askingPricePerUnit: 4250, district: 'Hyderabad',  description: 'Clean amber wheat harvested from Tando Jam irrigated farmlands. Moisture checked, dry and sound grains ready for pickup.', contactMethod: 'Demo Phone: 0300-1234001', status: ListingStatus.available },
    { id: 'listing-02', sellerId: 'user-01', cropId: 'crop-onion',     marketId: 'market-hyd', quantity: 400, unit: '40 kg', grade: ListingGrade.GradeA,        askingPricePerUnit: 2850, district: 'Hyderabad',  description: 'Medium-to-large sorted red onions from Matli belt. Bagged in breathable red mesh 40kg sacks.', contactMethod: 'Demo Phone: 0300-1234001', status: ListingStatus.available },
    { id: 'listing-03', sellerId: 'user-02', cropId: 'crop-chilli',    marketId: 'market-mpk', quantity: 80,  unit: '40 kg', grade: ListingGrade.ExportQuality, askingPricePerUnit: 18800, district: 'Mirpur Khas', description: 'Authentic Longi sun-dried red chillies from Kunri area. Vibrant red color and high heat index.', contactMethod: 'Demo Phone: 0301-2345002', status: ListingStatus.available },
    { id: 'listing-04', sellerId: 'user-02', cropId: 'crop-mango',     marketId: 'market-mpk', quantity: 120, unit: '40 kg', grade: ListingGrade.GradeA,        askingPricePerUnit: 7000, district: 'Mirpur Khas', description: 'Freshly crated Sindhri mangoes from certified orchard in Tando Allahyar border. Naturally ripened.', contactMethod: 'Demo Phone: 0301-2345002', status: ListingStatus.reserved },
    { id: 'listing-05', sellerId: 'user-03', cropId: 'crop-rice',      marketId: 'market-suk', quantity: 350, unit: '40 kg', grade: ListingGrade.GradeA,        askingPricePerUnit: 5350, district: 'Sukkur',     description: 'Super Basmati paddy grain harvested in northern canal command. Uniform length and zero chalkiness.', contactMethod: 'Demo Phone: 0302-3456003', status: ListingStatus.available },
    { id: 'listing-06', sellerId: 'user-03', cropId: 'crop-cotton',    marketId: 'market-suk', quantity: 150, unit: '40 kg', grade: ListingGrade.ExportQuality, askingPricePerUnit: 8750, district: 'Sukkur',     description: 'Clean first-pick Phutti seed cotton with minimal leaf trash. High micronaire rating ready for ginning.', contactMethod: 'Demo Phone: 0302-3456003', status: ListingStatus.available },
    { id: 'listing-07', sellerId: 'user-01', cropId: 'crop-tomato',    marketId: 'market-hyd', quantity: 180, unit: '40 kg', grade: ListingGrade.Standard,      askingPricePerUnit: 2150, district: 'Hyderabad',  description: 'Fresh farm-plucked firm tomatoes, packed in standard 40kg wooden/plastic crates.', contactMethod: 'Demo Phone: 0300-1234001', status: ListingStatus.available },
    { id: 'listing-08', sellerId: 'user-02', cropId: 'crop-sugarcane', marketId: 'market-mpk', quantity: 900, unit: '40 kg', grade: ListingGrade.Standard,      askingPricePerUnit: 495,  district: 'Mirpur Khas', description: 'High recovery sweet cane harvested near digri canal. Ready for trolley transport to local crushing mills.', contactMethod: 'Demo Phone: 0301-2345002', status: ListingStatus.sold },
    { id: 'listing-09', sellerId: 'user-03', cropId: 'crop-wheat',     marketId: 'market-suk', quantity: 180, unit: '40 kg', grade: ListingGrade.GradeB,        askingPricePerUnit: 4180, district: 'Sukkur',     description: 'Local desi wheat variety suitable for commercial flour milling or poultry feed stock.', contactMethod: 'Demo Phone: 0302-3456003', status: ListingStatus.available },
    { id: 'listing-10', sellerId: 'user-01', cropId: 'crop-cotton',    marketId: 'market-hyd', quantity: 220, unit: '40 kg', grade: ListingGrade.GradeA,        askingPricePerUnit: 8600, district: 'Hyderabad',  description: 'Dry stored cotton bales, moisture under 8.5%. Farm gate dispatch available.', contactMethod: 'Demo Phone: 0300-1234001', status: ListingStatus.available },
    { id: 'listing-11', sellerId: 'user-02', cropId: 'crop-onion',     marketId: 'market-mpk', quantity: 300, unit: '40 kg', grade: ListingGrade.GradeB,        askingPricePerUnit: 2800, district: 'Mirpur Khas', description: 'Bulk farm stock onion from Jhudo tehsil. Excellent storability.', contactMethod: 'Demo Phone: 0301-2345002', status: ListingStatus.reserved },
    { id: 'listing-12', sellerId: 'user-03', cropId: 'crop-rice',      marketId: 'market-suk', quantity: 500, unit: '40 kg', grade: ListingGrade.ExportQuality, askingPricePerUnit: 5400, district: 'Sukkur',     description: 'Aged Basmati grain with superb elongation ratio. Ideal for wholesale food grain distributors.', contactMethod: 'Demo Phone: 0302-3456003', status: ListingStatus.available },
  ];

  for (const l of LISTINGS) {
    await prisma.listing.upsert({
      where: { id: l.id },
      update: { askingPricePerUnit: l.askingPricePerUnit, status: l.status, description: l.description },
      create: l,
    });
  }
  console.log(`  ✓ ${LISTINGS.length} listings`);

  // ── Alerts ─────────────────────────────────────────────────
  console.log('  Seeding alerts...');
  const ALERTS = [
    { id: 'alert-01', userId: 'user-01', cropId: 'crop-wheat',     marketId: 'market-hyd', condition: AlertCondition.above, targetPrice: 4250, isEnabled: true,  lastEvaluatedPrice: 4300, lastTriggeredAt: new Date('2026-10-21T06:00:00Z') },
    { id: 'alert-02', userId: 'user-01', cropId: 'crop-onion',     marketId: 'market-hyd', condition: AlertCondition.below, targetPrice: 3000, isEnabled: true,  lastEvaluatedPrice: 2900, lastTriggeredAt: new Date('2026-10-21T06:00:00Z') },
    { id: 'alert-03', userId: 'user-02', cropId: 'crop-chilli',    marketId: 'market-mpk', condition: AlertCondition.above, targetPrice: 19000, isEnabled: true, lastEvaluatedPrice: 18950, lastTriggeredAt: null },
    { id: 'alert-04', userId: 'user-02', cropId: 'crop-cotton',    marketId: 'market-mpk', condition: AlertCondition.above, targetPrice: 8650, isEnabled: true,  lastEvaluatedPrice: 8670, lastTriggeredAt: new Date('2026-10-21T06:00:00Z') },
    { id: 'alert-05', userId: 'user-03', cropId: 'crop-rice',      marketId: 'market-suk', condition: AlertCondition.below, targetPrice: 5200, isEnabled: false, lastEvaluatedPrice: 5360, lastTriggeredAt: null },
  ];

  for (const a of ALERTS) {
    await prisma.alert.upsert({
      where: { id: a.id },
      update: { targetPrice: a.targetPrice, isEnabled: a.isEnabled, lastEvaluatedPrice: a.lastEvaluatedPrice, lastTriggeredAt: a.lastTriggeredAt },
      create: a,
    });
  }
  console.log(`  ✓ ${ALERTS.length} alerts`);

  console.log('\n✅ Seed complete!');
  console.log('   Demo login credentials (all users):');
  console.log(`   Password: ${DEMO_PASSWORD}`);
  console.log('   Emails:');
  USERS.forEach((u) => console.log(`     ${u.email} (${u.role})`));
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
