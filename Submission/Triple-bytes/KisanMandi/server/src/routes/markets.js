import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { databaseError } from '../utils/errors.js';
import { cached } from '../utils/data.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const data = await cached('markets', 300_000, async () => {
      const { data, error } = await supabase.from('markets').select('id,name,name_ur,district').order('id');
      if (error) throw databaseError(error);
      return data;
    });
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

export default router;
