import { writeFile } from 'node:fs/promises';

const crops = [
  { id: 'crp-wheat', name: 'Wheat', category: 'Grain' },
  { id: 'crp-rice', name: 'Rice', category: 'Grain' },
  { id: 'crp-cotton', name: 'Cotton', category: 'Cash Crop' },
  { id: 'crp-sugarcane', name: 'Sugarcane', category: 'Cash Crop' },
  { id: 'crp-onion', name: 'Onion', category: 'Vegetable' },
  { id: 'crp-tomato', name: 'Tomato', category: 'Vegetable' },
  { id: 'crp-mango', name: 'Mango', category: 'Fruit' },
  { id: 'crp-banana', name: 'Banana', category: 'Fruit' }
];

const markets = [
  { id: 'mkt-hyd', name: 'Hyderabad Mandi', district: 'Hyderabad' },
  { id: 'mkt-skr', name: 'Sukkur Mandi', district: 'Sukkur' },
  { id: 'mkt-khi', name: 'Karachi Sabzi Mandi', district: 'Karachi' }
];

const users = [
  { id: 'usr-1', name: 'Ghulam Rasool', phone: '0300-1234501', district: 'Hyderabad', role: 'Farmer' },
  { id: 'usr-2', name: 'Noor Muhammad', phone: '0300-1234502', district: 'Sukkur', role: 'Farmer' },
  { id: 'usr-3', name: 'Rais Ali', phone: '0300-1234503', district: 'Mirpur Khas', role: 'Farmer' },
  { id: 'usr-4', name: 'Sana Bibi', phone: '0300-1234504', district: 'Nawabshah', role: 'Farmer' },
  { id: 'usr-5', name: 'Tariq Ahmed', phone: '0300-1234505', district: 'Karachi', role: 'Buyer' },
  { id: 'usr-6', name: 'Ayesha Memon', phone: '0300-1234506', district: 'Hyderabad', role: 'Buyer' }
];

const today = new Date();
today.setHours(0, 0, 0, 0);
const formatDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const todayString = formatDate(today);
const dateOffset = (daysAgo) => {
  const date = new Date(today);
  date.setDate(date.getDate() - daysAgo);
  return formatDate(date);
};
const basePrices = [4000, 5200, 8500, 900, 3200, 4500, 7200, 3800];
const marketFactors = [1, 1.035, 0.975];
const prices = [];

for (const [cropIndex, crop] of crops.entries()) {
  for (const [marketIndex, market] of markets.entries()) {
    let price = Math.round(basePrices[cropIndex] * marketFactors[marketIndex]);
    const pairPrices = [];

    for (let daysAgo = 13; daysAgo >= 0; daysAgo -= 1) {
      if (daysAgo !== 13) {
        const movement = Math.round((Math.random() * 0.06 - 0.03) * price);
        price = Math.max(1, price + (movement || (Math.random() < 0.5 ? -1 : 1)));
      }
      pairPrices.push({
        id: `price-${crop.id}-${market.id}-${dateOffset(daysAgo)}`,
        crop_id: crop.id,
        market_id: market.id,
        date: dateOffset(daysAgo),
        price
      });
    }

    const latest = pairPrices.at(-1);
    const previous = pairPrices.at(-2);
    if (latest.price === previous.price) {
      latest.price += 1;
    }
    prices.push(...pairPrices);
  }
}

const priceAverage = (cropId) => {
  const latest = prices.filter((price) => price.crop_id === cropId && price.date === todayString);
  return latest.reduce((total, price) => total + price.price, 0) / latest.length;
};

const farmers = users.filter((user) => user.role === 'Farmer');
const grades = ['A', 'B', 'C'];
const listings = Array.from({ length: 12 }, (_, index) => {
  const crop = crops[index % crops.length];
  const farmer = farmers[index % farmers.length];
  const average = priceAverage(crop.id);
  const adjustment = [-0.12, -0.07, -0.03, 0, 0.03, 0.07, 0.12][index % 7];
  const available = new Date(today);
  available.setDate(available.getDate() + (index % 3));

  return {
    id: `lst-${String(index + 1).padStart(3, '0')}`,
    user_id: farmer.id,
    crop_id: crop.id,
    quantity: 20 + index * 5,
    asking_price: Math.round(average * (1 + adjustment)),
    district: farmer.district,
    grade: grades[index % grades.length],
    available_from: formatDate(available),
    status: index < 2 ? 'Sold' : 'Active'
  };
});

const wheatHyderabad = prices.find(
  (price) => price.crop_id === 'crp-wheat' && price.market_id === 'mkt-hyd' && price.date === todayString
);
const riceSukkur = prices.find(
  (price) => price.crop_id === 'crp-rice' && price.market_id === 'mkt-skr' && price.date === todayString
);
const alerts = [
  { id: 'alt-1', user_id: 'usr-1', crop_id: 'crp-wheat', market_id: 'mkt-hyd', condition: 'Above', target_price: wheatHyderabad.price - 1, active_status: true },
  { id: 'alt-2', user_id: 'usr-2', crop_id: 'crp-rice', market_id: 'mkt-skr', condition: 'Below', target_price: riceSukkur.price + 1, active_status: true },
  { id: 'alt-3', user_id: 'usr-3', crop_id: 'crp-cotton', market_id: 'mkt-khi', condition: 'Above', target_price: 9000, active_status: true },
  { id: 'alt-4', user_id: 'usr-4', crop_id: 'crp-onion', market_id: 'mkt-hyd', condition: 'Below', target_price: 2500, active_status: false },
  { id: 'alt-5', user_id: 'usr-1', crop_id: 'crp-mango', market_id: 'mkt-khi', condition: 'Above', target_price: 8000, active_status: true }
];

const database = { users, crops, markets, prices, listings, alerts };

await Promise.all([
  writeFile(
    new URL('./db.json', import.meta.url),
    `${JSON.stringify(database, null, 2)}\n`
  ),
  writeFile(
    new URL('./mock-api/db.json', import.meta.url),
    `${JSON.stringify(database, null, 2)}\n`
  )
]);
console.log(`Seeded ${prices.length} prices through ${todayString} to db.json and mock-api/db.json.`);
