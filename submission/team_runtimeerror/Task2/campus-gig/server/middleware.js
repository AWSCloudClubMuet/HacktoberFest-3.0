import { db } from './db.js';

export function auth(req, _res, next) {
  const id = Number(req.header('x-user-id'));
  req.user = db.users.find((u) => u.id === id) || null;
  next();
}
export const requireUser = (req, res, next) =>
  req.user ? next() : res.status(401).json({ error: 'Select a user first (x-user-id header missing)' });