import { Crop, Market, User, Listing, Alert, PriceRecord } from '../types';

export const SEED_USERS: User[] = [
  {
    id: 'user-01',
    displayName: 'Wadero Ali Nawaz',
    role: 'farmer',
    district: 'Hyderabad',
    phone: '0300-1234001',
    createdAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'user-02',
    displayName: 'Bachal Khan Brohi',
    role: 'farmer',
    district: 'Mirpur Khas',
    phone: '0301-2345002',
    createdAt: '2026-10-02T11:00:00Z',
  },
  {
    id: 'user-03',
    displayName: 'Gulzar Ahmed Soomro',
    role: 'farmer',
    district: 'Sukkur',
    phone: '0302-3456003',
    createdAt: '2026-10-03T09:30:00Z',
  },
  {
    id: 'user-04',
    displayName: 'Tariq Mehmood Traders',
    role: 'buyer',
    district: 'Hyderabad',
    phone: '0333-4567004',
    createdAt: '2026-10-04T14:15:00Z',
  },
  {
    id: 'user-05',
    displayName: 'Sajjad Agro Commodities',
    role: 'buyer',
    district: 'Sukkur',
    phone: '0334-5678005',
    createdAt: '2026-10-05T16:00:00Z',
  },
  {
    id: 'user-06',
    displayName: 'Mumtaz Wholesale Mandi',
    role: 'buyer',
    district: 'Mirpur Khas',
    phone: '0335-6789006',
    createdAt: '2026-10-06T12:00:00Z',
  },
];

export const SEED_CROPS: Crop[] = [
  {
    id: 'crop-wheat',
    name: 'Wheat (گندم)',
    sindhiName: 'ڪڻڪ',
    category: 'Grains',
    unit: 'PKR per 40 kg',
    symbol: '🌾',
    description: 'Sindh staple golden grain, fresh harvest sample data.',
    isActive: true,
  },
  {
    id: 'crop-rice',
    name: 'Basmati Rice (چانوَن)',
    sindhiName: 'چانور',
    category: 'Grains',
    unit: 'PKR per 40 kg',
    symbol: '🍚',
    description: 'Long-grain aromatic rice cultivated across northern & central Sindh.',
    isActive: true,
  },
  {
    id: 'crop-cotton',
    name: 'Seed Cotton / Phutti (ڪپھ)',
    sindhiName: 'ڪپهه',
    category: 'Cash Crops',
    unit: 'PKR per 40 kg',
    symbol: '☁️',
    description: 'High-grade Sindh cotton crop vital for local textile ginneries.',
    isActive: true,
  },
  {
    id: 'crop-sugarcane',
    name: 'Sugarcane (ڪمند)',
    sindhiName: 'ڪمند',
    category: 'Cash Crops',
    unit: 'PKR per 40 kg',
    symbol: '🎋',
    description: 'Juicy commercial canes supplying mills across Lower & Upper Sindh.',
    isActive: true,
  },
  {
    id: 'crop-onion',
    name: 'Red Onion (بصر)',
    sindhiName: 'بصر',
    category: 'Vegetables',
    unit: 'PKR per 40 kg',
    symbol: '🧅',
    description: 'Pungent red onion crop harvested extensively in southern Sindh.',
    isActive: true,
  },
  {
    id: 'crop-tomato',
    name: 'Farm Tomato (ٽماٽر)',
    sindhiName: 'ٽماٽر',
    category: 'Vegetables',
    unit: 'PKR per 40 kg',
    symbol: '🍅',
    description: 'Crisp field-grown tomatoes with fluctuating daily market prices.',
    isActive: true,
  },
  {
    id: 'crop-chilli',
    name: 'Red Chilli (ڳاڙهي مرچ)',
    sindhiName: 'ڳاڙهي مرچ',
    category: 'Spices',
    unit: 'PKR per 40 kg',
    symbol: '🌶️',
    description: 'Famous Kunri / Mirpur Khas sun-dried premium red chillies.',
    isActive: true,
  },
  {
    id: 'crop-mango',
    name: 'Sindhri Mango (سنڌڙي انب)',
    sindhiName: 'سنڌڙي انب',
    category: 'Fruits',
    unit: 'PKR per 40 kg',
    symbol: '🥭',
    description: 'Queen of mangoes from Mirpur Khas and Tando Allahyar orchards.',
    isActive: true,
  },
];

export const SEED_MARKETS: Market[] = [
  {
    id: 'market-hyd',
    name: 'Hyderabad Mandi',
    sindhiName: 'حيدرآباد منڊي',
    district: 'Hyderabad',
    province: 'Sindh',
    isActive: true,
    distanceKmApprox: 0,
  },
  {
    id: 'market-suk',
    name: 'Sukkur Grain & Fruit Market',
    sindhiName: 'سکر اَن ۽ ميوو مارڪيٽ',
    district: 'Sukkur',
    province: 'Sindh',
    isActive: true,
    distanceKmApprox: 310,
  },
  {
    id: 'market-mpk',
    name: 'Mirpur Khas Agricultural Market',
    sindhiName: 'ميرپورخاص زراعت منڊي',
    district: 'Mirpur Khas',
    province: 'Sindh',
    isActive: true,
    distanceKmApprox: 68,
  },
];

// Helper to generate exactly 14 consecutive days of prices (8 crops × 3 markets × 14 days = 336 records)
export const DATES_14_DAYS = [
  '2026-10-08',
  '2026-10-09',
  '2026-10-10',
  '2026-10-11',
  '2026-10-12',
  '2026-10-13',
  '2026-10-14',
  '2026-10-15',
  '2026-10-16',
  '2026-10-17',
  '2026-10-18',
  '2026-10-19',
  '2026-10-20',
  '2026-10-21',
];

// Realistic base prices & market offsets (Hyderabad baseline, Sukkur +/- 2%, Mirpur Khas +/- 3%)
const CROP_BASE_PRICES: Record<string, { base: number; wave: number[] }> = {
  'crop-wheat': {
    base: 4150,
    wave: [4080, 4100, 4120, 4140, 4130, 4150, 4180, 4200, 4190, 4220, 4250, 4270, 4260, 4300],
  },
  'crop-rice': {
    base: 5100,
    wave: [4980, 5020, 5050, 5030, 5080, 5120, 5150, 5180, 5160, 5200, 5240, 5280, 5290, 5320],
  },
  'crop-cotton': {
    base: 8400,
    wave: [8250, 8300, 8320, 8280, 8350, 8400, 8450, 8500, 8480, 8550, 8600, 8650, 8620, 8700],
  },
  'crop-sugarcane': {
    base: 480,
    wave: [465, 470, 472, 475, 474, 478, 480, 482, 485, 488, 490, 492, 495, 500],
  },
  'crop-onion': {
    base: 3100,
    wave: [3350, 3300, 3250, 3220, 3180, 3150, 3120, 3080, 3050, 3020, 2980, 2950, 2920, 2900],
  },
  'crop-tomato': {
    base: 2200,
    wave: [2400, 2350, 2280, 2250, 2300, 2350, 2380, 2320, 2260, 2200, 2150, 2100, 2140, 2180],
  },
  'crop-chilli': {
    base: 18500,
    wave: [18100, 18200, 18250, 18350, 18400, 18500, 18550, 18600, 18700, 18750, 18850, 18900, 18950, 19100],
  },
  'crop-mango': {
    base: 6800,
    wave: [6500, 6550, 6600, 6650, 6700, 6750, 6800, 6820, 6880, 6900, 6950, 7000, 7050, 7100],
  },
};

const MARKET_VARIATION: Record<string, number> = {
  'market-hyd': 0,      // Baseline
  'market-suk': 40,     // Northern trade hub slightly higher for grains, lower for mangoes
  'market-mpk': -30,    // Origin market for chillies/mangoes, slightly lower freight cost
};

// Generate exactly 336 price records (8 crops × 3 markets × 14 dates)
export function generateSeedPrices(): PriceRecord[] {
  const records: PriceRecord[] = [];

  SEED_CROPS.forEach((crop) => {
    const cropConfig = CROP_BASE_PRICES[crop.id] || {
      base: 3000,
      wave: [3000, 3020, 3040, 3030, 3050, 3060, 3080, 3100, 3120, 3110, 3130, 3150, 3140, 3160],
    };

    SEED_MARKETS.forEach((market) => {
      const marketOffset = MARKET_VARIATION[market.id] || 0;

      DATES_14_DAYS.forEach((date, dayIdx) => {
        const baseDayPrice = cropConfig.wave[dayIdx];
        // add slight realistic difference per market
        let adjustedPrice = baseDayPrice + marketOffset;
        if (crop.id === 'crop-chilli' && market.id === 'market-mpk') {
          adjustedPrice -= 150; // origin market discount
        }
        if (crop.id === 'crop-mango' && market.id === 'market-mpk') {
          adjustedPrice -= 100; // orchard direct hub
        }
        if (crop.id === 'crop-sugarcane') {
          // keep integer for sugarcane
          adjustedPrice = Math.round(adjustedPrice);
        }

        records.push({
          id: `price-${crop.id}-${market.id}-${date}`,
          cropId: crop.id,
          marketId: market.id,
          date,
          price: Math.max(10, Math.round(adjustedPrice)),
          unit: crop.unit,
          sourceLabel: 'Fictional demo data — Sindh Agri Mandi simulation',
        });
      });
    });
  });

  return records;
}

export const SEED_PRICES: PriceRecord[] = generateSeedPrices();

export const SEED_LISTINGS: Listing[] = [
  {
    id: 'listing-01',
    sellerId: 'user-01',
    cropId: 'crop-wheat',
    quantity: 250,
    unit: '40 kg',
    grade: 'Export Quality',
    askingPricePerUnit: 4250,
    marketId: 'market-hyd',
    district: 'Hyderabad',
    description: 'Clean amber wheat harvested from Tando Jam irrigated farmlands. Moisture checked, dry and sound grains ready for pickup.',
    contactMethod: 'Demo Phone: 0300-1234001',
    status: 'available',
    createdAt: '2026-10-18T09:30:00Z',
    updatedAt: '2026-10-18T09:30:00Z',
  },
  {
    id: 'listing-02',
    sellerId: 'user-01',
    cropId: 'crop-onion',
    quantity: 400,
    unit: '40 kg',
    grade: 'Grade A',
    askingPricePerUnit: 2850,
    marketId: 'market-hyd',
    district: 'Hyderabad',
    description: 'Medium-to-large sorted red onions from Matli belt. Bagged in breathable red mesh 40kg sacks.',
    contactMethod: 'Demo Phone: 0300-1234001',
    status: 'available',
    createdAt: '2026-10-19T08:15:00Z',
    updatedAt: '2026-10-19T08:15:00Z',
  },
  {
    id: 'listing-03',
    sellerId: 'user-02',
    cropId: 'crop-chilli',
    quantity: 80,
    unit: '40 kg',
    grade: 'Export Quality',
    askingPricePerUnit: 18800,
    marketId: 'market-mpk',
    district: 'Mirpur Khas',
    description: 'Authentic Longi sun-dried red chillies from Kunri area. Vibrant red color and high heat index.',
    contactMethod: 'Demo Phone: 0301-2345002',
    status: 'available',
    createdAt: '2026-10-19T11:00:00Z',
    updatedAt: '2026-10-19T11:00:00Z',
  },
  {
    id: 'listing-04',
    sellerId: 'user-02',
    cropId: 'crop-mango',
    quantity: 120,
    unit: '40 kg',
    grade: 'Grade A',
    askingPricePerUnit: 7000,
    marketId: 'market-mpk',
    district: 'Mirpur Khas',
    description: 'Freshly crated Sindhri mangoes from certified orchard in Tando Allahyar border. Naturally ripened.',
    contactMethod: 'Demo Phone: 0301-2345002',
    status: 'reserved',
    createdAt: '2026-10-17T14:20:00Z',
    updatedAt: '2026-10-18T10:00:00Z',
  },
  {
    id: 'listing-05',
    sellerId: 'user-03',
    cropId: 'crop-rice',
    quantity: 350,
    unit: '40 kg',
    grade: 'Grade A',
    askingPricePerUnit: 5350,
    marketId: 'market-suk',
    district: 'Sukkur',
    description: 'Super Basmati paddy grain harvested in northern canal command. Uniform length and zero chalkiness.',
    contactMethod: 'Demo Phone: 0302-3456003',
    status: 'available',
    createdAt: '2026-10-19T13:45:00Z',
    updatedAt: '2026-10-19T13:45:00Z',
  },
  {
    id: 'listing-06',
    sellerId: 'user-03',
    cropId: 'crop-cotton',
    quantity: 150,
    unit: '40 kg',
    grade: 'Export Quality',
    askingPricePerUnit: 8750,
    marketId: 'market-suk',
    district: 'Sukkur',
    description: 'Clean first-pick Phutti seed cotton with minimal leaf trash. High micronaire rating ready for ginning.',
    contactMethod: 'Demo Phone: 0302-3456003',
    status: 'available',
    createdAt: '2026-10-20T07:10:00Z',
    updatedAt: '2026-10-20T07:10:00Z',
  },
  {
    id: 'listing-07',
    sellerId: 'user-01',
    cropId: 'crop-tomato',
    quantity: 180,
    unit: '40 kg',
    grade: 'Standard',
    askingPricePerUnit: 2150,
    marketId: 'market-hyd',
    district: 'Hyderabad',
    description: 'Fresh farm-plucked firm tomatoes, packed in standard 40kg wooden/plastic crates.',
    contactMethod: 'Demo Phone: 0300-1234001',
    status: 'available',
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'listing-08',
    sellerId: 'user-02',
    cropId: 'crop-sugarcane',
    quantity: 900,
    unit: '40 kg',
    grade: 'Standard',
    askingPricePerUnit: 495,
    marketId: 'market-mpk',
    district: 'Mirpur Khas',
    description: 'High recovery sweet cane harvested near digri canal. Ready for trolley transport to local crushing mills.',
    contactMethod: 'Demo Phone: 0301-2345002',
    status: 'sold',
    createdAt: '2026-10-15T09:00:00Z',
    updatedAt: '2026-10-17T16:00:00Z',
  },
  {
    id: 'listing-09',
    sellerId: 'user-03',
    cropId: 'crop-wheat',
    quantity: 180,
    unit: '40 kg',
    grade: 'Grade B',
    askingPricePerUnit: 4180,
    marketId: 'market-suk',
    district: 'Sukkur',
    description: 'Local desi wheat variety suitable for commercial flour milling or poultry feed stock.',
    contactMethod: 'Demo Phone: 0302-3456003',
    status: 'available',
    createdAt: '2026-10-19T16:30:00Z',
    updatedAt: '2026-10-19T16:30:00Z',
  },
  {
    id: 'listing-10',
    sellerId: 'user-01',
    cropId: 'crop-cotton',
    quantity: 220,
    unit: '40 kg',
    grade: 'Grade A',
    askingPricePerUnit: 8600,
    marketId: 'market-hyd',
    district: 'Hyderabad',
    description: 'Dry stored cotton bales, moisture under 8.5%. Farm gate dispatch available.',
    contactMethod: 'Demo Phone: 0300-1234001',
    status: 'available',
    createdAt: '2026-10-20T11:20:00Z',
    updatedAt: '2026-10-20T11:20:00Z',
  },
  {
    id: 'listing-11',
    sellerId: 'user-02',
    cropId: 'crop-onion',
    quantity: 300,
    unit: '40 kg',
    grade: 'Grade B',
    askingPricePerUnit: 2800,
    marketId: 'market-mpk',
    district: 'Mirpur Khas',
    description: 'Bulk farm stock onion from Jhudo tehsil. Excellent storability.',
    contactMethod: 'Demo Phone: 0301-2345002',
    status: 'reserved',
    createdAt: '2026-10-18T15:00:00Z',
    updatedAt: '2026-10-19T12:00:00Z',
  },
  {
    id: 'listing-12',
    sellerId: 'user-03',
    cropId: 'crop-rice',
    quantity: 500,
    unit: '40 kg',
    grade: 'Export Quality',
    askingPricePerUnit: 5400,
    marketId: 'market-suk',
    district: 'Sukkur',
    description: 'Aged Basmati grain with superb elongation ratio. Ideal for wholesale food grain distributors.',
    contactMethod: 'Demo Phone: 0302-3456003',
    status: 'available',
    createdAt: '2026-10-20T14:00:00Z',
    updatedAt: '2026-10-20T14:00:00Z',
  },
];

export const SEED_ALERTS: Alert[] = [
  {
    id: 'alert-01',
    userId: 'user-01',
    cropId: 'crop-wheat',
    marketId: 'market-hyd',
    condition: 'above',
    targetPrice: 4250,
    isEnabled: true,
    lastEvaluatedPrice: 4300,
    lastTriggeredAt: '2026-10-21T06:00:00Z',
    createdAt: '2026-10-18T08:00:00Z',
  },
  {
    id: 'alert-02',
    userId: 'user-01',
    cropId: 'crop-onion',
    marketId: 'market-hyd',
    condition: 'below',
    targetPrice: 3000,
    isEnabled: true,
    lastEvaluatedPrice: 2900,
    lastTriggeredAt: '2026-10-21T06:00:00Z',
    createdAt: '2026-10-19T09:30:00Z',
  },
  {
    id: 'alert-03',
    userId: 'user-02',
    cropId: 'crop-chilli',
    marketId: 'market-mpk',
    condition: 'above',
    targetPrice: 19000,
    isEnabled: true,
    lastEvaluatedPrice: 18950,
    lastTriggeredAt: null,
    createdAt: '2026-10-19T10:15:00Z',
  },
  {
    id: 'alert-04',
    userId: 'user-02',
    cropId: 'crop-cotton',
    marketId: 'market-mpk',
    condition: 'above',
    targetPrice: 8650,
    isEnabled: true,
    lastEvaluatedPrice: 8670,
    lastTriggeredAt: '2026-10-21T06:00:00Z',
    createdAt: '2026-10-20T08:45:00Z',
  },
  {
    id: 'alert-05',
    userId: 'user-03',
    cropId: 'crop-rice',
    marketId: 'market-suk',
    condition: 'below',
    targetPrice: 5200,
    isEnabled: false,
    lastEvaluatedPrice: 5360,
    lastTriggeredAt: null,
    createdAt: '2026-10-17T11:00:00Z',
  },
];
