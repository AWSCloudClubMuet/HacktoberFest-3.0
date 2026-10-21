// ============================================================
// Zod validation schemas for all API request bodies
// ============================================================
import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────────
export const RegisterSchema = z.object({
  email: z.string().email('Valid email required'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(80),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['farmer', 'buyer']),
  district: z.string().min(2).max(80),
  phone: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── Listings ─────────────────────────────────────────────
export const CreateListingSchema = z.object({
  cropId: z.string().min(1, 'Crop is required'),
  marketId: z.string().min(1, 'Market is required'),
  quantity: z.number().positive('Quantity must be > 0'),
  unit: z.string().min(1),
  grade: z.enum(['GradeA', 'GradeB', 'ExportQuality', 'Standard']),
  askingPricePerUnit: z.number().nonnegative('Price must be >= 0'),
  district: z.string().min(1),
  description: z.string().max(1000).optional(),
  contactMethod: z.string().max(200).optional(),
  status: z.enum(['available', 'reserved', 'sold']).default('available'),
});

export const UpdateListingSchema = CreateListingSchema.partial();

// ── Alerts ───────────────────────────────────────────────
export const CreateAlertSchema = z.object({
  cropId: z.string().min(1, 'Crop is required'),
  marketId: z.string().min(1, 'Market is required'),
  condition: z.enum(['above', 'below']),
  targetPrice: z.number().positive('Target price must be positive'),
  isEnabled: z.boolean().default(true),
});

export const UpdateAlertSchema = z.object({
  isEnabled: z.boolean().optional(),
  targetPrice: z.number().positive().optional(),
  condition: z.enum(['above', 'below']).optional(),
});

// ── Messages ─────────────────────────────────────────────
export const SendMessageSchema = z.object({
  text: z.string().min(1, 'Message cannot be empty').max(4000, 'Message too long'),
});

export const CreateConversationSchema = z.object({
  recipientId: z.string().min(1),
  listingId: z.string().optional(),
  initialMessage: z.string().min(1).max(4000).optional(),
});

// ── AI ───────────────────────────────────────────────────
export const AiQuerySchema = z.object({
  message: z.string().min(1).max(2000, 'Message too long'),
  context: z
    .object({
      cropId: z.string().optional(),
      marketId: z.string().optional(),
      listingId: z.string().optional(),
    })
    .optional(),
});

// ── Query helpers ─────────────────────────────────────────
export const PriceQuerySchema = z.object({
  cropId: z.string().optional(),
  marketId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(100),
});

export const ListingQuerySchema = z.object({
  cropId: z.string().optional(),
  marketId: z.string().optional(),
  district: z.string().optional(),
  status: z.enum(['available', 'reserved', 'sold']).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'askingPricePerUnit', 'quantity']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
