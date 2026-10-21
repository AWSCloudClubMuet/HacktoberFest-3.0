import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'db.json')
if (!fs.existsSync(dbPath)) {
  console.error('❌ db.json does not exist. Run npm run seed first.')
  process.exit(1)
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
let failed = false

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`)
    failed = true
  } else {
    console.log(`✅ PASSED: ${message}`)
  }
}

console.log('=== Verifying KisanMandi Mock API Data ===\n')

// 1. Check exact counts
assert(db.crops && db.crops.length === 8, `crops count is 8 (found ${db.crops?.length})`)
assert(db.markets && db.markets.length === 3, `markets count is 3 (found ${db.markets?.length})`)
assert(db.prices && db.prices.length === 336, `prices count is 336 (found ${db.prices?.length})`)
assert(db.users && db.users.length === 6, `users count is 6 (found ${db.users?.length})`)
assert(db.listings && db.listings.length === 12, `listings count is 12 (found ${db.listings?.length})`)
assert(db.alerts && db.alerts.length === 5, `alerts count is 5 (found ${db.alerts?.length})`)

// 2. Check no duplicate IDs in any collection
const collections = ['crops', 'markets', 'prices', 'users', 'listings', 'alerts']
collections.forEach((col) => {
  const ids = new Set()
  let hasDupes = false
  db[col].forEach((item) => {
    if (ids.has(item.id)) hasDupes = true
    ids.add(item.id)
  })
  assert(!hasDupes, `No duplicate IDs in collection '${col}' (${ids.size} unique IDs)`)
})

// 3. Check every crop–market pair has exactly 14 consecutive dates and price variation
const pairMap = new Map()
db.prices.forEach((p) => {
  const key = `${p.crop_id}_${p.market_id}`
  if (!pairMap.has(key)) pairMap.set(key, [])
  pairMap.get(key).push(p)
})

assert(pairMap.size === 24, `All 24 crop-market pairs are present (found ${pairMap.size})`)

let allConsecutive = true
let allDiffTodayYesterday = true

pairMap.forEach((records, key) => {
  if (records.length !== 14) {
    allConsecutive = false
    console.error(`Pair ${key} has ${records.length} records instead of 14`)
  }
  // Sort by date ascending
  records.sort((a, b) => a.date.localeCompare(b.date))
  for (let i = 1; i < records.length; i++) {
    const prevDate = new Date(records[i - 1].date)
    const currDate = new Date(records[i].date)
    const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24))
    if (diffDays !== 1) {
      allConsecutive = false
      console.error(`Pair ${key} dates not consecutive: ${records[i - 1].date} -> ${records[i].date}`)
    }
  }

  const yesterdayPrice = records[12].price
  const todayPrice = records[13].price
  if (yesterdayPrice === todayPrice) {
    allDiffTodayYesterday = false
    console.error(`Pair ${key} today price equals yesterday price: ${todayPrice}`)
  }
})

assert(allConsecutive, 'Every crop-market pair has exactly 14 consecutive dates with no gaps')
assert(allDiffTodayYesterday, "Today's price differs from yesterday's price for all 24 pairs")

// 4. Best market differs across crops
const bestMarketPerCrop = new Map()
db.crops.forEach((c) => {
  let bestMarketId = null
  let maxPrice = -1
  db.markets.forEach((m) => {
    const records = pairMap.get(`${c.id}_${m.id}`)
    const todayRecord = records[records.length - 1]
    if (todayRecord.price > maxPrice) {
      maxPrice = todayRecord.price
      bestMarketId = m.id
    }
  })
  bestMarketPerCrop.set(c.id, bestMarketId)
})
const uniqueBestMarkets = new Set(bestMarketPerCrop.values())
assert(uniqueBestMarkets.size >= 2, `Best market differs across crops (${uniqueBestMarkets.size} unique best markets)`)

// 5. Listings checks:
// - 10 Active, 2 Sold
const activeListings = db.listings.filter((l) => l.status === 'Active')
const soldListings = db.listings.filter((l) => l.status === 'Sold')
assert(activeListings.length === 10, `Active listings count is 10 (found ${activeListings.length})`)
assert(soldListings.length === 2, `Sold listings count is 2 (found ${soldListings.length})`)

// - at least 5 different crops
const listingCrops = new Set(db.listings.map((l) => l.crop_id))
assert(listingCrops.size >= 5, `Listings span at least 5 crops (found ${listingCrops.size})`)

// - grades A/B/C mixed
const listingGrades = new Set(db.listings.map((l) => l.grade))
assert(listingGrades.has('A') && listingGrades.has('B') && listingGrades.has('C'), 'Listings contain grades A, B, and C')

// - at least 4 different farmers
const farmerIds = new Set(db.users.filter((u) => u.role === 'Farmer').map((u) => u.id))
const listingFarmers = new Set(db.listings.map((l) => l.user_id).filter((uid) => farmerIds.has(uid)))
assert(listingFarmers.size >= 4, `Listings belong to at least 4 farmers (found ${listingFarmers.size})`)

// - asking prices mixed: Below (< -5%), At (within ±5%), Above (> +5%)
// calculate market avg per crop today
const cropAvgToday = {}
db.crops.forEach((c) => {
  let sum = 0
  db.markets.forEach((m) => {
    const recs = pairMap.get(`${c.id}_${m.id}`)
    sum += recs[recs.length - 1].price
  })
  cropAvgToday[c.id] = sum / db.markets.length
})

let hasBelow = false
let hasAt = false
let hasAbove = false

db.listings.forEach((l) => {
  const avg = cropAvgToday[l.crop_id]
  const pctDiff = ((l.asking_price - avg) / avg) * 100
  if (pctDiff < -5) hasBelow = true
  else if (pctDiff <= 5) hasAt = true
  else hasAbove = true
})
assert(hasBelow && hasAt && hasAbove, 'Market labels have Below (< -5%), At (±5%), and Above (> +5%) asking prices')

// 6. Alerts checks:
// - 4 active, 1 inactive
const activeAlerts = db.alerts.filter((a) => a.active_status === true)
const inactiveAlerts = db.alerts.filter((a) => a.active_status === false)
assert(activeAlerts.length === 4, `Active alerts count is 4 (found ${activeAlerts.length})`)
assert(inactiveAlerts.length === 1, `Inactive alerts count is 1 (found ${inactiveAlerts.length})`)

// - At least 2 active alerts currently triggered
let triggeredCount = 0
activeAlerts.forEach((a) => {
  const recs = pairMap.get(`${a.crop_id}_${a.market_id}`)
  const latestPrice = recs[recs.length - 1].price
  const isTriggered = a.condition === 'Above' ? latestPrice >= a.target_price : latestPrice <= a.target_price
  if (isTriggered) triggeredCount++
})

assert(triggeredCount >= 2, `At least 2 active alerts are triggered (found ${triggeredCount})`)
assert(activeAlerts.length - triggeredCount >= 1, `At least 1 active alert is not triggered (found ${activeAlerts.length - triggeredCount})`)

console.log('\n==========================================')
if (failed) {
  console.error('❌ Verification failed with one or more errors.')
  process.exit(1)
} else {
  console.log('🎉 All verification checks passed successfully!')
  process.exit(0)
}
