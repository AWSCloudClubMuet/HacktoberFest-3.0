import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { databaseError, notFound } from '../utils/errors.js';
import { parsePositiveInteger, validateUser } from '../utils/validation.js';

const router = Router();
const fields = 'id,name,phone,district,role';

router.post('/', async (req, res, next) => {
  try {
    const values = validateUser(req.body);
    const { data: existing, error: findError } = await supabase
      .from('users').select(fields).eq('phone', values.phone).maybeSingle();
    if (findError) throw databaseError(findError);
    if (existing) return res.status(200).json({ data: existing });
    const { data, error } = await supabase.from('users').insert(values).select(fields).single();
    if (error) throw databaseError(error);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parsePositiveInteger(req.params.id, 'id');
    const { data, error } = await supabase.from('users').select(fields).eq('id', id).maybeSingle();
    if (error) throw databaseError(error);
    if (!data) throw notFound('User');
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

export default router;
