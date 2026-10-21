import { User, Crop, Market, PriceRecord, Listing, Alert } from '../types';
import {
  SEED_USERS,
  SEED_CROPS,
  SEED_MARKETS,
  SEED_PRICES,
  SEED_LISTINGS,
  SEED_ALERTS,
} from '../data/seedData';

const STORAGE_KEYS = {
  USERS: 'saawak_users_v1',
  CROPS: 'saawak_crops_v1',
  MARKETS: 'saawak_markets_v1',
  PRICES: 'saawak_prices_v1',
  LISTINGS: 'saawak_listings_v1',
  ALERTS: 'saawak_alerts_v1',
  CURRENT_USER_ID: 'saawak_active_user_id_v1',
  HAS_ONBOARDED: 'saawak_has_onboarded_v1',
};

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (e) {
    console.warn(`Failed to parse localStorage key ${key}`, e);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to set localStorage key ${key}`, e);
  }
}

export function loadUsers(): User[] {
  return getStored<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
}

export function saveUsers(users: User[]): void {
  setStored(STORAGE_KEYS.USERS, users);
}

export function loadCrops(): Crop[] {
  return getStored<Crop[]>(STORAGE_KEYS.CROPS, SEED_CROPS);
}

export function loadMarkets(): Market[] {
  return getStored<Market[]>(STORAGE_KEYS.MARKETS, SEED_MARKETS);
}

export function loadPrices(): PriceRecord[] {
  return getStored<PriceRecord[]>(STORAGE_KEYS.PRICES, SEED_PRICES);
}

export function loadListings(): Listing[] {
  return getStored<Listing[]>(STORAGE_KEYS.LISTINGS, SEED_LISTINGS);
}

export function saveListings(listings: Listing[]): void {
  setStored(STORAGE_KEYS.LISTINGS, listings);
}

export function loadAlerts(): Alert[] {
  return getStored<Alert[]>(STORAGE_KEYS.ALERTS, SEED_ALERTS);
}

export function saveAlerts(alerts: Alert[]): void {
  setStored(STORAGE_KEYS.ALERTS, alerts);
}

export function getActiveUserId(): string {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'user-01'; // Default: Demo Farmer Wadero Ali
}

export function setActiveUserId(id: string): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
}

export function getHasOnboarded(): boolean {
  return localStorage.getItem(STORAGE_KEYS.HAS_ONBOARDED) === 'true';
}

export function setHasOnboarded(val: boolean): void {
  localStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, val ? 'true' : 'false');
}

export function resetAllToSeedData(): void {
  setStored(STORAGE_KEYS.USERS, SEED_USERS);
  setStored(STORAGE_KEYS.CROPS, SEED_CROPS);
  setStored(STORAGE_KEYS.MARKETS, SEED_MARKETS);
  setStored(STORAGE_KEYS.PRICES, SEED_PRICES);
  setStored(STORAGE_KEYS.LISTINGS, SEED_LISTINGS);
  setStored(STORAGE_KEYS.ALERTS, SEED_ALERTS);
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'user-01');
}
