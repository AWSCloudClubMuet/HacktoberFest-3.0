import {
  priceChange,
  stats14Days,
  bestMarket,
  isTriggered,
  marketLabel,
  validateListing,
  validateOwnership,
  profitCalc
} from './src/logic.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`✓ PASS: ${message}`);
  } else {
    failed++;
    console.error(`✗ FAIL: ${message}`);
  }
}

console.log('=== RUNNING KISANMANDI RULES CHEAT SHEET TESTS ===\n');

// 1. priceChange(today, yesterday)
const pc1 = priceChange(4100, 4000);
assert(pc1.amount === 100, 'priceChange amount = 100');
assert(pc1.percent === 2.5, 'priceChange percent = 2.5%');

const pc2 = priceChange(3800, 4000);
assert(pc2.amount === -200, 'priceChange amount = -200');
assert(pc2.percent === -5, 'priceChange percent = -5%');

// 2. stats14Days
const testPrices = [3800, 3900, 4000, 4100, 4200, 4000, 3950, 4050, 4150, 4250, 4300, 4100, 4000, 4200];
const stats = stats14Days(testPrices);
assert(stats.min === 3800, 'stats14Days min = 3800');
assert(stats.max === 4300, 'stats14Days max = 4300');
assert(stats.avg === 4071, `stats14Days avg = ${stats.avg} (expected 4071)`);

// 3. bestMarket
const marketEntries = [
  { market_id: 'mkt-hyd', price: 4050, name: 'Hyderabad Mandi' },
  { market_id: 'mkt-skr', price: 4200, name: 'Sukkur Mandi' },
  { market_id: 'mkt-khi', price: 4150, name: 'Karachi Sabzi Mandi' }
];
const best = bestMarket(marketEntries);
assert(best.market_id === 'mkt-skr' && best.price === 4200, 'bestMarket selects Sukkur Mandi (highest price 4200)');

// 4. isTriggered(alert, latestPrice)
const alertAbove = { condition: 'Above', target_price: 4000, active_status: true };
assert(isTriggered(alertAbove, 4100) === true, 'Alert Above triggered when latest >= target');
assert(isTriggered(alertAbove, 3900) === false, 'Alert Above NOT triggered when latest < target');

const alertBelow = { condition: 'Below', target_price: 3500, active_status: true };
assert(isTriggered(alertBelow, 3400) === true, 'Alert Below triggered when latest <= target');
assert(isTriggered(alertBelow, 3600) === false, 'Alert Below NOT triggered when latest > target');

const alertInactive = { condition: 'Above', target_price: 4000, active_status: false };
assert(isTriggered(alertInactive, 4500) === false, 'Inactive alert is NOT triggered even if price meets target');

// 5. marketLabel(asking, avg)
// avg = 4000. -5% = 3800, +5% = 4200
assert(marketLabel(4000, 4000) === 'At market', 'At market when asking equals avg');
assert(marketLabel(4150, 4000) === 'At market', 'At market when within +5% (3.75%)');
assert(marketLabel(3850, 4000) === 'At market', 'At market when within -5% (-3.75%)');
assert(marketLabel(4300, 4000) === 'Above market', 'Above market when asking > +5% (7.5%)');
assert(marketLabel(3700, 4000) === 'Below market', 'Below market when asking < -5% (-7.5%)');

// 6. validateListing(form)
// Spec: "try quantity 0, price -5, yesterday's date: each must show an error."
const yesterday = '2026-10-20';
const today = '2026-10-21';
const tomorrow = '2026-10-22';

const invalidForm = {
  crop_id: 'crp-wheat',
  quantity: 0,
  asking_price: -5,
  available_from: yesterday,
  grade: 'Z',
  phone: '',
  district: 'Hyderabad'
};
const valResult = validateListing(invalidForm, today);
assert(valResult.isValid === false, 'Invalid form fails validation');
assert(valResult.errors.quantity !== undefined, 'Quantity 0 produces error');
assert(valResult.errors.asking_price !== undefined, 'Price -5 produces error');
assert(valResult.errors.available_from !== undefined, "Yesterday's date produces error");
assert(valResult.errors.grade !== undefined, 'Invalid grade produces error');
assert(valResult.errors.phone !== undefined, 'Missing phone produces error');

const validForm = {
  crop_id: 'crp-wheat',
  quantity: 50,
  asking_price: 4100,
  available_from: tomorrow,
  grade: 'A',
  phone: '0300-1234501',
  district: 'Hyderabad'
};
const valResult2 = validateListing(validForm, today);
assert(valResult2.isValid === true, 'Valid listing passes validation');

// 7. validateOwnership(listing, currentUserId)
const ownListing = { id: 'lst-1', user_id: 'usr-1' };
assert(validateOwnership(ownListing, 'usr-1') === true, 'Ownership valid when listing.user_id === currentUserId');
assert(validateOwnership(ownListing, 'usr-2') === false, 'Ownership invalid when listing.user_id !== currentUserId');

// 8. profitCalc(qty, cost, price, slider)
// Spec: "Check before moving on: qty 100, cost 3000, price 4000: revenue 400000, cost 300000, profit 100000, margin 25%. Slider at -20% should give a loss or lower margin."
const profit1 = profitCalc(100, 3000, 4000, 0);
assert(profit1.revenue === 400000, `profitCalc revenue = ${profit1.revenue} (expected 400000)`);
assert(profit1.totalCost === 300000, `profitCalc cost = ${profit1.totalCost} (expected 300000)`);
assert(profit1.profit === 100000, `profitCalc profit = ${profit1.profit} (expected 100000)`);
assert(profit1.margin === 25, `profitCalc margin = ${profit1.margin}% (expected 25%)`);

const profitMinus20 = profitCalc(100, 3000, 4000, -20);
assert(profitMinus20.adjustedPrice === 3200, `Slider -20% adjustedPrice = ${profitMinus20.adjustedPrice} (expected 3200)`);
assert(profitMinus20.revenue === 320000, `Slider -20% revenue = ${profitMinus20.revenue} (expected 320000)`);
assert(profitMinus20.profit === 20000, `Slider -20% profit = ${profitMinus20.profit} (expected 20000)`);
assert(profitMinus20.margin === 6.25, `Slider -20% margin = ${profitMinus20.margin}% (expected 6.25%)`);

console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
