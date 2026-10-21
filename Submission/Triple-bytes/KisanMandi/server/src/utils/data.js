import { supabase } from '../config/supabase.js';
import { databaseError, notFound, validationError } from './errors.js';

export async function ensureExists(table, id, field) {
  const { data, error } = await supabase.from(table).select('id').eq('id', id).maybeSingle();
  if (error) throw databaseError(error);
  if (!data) throw validationError({ [field]: `${table.slice(0, -1)} does not exist` });
}

const cache = new Map();

export function cached(key, ttlMs, load) {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.promise;
  const promise = load().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, { promise, expires: Date.now() + ttlMs });
  return promise;
}

export function getLatestPriceDates() {
  return cached('price-dates', 30_000, async () => {
    const { data, error } = await supabase
      .from('prices').select('date').order('date', { ascending: false }).limit(500);
    if (error) throw databaseError(error);
    const dates = [...new Set((data ?? []).map((row) => row.date))];
    return { latest: dates[0] ?? null, previous: dates[1] ?? null };
  });
}

async function latestPricesByCrop(cropIds) {
  const ids = [...new Set(cropIds)];
  const result = new Map(ids.map((id) => [id, []]));
  if (!ids.length) return result;
  const { data, error } = await supabase
    .from('prices')
    .select('crop_id,market_id,date,price,markets(name,name_ur,district)')
    .in('crop_id', ids)
    .order('date', { ascending: false })
    .limit(1000);
  if (error) throw databaseError(error);
  const seen = new Set();
  for (const row of data ?? []) {
    const key = `${row.crop_id}:${row.market_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.get(row.crop_id)?.push(row);
  }
  return result;
}

export async function latestPricesForCrop(cropId) {
  return (await latestPricesByCrop([cropId])).get(cropId) ?? [];
}

export async function marketAverageMap(cropIds) {
  const byCrop = await cached(`avg:${[...new Set(cropIds)].sort().join(',')}`, 30_000, () => latestPricesByCrop(cropIds));
  const result = new Map();
  for (const [cropId, rows] of byCrop) {
    result.set(cropId, rows.length ? rows.reduce((sum, row) => sum + Number(row.price), 0) / rows.length : null);
  }
  return result;
}

export function serializeListing(row, average) {
  return {
    id: row.id,
    user_id: row.user_id,
    seller_name: row.users?.name ?? null,
    crop_id: row.crop_id,
    crop_name: row.crops?.name ?? null,
    crop_name_ur: row.crops?.name_ur ?? null,
    category: row.crops?.category ?? null,
    quantity: Number(row.quantity),
    asking_price: Number(row.asking_price),
    district: row.district,
    grade: row.grade,
    available_from: row.available_from,
    contact_phone: row.contact_phone,
    status: row.status,
    created_at: row.created_at,
    market_avg_price: average == null ? null : Number(average.toFixed(2)),
  };
}

export async function getListing(id) {
  const { data, error } = await supabase
    .from('listings')
    .select('*,users(name),crops(name,name_ur,category)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw databaseError(error);
  if (!data) throw notFound('Listing');
  const averages = await marketAverageMap([data.crop_id]);
  return { raw: data, serialized: serializeListing(data, averages.get(data.crop_id)) };
}

export async function serializeAlert(row) {
  const { data: priceRows, error } = await supabase
    .from('prices')
    .select('price')
    .eq('crop_id', row.crop_id)
    .eq('market_id', row.market_id)
    .order('date', { ascending: false })
    .limit(1);
  if (error) throw databaseError(error);
  return {
    id: row.id,
    user_id: row.user_id,
    crop_id: row.crop_id,
    crop_name: row.crops?.name ?? null,
    crop_name_ur: row.crops?.name_ur ?? null,
    market_id: row.market_id,
    market_name: row.markets?.name ?? null,
    market_name_ur: row.markets?.name_ur ?? null,
    condition: row.condition,
    target_price: Number(row.target_price),
    active_status: row.active_status,
    latest_price: priceRows?.length ? Number(priceRows[0].price) : null,
  };
}

export async function getAlert(id) {
  const { data, error } = await supabase
    .from('alerts')
    .select('*,crops(name,name_ur),markets(name,name_ur)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw databaseError(error);
  if (!data) throw notFound('Alert');
  return data;
}
