// src/services/api.js
// Dual-backend Data Layer: Supabase (Production) with transparent JSON Server fallback (Local/Mock)
// Team 404 MERCY | KisanMandi

import { supabase, isSupabaseConfigured } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const isUsingSupabase = isSupabaseConfigured;

// ── HTTP JSON SERVER FALLBACK HELPER ─────────────────────────────────────────
async function http(path, options = {}) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── USERS / PROFILES ────────────────────────────────────────────────────────
export async function getUsers() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return (data || []).map(p => ({
      id: p.id,
      name: p.full_name,
      phone: p.phone,
      district: p.district,
      role: p.role,
    }));
  }
  return http('/users');
}

export async function createUser(userData) {
  if (isSupabaseConfigured()) {
    // When in Supabase mode, profile is created through Supabase Auth signup
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userData.id,
        full_name: userData.name,
        phone: userData.phone,
        district: userData.district,
        role: userData.role,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.full_name,
      phone: data.phone,
      district: data.district,
      role: data.role,
    };
  }
  return http('/users', { method: 'POST', body: JSON.stringify(userData) });
}

// ── CROPS ────────────────────────────────────────────────────────────────────
export async function getCrops() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('crops').select('*').order('name');
    if (error) throw error;
    return (data || []).map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      unit: c.unit,
      icon: c.icon,
      imageUrl: c.image_url ?? c.imageUrl ?? `/images/crops/${c.name.toLowerCase()}.jpg`,
    }));
  }
  const localCrops = await http('/crops');
  return (localCrops || []).map(c => ({
    ...c,
    imageUrl: c.imageUrl || `/images/crops/${c.name.toLowerCase()}.jpg`,
  }));
}

// ── MARKETS ──────────────────────────────────────────────────────────────────
export async function getMarkets() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('markets').select('*').order('name');
    if (error) throw error;
    return data || [];
  }
  return http('/markets');
}

// ── PRICES ───────────────────────────────────────────────────────────────────
export async function getPrices() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('prices')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(p => ({
      id: p.id,
      cropId: p.crop_id,
      marketId: p.market_id,
      date: p.date,
      price: Number(p.price),
    }));
  }
  return http('/prices');
}

export async function getPricesByMarket(marketId) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('prices')
      .select('*')
      .eq('market_id', marketId)
      .order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(p => ({
      id: p.id,
      cropId: p.crop_id,
      marketId: p.market_id,
      date: p.date,
      price: Number(p.price),
    }));
  }
  return http(`/prices?marketId=${marketId}`);
}

export async function getPricesByCropAndMarket(cropId, marketId) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('prices')
      .select('*')
      .eq('crop_id', cropId)
      .eq('market_id', marketId)
      .order('date', { ascending: true });
    if (error) throw error;
    return (data || []).map(p => ({
      id: p.id,
      cropId: p.crop_id,
      marketId: p.market_id,
      date: p.date,
      price: Number(p.price),
    }));
  }
  return http(`/prices?cropId=${cropId}&marketId=${marketId}&_sort=date`);
}

// ── LISTINGS ─────────────────────────────────────────────────────────────────
function mapListingFromDb(l) {
  if (!l) return null;
  return {
    id: l.id,
    sellerId: l.seller_id ?? l.sellerId,
    cropId: l.crop_id ?? l.cropId,
    district: l.district,
    quantity: Number(l.quantity),
    askingPrice: Number(l.asking_price ?? l.askingPrice),
    grade: l.grade,
    availableFrom: l.available_from ?? l.availableFrom,
    contactPhone: l.contact_phone ?? l.contactPhone,
    status: l.status,
    imageUrl: l.image_url ?? l.imageUrl ?? null,
    createdAt: l.created_at ?? l.createdAt,
  };
}

export async function getActiveListings() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapListingFromDb);
  }
  return http('/listings?status=active');
}

export async function getListingsBySeller(sellerId) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapListingFromDb);
  }
  return http(`/listings?sellerId=${sellerId}`);
}

export async function getListing(id) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return mapListingFromDb(data);
  }
  return http(`/listings/${id}`);
}

export async function createListing(data) {
  if (isSupabaseConfigured()) {
    const payload = {
      seller_id: data.sellerId,
      crop_id: data.cropId,
      district: data.district,
      quantity: Number(data.quantity),
      asking_price: Number(data.askingPrice),
      grade: data.grade,
      available_from: data.availableFrom,
      contact_phone: data.contactPhone,
      status: data.status || 'active',
      image_url: data.imageUrl || null,
    };
    const { data: created, error } = await supabase
      .from('listings')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return mapListingFromDb(created);
  }
  return http('/listings', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateListing(id, updates) {
  if (isSupabaseConfigured()) {
    const payload = {};
    if (updates.cropId !== undefined) payload.crop_id = updates.cropId;
    if (updates.district !== undefined) payload.district = updates.district;
    if (updates.quantity !== undefined) payload.quantity = Number(updates.quantity);
    if (updates.askingPrice !== undefined) payload.asking_price = Number(updates.askingPrice);
    if (updates.grade !== undefined) payload.grade = updates.grade;
    if (updates.availableFrom !== undefined) payload.available_from = updates.availableFrom;
    if (updates.contactPhone !== undefined) payload.contact_phone = updates.contactPhone;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
    payload.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('listings')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapListingFromDb(updated);
  }
  return http(`/listings/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
}

export async function deleteListing(id) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
  return http(`/listings/${id}`, { method: 'DELETE' });
}

// ── ALERTS ───────────────────────────────────────────────────────────────────
function mapAlertFromDb(a) {
  if (!a) return null;
  return {
    id: a.id,
    userId: a.user_id ?? a.userId,
    cropId: a.crop_id ?? a.cropId,
    marketId: a.market_id ?? a.marketId,
    condition: a.condition,
    targetPrice: Number(a.target_price ?? a.targetPrice),
    active: a.active,
    triggered: a.triggered,
  };
}

export async function getAlerts() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('alerts').select('*');
    if (error) throw error;
    return (data || []).map(mapAlertFromDb);
  }
  return http('/alerts');
}

export async function getAlertsByUser(userId) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map(mapAlertFromDb);
  }
  return http(`/alerts?userId=${userId}`);
}

export async function createAlert(data) {
  if (isSupabaseConfigured()) {
    const payload = {
      user_id: data.userId,
      crop_id: data.cropId,
      market_id: data.marketId,
      condition: data.condition,
      target_price: Number(data.targetPrice),
      active: data.active !== false,
      triggered: false,
    };
    const { data: created, error } = await supabase
      .from('alerts')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return mapAlertFromDb(created);
  }
  return http('/alerts', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateAlert(id, updates) {
  if (isSupabaseConfigured()) {
    const payload = {};
    if (updates.targetPrice !== undefined) payload.target_price = Number(updates.targetPrice);
    if (updates.condition !== undefined) payload.condition = updates.condition;
    if (updates.active !== undefined) payload.active = updates.active;
    if (updates.triggered !== undefined) {
      payload.triggered = updates.triggered;
      if (updates.triggered) {
        payload.triggered_at = new Date().toISOString();
      }
    }

    const { data: updated, error } = await supabase
      .from('alerts')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapAlertFromDb(updated);
  }
  return http(`/alerts/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
}

export async function deleteAlert(id) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
  return http(`/alerts/${id}`, { method: 'DELETE' });
}
