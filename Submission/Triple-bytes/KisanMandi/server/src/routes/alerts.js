import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireFarmer, requireUser } from '../middleware/auth.js';
import { ApiError, databaseError } from '../utils/errors.js';
import { ensureExists, getAlert, serializeAlert } from '../utils/data.js';
import { parsePositiveInteger, validateAlert } from '../utils/validation.js';

const router = Router();
const selectFields = '*,crops(name,name_ur),markets(name,name_ur)';

router.use(requireUser, requireFarmer);

router.get('/', async (req, res, next) => {
  try {
    const { data: rows, error } = await supabase.from('alerts')
      .select(selectFields).eq('user_id', req.user.id).order('id');
    if (error) throw databaseError(error);
    const data = await Promise.all((rows ?? []).map(serializeAlert));
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const values = validateAlert(req.body);
    await Promise.all([
      ensureExists('crops', values.crop_id, 'crop_id'),
      ensureExists('markets', values.market_id, 'market_id'),
    ]);
    const { data, error } = await supabase.from('alerts')
      .insert({ ...values, user_id: req.user.id, active_status: true }).select(selectFields).single();
    if (error) throw databaseError(error);
    res.status(201).json({ data: await serializeAlert(data) });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = parsePositiveInteger(req.params.id, 'id');
    const existing = await getAlert(id);
    if (existing.user_id !== req.user.id) throw new ApiError(403, 'FORBIDDEN', 'You do not own this alert');
    const values = validateAlert(req.body);
    await Promise.all([
      ensureExists('crops', values.crop_id, 'crop_id'),
      ensureExists('markets', values.market_id, 'market_id'),
    ]);
    const { data, error } = await supabase.from('alerts').update(values).eq('id', id).select(selectFields).single();
    if (error) throw databaseError(error);
    res.json({ data: await serializeAlert(data) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/toggle', async (req, res, next) => {
  try {
    const id = parsePositiveInteger(req.params.id, 'id');
    const existing = await getAlert(id);
    if (existing.user_id !== req.user.id) throw new ApiError(403, 'FORBIDDEN', 'You do not own this alert');
    const { data, error } = await supabase.from('alerts')
      .update({ active_status: !existing.active_status }).eq('id', id).select(selectFields).single();
    if (error) throw databaseError(error);
    res.json({ data: await serializeAlert(data) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parsePositiveInteger(req.params.id, 'id');
    const existing = await getAlert(id);
    if (existing.user_id !== req.user.id) throw new ApiError(403, 'FORBIDDEN', 'You do not own this alert');
    const { error } = await supabase.from('alerts').delete().eq('id', id);
    if (error) throw databaseError(error);
    res.json({ data: { id, deleted: true } });
  } catch (error) {
    next(error);
  }
});

export default router;
