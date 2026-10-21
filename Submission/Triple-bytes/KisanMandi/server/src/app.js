import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import alertsRouter from './routes/alerts.js';
import cropsRouter from './routes/crops.js';
import listingsRouter from './routes/listings.js';
import marketsRouter from './routes/markets.js';
import pricesRouter from './routes/prices.js';
import usersRouter from './routes/users.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
const allowedOrigins = String(process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
  .split(',').map((origin) => origin.trim()).filter(Boolean);

app.disable('x-powered-by');
const localOrigin = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || localOrigin.test(origin)) return callback(null, true);
    callback(null, false);
  },
}));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ data: { status: 'ok' } }));
app.use('/api/users', usersRouter);
app.use('/api/crops', cropsRouter);
app.use('/api/markets', marketsRouter);
app.use('/api/prices', pricesRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/alerts', alertsRouter);
app.use(notFoundHandler);
app.use(errorHandler);

const port = Number(process.env.PORT ?? 5000);
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`KisanMandi API listening on port ${port}`));
}

export default app;
