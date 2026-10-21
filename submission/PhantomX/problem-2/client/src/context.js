import { createContext, useContext } from 'react';

export const AppContext = createContext(null);
export const AuthContext = createContext(null);

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside App');
  return value;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside App');
  return value;
}
