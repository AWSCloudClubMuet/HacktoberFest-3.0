import { Router, Request, Response, NextFunction } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { CreateAlertSchema, UpdateAlertSchema } from '../lib/validation';
import { notFoundError, forbiddenError, validationError } from '../lib/errors';

const router = Router();

function formatAlert(a: {
  id: string; userId: string; cropId: string; marketId: string;
  condition: string; targetPrice: Decimal; isEnabled: boolean;
  lastEvaluatedPrice: Decimal | null; lastTriggeredAt: Date | null;
  createdAt: Date; updatedAt: Date;
}) {
  return {
    id: a.id,
    userId: a.userId,
    cropId: a.cropId,
    marketId: a.marketId,
    condition: a.condition,
    targetPrice: Number(a.targetPrice),
    isEnabled: a.isEnabled,
    lastEvaluatedPrice: a.lastEvaluatedPrice !== null ? Number(a.lastEvaluatedPrice) : null,
    lastTriggeredAt: a.lastTriggeredAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  };
}

const userAlertsCache = new Map<string, { data: unknown; expiry: number }>();
export function clearUserAlertsCache(userId?: string) {
  if (userId) userAlertsCache.delete(userId);
  else userAlertsCache.clear();
}

// All alert routes require authentication
router.use(authenticate);

// GET /alerts — user's own alerts only
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const cached = userAlertsCache.get(userId);
    if (cached && Date.now() < cached.expiry) {
      res.json({ success: true, data: cached.data });
      return;
    }

    const alerts = await prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const formatted = alerts.map(formatAlert);
    userAlertsCache.set(userId, { data: formatted, expiry: Date.now() + 60 * 1000 });
    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// POST /alerts
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = CreateAlertSchema.safeParse(req.body);
    if (!parsed.success) throw validationError('Validation failed', parsed.error.issues);

    const data = parsed.data;

    // Verify crop and market exist
    const [crop, market] = await Promise.all([
      prisma.crop.findUnique({ where: { id: data.cropId } }),
      prisma.market.findUnique({ where: { id: data.marketId } }),
    ]);
    if (!crop) throw validationError('Crop not found');
    if (!market) throw validationError('Market not found');

    const alert = await prisma.alert.create({
      data: {
        userId: req.user!.userId,
        cropId: data.cropId,
        marketId: data.marketId,
        condition: data.condition,
        targetPrice: data.targetPrice,
        isEnabled: data.isEnabled,
      },
    });

    clearUserAlertsCache(req.user!.userId);
    res.status(201).json({ success: true, data: formatAlert(alert) });
  } catch (err) {
    next(err);
  }
});

// PATCH /alerts/:id
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) throw notFoundError('Alert', id);
    if (alert.userId !== req.user!.userId) throw forbiddenError('You can only modify your own alerts');

    const parsed = UpdateAlertSchema.safeParse(req.body);
    if (!parsed.success) throw validationError('Validation failed', parsed.error.issues);

    // Also allow updating evaluation fields (from alert evaluation endpoint)
    const evalData = req.body as {
      lastEvaluatedPrice?: number;
      lastTriggeredAt?: string | null;
    };

    const updated = await prisma.alert.update({
      where: { id },
      data: {
        ...(parsed.data.isEnabled !== undefined ? { isEnabled: parsed.data.isEnabled } : {}),
        ...(parsed.data.targetPrice !== undefined ? { targetPrice: parsed.data.targetPrice } : {}),
        ...(parsed.data.condition ? { condition: parsed.data.condition } : {}),
        ...(evalData.lastEvaluatedPrice !== undefined
          ? { lastEvaluatedPrice: evalData.lastEvaluatedPrice }
          : {}),
        ...(evalData.lastTriggeredAt !== undefined
          ? { lastTriggeredAt: evalData.lastTriggeredAt ? new Date(evalData.lastTriggeredAt) : null }
          : {}),
      },
    });

    clearUserAlertsCache(req.user!.userId);
    res.json({ success: true, data: formatAlert(updated) });
  } catch (err) {
    next(err);
  }
});

// DELETE /alerts/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) throw notFoundError('Alert', id);
    if (alert.userId !== req.user!.userId) throw forbiddenError('You can only delete your own alerts');

    await prisma.alert.delete({ where: { id } });
    clearUserAlertsCache(req.user!.userId);
    res.json({ success: true, message: 'Alert deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
