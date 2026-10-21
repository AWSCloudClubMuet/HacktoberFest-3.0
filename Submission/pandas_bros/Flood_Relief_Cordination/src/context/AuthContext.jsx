import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const DEMO_USERS = {
  admin: {
    id: 'user-admin',
    name: 'Relief Coordinator',
    email: 'admin@reliefhub.org',
    role: 'admin',
    password: 'admin123',
  },
  volunteer: {
    id: 'user-volunteer',
    name: 'Field Volunteer',
    email: 'volunteer@reliefhub.org',
    role: 'volunteer',
    password: 'volunteer123',
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('reliefhub_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('reliefhub_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((email, password) => {
    let matchedUser = null;
    
    for (const key in DEMO_USERS) {
      const u = DEMO_USERS[key];
      if (u.email === email && u.password === password) {
        matchedUser = { ...u };
        delete matchedUser.password;
        break;
      }
    }
    
    if (!matchedUser) {
      throw new Error('Invalid credentials');
    }
    
    localStorage.setItem('reliefhub_user', JSON.stringify(matchedUser));
    setUser(matchedUser);
    return matchedUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('reliefhub_user');
    setUser(null);
  }, []);

  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    
    const permissions = {
      admin: ['*'],
      volunteer: [
        'camps.view',
        'camps.view_details',
        'needs.view',
        'needs.view_details',
        'dispatches.view',
        'dispatches.view_details',
        'dashboard.view',
      ],
    };
    
    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }, [user]);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};