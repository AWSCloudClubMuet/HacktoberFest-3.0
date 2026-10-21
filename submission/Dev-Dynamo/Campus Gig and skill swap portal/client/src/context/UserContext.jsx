import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/api';
const Ctx = createContext(null);
export const useUser = () => useContext(Ctx);
export function UserProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [currentId, setCurrentId] = useState(+localStorage.getItem('uid') || 1);
  useEffect(() => { api.users().then(setUsers).catch(() => {}); }, []);
  const switchUser = id => { localStorage.setItem('uid', id); setCurrentId(id); };
  return <Ctx.Provider value={{ users, current: users.find(u => u.id === currentId), currentId, switchUser }}>{children}</Ctx.Provider>;
}
