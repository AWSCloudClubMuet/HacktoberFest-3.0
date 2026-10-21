// ============================================================
// Frontend API service — connects to saa-wak Express backend
// Falls back to localStorage seed data when VITE_API_BASE_URL is empty
// ============================================================
import { User, Crop, Market, PriceRecord, Listing, Alert } from '../types';
import {
  loadUsers,
  loadCrops,
  loadMarkets,
  loadPrices,
  loadListings,
  saveListings,
  loadAlerts,
  saveAlerts,
  getActiveUserId,
  setActiveUserId,
  resetAllToSeedData,
} from './storage';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const USE_BACKEND = Boolean(API_BASE_URL);

// ── Auth token management ─────────────────────────────────────
let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
  if (token) {
    localStorage.setItem('saawak_token', token);
  } else {
    localStorage.removeItem('saawak_token');
  }
}

export function getAuthToken(): string | null {
  if (_authToken) return _authToken;
  _authToken = localStorage.getItem('saawak_token');
  return _authToken;
}

// ── Error class ───────────────────────────────────────────────
export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// ── Core fetch wrapper ────────────────────────────────────────
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { ...options, headers, credentials: 'include' });

    if (!response.ok) {
      let errorBody: { message?: string } | string | null = null;
      try { errorBody = await response.json(); } catch { errorBody = await response.text(); }
      const msg = (typeof errorBody === 'object' && errorBody?.message) || `HTTP ${response.status}`;
      throw new ApiError(msg, response.status, errorBody);
    }

    // Handle 204 No Content
    if (response.status === 204) return undefined as T;

    const data = await response.json();
    // Backend wraps in { success, data } — unwrap automatically
    return (data?.data !== undefined ? data.data : data) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError((err as Error)?.message || 'Network request failed', 0, err);
  }
}

const LOCAL_DELAY_MS = 80;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface ListingFilterParams {
  cropId?: string;
  marketId?: string;
  district?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  searchQuery?: string;
}

// ============================================================
// AUTH
// ============================================================

export interface AuthResult {
  token: string;
  user: User & { email: string };
}

export async function register(data: {
  email: string;
  displayName: string;
  password: string;
  role: 'farmer' | 'buyer';
  district: string;
  phone?: string;
}): Promise<AuthResult> {
  const result = await request<AuthResult>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setAuthToken(result.token);
  return result;
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const raw = await request<{ token: string; user: User & { email: string } }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(raw.token);
  return raw;
}

export async function ensureDemoAuth(): Promise<void> {
  if (!USE_BACKEND || getAuthToken()) return;
  try {
    await login('farmer.ali@demo.saawak', 'Demo@1234');
  } catch (err) {
    console.warn('Auto demo auth warning:', err);
  }
}

export async function logout(): Promise<void> {
  if (USE_BACKEND) {
    try { await request<void>('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
  }
  setAuthToken(null);
}

export async function getMe(): Promise<(User & { email: string }) | null> {
  if (!USE_BACKEND || !getAuthToken()) return null;
  try {
    return await request<User & { email: string }>('/auth/me');
  } catch {
    return null;
  }
}

// ============================================================
// USERS
// ============================================================

export async function getUsers(): Promise<User[]> {
  if (USE_BACKEND) {
    return request<User[]>('/users');
  }
  await delay(LOCAL_DELAY_MS);
  return loadUsers();
}

export async function getCurrentUser(): Promise<User> {
  if (USE_BACKEND) {
    const me = await getMe();
    if (me && (me as any).displayName) return me;
    if (me && (me as any).user) return (me as any).user;
  }
  const users = loadUsers();
  const activeId = getActiveUserId();
  return users.find((u) => u.id === activeId) || users[0];
}

export function setCurrentUserId(userId: string): void {
  setActiveUserId(userId);
}

// ============================================================
// CROPS
// ============================================================

export async function getCrops(): Promise<Crop[]> {
  if (USE_BACKEND) {
    const list = await request<Crop[]>('/crops');
    return list.filter((c) => c.isActive);
  }
  await delay(LOCAL_DELAY_MS);
  return loadCrops().filter((c) => c.isActive);
}

// ============================================================
// MARKETS
// ============================================================

export async function getMarkets(): Promise<Market[]> {
  if (USE_BACKEND) {
    const list = await request<Market[]>('/markets');
    return list.filter((m) => m.isActive);
  }
  await delay(LOCAL_DELAY_MS);
  return loadMarkets().filter((m) => m.isActive);
}

// ============================================================
// PRICES
// ============================================================

export async function getPrices(cropId?: string, marketId?: string): Promise<PriceRecord[]> {
  if (USE_BACKEND) {
    const params = new URLSearchParams();
    if (cropId) params.append('cropId', cropId);
    if (marketId) params.append('marketId', marketId);
    params.append('limit', '350');
    return request<PriceRecord[]>(`/prices?${params}`);
  }
  await delay(LOCAL_DELAY_MS);
  let prices = loadPrices();
  if (cropId) prices = prices.filter((p) => p.cropId === cropId);
  if (marketId) prices = prices.filter((p) => p.marketId === marketId);
  return prices;
}

export async function getPriceHistory(cropId: string, marketId: string): Promise<PriceRecord[]> {
  if (USE_BACKEND) {
    return request<PriceRecord[]>(`/prices/history?cropId=${encodeURIComponent(cropId)}&marketId=${encodeURIComponent(marketId)}`);
  }
  await delay(LOCAL_DELAY_MS);
  return loadPrices()
    .filter((p) => p.cropId === cropId && p.marketId === marketId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ============================================================
// LISTINGS
// ============================================================

export async function getListings(filters?: ListingFilterParams): Promise<Listing[]> {
  if (USE_BACKEND) {
    const params = new URLSearchParams();
    if (filters?.cropId && filters.cropId !== 'all') params.append('cropId', filters.cropId);
    if (filters?.marketId && filters.marketId !== 'all') params.append('marketId', filters.marketId);
    if (filters?.district && filters.district !== 'all') params.append('district', filters.district);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    const qs = params.toString() ? `?${params}` : '';
    let list = await request<Listing[]>(`/listings${qs}`);
    // Client-side price / search filters
    if (filters?.minPrice !== undefined && !isNaN(filters.minPrice))
      list = list.filter((l) => l.askingPricePerUnit >= filters.minPrice!);
    if (filters?.maxPrice !== undefined && !isNaN(filters.maxPrice))
      list = list.filter((l) => l.askingPricePerUnit <= filters.maxPrice!);
    if (filters?.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter(
        (l) => l.description?.toLowerCase().includes(q) || l.grade.toLowerCase().includes(q) || l.district.toLowerCase().includes(q)
      );
    }
    return list;
  }
  await delay(LOCAL_DELAY_MS);
  let list = loadListings();
  if (filters) {
    if (filters.cropId && filters.cropId !== 'all') list = list.filter((l) => l.cropId === filters.cropId);
    if (filters.marketId && filters.marketId !== 'all') list = list.filter((l) => l.marketId === filters.marketId);
    if (filters.district && filters.district !== 'all') list = list.filter((l) => l.district.toLowerCase() === filters.district?.toLowerCase());
    if (filters.status && filters.status !== 'all') list = list.filter((l) => l.status === filters.status);
    if (filters.minPrice !== undefined && !isNaN(filters.minPrice)) list = list.filter((l) => l.askingPricePerUnit >= filters.minPrice!);
    if (filters.maxPrice !== undefined && !isNaN(filters.maxPrice)) list = list.filter((l) => l.askingPricePerUnit <= filters.maxPrice!);
    if (filters.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter((l) => l.description?.toLowerCase().includes(q) || l.grade.toLowerCase().includes(q) || l.district.toLowerCase().includes(q));
    }
  }
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getListingById(id: string): Promise<Listing | null> {
  if (USE_BACKEND) {
    try { return await request<Listing>(`/listings/${encodeURIComponent(id)}`); }
    catch { return null; }
  }
  await delay(LOCAL_DELAY_MS);
  return loadListings().find((l) => l.id === id) || null;
}

export async function createListing(payload: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>): Promise<Listing> {
  if (USE_BACKEND) {
    return request<Listing>('/listings', { method: 'POST', body: JSON.stringify(payload) });
  }
  await delay(LOCAL_DELAY_MS);
  const now = new Date().toISOString();
  const newListing: Listing = { ...payload, id: `listing-${Date.now()}`, createdAt: now, updatedAt: now };
  saveListings([newListing, ...loadListings()]);
  return newListing;
}

export async function updateListing(id: string, updates: Partial<Omit<Listing, 'id' | 'createdAt'>>): Promise<Listing> {
  if (USE_BACKEND) {
    return request<Listing>(`/listings/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(updates) });
  }
  await delay(LOCAL_DELAY_MS);
  const list = loadListings();
  const idx = list.findIndex((l) => l.id === id);
  if (idx === -1) throw new ApiError(`Listing ${id} not found`, 404);
  list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
  saveListings(list);
  return list[idx];
}

export async function deleteListing(id: string): Promise<boolean> {
  if (USE_BACKEND) {
    await request<void>(`/listings/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return true;
  }
  await delay(LOCAL_DELAY_MS);
  saveListings(loadListings().filter((l) => l.id !== id));
  return true;
}

// ============================================================
// ALERTS
// ============================================================

export async function getAlerts(userId?: string): Promise<Alert[]> {
  if (USE_BACKEND) {
    if (!getAuthToken()) return [];
    try {
      return await request<Alert[]>('/alerts');
    } catch {
      return [];
    }
  }
  await delay(LOCAL_DELAY_MS);
  let list = loadAlerts();
  if (userId) list = list.filter((a) => a.userId === userId);
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createAlert(payload: Omit<Alert, 'id' | 'createdAt' | 'lastEvaluatedPrice' | 'lastTriggeredAt'>): Promise<Alert> {
  if (USE_BACKEND) {
    return request<Alert>('/alerts', { method: 'POST', body: JSON.stringify(payload) });
  }
  await delay(LOCAL_DELAY_MS);
  const now = new Date().toISOString();
  const newAlert: Alert = { ...payload, id: `alert-${Date.now()}`, createdAt: now, lastEvaluatedPrice: null, lastTriggeredAt: null };
  saveAlerts([newAlert, ...loadAlerts()]);
  return newAlert;
}

export async function updateAlert(id: string, updates: Partial<Omit<Alert, 'id' | 'createdAt'>>): Promise<Alert> {
  if (USE_BACKEND) {
    return request<Alert>(`/alerts/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(updates) });
  }
  await delay(LOCAL_DELAY_MS);
  const list = loadAlerts();
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) throw new ApiError(`Alert ${id} not found`, 404);
  list[idx] = { ...list[idx], ...updates };
  saveAlerts(list);
  return list[idx];
}

export async function deleteAlert(id: string): Promise<boolean> {
  if (USE_BACKEND) {
    await request<void>(`/alerts/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return true;
  }
  await delay(LOCAL_DELAY_MS);
  saveAlerts(loadAlerts().filter((a) => a.id !== id));
  return true;
}

export async function evaluateAlerts(
  userId?: string,
  existingAlerts?: Alert[],
  existingPrices?: PriceRecord[]
): Promise<{ alerts: Alert[]; triggeredCount: number }> {
  const alerts = existingAlerts || (await getAlerts());
  const prices = existingPrices || (await getPrices());

  const latestPriceMap = new Map<string, PriceRecord>();
  prices.forEach((p) => {
    const key = `${p.cropId}_${p.marketId}`;
    const ex = latestPriceMap.get(key);
    if (!ex || p.date.localeCompare(ex.date) > 0) latestPriceMap.set(key, p);
  });

  let triggeredCount = 0;
  const now = new Date().toISOString();

  const evaluated = alerts.map((alert) => {
    if (!alert.isEnabled) return alert;
    const key = `${alert.cropId}_${alert.marketId}`;
    const rec = latestPriceMap.get(key);
    if (!rec) return alert;
    const cp = rec.price;
    const isTriggered = (alert.condition === 'above' && cp >= alert.targetPrice) || (alert.condition === 'below' && cp <= alert.targetPrice);
    if (isTriggered && (!userId || alert.userId === userId)) triggeredCount++;
    return {
      ...alert,
      lastEvaluatedPrice: cp,
      lastTriggeredAt: isTriggered ? now : alert.lastTriggeredAt,
    };
  });

  if (!USE_BACKEND) saveAlerts(evaluated);
  return { alerts: evaluated, triggeredCount };
}

// ============================================================
// AI ASSISTANT
// ============================================================

export async function askAI(message: string, context?: { cropId?: string; marketId?: string; listingId?: string }): Promise<string> {
  if (!USE_BACKEND) {
    return 'AI assistant requires the backend to be running. Please configure VITE_API_BASE_URL in your .env file.';
  }
  const result = await request<{ response: string; disclaimer: string }>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, context }),
  });
  return result.response;
}

// ============================================================
// CONVERSATIONS (Messaging)
// ============================================================

export interface ConversationSummary {
  id: string;
  user1Id: string;
  user2Id: string;
  listingId: string | null;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  messages?: MessageData[];
  user1?: { id: string; displayName: string; role: string };
  user2?: { id: string; displayName: string; role: string };
}

export interface MessageData {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  readAt: string | null;
}

export async function getConversations(): Promise<ConversationSummary[]> {
  if (!USE_BACKEND) return [];
  return request<ConversationSummary[]>('/conversations');
}

export async function getConversation(id: string): Promise<ConversationSummary | null> {
  if (!USE_BACKEND) return null;
  try { return await request<ConversationSummary>(`/conversations/${id}`); }
  catch { return null; }
}

export async function createConversation(recipientId: string, listingId?: string, initialMessage?: string): Promise<ConversationSummary> {
  return request<ConversationSummary>('/conversations', {
    method: 'POST',
    body: JSON.stringify({ recipientId, listingId, initialMessage }),
  });
}

export async function sendMessage(conversationId: string, text: string): Promise<MessageData> {
  return request<MessageData>(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function markConversationRead(conversationId: string): Promise<void> {
  if (!USE_BACKEND) return;
  await request<void>(`/conversations/${conversationId}/read`, { method: 'PATCH' });
}

// ============================================================
// MISC
// ============================================================

export async function resetDatabase(): Promise<void> {
  await delay(LOCAL_DELAY_MS);
  resetAllToSeedData();
}
