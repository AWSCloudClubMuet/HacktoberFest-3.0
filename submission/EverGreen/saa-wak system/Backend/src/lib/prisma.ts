// ============================================================
// Prisma Client singleton
// ============================================================
import { PrismaClient } from '@prisma/client';

declare global {
  // Prevent multiple Prisma instances in hot-reload dev
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma = global.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
