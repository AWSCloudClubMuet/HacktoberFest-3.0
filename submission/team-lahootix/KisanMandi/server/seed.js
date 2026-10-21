import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Seeded PRNG (mulberry32) for deterministic pseudo-random generation
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = mulberry32(133742)

function randomRange(min, max) {
  return min + rng() * (max - min)
}

function formatDate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function generateSeedData() {
  // 1. Crops: 8 crops, 4 categories
  const crops = [
    { id: 1, name: 'Wheat', category: 'Grains', base: 4000 },
    { id: 2, name: 'Rice (IRRI-6)', category: 'Grains', base: 5200 },
    { id: 3, name: 'Cotton (Phutti)', category: 'Cash Crops', base: 8300 },
    { id: 4, name: 'Onion', category: 'Vegetables', base: 3000 },
    { id: 5, name: 'Tomato', category: 'Vegetables', base: 2600 },
    { id: 6, name: 'Potato', category: 'Vegetables', base: 2200 },
    { id: 7, Sindhri: true, name: 'Sindhri Mango', category: 'Fruits', base: 6500 },
    { id: 8, name: 'Banana', category: 'Fruits', base: 3800 },
  ].map(({ base, Sindhri, ...crop }) => crop)

  const cropBases = {
    1: 4000,
    2: 5200,
    3: 8300,
    4: 3000,
    5: 2600,
    6: 2200,
    7: 6500,
    8: 3800,
  }

  // 2. Markets: 3 markets in different districts
  const markets = [
    { id: 1, name: 'Hyderabad Sabzi Mandi', district: 'Hyderabad' },
    { id: 2, name: 'Sukkur Wholesale Mandi', district: 'Sukkur' },
    { id: 3, name: 'Mirpurkhas Fruit & Grain Mandi', district: 'Mirpurkhas' },
  ]

  // 3. Users: 6 fictional users (4 Farmers, 2 Buyers)
  const users = [
    { id: 1, name: 'Ali Raza Memon', phone: '03001230001', district: 'Hyderabad', role: 'Farmer' },
    { id: 2, name: 'Sanam Bheel', phone: '03001230002', district: 'Mirpurkhas', role: 'Farmer' },
    { id: 3, name: 'Ghulam Hussain Soomro', phone: '03001230003', district: 'Sukkur', role: 'Farmer' },
    { id: 4, name: 'Noor Fatima Shaikh', phone: '03001230004', district: 'Hyderabad', role: 'Buyer' },
    { id: 5, name: 'Imran Chandio', phone: '03001230005', district: 'Larkana', role: 'Buyer' },
    { id: 6, name: 'Zainab Khaskheli', phone: '03001230006', district: 'Jamshoro', role: 'Farmer' },
  ]

  // 4. Prices: 14 consecutive days ending today for 8 crops * 3 markets = 336 records
  // We want to ensure the best market differs across crops:
  // e.g. crop 1 -> market 1 best, crop 2 -> market 2 best, crop 3 -> market 3 best, etc.
  const marketMultipliers = {
    1: [1.05, 0.97, 1.01], // Crop 1 best in M1
    2: [0.97, 1.05, 0.99], // Crop 2 best in M2
    3: [0.99, 0.96, 1.06], // Crop 3 best in M3
    4: [1.04, 0.98, 1.01], // Crop 4 best in M1
    5: [0.96, 1.05, 0.98], // Crop 5 best in M2
    6: [1.00, 0.96, 1.05], // Crop 6 best in M3
    7: [0.98, 0.97, 1.06], // Crop 7 best in M3
    8: [1.05, 0.98, 0.99], // Crop 8 best in M1
  }

  const today = new Date()
  const dates = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    dates.push(formatDate(d))
  }

  const prices = []
  let priceId = 1

  // Map to store latest prices per crop-market pair for listings/alerts
  const latestPriceMap = {} // key: `${crop_id}_${market_id}` -> price
  const todayPricesByCrop = {} // key: crop_id -> [prices in all markets]

  for (const crop of crops) {
    todayPricesByCrop[crop.id] = []
    const base = cropBases[crop.id]
    const multipliers = marketMultipliers[crop.id]

    for (let mIdx = 0; mIdx < markets.length; mIdx++) {
      const market = markets[mIdx]
      const marketFactor = multipliers[mIdx]

      // Starting price for day 0
      let currentPrice = base * marketFactor
      const pairPrices = []

      for (let dayIdx = 0; dayIdx < 14; dayIdx++) {
        const date = dates[dayIdx]

        if (dayIdx > 0) {
          // Bounded random walk: daily change -3% to +3%
          const pctChange = randomRange(-0.03, 0.03)
          currentPrice = currentPrice * (1 + pctChange)

          // Clamp within ±15% of base
          const minAllowed = base * 0.85
          const maxAllowed = base * 1.15
          if (currentPrice < minAllowed) currentPrice = minAllowed
          if (currentPrice > maxAllowed) currentPrice = maxAllowed
        }

        let roundedPrice = Math.round(currentPrice / 10) * 10

        // Guarantee today's price (dayIdx === 13) differs from yesterday's (dayIdx === 12)
        if (dayIdx === 13 && pairPrices.length > 0) {
          const yesterdayPrice = pairPrices[12].price
          if (roundedPrice === yesterdayPrice) {
            roundedPrice = rng() > 0.5 ? yesterdayPrice + 20 : yesterdayPrice - 20
          }
        }

        const priceRecord = {
          id: priceId++,
          crop_id: crop.id,
          market_id: market.id,
          date,
          price: roundedPrice,
        }

        prices.push(priceRecord)
        pairPrices.push(priceRecord)

        if (dayIdx === 13) {
          latestPriceMap[`${crop.id}_${market.id}`] = roundedPrice
          todayPricesByCrop[crop.id].push(roundedPrice)
        }
      }
    }
  }

  // Calculate market average for each crop on today
  const marketAvgByCrop = {}
  for (const crop of crops) {
    const list = todayPricesByCrop[crop.id]
    const sum = list.reduce((a, b) => a + b, 0)
    marketAvgByCrop[crop.id] = Math.round(sum / list.length)
  }

  // 5. Listings: 12 (10 Active, 2 Sold), >= 5 crops, grades A/B/C mixed, >= 4 farmers
  // Asking prices deliberately mixed:
  // - Below market (< -5%)
  // - At market (within ±5%)
  // - Above market (> +5%)
  // available_from >= today for Active ones, created_at spread over the last 5 days
  const todayStr = dates[13]

  function getISODatetimeAgo(daysAgo, hourOffset = 0) {
    const d = new Date(today)
    d.setDate(today.getDate() - daysAgo)
    d.setHours(9 + hourOffset, 15, 0, 0)
    return d.toISOString()
  }

  function getAvailableFrom(daysAhead) {
    const d = new Date(today)
    d.setDate(today.getDate() + daysAhead)
    return formatDate(d)
  }

  // 12 listings specifications:
  // Crops used: 1 (Wheat), 2 (Rice), 3 (Cotton), 4 (Onion), 5 (Tomato), 7 (Sindhri Mango) -> 6 crops!
  // Farmers used: 1, 2, 3, 6 -> 4 farmers!
  // Positions:
  // Below (< -5%): e.g. -8% to -10%
  // At ([-5%, +5%]): e.g. -2%, 0%, +2%
  // Above (> +5%): e.g. +7% to +10%
  const listingConfigs = [
    // Farmer 1 (Ali Raza Memon, Hyderabad)
    { userId: 1, cropId: 1, qty: 50, grade: 'A', status: 'Active', pos: 'At', deltaPct: 0.01, availDays: 0, daysAgo: 1, district: 'Hyderabad' },
    { userId: 1, cropId: 4, qty: 80, grade: 'B', status: 'Active', pos: 'Below', deltaPct: -0.08, availDays: 1, daysAgo: 3, district: 'Hyderabad' },
    { userId: 1, cropId: 5, qty: 40, grade: 'A', status: 'Sold', pos: 'At', deltaPct: -0.02, availDays: -2, daysAgo: 4, district: 'Hyderabad' },

    // Farmer 2 (Sanam Bheel, Mirpurkhas)
    { userId: 2, cropId: 7, qty: 100, grade: 'A', status: 'Active', pos: 'Above', deltaPct: 0.08, availDays: 2, daysAgo: 0, district: 'Mirpurkhas' },
    { userId: 2, cropId: 1, qty: 60, grade: 'B', status: 'Active', pos: 'Below', deltaPct: -0.07, availDays: 0, daysAgo: 2, district: 'Mirpurkhas' },
    { userId: 2, cropId: 3, qty: 120, grade: 'A', status: 'Active', pos: 'At', deltaPct: 0.02, availDays: 3, daysAgo: 4, district: 'Mirpurkhas' },

    // Farmer 3 (Ghulam Hussain Soomro, Sukkur)
    { userId: 3, cropId: 2, qty: 90, grade: 'A', status: 'Active', pos: 'Above', deltaPct: 0.09, availDays: 1, daysAgo: 1, district: 'Sukkur' },
    { userId: 3, cropId: 6, qty: 110, grade: 'B', status: 'Active', pos: 'At', deltaPct: -0.01, availDays: 0, daysAgo: 2, district: 'Sukkur' },
    { userId: 3, cropId: 4, qty: 45, grade: 'C', status: 'Sold', pos: 'Below', deltaPct: -0.09, availDays: -1, daysAgo: 5, district: 'Sukkur' },

    // Farmer 6 (Zainab Khaskheli, Jamshoro)
    { userId: 6, cropId: 5, qty: 70, grade: 'B', status: 'Active', pos: 'Above', deltaPct: 0.07, availDays: 2, daysAgo: 1, district: 'Jamshoro' },
    { userId: 6, cropId: 2, qty: 55, grade: 'A', status: 'Active', pos: 'Below', deltaPct: -0.08, availDays: 0, daysAgo: 3, district: 'Jamshoro' },
    { userId: 6, cropId: 8, qty: 150, grade: 'C', status: 'Active', pos: 'At', deltaPct: 0.00, availDays: 1, daysAgo: 0, district: 'Jamshoro' },
  ]

  const listings = listingConfigs.map((cfg, idx) => {
    const marketAvg = marketAvgByCrop[cfg.cropId]
    const askingPrice = Math.round((marketAvg * (1 + cfg.deltaPct)) / 10) * 10
    const availDate = cfg.status === 'Active' ? getAvailableFrom(Math.max(0, cfg.availDays)) : getAvailableFrom(cfg.availDays)

    return {
      id: idx + 1,
      user_id: cfg.userId,
      crop_id: cfg.cropId,
      quantity: cfg.qty,
      asking_price: askingPrice,
      district: cfg.district,
      grade: cfg.grade,
      available_from: availDate,
      status: cfg.status,
      created_at: getISODatetimeAgo(cfg.daysAgo, idx),
    }
  })

  // 6. Alerts: 5 belonging to farmers, mix of Above/Below, 4 active and 1 inactive.
  // At least 2 active alerts currently triggered, at least 1 active alert not triggered.
  // Above triggers when latest >= target
  // Below triggers when latest <= target
  const alerts = [
    // Alert 1: Farmer 1, Wheat in Hyderabad. Above condition, target < latest => TRIGGERED (active)
    {
      id: 1,
      user_id: 1,
      crop_id: 1,
      market_id: 1,
      condition: 'Above',
      target_price: latestPriceMap['1_1'] - 50,
      active_status: true,
    },
    // Alert 2: Farmer 2, Onion in Hyderabad. Below condition, target > latest => TRIGGERED (active)
    {
      id: 2,
      user_id: 2,
      crop_id: 4,
      market_id: 1,
      condition: 'Below',
      target_price: latestPriceMap['4_1'] + 60,
      active_status: true,
    },
    // Alert 3: Farmer 3, Rice in Sukkur. Above condition, target > latest => NOT TRIGGERED (active)
    {
      id: 3,
      user_id: 3,
      crop_id: 2,
      market_id: 2,
      condition: 'Above',
      target_price: latestPriceMap['2_2'] + 400,
      active_status: true,
    },
    // Alert 4: Farmer 6, Tomato in Mirpurkhas. Below condition, target < latest => NOT TRIGGERED (active)
    {
      id: 4,
      user_id: 6,
      crop_id: 5,
      market_id: 3,
      condition: 'Below',
      target_price: latestPriceMap['5_3'] - 300,
      active_status: true,
    },
    // Alert 5: Farmer 1, Mango in Mirpurkhas. Inactive alert
    {
      id: 5,
      user_id: 1,
      crop_id: 7,
      market_id: 3,
      condition: 'Above',
      target_price: latestPriceMap['7_3'] - 100,
      active_status: false,
    },
  ]

  return {
    crops,
    markets,
    prices,
    users,
    listings,
    alerts,
  }
}

// Generate and write to db.json when run directly
const data = generateSeedData()
const dbPath = path.join(__dirname, 'db.json')
fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8')
console.log('✅ Seed data written successfully to', dbPath)
console.log(`Counts:
  crops: ${data.crops.length}
  markets: ${data.markets.length}
  prices: ${data.prices.length}
  users: ${data.users.length}
  listings: ${data.listings.length}
  alerts: ${data.alerts.length}`)
