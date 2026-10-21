import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

let lastHealthCheck = 0;
let lastDbOk = true;

router.get('/', async (_req: Request, res: Response) => {
  const now = Date.now();
  if (now - lastHealthCheck > 30000) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      lastDbOk = true;
    } catch {
      lastDbOk = false;
    }
    lastHealthCheck = now;
  }

  res.status(lastDbOk ? 200 : 503).json({
    success: true,
    status: lastDbOk ? 'ok' : 'degraded',
    database: lastDbOk ? 'connected' : 'disconnected',
    version: '1.0.0',
    app: 'saa-wak (ساوڪ)',
    timestamp: new Date().toISOString(),
  });
});

export default router;
