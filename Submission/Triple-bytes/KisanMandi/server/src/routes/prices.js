import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { databaseError, validationError } from '../utils/errors.js';
import { getLatestPriceDates, latestPricesForCrop } from '../utils/data.js';
import { parsePositiveInteger } from '../utils/validation.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const cropId = parsePositiveInteger(req.query.crop_id, 'crop_id');
    const marketId = parsePositiveInteger(req.query.market_id, 'market_id');
    const days = req.query.days == null ? 14 : parsePositiveInteger(req.query.days, 'days');
    if (days > 365) throw validationError({ days: 'Cannot be greater than 365' });
    const { data, error } = await supabase
      .from('prices')
      .select('id,crop_id,market_id,date,price')
      .eq('crop_id', cropId)
      .eq('market_id', marketId)
      .order('date', { ascending: false })
      .limit(days);
    if (error) throw databaseError(error);
    const rows = (data ?? []).reverse().map((row) => ({ ...row, price: Number(row.price) }));
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
});

router.get('/latest', async (req, res, next) => {
  try {
    const marketId = parsePositiveInteger(req.query.market_id, 'market_id');
    const { latest, previous } = await getLatestPriceDates();
    if (!latest) return res.json({ data: [] });
    const dates = previous ? [latest, previous] : [latest];
    const { data, error } = await supabase
      .from('prices')
      .select('crop_id,date,price,crops(name,name_ur,category)')
      .eq('market_id', marketId)
      .in('date', dates);
    if (error) throw databaseError(error);
    const byCrop = new Map();
    for (const row of data ?? []) {
      const item = byCrop.get(row.crop_id) ?? {
        crop_id: row.crop_id,
        crop_name: row.crops?.name ?? null,
        crop_name_ur: row.crops?.name_ur ?? null,
        category: row.crops?.category ?? null,
        date: latest,
        today_price: null,
        yesterday_price: null,
      };
      if (row.date === latest) item.today_price = Number(row.price);
      if (row.date === previous) item.yesterday_price = Number(row.price);
      byCrop.set(row.crop_id, item);
    }
    const search = String(req.query.search ?? '').trim().toLocaleLowerCase();
    const category = String(req.query.category ?? '').trim().toLocaleLowerCase();
    const result = [...byCrop.values()].filter((row) => {
      const matchesSearch = !search || row.crop_name?.toLocaleLowerCase().includes(search)
        || row.crop_name_ur?.toLocaleLowerCase().includes(search);
      const matchesCategory = !category || row.category?.toLocaleLowerCase() === category;
      return matchesSearch && matchesCategory && row.today_price != null;
    }).sort((a, b) => a.crop_id - b.crop_id);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/compare', async (req, res, next) => {
  try {
    const cropId = parsePositiveInteger(req.query.crop_id, 'crop_id');
    const rows = await latestPricesForCrop(cropId);
    const data = rows.map((row) => ({
      market_id: row.market_id,
      market_name: row.markets?.name ?? null,
      market_name_ur: row.markets?.name_ur ?? null,
      district: row.markets?.district ?? null,
      date: row.date,
      price: Number(row.price),
    })).sort((a, b) => b.price - a.price);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

export default router;
