import { createContext, useContext, useMemo, useState } from 'react';

const UserContext = createContext(null);

function readUser() {
  try { return JSON.parse(localStorage.getItem('kisanmandi_user')) || null; }
  catch { return null; }
}

export function UserProvider({ children }) {
  const [user, setUserState] = useState(readUser);
  const setUser = (next) => {
    setUserState(next);
    if (next) localStorage.setItem('kisanmandi_user', JSON.stringify(next));
    else localStorage.removeItem('kisanmandi_user');
  };
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useUser = () => useContext(UserContext);
