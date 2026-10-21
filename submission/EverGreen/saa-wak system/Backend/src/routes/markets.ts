import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

const router = Router();

let cachedMarkets: any = null;
let lastMarketsFetch = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

// GET /markets
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = Date.now();
    if (cachedMarkets && now - lastMarketsFetch < CACHE_TTL_MS) {
      res.json({ success: true, data: cachedMarkets });
      return;
    }

    const markets = await prisma.market.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    cachedMarkets = markets;
    lastMarketsFetch = now;
    res.json({ success: true, data: markets });
  } catch (err) {
    next(err);
  }
});

// GET /markets/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const market = await prisma.market.findUnique({ where: { id: req.params.id as string } });
    if (!market) {
      res.status(404).json({ success: false, message: 'Market not found' });
      return;
    }
    res.json({ success: true, data: market });
  } catch (err) {
    next(err);
  }
});

export default router;
