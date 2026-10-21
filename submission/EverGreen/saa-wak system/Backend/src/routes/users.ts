import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /users/me/listings — authenticated user's own listings
router.get('/me/listings', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { sellerId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: listings.map((l) => ({
        id: l.id,
        sellerId: l.sellerId,
        cropId: l.cropId,
        marketId: l.marketId,
        quantity: Number(l.quantity),
        unit: l.unit,
        grade: gradeDisplay(l.grade),
        askingPricePerUnit: Number(l.askingPricePerUnit),
        district: l.district,
        description: l.description,
        contactMethod: l.contactMethod,
        status: l.status,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

let usersCache: { data: unknown; expiry: number } | null = null;

// GET /users — public list of all users (display names only, no passwords)
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (usersCache && Date.now() < usersCache.expiry) {
      res.json({ success: true, data: usersCache.data });
      return;
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        displayName: true,
        role: true,
        district: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    usersCache = { data: users, expiry: Date.now() + 5 * 60 * 1000 };
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

function gradeDisplay(g: string): string {
  const map: Record<string, string> = {
    GradeA: 'Grade A', GradeB: 'Grade B',
    ExportQuality: 'Export Quality', Standard: 'Standard',
  };
  return map[g] ?? g;
}

export default router;
