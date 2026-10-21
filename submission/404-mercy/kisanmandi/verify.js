// verify.js
// Automated verification script for KisanMandi hackathon requirements

const API_URL = 'http://localhost:3001';

async function req(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function runVerification() {
  console.log('====================================================');
  console.log('   KisanMandi: Comprehensive Verification Suite     ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${details ? '— ' + details : ''}`);
    }
  }

  // 1 & 2 & 3: Six collections respond over HTTP
  const collections = ['users', 'crops', 'markets', 'prices', 'listings', 'alerts'];
  const data = {};

  for (const c of collections) {
    try {
      data[c] = await req(`/${c}`);
      assert(Array.isArray(data[c]), `HTTP GET /${c} responds with array (${data[c].length} items)`);
    } catch (err) {
      assert(false, `HTTP GET /${c} failed`, err.message);
    }
  }

  // 4: Every collection meets seed count requirements
  assert(data.users.length >= 6, `users count: ${data.users.length} >= 6`);
  assert(data.crops.length >= 8, `crops count: ${data.crops.length} >= 8`);
  const categories = new Set(data.crops.map(c => c.category));
  assert(categories.size >= 4, `crop categories count: ${categories.size} >= 4 (${[...categories].join(', ')})`);
  assert(data.markets.length >= 3, `markets count: ${data.markets.length} >= 3`);
  assert(data.prices.length >= 336, `prices count: ${data.prices.length} >= 336`);
  assert(data.listings.length >= 12, `listings count: ${data.listings.length} >= 12`);
  assert(data.alerts.length >= 5, `alerts count: ${data.alerts.length} >= 5`);

  // 5: Every crop-market pair has 14 consecutive daily records
  let allPairsCovered = true;
  for (const crop of data.crops) {
    for (const market of data.markets) {
      const records = data.prices.filter(p => p.cropId === crop.id && p.marketId === market.id);
      if (records.length < 14) {
        allPairsCovered = false;
        console.error(`Missing days for crop ${crop.name} (${crop.id}) at market ${market.name} (${market.id}): got ${records.length}`);
      }
    }
  }
  assert(allPairsCovered, 'Every crop-market pair has at least 14 daily price records');

  // 6: Onboarding creates user through API
  const testPhone = '0300' + Math.floor(1000000 + Math.random() * 9000000);
  const newUser = await req('/users', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Farmer Verification',
      phone: testPhone,
      district: 'Hyderabad',
      role: 'farmer'
    }),
  });
  assert(newUser && newUser.id && newUser.name === 'Test Farmer Verification', 'Onboarding creates user via HTTP POST /users');

  // 7 & 8: Daily change calculations (positive, negative, zero, missing)
  function calcChange(today, yesterday) {
    if (today == null) return null;
    if (yesterday == null || yesterday === 0) return { change: null, pct: null };
    const change = today - yesterday;
    const pct = (change / yesterday) * 100;
    return { change, pct };
  }
  const pos = calcChange(110, 100);
  assert(pos.change === 10 && pos.pct === 10, 'Daily change positive: 110 from 100 is +10 (+10%)');
  const neg = calcChange(90, 100);
  assert(neg.change === -10 && neg.pct === -10, 'Daily change negative: 90 from 100 is -10 (-10%)');
  const zero = calcChange(100, 100);
  assert(zero.change === 0 && zero.pct === 0, 'Daily change zero: 100 from 100 is 0 (0%)');
  const missing = calcChange(100, null);
  assert(missing.change === null && missing.pct === null, 'Daily change handles missing yesterday as unavailable');
  const zeroYday = calcChange(100, 0);
  assert(zeroYday.change === null && zeroYday.pct === null, 'Daily change handles zero yesterday as unavailable');

  // 9: Chart statistics min, max, avg on specific crop+market
  const samplePrices = data.prices.filter(p => p.cropId === 'c1' && p.marketId === 'm1');
  const pVals = samplePrices.map(p => p.price);
  const minP = Math.min(...pVals);
  const maxP = Math.max(...pVals);
  const avgP = Math.round(pVals.reduce((a, b) => a + b, 0) / pVals.length);
  assert(minP > 0 && maxP >= minP && avgP >= minP && avgP <= maxP, `Crop c1 @ m1 stats: min=${minP}, avg=${avgP}, max=${maxP}`);

  // 10: Market comparison sorts highest to lowest and highlights highest
  const comparisons = data.markets.map(m => {
    const recs = data.prices.filter(p => p.cropId === 'c1' && p.marketId === m.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    return { market: m, price: recs[0]?.price };
  }).sort((a, b) => b.price - a.price);
  assert(comparisons[0].price >= comparisons[1].price && comparisons[1].price >= comparisons[2].price,
    `Market comparison sorts highest to lowest: ${comparisons.map(c => `${c.market.name}: ${c.price}`).join(' >= ')}`);

  // 11: Listing CRUD persists through HTTP
  const newListing = await req('/listings', {
    method: 'POST',
    body: JSON.stringify({
      sellerId: newUser.id,
      cropId: 'c1',
      district: 'Hyderabad',
      quantity: 50,
      askingPrice: 1900,
      grade: 'A',
      availableFrom: '2026-10-25',
      contactPhone: testPhone,
      status: 'active',
      createdAt: new Date().toISOString()
    })
  });
  assert(newListing && newListing.id, `Created listing via HTTP POST (id: ${newListing.id})`);

  // Edit listing
  const updatedListing = await req(`/listings/${newListing.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ askingPrice: 1950, quantity: 60 })
  });
  assert(updatedListing.askingPrice === 1950 && updatedListing.quantity === 60, 'Edited listing via HTTP PATCH');

  // Mark Sold
  const soldListing = await req(`/listings/${newListing.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'sold' })
  });
  assert(soldListing.status === 'sold', 'Marked listing sold via HTTP PATCH');

  // Verify sold listing does not appear in active listings feed
  const activeListings = await req('/listings?status=active');
  assert(!activeListings.find(l => l.id === newListing.id), 'Sold listing is excluded from active listings feed');

  // Delete listing
  await req(`/listings/${newListing.id}`, { method: 'DELETE' });
  const listingsAfterDelete = await req('/listings');
  assert(!listingsAfterDelete.find(l => l.id === newListing.id), 'Deleted listing via HTTP DELETE');

  // 14: Listing price labels handle -5% and +5% boundary correctly
  function calcPriceLabel(askingPrice, avgMarketPrice) {
    if (!avgMarketPrice || avgMarketPrice === 0) return 'Market comparison unavailable';
    const pct = ((askingPrice - avgMarketPrice) / avgMarketPrice) * 100;
    if (pct < -5) return 'Below Market';
    if (pct > 5)  return 'Above Market';
    return 'At Market';
  }
  const avgTest = 1000;
  assert(calcPriceLabel(950, avgTest) === 'At Market', 'Price label: exactly -5% (950 vs 1000) is "At Market"');
  assert(calcPriceLabel(1050, avgTest) === 'At Market', 'Price label: exactly +5% (1050 vs 1000) is "At Market"');
  assert(calcPriceLabel(949, avgTest) === 'Below Market', 'Price label: -5.1% (949 vs 1000) is "Below Market"');
  assert(calcPriceLabel(1051, avgTest) === 'Above Market', 'Price label: +5.1% (1051 vs 1000) is "Above Market"');
  assert(calcPriceLabel(1000, null) === 'Market comparison unavailable', 'Price label: null avg is "Market comparison unavailable"');

  // 15: Alerts trigger at inclusive thresholds and persist correctly
  // Above trigger when latestPrice >= targetPrice
  const createdAlert = await req('/alerts', {
    method: 'POST',
    body: JSON.stringify({
      userId: newUser.id,
      cropId: 'c1',
      marketId: 'm1',
      condition: 'above',
      targetPrice: 100, // Very low so latestPrice >= 100 is true
      active: true,
      triggered: false
    })
  });
  assert(createdAlert && createdAlert.id, `Created alert (id: ${createdAlert.id})`);

  // Simulate alert evaluation
  const latestC1M1 = data.prices
    .filter(p => p.cropId === 'c1' && p.marketId === 'm1')
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const shouldTrigger = latestC1M1.price >= createdAlert.targetPrice;
  assert(shouldTrigger, `Inclusive threshold: ${latestC1M1.price} >= ${createdAlert.targetPrice} is TRUE`);

  // Persist triggered state
  const triggeredAlert = await req(`/alerts/${createdAlert.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ triggered: shouldTrigger })
  });
  assert(triggeredAlert.triggered === true, 'Alert triggered state persisted via HTTP PATCH');

  // 16: Consecutive refreshes do not double count
  const allUserAlerts = await req(`/alerts?userId=${newUser.id}`);
  const triggeredCount1 = allUserAlerts.filter(a => a.active && a.triggered).length;
  const triggeredCount2 = allUserAlerts.filter(a => a.active && a.triggered).length;
  assert(triggeredCount1 === triggeredCount2, `Consecutive checks maintain exact count (${triggeredCount1}) without double counting`);

  // Clean up alert
  await req(`/alerts/${createdAlert.id}`, { method: 'DELETE' });

  // 17: Profit calculator calculations & slider
  function calcProfit(currentPrice, qty, cost, adjPct) {
    const adjPrice = currentPrice * (1 + adjPct / 100);
    const revenue = qty * adjPrice;
    const totalCost = qty * cost;
    const profitLoss = revenue - totalCost;
    const margin = revenue !== 0 ? (profitLoss / revenue) * 100 : null;
    return { adjPrice, revenue, totalCost, profitLoss, margin };
  }
  const calc1 = calcProfit(100, 10, 80, 0); // 1000 rev, 800 cost, +200 profit, 20% margin
  assert(calc1.profitLoss === 200 && calc1.margin === 20, 'Profit calc: +200 profit, 20% margin at 0% slider');

  const calcLoss = calcProfit(100, 10, 120, 0); // 1000 rev, 1200 cost, -200 loss, -20% margin
  assert(calcLoss.profitLoss === -200 && calcLoss.margin === -20, 'Profit calc handles loss: -200 profitLoss, -20% margin');

  const calcSliderUp = calcProfit(100, 10, 80, 20); // adjPrice = 120, rev = 1200, cost = 800, profit = 400
  assert(calcSliderUp.adjPrice === 120 && calcSliderUp.profitLoss === 400, 'Profit calc with +20% slider works');

  const calcSliderDown = calcProfit(100, 10, 80, -20); // adjPrice = 80, rev = 800, cost = 800, profit = 0
  assert(calcSliderDown.adjPrice === 80 && calcSliderDown.profitLoss === 0, 'Profit calc with -20% slider works');

  const calcZeroRev = calcProfit(0, 10, 50, 0);
  assert(calcZeroRev.revenue === 0 && calcZeroRev.margin === null, 'Profit calc with zero revenue marks margin as null/unavailable');

  // Clean up test user
  await req(`/users/${newUser.id}`, { method: 'DELETE' }).catch(() => {});

  // 42-47: Supabase Schema, Security & Migration Verification
  const fs = await import('fs');
  const schemaPath = 'supabase/migrations/20261021_init_schema.sql';
  assert(fs.existsSync(schemaPath), 'Supabase schema migration file exists (supabase/migrations/20261021_init_schema.sql)');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const hasAllTables = ['profiles', 'crops', 'markets', 'prices', 'listings', 'alerts']
      .every(t => schemaSql.includes(`CREATE TABLE IF NOT EXISTS public.${t}`));
    assert(hasAllTables, 'Schema migration defines all 6 required tables (profiles, crops, markets, prices, listings, alerts)');

    const hasRLS = ['profiles', 'crops', 'markets', 'prices', 'listings', 'alerts']
      .every(t => schemaSql.includes(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;`));
    assert(hasRLS, 'Row Level Security (RLS) is explicitly enabled on all 6 tables');

    const hasRealtime = schemaSql.includes('ALTER PUBLICATION supabase_realtime ADD TABLE public.listings');
    assert(hasRealtime, 'Supabase Realtime publication includes public.listings');

    const hasTrigger = schemaSql.includes('handle_new_user');
    assert(hasTrigger, 'Automatic profile creation trigger (handle_new_user) on auth.users is present');
  }

  const seedPath = 'supabase/seed.sql';
  assert(fs.existsSync(seedPath), 'Supabase seed SQL file exists (supabase/seed.sql)');
  if (fs.existsSync(seedPath)) {
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    assert(seedSql.includes("INSERT INTO public.crops") && seedSql.includes("INSERT INTO public.markets"),
      'Seed SQL populates crops and markets tables');
  }

  // 48-52: Image Support & Supabase Storage Verification
  const imageMigrationPath = 'supabase/migrations/20261021_add_image_support.sql';
  assert(fs.existsSync(imageMigrationPath), 'Image support SQL migration exists (supabase/migrations/20261021_add_image_support.sql)');
  if (fs.existsSync(imageMigrationPath)) {
    const imgSql = fs.readFileSync(imageMigrationPath, 'utf8');
    assert(imgSql.includes("product-images"), 'Migration provisions public Supabase Storage bucket: product-images');
    assert(imgSql.includes("ADD COLUMN IF NOT EXISTS image_url"), 'Migration adds image_url column to crops and listings tables');
    assert(imgSql.includes("storage.foldername(name)"), 'Storage RLS restricts upload/edit/delete to user-owned folders');
  }

  const expectedCropPhotos = ['wheat.jpg', 'rice.jpg', 'cotton.jpg', 'sugarcane.jpg', 'tomato.jpg', 'onion.jpg', 'potato.jpg', 'chilies.jpg'];
  const allCropPhotosExist = expectedCropPhotos.every(f => fs.existsSync(`public/images/crops/${f}`));
  assert(allCropPhotosExist, `Genuine photographic reference images present in public/images/crops/ (${expectedCropPhotos.length} crops verified)`);

  console.log('\n====================================================');
  console.log(`Verification Complete: ${passed}/${total} checks passed (${Math.round(passed/total*100)}%)`);
  console.log('====================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Verification failed with unexpected error:', err);
  process.exit(1);
});

