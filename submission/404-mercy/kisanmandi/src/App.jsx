import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import { supabase, isSupabaseConfigured, getCurrentAuthUser, signOutUser } from './services/supabase';
import AuthScreen from './components/AuthScreen';
import AppShell from './components/AppShell';

const LOCAL_STORAGE_KEY = 'kisanmandi_local_user';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Initialize auth session
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        if (isSupabaseConfigured() && supabase) {
          // Check for active Supabase session
          const user = await getCurrentAuthUser();
          if (mounted && user) {
            setCurrentUser(user);
          }

          // Listen for Supabase auth state changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              if (event === 'SIGNED_IN' && session?.user) {
                const profile = await getCurrentAuthUser();
                if (mounted) setCurrentUser(profile);
              } else if (event === 'SIGNED_OUT') {
                if (mounted) setCurrentUser(null);
              }
            }
          );

          return () => {
            subscription?.unsubscribe();
          };
        } else {
          // Local fallback: retrieve saved session if any
          const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (saved && mounted) {
            try {
              setCurrentUser(JSON.parse(saved));
            } catch {
              localStorage.removeItem(LOCAL_STORAGE_KEY);
            }
          }
        }
      } catch (err) {
        console.error('[App] Auth init error:', err);
      } finally {
        if (mounted) setInitializing(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const handleAuthSuccess = useCallback((user) => {
    setCurrentUser(user);
    if (!isSupabaseConfigured()) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
    }
  }, []);

  const handleLogout = useCallback(async () => {
    if (isSupabaseConfigured()) {
      await signOutUser().catch(console.error);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    setCurrentUser(null);
  }, []);

  if (initializing) {
    return (
      <div className="onboard-wrap">
        <div style={{ textAlign: 'center', color: 'var(--white)' }}>
          <img
            src="/images/kisanmandi-logo.png"
            alt="KisanMandi logo"
            style={{ width: 80, height: 80, objectFit: 'contain', margin: '0 auto 1rem', display: 'block', borderRadius: 12, background: 'var(--white)', padding: 4, boxShadow: 'var(--shadow)' }}
          />
          <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'var(--white)', margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '.9rem' }}>Loading KisanMandi…</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <AppShell
      currentUser={currentUser}
      onLogout={handleLogout}
    />
  );
}
