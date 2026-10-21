import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

const router = Router();

let cachedCrops: any = null;
let lastCropsFetch = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

// GET /crops — list all active crops
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = Date.now();
    if (cachedCrops && now - lastCropsFetch < CACHE_TTL_MS) {
      res.json({ success: true, data: cachedCrops });
      return;
    }

    const crops = await prisma.crop.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    // Map category enum back to frontend-friendly string
    const mapped = crops.map(formatCrop);
    cachedCrops = mapped;
    lastCropsFetch = now;
    res.json({ success: true, data: mapped });
  } catch (err) {
    next(err);
  }
});

// GET /crops/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const crop = await prisma.crop.findUnique({ where: { id: req.params.id as string } });
    if (!crop) {
      res.status(404).json({ success: false, message: 'Crop not found' });
      return;
    }
    res.json({ success: true, data: formatCrop(crop) });
  } catch (err) {
    next(err);
  }
});

function formatCrop(c: { id: string; name: string; sindhiName: string | null; category: string; unit: string; symbol: string; description: string | null; isActive: boolean; createdAt: Date }) {
  return {
    id: c.id,
    name: c.name,
    sindhiName: c.sindhiName,
    // Map enum value back to display string for frontend
    category: c.category === 'CashCrops' ? 'Cash Crops' : c.category,
    unit: c.unit,
    symbol: c.symbol,
    description: c.description,
    isActive: c.isActive,
  };
}

export default router;
