import { Router, Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import {
  CreateListingSchema,
  UpdateListingSchema,
  ListingQuerySchema,
} from '../lib/validation';
import { notFoundError, forbiddenError, validationError } from '../lib/errors';

const router = Router();

// Grade mapping between frontend and DB enum
const GRADE_MAP: Record<string, 'GradeA' | 'GradeB' | 'ExportQuality' | 'Standard'> = {
  'Grade A': 'GradeA',
  'Grade B': 'GradeB',
  'Export Quality': 'ExportQuality',
  Standard: 'Standard',
  GradeA: 'GradeA',
  GradeB: 'GradeB',
  ExportQuality: 'ExportQuality',
};

const GRADE_DISPLAY: Record<string, string> = {
  GradeA: 'Grade A',
  GradeB: 'Grade B',
  ExportQuality: 'Export Quality',
  Standard: 'Standard',
};

type ListingWithRelations = Prisma.ListingGetPayload<{
  include: { seller: false; crop: true; market: true };
}> & { seller?: { id: string; displayName: string; role: string } | null };

function formatListing(l: {
  id: string; sellerId: string; cropId: string; marketId: string;
  quantity: Decimal; unit: string; grade: string; askingPricePerUnit: Decimal;
  district: string; description: string | null; contactMethod: string | null;
  status: string; createdAt: Date; updatedAt: Date;
  crop?: { name: string } | null;
  market?: { name: string; district: string } | null;
  sellerData?: { displayName: string } | null;
}) {
  return {
    id: l.id,
    sellerId: l.sellerId,
    cropId: l.cropId,
    marketId: l.marketId,
    quantity: Number(l.quantity),
    unit: l.unit,
    grade: GRADE_DISPLAY[l.grade] ?? l.grade,
    askingPricePerUnit: Number(l.askingPricePerUnit),
    district: l.district,
    description: l.description,
    contactMethod: l.contactMethod,
    status: l.status,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

let listingsCache: { key: string; data: unknown; expiry: number } | null = null;
export function clearListingsCache() {
  listingsCache = null;
}

// GET /listings — public browse
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ListingQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Invalid query', details: parsed.error.issues });
      return;
    }

    const cacheKey = JSON.stringify(req.query);
    if (listingsCache && listingsCache.key === cacheKey && Date.now() < listingsCache.expiry) {
      res.json(listingsCache.data);
      return;
    }

    const { cropId, marketId, district, status, minPrice, maxPrice, search, page, limit, sortBy, sortOrder } = parsed.data;

    const where: Prisma.ListingWhereInput = {};
    if (cropId) where.cropId = cropId;
    if (marketId) where.marketId = marketId;
    if (district) where.district = { contains: district, mode: 'insensitive' };
    if (status) where.status = status as 'available' | 'reserved' | 'sold';
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.askingPricePerUnit = {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      };
    }
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { district: { contains: search, mode: 'insensitive' } },
        { contactMethod: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, listings] = await prisma.$transaction([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const result = {
      success: true,
      data: listings.map(formatListing),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
    listingsCache = { key: cacheKey, data: result, expiry: Date.now() + 60 * 1000 };

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /listings/:id — single listing
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw notFoundError('Listing', id);
    res.json({ success: true, data: formatListing(listing) });
  } catch (err) {
    next(err);
  }
});

// POST /listings — authenticated farmers only
router.post(
  '/',
  authenticate,
  requireRole('farmer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = CreateListingSchema.safeParse(req.body);
      if (!parsed.success) throw validationError('Validation failed', parsed.error.issues);

      const data = parsed.data;
      const gradeEnum = GRADE_MAP[data.grade];
      if (!gradeEnum) throw validationError('Invalid grade value');

      // Verify crop and market exist
      const [crop, market] = await Promise.all([
        prisma.crop.findUnique({ where: { id: data.cropId } }),
        prisma.market.findUnique({ where: { id: data.marketId } }),
      ]);
      if (!crop) throw validationError('Crop not found');
      if (!market) throw validationError('Market not found');

      const listing = await prisma.listing.create({
        data: {
          sellerId: req.user!.userId,
          cropId: data.cropId,
          marketId: data.marketId,
          quantity: data.quantity,
          unit: data.unit,
          grade: gradeEnum,
          askingPricePerUnit: data.askingPricePerUnit,
          district: data.district,
          description: data.description,
          contactMethod: data.contactMethod,
          status: data.status as 'available' | 'reserved' | 'sold',
        },
      });

      clearListingsCache();
      res.status(201).json({ success: true, data: formatListing(listing) });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /listings/:id — owner only
router.patch(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const listing = await prisma.listing.findUnique({ where: { id } });
      if (!listing) throw notFoundError('Listing', id);
      if (listing.sellerId !== req.user!.userId) throw forbiddenError('You can only edit your own listings');

      const parsed = UpdateListingSchema.safeParse(req.body);
      if (!parsed.success) throw validationError('Validation failed', parsed.error.issues);

      const data = parsed.data;
      let gradeEnum: 'GradeA' | 'GradeB' | 'ExportQuality' | 'Standard' | undefined;
      if (data.grade) {
        gradeEnum = GRADE_MAP[data.grade];
        if (!gradeEnum) throw validationError('Invalid grade value');
      }

      const updated = await prisma.listing.update({
        where: { id },
        data: {
          ...(data.cropId ? { cropId: data.cropId } : {}),
          ...(data.marketId ? { marketId: data.marketId } : {}),
          ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
          ...(data.unit ? { unit: data.unit } : {}),
          ...(gradeEnum ? { grade: gradeEnum } : {}),
          ...(data.askingPricePerUnit !== undefined ? { askingPricePerUnit: data.askingPricePerUnit } : {}),
          ...(data.district ? { district: data.district } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.contactMethod !== undefined ? { contactMethod: data.contactMethod } : {}),
          ...(data.status ? { status: data.status as 'available' | 'reserved' | 'sold' } : {}),
        },
      });

      clearListingsCache();
      res.json({ success: true, data: formatListing(updated) });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /listings/:id — owner only
router.delete(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const listing = await prisma.listing.findUnique({ where: { id } });
      if (!listing) throw notFoundError('Listing', id);
      if (listing.sellerId !== req.user!.userId) throw forbiddenError('You can only delete your own listings');

      await prisma.listing.delete({ where: { id } });
      clearListingsCache();
      res.json({ success: true, message: 'Listing deleted' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
