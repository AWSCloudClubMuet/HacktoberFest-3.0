import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, COLLECTIONS, setApiRole } from '../api/client.js';
import { can as canDo } from '../../shared/domain.js';
import { useToast } from './ToastContext.jsx';

const DataContext = createContext(null);
const EMPTY = Object.fromEntries(COLLECTIONS.map((c) => [c, []]));
const ROLE_KEY = 'reliefhub.role';

function storedRole() {
  try {
    return localStorage.getItem(ROLE_KEY) === 'volunteer' ? 'volunteer' : 'admin';
  } catch {
    return 'admin';
  }
}

export function DataProvider({ children }) {
  const [data, setData] = useState(EMPTY);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [role, setRoleState] = useState(storedRole);
  setApiRole(role);

  // Fetches all six collections. Data volumes are small, so after every write
  // the UI reloads everything: derived numbers can never drift from the API.
  const reload = useCallback(async () => {
    try {
      const lists = await Promise.all(COLLECTIONS.map((c) => api[c].list()));
      setData(Object.fromEntries(COLLECTIONS.map((c, i) => [c, lists[i]])));
      setStatus('ready');
      setError(null);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err);
      setStatus((s) => (s === 'ready' ? 'ready' : 'error'));
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const setRole = useCallback((next) => {
    setApiRole(next);
    setRoleState(next);
    try {
      localStorage.setItem(ROLE_KEY, next);
    } catch {
      /* role just won't persist */
    }
  }, []);

  const value = useMemo(
    () => ({ ...data, status, error, updatedAt, reload, role, setRole, can: (action) => canDo(role, action) }),
    [data, status, error, updatedAt, reload, role, setRole],
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);

// Runs one write against the API with double-submit protection, a toast for
// the outcome, and a full reload so every view reflects the server state.
export function useAction() {
  const { reload } = useData();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const run = useCallback(
    async (fn, { success } = {}) => {
      if (busyRef.current) return { ok: false, skipped: true };
      busyRef.current = true;
      setBusy(true);
      try {
        const result = await fn();
        if (success) toast.success(typeof success === 'function' ? success(result) : success);
        await reload();
        return { ok: true, result };
      } catch (err) {
        toast.error(err.message);
        // e.g. a 409 means someone else changed the record: show the latest.
        if (err.status) await reload();
        return { ok: false, error: err };
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [reload, toast],
  );

  return { run, busy };
}
