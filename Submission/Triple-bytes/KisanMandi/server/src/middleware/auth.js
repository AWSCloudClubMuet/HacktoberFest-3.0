import { supabase } from '../config/supabase.js';
import { ApiError, databaseError } from '../utils/errors.js';
import { isPositiveInteger } from '../utils/validation.js';

export async function requireUser(req, _res, next) {
  try {
    const id = req.get('x-user-id');
    if (!isPositiveInteger(id)) throw new ApiError(401, 'UNAUTHORIZED', 'Missing or invalid user');
    const { data, error } = await supabase
      .from('users')
      .select('id,name,phone,district,role')
      .eq('id', Number(id))
      .maybeSingle();
    if (error) throw databaseError(error);
    if (!data) throw new ApiError(401, 'UNAUTHORIZED', 'Missing or invalid user');
    req.user = data;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireFarmer(req, _res, next) {
  if (req.user?.role !== 'Farmer') {
    return next(new ApiError(403, 'FORBIDDEN', 'This action is available to farmers only'));
  }
  next();
}
