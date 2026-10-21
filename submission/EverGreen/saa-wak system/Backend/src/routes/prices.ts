import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { PriceQuerySchema } from '../lib/validation';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();

// Shared formatter
function formatPrice(p: {
  id: string; cropId: string; marketId: string;
  date: Date; price: Decimal; unit: string; sourceLabel: string;
}) {
  return {
    id: p.id,
    cropId: p.cropId,
    marketId: p.marketId,
    date: p.date.toISOString().slice(0, 10), // YYYY-MM-DD
    price: Number(p.price),
    unit: p.unit,
    sourceLabel: p.sourceLabel,
  };
}

let cachedAllPrices: any = null;
let lastPricesFetch = 0;
const PRICES_CACHE_TTL = 3 * 60 * 1000;

// GET /prices — filterable price records
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = PriceQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Invalid query', details: parsed.error.issues });
      return;
    }

    const { cropId, marketId, startDate, endDate, page, limit } = parsed.data;

    const isAllPricesQuery = !cropId && !marketId && !startDate && !endDate && page === 1 && limit >= 300;
    const now = Date.now();
    if (isAllPricesQuery && cachedAllPrices && now - lastPricesFetch < PRICES_CACHE_TTL) {
      res.json({ success: true, data: cachedAllPrices });
      return;
    }

    const where: Record<string, unknown> = {};
    if (cropId) where.cropId = cropId;
    if (marketId) where.marketId = marketId;
    if (startDate || endDate) {
      where.date = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    const prices = await prisma.price.findMany({
      where,
      orderBy: [{ cropId: 'asc' }, { marketId: 'asc' }, { date: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    });

    const formatted = prices.map(formatPrice);
    if (isAllPricesQuery) {
      cachedAllPrices = formatted;
      lastPricesFetch = now;
    }

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// GET /prices/history — 14-day history for a specific crop+market
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cropId, marketId } = req.query as { cropId?: string; marketId?: string };

    if (!cropId || !marketId) {
      res.status(400).json({ success: false, message: 'cropId and marketId are required' });
      return;
    }

    const prices = await prisma.price.findMany({
      where: { cropId, marketId },
      orderBy: { date: 'desc' },
      take: 14,
    });

    // Return in ascending date order for charting
    res.json({ success: true, data: prices.reverse().map(formatPrice) });
  } catch (err) {
    next(err);
  }
});

// GET /prices/compare — compare a crop across all markets for latest date
router.get('/compare', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cropId } = req.query as { cropId?: string };

    if (!cropId) {
      res.status(400).json({ success: false, message: 'cropId is required' });
      return;
    }

    // Latest date per market for this crop
    const markets = await prisma.market.findMany({ where: { isActive: true } });

    const results = await Promise.all(
      markets.map(async (market) => {
        const latest = await prisma.price.findFirst({
          where: { cropId, marketId: market.id },
          orderBy: { date: 'desc' },
        });
        return { market, price: latest ? formatPrice(latest) : null };
      })
    );

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
});

// GET /prices/:id — single price record
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const price = await prisma.price.findUnique({ where: { id } });
    if (!price) {
      res.status(404).json({ success: false, message: 'Price record not found' });
      return;
    }
    res.json({ success: true, data: formatPrice(price) });
  } catch (err) {
    next(err);
  }
});

export default router;
