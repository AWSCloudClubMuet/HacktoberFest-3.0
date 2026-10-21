const fs = require('fs');
let s = 7; const R = () => (s = s * 16807 % 2147483647) / 2147483647;
const off = new Date().getTimezoneOffset() * 6e4;
const iso = d => new Date(Date.now() - d * 864e5 - off).toISOString().slice(0, 10);

const C = [['Wheat', 'Grain', 3900], ['Rice (IRRI-6)', 'Grain', 4600], ['Cotton (Phutti)', 'Cash Crop', 8200], ['Sugarcane', 'Cash Crop', 450],
['Tomato', 'Vegetable', 2600], ['Onion', 'Vegetable', 2200], ['Sindhri Mango', 'Fruit', 7200], ['Banana', 'Fruit', 3400]];
const crops = C.map((c, i) => ({ id: i + 1, name: c[0], category: c[1] }));
const markets = [
  { id: 1, name: 'Hyderabad Mandi', district: 'Hyderabad' },
  { id: 2, name: 'Sukkur Sabzi Mandi', district: 'Sukkur' },
  { id: 3, name: 'Larkana Grain Market', district: 'Larkana' }];

const prices = []; let pid = 1;
crops.forEach((c, i) => markets.forEach((m, j) => {
  let p = C[i][2] * [1, .96, 1.05][j];
  const vol = /Veg|Fruit/.test(c.category) ? .09 : .03;
  for (let d = 13; d >= 0; d--) { p *= 1 + (R() - .5) * vol; prices.push({ id: pid++, crop_id: c.id, market_id: m.id, date: iso(d), price: Math.round(p / 5) * 5 }); }
}));

const U = [['Ghulam Hussain Jatoi', 'Larkana', 'Farmer'], ['Zainab Soomro', 'Hyderabad', 'Farmer'], ['Imran Chandio', 'Sukkur', 'Farmer'],
['Mehran Shaikh', 'Jamshoro', 'Farmer'], ['Nazia Kalhoro', 'Hyderabad', 'Buyer'], ['Faraz Abro', 'Sukkur', 'Buyer']];
const users = U.map((u, i) => ({ id: i + 1, name: u[0], phone: '0300-555010' + (i + 1), district: u[1], role: u[2] }));

const farmers = users.filter(u => u.role === 'Farmer');
const avg = ci => prices.filter(p => p.crop_id === ci && p.date === iso(0)).reduce((a, p) => a + p.price, 0) / 3;
const listings = Array.from({ length: 12 }, (_, i) => {
  const u = farmers[i % 4], c = crops[(i * 3) % 8];
  return {
    id: i + 1, user_id: u.id, crop_id: c.id, quantity: 20 + (i * 13) % 80,
    asking_price: Math.round(avg(c.id) * (.88 + R() * .26) / 5) * 5, district: u.district, grade: 'ABC'[i % 3],
    available_from: iso(-(i % 5)), status: i === 11 ? 'Sold' : 'Active', contact_phone: u.phone,
    created_at: new Date(Date.now() - i * 36e5).toISOString()
  };
});

const last = (c, m) => prices.filter(p => p.crop_id === c && p.market_id === m).pop().price;
const alerts = [[1, 1, 1, 'Above', .97, true], [2, 2, 2, 'Above', 1.1, true], [2, 5, 1, 'Below', 1.05, true], [3, 3, 3, 'Below', .9, true], [4, 8, 2, 'Above', 1.02, false]]
  .map((a, i) => ({
    id: i + 1, user_id: a[0], crop_id: a[1], market_id: a[2], condition: a[3],
    target_price: Math.round(last(a[1], a[2]) * a[4] / 5) * 5, active_status: a[5]
  }));

fs.writeFileSync('db.json', JSON.stringify({ users, crops, markets, prices, listings, alerts }, null, 1));
console.log('db.json written:', { users: users.length, crops: crops.length, markets: markets.length, prices: prices.length, listings: listings.length, alerts: alerts.length });
