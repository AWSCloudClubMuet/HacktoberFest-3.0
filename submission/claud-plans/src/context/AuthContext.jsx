import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUsers, createUser } from '../api.js';

const AuthContext = createContext();

export const KISAN_USER_KEY = 'kisan_user';

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(KISAN_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(data || []);
      // If we have currentUser, verify if it still exists or sync
      const saved = localStorage.getItem(KISAN_USER_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const found = (data || []).find((u) => String(u.id) === String(parsed.id));
          if (found) {
            setCurrentUser(found);
            localStorage.setItem(KISAN_USER_KEY, JSON.stringify(found));
          }
        } catch {
          // ignore parse error
        }
      }
    } catch (err) {
      console.error('Failed to load users from API:', err);
      setError(err.message || 'Failed to connect to API server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Save new user from Onboarding form
  const registerUser = async ({ name, phone, district, role }) => {
    try {
      // Validate all fields
      if (!name?.trim() || !phone?.trim() || !district?.trim() || !role?.trim()) {
        throw new Error('All fields are required.');
      }

      // Format role as capitalized 'Farmer' or 'Buyer'
      const formattedRole = role.toLowerCase() === 'buyer' ? 'Buyer' : 'Farmer';

      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        district: district.trim(),
        role: formattedRole
      };

      const createdUser = await createUser(payload);
      setUsers((prev) => [...prev, createdUser]);
      setCurrentUser(createdUser);
      localStorage.setItem(KISAN_USER_KEY, JSON.stringify(createdUser));
      return createdUser;
    } catch (err) {
      console.error('Registration failed:', err);
      throw err;
    }
  };

  // Switch to another existing user (for quick testing)
  const switchUser = (userId) => {
    const found = users.find((u) => String(u.id) === String(userId));
    if (found) {
      setCurrentUser(found);
      localStorage.setItem(KISAN_USER_KEY, JSON.stringify(found));
    }
  };

  // Clear localStorage for switch user / logout testing
  const clearUser = () => {
    localStorage.removeItem(KISAN_USER_KEY);
    setCurrentUser(null);
  };

  const isFarmer = (currentUser?.role || '').toLowerCase() === 'farmer';
  const isBuyer = (currentUser?.role || '').toLowerCase() === 'buyer';

  return (
    <AuthContext.Provider
      value={{
        users,
        currentUser,
        isLoading,
        error,
        registerUser,
        switchUser,
        clearUser,
        refreshUsers: loadUsers,
        isFarmer,
        isBuyer
      }}
    >
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

export default AuthContext;
