import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, getStoredUserId, setStoredUserId } from "./api";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  // only "loading" if there is a saved user id to check
  const [loading, setLoading] = useState(() => getStoredUserId() !== null);

  const refreshUser = useCallback(async () => {
    if (getStoredUserId() === null) {
      setCurrentUser(null);
      return;
    }
    try {
      setCurrentUser(await api.getMe());
    } catch (err) {
      // saved id no longer exists (for example you deleted the database)
      if (err.status === 401) {
        setStoredUserId(null);
        setCurrentUser(null);
      }
    }
  }, []);

  useEffect(() => {
    if (getStoredUserId() === null) return;
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (userId) => {
    const previous = getStoredUserId();
    setStoredUserId(userId);
    try {
      setCurrentUser(await api.getMe());
    } catch (err) {
      setStoredUserId(previous); // undo if it failed
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setStoredUserId(null);
    setCurrentUser(null);
  }, []);

  return (
    <UserContext.Provider
      value={{ currentUser, loading, login, logout, refreshUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used inside <UserProvider>");
  return context;
}
