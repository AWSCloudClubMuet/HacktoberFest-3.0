import React, { createContext, useContext, useState, useCallback } from 'react';

export const ROLES = {
  COORDINATOR: 'Relief Coordinator (Admin)',
  VOLUNTEER:   'Field Volunteer',
  OBSERVER:    'District Observer',
  MEDIC:       'Medical Lead',
};

/* ── Static credential store ─────────────────────────────── */
export const USERS = [
  {
    id:       'u1',
    name:     'Zara Khan',
    email:    'admin@reliefhub.pk',
    password: 'admin123',
    role:     ROLES.COORDINATOR,
    avatar:   '👩‍💼',
    district: 'All Districts',
  },
  {
    id:       'u2',
    name:     'Ali Raza',
    email:    'volunteer@reliefhub.pk',
    password: 'volunteer123',
    role:     ROLES.VOLUNTEER,
    avatar:   '🧑‍🤝‍🧑',
    district: 'Sukkur',
  },
  {
    id:       'u3',
    name:     'Dr. Sana Mirza',
    email:    'medic@reliefhub.pk',
    password: 'medic123',
    role:     ROLES.MEDIC,
    avatar:   '👩‍⚕️',
    district: 'Larkana',
  },
  {
    id:       'u4',
    name:     'Usman Bhutto',
    email:    'observer@reliefhub.pk',
    password: 'observer123',
    role:     ROLES.OBSERVER,
    avatar:   '🧑‍💻',
    district: 'Dadu',
  },
];

const RoleContext = createContext(null);

function loadSession() {
  try {
    const raw = localStorage.getItem('reliefhub_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function RoleProvider({ children }) {
  const [session, setSession] = useState(loadSession);

  /* role derived from session */
  const role = session?.role ?? ROLES.COORDINATOR;

  const login = useCallback((email, password) => {
    const user = USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) return { ok: false, error: 'Invalid email or password.' };
    const sess = { id: user.id, name: user.name, email: user.email,
                   role: user.role, avatar: user.avatar, district: user.district };
    localStorage.setItem('reliefhub_session', JSON.stringify(sess));
    setSession(sess);
    return { ok: true };
  }, []);

  /* Allow quick-switch from navbar (no password needed in active session) */
  const setRole = useCallback((newRole) => {
    if (!session) return;
    const updated = { ...session, role: newRole };
    localStorage.setItem('reliefhub_session', JSON.stringify(updated));
    setSession(updated);
  }, [session]);

  const logout = useCallback(() => {
    localStorage.removeItem('reliefhub_session');
    setSession(null);
  }, []);

  const isAdmin     = role === ROLES.COORDINATOR;
  const isVolunteer = role === ROLES.VOLUNTEER;
  const isObserver  = role === ROLES.OBSERVER;
  const isMedic     = role === ROLES.MEDIC;
  const isLoggedIn  = session !== null;

  return (
    <RoleContext.Provider
      value={{ role, setRole, login, logout, session,
               isAdmin, isVolunteer, isObserver, isMedic, isLoggedIn, ROLES, USERS }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within a RoleProvider');
  return ctx;
}
