import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [currentId, setCurrentId] = useState(localStorage.getItem('currentUserId') || 'u1');

  useEffect(() => {
    api.getUsers().then(setUsers).catch(console.error);
  }, []);

  const switchUser = (id) => {
    setCurrentId(id);
    localStorage.setItem('currentUserId', id);
  };

  const currentUser = users.find((u) => u.id === currentId) || null;

  return (
    <UserContext.Provider value={{ users, currentUser, switchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);