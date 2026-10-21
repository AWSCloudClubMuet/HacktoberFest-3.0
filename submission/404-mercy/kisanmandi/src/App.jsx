import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import { getUsers } from './services/api';
import Onboarding from './components/Onboarding';
import AppShell from './components/AppShell';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    getUsers().then(setAllUsers).catch(console.error);
  }, []);

  const handleRegister = useCallback((user) => {
    setCurrentUser(user);
    setAllUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
  }, []);

  const handleSwitchUser = useCallback((user) => {
    setCurrentUser(user);
  }, []);

  if (!currentUser) {
    return <Onboarding onComplete={handleRegister} />;
  }

  return (
    <AppShell
      currentUser={currentUser}
      allUsers={allUsers}
      onSwitchUser={handleSwitchUser}
    />
  );
}
