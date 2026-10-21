import fs from 'fs';
import path from 'path';
import {
  Camp,
  InventoryItem,
  CampNeed,
  Dispatch,
  Donation,
  Volunteer,
} from '../src/types/index.ts';
import { getInitialSeedData } from './seed-data.ts';

export interface DatabaseSchema {
  version: number;
  lastUpdated: string;
  camps: Camp[];
  inventory: InventoryItem[];
  needs: CampNeed[];
  dispatches: Dispatch[];
  donations: Donation[];
  volunteers: Volunteer[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'reliefhub-db.json');

// In-process serialized lock to guarantee atomic concurrency
class Mutex {
  private queue: (() => void)[] = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    if (!this.locked) {
      this.locked = true;
      return () => this.release();
    }
    return new Promise<() => void>((resolve) => {
      this.queue.push(() => {
        this.locked = true;
        resolve(() => this.release());
      });
    });
  }

  private release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      next();
    } else {
      this.locked = false;
    }
  }

  async runExclusive<T>(callback: () => Promise<T> | T): Promise<T> {
    const release = await this.acquire();
    try {
      return await callback();
    } finally {
      release();
    }
  }
}

const dbMutex = new Mutex();

function ensureDbDirectory(): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

export function loadDatabase(): DatabaseSchema {
  ensureDbDirectory();

  if (!fs.existsSync(DB_PATH)) {
    const seed = getInitialSeedData();
    const initialDb: DatabaseSchema = {
      version: 1,
      lastUpdated: new Date().toISOString(),
      ...seed,
    };
    saveDatabase(initialDb);
    return initialDb;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    // Basic structural integrity check
    if (
      !Array.isArray(parsed.camps) ||
      !Array.isArray(parsed.inventory) ||
      !Array.isArray(parsed.needs) ||
      !Array.isArray(parsed.dispatches) ||
      !Array.isArray(parsed.donations) ||
      !Array.isArray(parsed.volunteers)
    ) {
      throw new Error('Database schema integrity validation failed.');
    }
    return parsed;
  } catch (error) {
    console.warn('Database file corrupted or unreadable. Reinitializing from seeds:', error);
    const seed = getInitialSeedData();
    const fallbackDb: DatabaseSchema = {
      version: 1,
      lastUpdated: new Date().toISOString(),
      ...seed,
    };
    saveDatabase(fallbackDb);
    return fallbackDb;
  }
}

export function saveDatabase(data: DatabaseSchema): void {
  ensureDbDirectory();
  data.lastUpdated = new Date().toISOString();
  const tmpPath = `${DB_PATH}.tmp.${Date.now()}`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DB_PATH);
}

export async function withDbLock<T>(callback: (db: DatabaseSchema) => Promise<{ data?: T; result?: T; dbModified?: boolean }> | { data?: T; result?: T; dbModified?: boolean }): Promise<T> {
  return dbMutex.runExclusive(async () => {
    const db = loadDatabase();
    const outcome = await callback(db);
    if (outcome.dbModified !== false) {
      saveDatabase(db);
    }
    return (outcome.data !== undefined ? outcome.data : outcome.result) as T;
  });
}

export async function resetDatabase(): Promise<DatabaseSchema> {
  return dbMutex.runExclusive(async () => {
    const seed = getInitialSeedData();
    const resetDb: DatabaseSchema = {
      version: 1,
      lastUpdated: new Date().toISOString(),
      ...seed,
    };
    saveDatabase(resetDb);
    return resetDb;
  });
}

export function getDbStats() {
  const db = loadDatabase();
  return {
    filePath: DB_PATH,
    lastUpdated: db.lastUpdated,
    campsCount: db.camps.length,
    inventoryCount: db.inventory.length,
    needsCount: db.needs.length,
    dispatchesCount: db.dispatches.length,
    donationsCount: db.donations.length,
    volunteersCount: db.volunteers.length,
  };
}
