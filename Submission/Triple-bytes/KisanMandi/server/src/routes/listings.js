import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireFarmer, requireUser } from '../middleware/auth.js';
import { ApiError, databaseError, validationError } from '../utils/errors.js';
import { ensureExists, getListing, marketAverageMap, serializeListing } from '../utils/data.js';
import { isPositiveInteger, parsePositiveInteger, validateListing } from '../utils/validation.js';

const router = Router();
const selectFields = '*,users(name),crops(name,name_ur,category)';

async function optionalUser(req, _res, next) {
  if (req.query.mine === 'true') return requireUser(req, _res, next);
  next();
}

router.get('/', optionalUser, async (req, res, next) => {
  try {
    const allowed = ['crop_id', 'district', 'grade', 'search', 'sort', 'status', 'mine'];
    const unknown = Object.keys(req.query).find((key) => !allowed.includes(key));
    if (unknown) throw validationError({ [unknown]: 'Unknown query parameter' });
    const sort = req.query.sort ?? 'newest';
    if (!['newest', 'price_asc'].includes(sort)) throw validationError({ sort: 'Must be newest or price_asc' });
    if (req.query.grade && !['A', 'B', 'C'].includes(req.query.grade)) throw validationError({ grade: 'Must be A, B or C' });
    if (req.query.status && !['Active', 'Sold'].includes(req.query.status)) throw validationError({ status: 'Must be Active or Sold' });
    if (req.query.mine && req.query.mine !== 'true') throw validationError({ mine: 'Must be true' });
    if (req.query.crop_id && !isPositiveInteger(req.query.crop_id)) throw validationError({ crop_id: 'Must be a positive integer' });

    let query = supabase.from('listings').select(selectFields);
    if (req.query.mine === 'true') query = query.eq('user_id', req.user.id);
    else query = query.eq('status', req.query.status ?? 'Active');
    if (req.query.mine === 'true' && req.query.status) query = query.eq('status', req.query.status);
    if (req.query.crop_id) query = query.eq('crop_id', Number(req.query.crop_id));
    if (req.query.district) query = query.eq('district', req.query.district);
    if (req.query.grade) query = query.eq('grade', req.query.grade);
    query = sort === 'price_asc'
      ? query.order('asking_price', { ascending: true })
      : query.order('created_at', { ascending: false });
    const { data: rows, error } = await query;
    if (error) throw databaseError(error);
    const search = String(req.query.search ?? '').trim().toLocaleLowerCase();
    const filtered = (rows ?? []).filter((row) => !search
      || row.crops?.name?.toLocaleLowerCase().includes(search)
      || row.crops?.name_ur?.toLocaleLowerCase().includes(search));
    const averages = await marketAverageMap(filtered.map((row) => row.crop_id));
    res.json({ data: filtered.map((row) => serializeListing(row, averages.get(row.crop_id))) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parsePositiveInteger(req.params.id, 'id');
    const { serialized } = await getListing(id);
    res.json({ data: serialized });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireUser, requireFarmer, async (req, res, next) => {
  try {
    const values = validateListing(req.body);
    await ensureExists('crops', values.crop_id, 'crop_id');
    const { data, error } = await supabase.from('listings')
      .insert({ ...values, user_id: req.user.id, status: 'Active' }).select('id').single();
    if (error) throw databaseError(error);
    const listing = await getListing(data.id);
    res.status(201).json({ data: listing.serialized });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireUser, requireFarmer, async (req, res, next) => {
  try {
    const id = parsePositiveInteger(req.params.id, 'id');
    const existing = await getListing(id);
    if (existing.raw.user_id !== req.user.id) throw new ApiError(403, 'FORBIDDEN', 'You do not own this listing');
    const values = validateListing(req.body);
    await ensureExists('crops', values.crop_id, 'crop_id');
    const { error } = await supabase.from('listings').update(values).eq('id', id);
    if (error) throw databaseError(error);
    const listing = await getListing(id);
    res.json({ data: listing.serialized });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/sold', requireUser, requireFarmer, async (req, res, next) => {
  try {
    const id = parsePositiveInteger(req.params.id, 'id');
    const existing = await getListing(id);
    if (existing.raw.user_id !== req.user.id) throw new ApiError(403, 'FORBIDDEN', 'You do not own this listing');
    const { error } = await supabase.from('listings').update({ status: 'Sold' }).eq('id', id);
    if (error) throw databaseError(error);
    const listing = await getListing(id);
    res.json({ data: listing.serialized });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireUser, requireFarmer, async (req, res, next) => {
  try {
    const id = parsePositiveInteger(req.params.id, 'id');
    const existing = await getListing(id);
    if (existing.raw.user_id !== req.user.id) throw new ApiError(403, 'FORBIDDEN', 'You do not own this listing');
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (error) throw databaseError(error);
    res.json({ data: { id, deleted: true } });
  } catch (error) {
    next(error);
  }
});

export default router;
