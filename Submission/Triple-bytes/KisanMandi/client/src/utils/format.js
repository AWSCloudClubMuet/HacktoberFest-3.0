export const money = (value) => `Rs ${Number(value || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

export function priceChange(today, yesterday) {
  const change = Number(today) - Number(yesterday);
  const percent = Number(yesterday) ? (change / Number(yesterday)) * 100 : 0;
  return { change, percent };
}

export function marketLabel(asking, average) {
  if (!average) return 'atMarket';
  const diff = (Number(asking) - Number(average)) / Number(average);
  if (Math.abs(diff) <= 0.05) return 'atMarket';
  return diff < -0.05 ? 'belowMarket' : 'aboveMarket';
}

export function localizedName(item, language) {
  return language === 'ur' ? (item?.name_ur || item?.crop_name_ur || item?.market_name_ur)
    : (item?.name || item?.crop_name || item?.market_name);
}

export const cropImages = {
  Wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=900&auto=format&fit=crop&q=85',
  Rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=900&auto=format&fit=crop&q=85',
  Tomato: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=900&auto=format&fit=crop&q=85',
  Onion: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=900&auto=format&fit=crop&q=85',
  Mango: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=900&auto=format&fit=crop&q=85',
  Banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=900&auto=format&fit=crop&q=85',
  Cotton: 'https://images.unsplash.com/photo-1594897030264-ab7d87efc473?w=900&auto=format&fit=crop&q=85',
  'Red Chilli': 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=900&auto=format&fit=crop&q=85',
};

export const cropImage = (name) => cropImages[name] || 'https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?w=900&auto=format&fit=crop&q=85';
