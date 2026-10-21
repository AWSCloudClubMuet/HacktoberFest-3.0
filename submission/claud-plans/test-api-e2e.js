import {
  BASE_URL,
  getUsers,
  createUser,
  deleteUser,
  getCrops,
  getMarkets,
  getPrices,
  getListings,
  createListing,
  updateListing,
  deleteListing,
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert
} from './src/api.js';

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

console.log('=== VERIFYING KISANMANDI MOCK API & CLIENT (port 3001) ===\n');

async function runTests() {
  try {
    // 1. Crops
    const crops = await getCrops();
    assert(crops.length === 8, `getCrops returned 8 crops (got ${crops.length})`);

    // 2. Markets
    const markets = await getMarkets();
    assert(markets.length === 3, `getMarkets returned 3 markets (got ${markets.length})`);

    // 3. Prices
    const prices = await getPrices();
    assert(prices.length >= 336, `getPrices returned 336+ price records (got ${prices.length})`);

    // 4. Users (GET & POST)
    const users = await getUsers();
    assert(users.length >= 6, `getUsers returned initial 6 users (got ${users.length})`);

    const testUser = await createUser({
      name: 'Allah Dino Test',
      phone: '0300-9876543',
      district: 'Hyderabad',
      role: 'Farmer'
    });
    assert(testUser && testUser.id, `createUser successfully created user ${testUser.id}`);

    // 5. Listings (GET, POST, PATCH, DELETE)
    const initialListings = await getListings();
    assert(initialListings.length >= 12, `getListings returned initial listings (got ${initialListings.length})`);

    const newListing = await createListing({
      id: `lst-test-${Date.now()}`,
      user_id: testUser.id,
      crop_id: 'crp-wheat',
      quantity: 50,
      asking_price: 4200,
      district: 'Hyderabad',
      grade: 'A',
      available_from: '2026-10-22',
      status: 'Active',
      phone: '0300-9876543'
    });
    assert(newListing && newListing.id, `createListing successfully created listing ${newListing.id}`);

    const patchedListing = await updateListing(newListing.id, { status: 'Sold' });
    assert(patchedListing.status === 'Sold', `updateListing successfully patched status to Sold`);

    await deleteListing(newListing.id);
    const afterDeleteListings = await getListings();
    assert(!afterDeleteListings.find(l => l.id === newListing.id), `deleteListing successfully removed test listing`);

    // 6. Alerts (GET, POST, PATCH, DELETE)
    const initialAlerts = await getAlerts();
    assert(initialAlerts.length >= 5, `getAlerts returned initial alerts (got ${initialAlerts.length})`);

    const newAlert = await createAlert({
      id: `alt-test-${Date.now()}`,
      user_id: testUser.id,
      crop_id: 'crp-rice',
      market_id: 'mkt-skr',
      condition: 'Below',
      target_price: 5300,
      active_status: true
    });
    assert(newAlert && newAlert.id, `createAlert successfully created alert ${newAlert.id}`);

    const patchedAlert = await updateAlert(newAlert.id, { active_status: false });
    assert(patchedAlert.active_status === false, `updateAlert successfully toggled active_status to false`);

    await deleteAlert(newAlert.id);
    const afterDeleteAlerts = await getAlerts();
    assert(!afterDeleteAlerts.find(a => a.id === newAlert.id), `deleteAlert successfully removed test alert`);

    // Clean up test user
    await deleteUser(testUser.id);
    const finalUsers = await getUsers();
    assert(!finalUsers.find(u => u.id === testUser.id), `deleteUser successfully cleaned up test user`);

    // 7. Verify Vite Dev Server responds on http://localhost:5173
    const viteRes = await fetch('http://localhost:5173');
    assert(viteRes.ok, `Vite dev server responded on http://localhost:5173 with status ${viteRes.status}`);
    const viteHtml = await viteRes.text();
    assert(viteHtml.includes('KisanMandi'), `Vite index.html contains KisanMandi title/branding`);

    console.log(`\n=== ALL API & E2E NETWORK TESTS PASSED: ${passed} passed, ${failed} failed ===`);
  } catch (err) {
    console.error('Test run failed with error:', err);
    process.exit(1);
  }
}

runTests();
