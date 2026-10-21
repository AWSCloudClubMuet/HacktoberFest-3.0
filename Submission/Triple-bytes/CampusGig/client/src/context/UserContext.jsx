import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { getMe } from '../api/index.js';
import { clearSession, getToken, readProfile, saveProfile, saveSession } from '../api/session.js';

const UserContext = createContext(null);

const cachedUser = () => (getToken() ? readProfile() : null);

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(cachedUser);
  const [loading, setLoading] = useState(() => Boolean(getToken()) && !cachedUser());

  useEffect(() => {
    if (!getToken()) return undefined;
    let ignore = false;
    getMe()
      .then((user) => {
        if (ignore) return;
        saveProfile(user);
        setCurrentUser(user);
      })
      .catch(() => {})
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, []);

  const login = useCallback(({ token, user }) => {
    saveSession(token, user);
    setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setCurrentUser(null);
  }, []);

  const value = useMemo(() => ({ currentUser, loading, login, logout }), [currentUser, loading, login, logout]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useUser = () => useContext(UserContext);
