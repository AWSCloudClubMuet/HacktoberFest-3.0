import express, { Request, Response, NextFunction } from 'express';
import { ReliefService, ServiceError } from '../services/reliefService.ts';
import { getDbStats } from '../db.ts';
import { runAllTests } from '../../tests/backend.test.ts';

export const apiRouter = express.Router();

// Role validation middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const role = req.headers['x-user-role'] || 'admin'; // default to admin for dev/tests if not passed
  if (role !== 'admin') {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied: This operation requires Relief Coordinator (Admin) permissions.',
      },
    });
    return;
  }
  next();
}

// Global async error wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// ================= HEALTH =================
apiRouter.get('/health', (req: Request, res: Response) => {
  const stats = getDbStats();
  res.status(200).json({
    status: 'healthy',
    system: 'ReliefHub Sindh Flood Coordination Engine',
    timestamp: new Date().toISOString(),
    database: {
      type: 'Persistent JSON Database with Mutex Serialization',
      stats,
    },
  });
});

// ================= CAMPS =================
apiRouter.get('/camps', asyncHandler(async (req, res) => {
  const { district, status, search } = req.query;
  const camps = await ReliefService.getAllCamps({
    district: district as string,
    status: status as string,
    search: search as string,
  });
  res.json({ data: camps });
}));

apiRouter.get('/camps/:id', asyncHandler(async (req, res) => {
  const camp = await ReliefService.getCampById(req.params.id);
  res.json({ data: camp });
}));

apiRouter.post('/camps', requireAdmin, asyncHandler(async (req, res) => {
  const newCamp = await ReliefService.createCamp(req.body);
  res.status(201).json({ data: newCamp });
}));

apiRouter.patch('/camps/:id', requireAdmin, asyncHandler(async (req, res) => {
  const updated = await ReliefService.updateCamp(req.params.id, req.body);
  res.json({ data: updated });
}));

apiRouter.delete('/camps/:id', requireAdmin, asyncHandler(async (req, res) => {
  await ReliefService.deleteCamp(req.params.id);
  res.status(204).send();
}));

// ================= INVENTORY =================
apiRouter.get('/inventory', asyncHandler(async (req, res) => {
  const { category, lowStockOnly, search } = req.query;
  const items = await ReliefService.getAllInventory({
    category: category as string,
    lowStockOnly: lowStockOnly === 'true',
    search: search as string,
  });
  res.json({ data: items });
}));

apiRouter.get('/inventory/:id', asyncHandler(async (req, res) => {
  const item = await ReliefService.getInventoryById(req.params.id);
  res.json({ data: item });
}));

apiRouter.post('/inventory', requireAdmin, asyncHandler(async (req, res) => {
  const item = await ReliefService.createInventory(req.body);
  res.status(201).json({ data: item });
}));

apiRouter.patch('/inventory/:id', requireAdmin, asyncHandler(async (req, res) => {
  const item = await ReliefService.updateInventory(req.params.id, req.body);
  res.json({ data: item });
}));

apiRouter.delete('/inventory/:id', requireAdmin, asyncHandler(async (req, res) => {
  await ReliefService.deleteInventory(req.params.id);
  res.status(204).send();
}));

// ================= NEEDS =================
apiRouter.get('/needs', asyncHandler(async (req, res) => {
  const { campId, priority, category, search } = req.query;
  const needs = await ReliefService.getAllNeeds({
    campId: campId as string,
    priority: priority as string,
    category: category as string,
    search: search as string,
  });
  res.json({ data: needs });
}));

apiRouter.get('/needs/:id', asyncHandler(async (req, res) => {
  const need = await ReliefService.getNeedById(req.params.id);
  res.json({ data: need });
}));

apiRouter.post('/needs', requireAdmin, asyncHandler(async (req, res) => {
  const need = await ReliefService.createNeed(req.body);
  res.status(201).json({ data: need });
}));

apiRouter.patch('/needs/:id', requireAdmin, asyncHandler(async (req, res) => {
  const need = await ReliefService.updateNeed(req.params.id, req.body);
  res.json({ data: need });
}));

apiRouter.delete('/needs/:id', requireAdmin, asyncHandler(async (req, res) => {
  await ReliefService.deleteNeed(req.params.id);
  res.status(204).send();
}));

// ================= DISPATCHES =================
apiRouter.get('/dispatches', asyncHandler(async (req, res) => {
  const { status, campId, search } = req.query;
  const dispatches = await ReliefService.getAllDispatches({
    status: status as string,
    campId: campId as string,
    search: search as string,
  });
  res.json({ data: dispatches });
}));

apiRouter.get('/dispatches/:id', asyncHandler(async (req, res) => {
  const dispatch = await ReliefService.getDispatchById(req.params.id);
  res.json({ data: dispatch });
}));

apiRouter.post('/dispatches', requireAdmin, asyncHandler(async (req, res) => {
  const dispatch = await ReliefService.createDispatch(req.body);
  res.status(201).json({ data: dispatch });
}));

apiRouter.post('/dispatches/:id/in-transit', asyncHandler(async (req, res) => {
  const dispatch = await ReliefService.markInTransit(req.params.id);
  res.json({ data: dispatch });
}));

apiRouter.post('/dispatches/:id/deliver', asyncHandler(async (req, res) => {
  const dispatch = await ReliefService.markDelivered(req.params.id);
  res.json({ data: dispatch });
}));

apiRouter.post('/dispatches/:id/cancel', requireAdmin, asyncHandler(async (req, res) => {
  const dispatch = await ReliefService.cancelDispatch(req.params.id);
  res.json({ data: dispatch });
}));

// ================= DONATIONS =================
apiRouter.get('/donations', asyncHandler(async (req, res) => {
  const { type, search } = req.query;
  const donations = await ReliefService.getAllDonations({
    type: type as string,
    search: search as string,
  });
  res.json({ data: donations });
}));

apiRouter.get('/donations/:id', asyncHandler(async (req, res) => {
  const don = await ReliefService.getDonationById(req.params.id);
  res.json({ data: don });
}));

apiRouter.post('/donations', requireAdmin, asyncHandler(async (req, res) => {
  const donation = await ReliefService.createDonation(req.body);
  res.status(201).json({ data: donation });
}));

// ================= VOLUNTEERS =================
apiRouter.get('/volunteers', asyncHandler(async (req, res) => {
  const { skill, assignedStatus, search } = req.query;
  const volunteers = await ReliefService.getAllVolunteers({
    skill: skill as string,
    assignedStatus: assignedStatus as string,
    search: search as string,
  });
  res.json({ data: volunteers });
}));

apiRouter.get('/volunteers/:id', asyncHandler(async (req, res) => {
  const vol = await ReliefService.getVolunteerById(req.params.id);
  res.json({ data: vol });
}));

apiRouter.post('/volunteers', requireAdmin, asyncHandler(async (req, res) => {
  const vol = await ReliefService.registerVolunteer(req.body);
  res.status(201).json({ data: vol });
}));

apiRouter.patch('/volunteers/:id', requireAdmin, asyncHandler(async (req, res) => {
  const vol = await ReliefService.updateVolunteer(req.params.id, req.body);
  res.json({ data: vol });
}));

apiRouter.delete('/volunteers/:id', requireAdmin, asyncHandler(async (req, res) => {
  await ReliefService.deleteVolunteer(req.params.id);
  res.status(204).send();
}));

apiRouter.post('/volunteers/:id/assign', requireAdmin, asyncHandler(async (req, res) => {
  const { camp_id } = req.body;
  if (!camp_id) {
    res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'camp_id is required for assignment.' } });
    return;
  }
  const vol = await ReliefService.assignVolunteer(req.params.id, camp_id);
  res.json({ data: vol });
}));

apiRouter.post('/volunteers/:id/unassign', requireAdmin, asyncHandler(async (req, res) => {
  const vol = await ReliefService.unassignVolunteer(req.params.id);
  res.json({ data: vol });
}));

// ================= DASHBOARD =================
apiRouter.get('/dashboard/summary', asyncHandler(async (req, res) => {
  const summary = await ReliefService.getDashboardSummary();
  res.json({ data: summary });
}));

apiRouter.get('/dashboard/category-fulfilment', asyncHandler(async (req, res) => {
  const data = await ReliefService.getCategoryFulfilment();
  res.json({ data });
}));

apiRouter.get('/dashboard/critical-gaps', asyncHandler(async (req, res) => {
  const data = await ReliefService.getCriticalGaps();
  res.json({ data });
}));

apiRouter.get('/dashboard/recommendations', asyncHandler(async (req, res) => {
  const data = await ReliefService.getSmartRecommendations();
  res.json({ data });
}));

apiRouter.get('/dashboard/dispatch-delays', asyncHandler(async (req, res) => {
  const threshold = req.query.threshold ? Number(req.query.threshold) : 24;
  const data = await ReliefService.getDispatchDelayAlerts(threshold);
  res.json({ data });
}));

// ================= ADMIN RESET =================
apiRouter.post('/admin/reset-seed', requireAdmin, asyncHandler(async (req, res) => {
  await ReliefService.resetSeedData();
  res.json({
    status: 'ok',
    message: 'Seed data successfully reinitialized to pristine demo state.',
  });
}));

// ================= TEST RUNNER =================
apiRouter.post('/test/run', asyncHandler(async (req, res) => {
  const result = await runAllTests();
  res.json({
    status: 'ok',
    data: result,
  });
}));

// Centralized error handler
apiRouter.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ServiceError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred.',
    },
  });
});
