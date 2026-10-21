// src/services/supabase.js
// Supabase Client, Authentication, and Realtime Subscription Manager
// Team 404 MERCY | KisanMandi

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('placeholder')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// ── AUTHENTICATION HELPERS ──────────────────────────────────────────────────

/**
 * Register a new user with Supabase Auth and write profile data.
 */
export async function signUpWithEmail({ email, password, fullName, phone, district, role }) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        district,
        role,
      },
    },
  });

  if (error) throw error;

  // If session is returned immediately (email confirmation disabled in Supabase), ensure profile exists
  if (data?.user) {
    const profile = {
      id: data.user.id,
      full_name: fullName,
      phone,
      district,
      role,
    };
    // Upsert profile in case trigger handled or didn't handle it
    await supabase.from('profiles').upsert(profile, { onConflict: 'id' });
    return { user: data.user, profile };
  }

  return data;
}

/**
 * Sign in an existing user with email and password.
 */
export async function signInWithEmail({ email, password }) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // Fetch full profile
  const profile = await getUserProfile(data.user.id);
  return { user: data.user, profile };
}

/**
 * Sign out current authenticated session.
 */
export async function signOutUser() {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Fetch profile for a specific user ID.
 */
export async function getUserProfile(userId) {
  if (!isSupabaseConfigured() || !userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.warn('[Supabase] Could not fetch profile:', error.message);
    return null;
  }
  return data;
}

/**
 * Update current user profile.
 */
export async function updateUserProfile(userId, updates) {
  if (!isSupabaseConfigured() || !userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get current authenticated session user and profile.
 */
export async function getCurrentAuthUser() {
  if (!isSupabaseConfigured()) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const profile = await getUserProfile(session.user.id);
  return {
    ...profile,
    id: session.user.id,
    email: session.user.email,
    name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email.split('@')[0],
    role: profile?.role || session.user.user_metadata?.role || 'farmer',
    phone: profile?.phone || session.user.user_metadata?.phone || '',
    district: profile?.district || session.user.user_metadata?.district || 'Hyderabad',
  };
}

// ── REALTIME MARKETPLACE SUBSCRIPTIONS ──────────────────────────────────────

/**
 * Subscribe to realtime changes on the listings table.
 * Returns the active channel for cleanup in component unmount.
 */
export function subscribeToListings({ onInsert, onUpdate, onDelete }) {
  if (!isSupabaseConfigured()) return null;

  const channel = supabase
    .channel('public:listings:changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'listings' },
      (payload) => {
        if (onInsert) onInsert(payload.new);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'listings' },
      (payload) => {
        if (onUpdate) onUpdate(payload.new);
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'listings' },
      (payload) => {
        if (onDelete) onDelete(payload.old);
      }
    )
    .subscribe((status) => {
      console.log(`[Realtime] Listings channel status: ${status}`);
    });

  return channel;
}

/**
 * Remove an active Realtime channel safely.
 */
export function unsubscribeChannel(channel) {
  if (!supabase || !channel) return;
  supabase.removeChannel(channel).catch((err) => {
    console.warn('[Realtime] Unsubscribe warning:', err);
  });
}

// ── SUPABASE STORAGE IMAGE UPLOAD ──────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Upload actual seller produce photo to Supabase Storage bucket 'product-images'.
 * Stores under folder `${userId}/${timestamp}-${sanitizedName}`.
 * Returns public URL.
 */
export async function uploadListingImage(file, userId) {
  if (!file) throw new Error('No file selected.');

  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Invalid file format. Only JPEG, PNG, and WebP images are permitted.');
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Image size exceeds 5MB limit. Please choose a smaller photo.');
  }

  if (isSupabaseConfigured() && supabase) {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId || 'anonymous'}/${Date.now()}-${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    return {
      url: publicData.publicUrl,
      path: data.path,
    };
  }

  // Local fallback: Convert to data URL for mock preview & persistence
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ url: reader.result, path: `local-${file.name}` });
    reader.onerror = () => reject(new Error('Failed to read image file locally.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Remove an uploaded listing image from Supabase Storage.
 */
export async function deleteListingImage(filePath) {
  if (!isSupabaseConfigured() || !supabase || !filePath || filePath.startsWith('data:') || filePath.startsWith('/')) {
    return;
  }
  try {
    await supabase.storage.from('product-images').remove([filePath]);
  } catch (err) {
    console.warn('[Storage] Could not delete image:', err.message);
  }
}


