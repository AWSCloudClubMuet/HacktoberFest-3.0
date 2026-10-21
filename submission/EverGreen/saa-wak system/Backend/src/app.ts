// ============================================================
// saa-wak Express Application
// ============================================================
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Route imports
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import cropsRouter from './routes/crops';
import marketsRouter from './routes/markets';
import pricesRouter from './routes/prices';
import listingsRouter from './routes/listings';
import alertsRouter from './routes/alerts';
import usersRouter from './routes/users';
import conversationsRouter from './routes/conversations';
import aiRouter from './routes/ai';

const app = express();

// ── Security headers ──────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., curl, mobile apps) in dev
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Request logging (dev only) ────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── API Routes ────────────────────────────────────────────────
const API = '/api/v1';

app.use(`${API}/health`, healthRouter);
app.use(`${API}/auth`, authRouter);
app.use(`${API}/crops`, cropsRouter);
app.use(`${API}/markets`, marketsRouter);
app.use(`${API}/prices`, pricesRouter);
app.use(`${API}/listings`, listingsRouter);
app.use(`${API}/alerts`, alertsRouter);
app.use(`${API}/users`, usersRouter);
app.use(`${API}/conversations`, conversationsRouter);
app.use(`${API}/ai`, aiRouter);

// ── Error handling ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
