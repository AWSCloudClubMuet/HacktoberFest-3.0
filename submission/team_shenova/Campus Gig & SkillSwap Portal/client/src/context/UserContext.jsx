// client/src/context/UserContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);

      const savedId = localStorage.getItem('campus_portal_acting_user_id') || localStorage.getItem('shenova_acting_user_id');
      const found = data.find(u => u.id === savedId) || data[0];
      setCurrentUser(found || null);
      if (found) {
        localStorage.setItem('campus_portal_acting_user_id', found.id);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const switchUser = (userId) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('campus_portal_acting_user_id', found.id);
    }
  };

  const refreshCurrentUser = async () => {
    if (!currentUser) return;
    try {
      const refreshed = await api.getUser(currentUser.id);
      setCurrentUser(refreshed);
      // Also update in users list
      setUsers(prev => prev.map(u => u.id === refreshed.id ? refreshed : u));
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  };

  const createUserProfile = async (userData) => {
    const newUser = await api.createUser(userData);
    const updatedUsers = await api.getUsers();
    setUsers(updatedUsers);
    const found = updatedUsers.find(u => u.id === newUser.id) || newUser;
    setCurrentUser(found);
    localStorage.setItem('campus_portal_acting_user_id', found.id);
    return found;
  };

  return (
    <UserContext.Provider value={{
      users,
      currentUser,
      switchUser,
      refreshCurrentUser,
      reloadUsers: fetchUsers,
      createUserProfile,
      loading,
      error
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
