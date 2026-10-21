import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole, AppNotification } from '../types/index.ts';
import { api } from '../services/api.ts';

export type NavigationTab =
  | 'overview'
  | 'camps'
  | 'inventory'
  | 'needs'
  | 'dispatches'
  | 'donations'
  | 'volunteers'
  | 'demo';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  refreshKey: number;
  triggerRefresh: () => void;
  toasts: ToastItem[];
  notify: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
  dismissToast: (id: string) => void;
  backendOnline: boolean | null;
  checkBackendHealth: () => Promise<void>;
  // Quick action navigation state
  preselectedNeedForDispatch: string | null;
  setPreselectedNeedForDispatch: (needId: string | null) => void;
  preselectedCampFilter: string | null;
  setPreselectedCampFilter: (campId: string | null) => void;
  // Feature 4: In-App Notification Center
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  toggleNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('admin');
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [preselectedNeedForDispatch, setPreselectedNeedForDispatch] = useState<string | null>(null);
  const [preselectedCampFilter, setPreselectedCampFilter] = useState<string | null>(null);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    api.setRole(newRole);
  };

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const notify = useCallback((type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const checkBackendHealth = useCallback(async () => {
    try {
      await api.getHealth();
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  // Notification state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('reliefhub_read_notifications');
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch {
      // Fallback in case localStorage is restricted
    }
    return new Set<string>();
  });

  const toggleNotificationRead = useCallback((id: string) => {
    setReadNotificationIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      try {
        localStorage.setItem('reliefhub_read_notifications', JSON.stringify(Array.from(updated)));
      } catch {}
      return updated;
    });
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((current) => {
      const allIds = new Set(current.map((n) => n.id));
      setReadNotificationIds(allIds);
      try {
        localStorage.setItem('reliefhub_read_notifications', JSON.stringify(Array.from(allIds)));
      } catch {}
      return current;
    });
  }, []);

  // Fetch condition-based notifications from actual backend records
  useEffect(() => {
    let mounted = true;
    const fetchNotifications = async () => {
      try {
        const [gaps, inventory, delays, camps] = await Promise.all([
          api.getCriticalGaps(),
          api.getInventory({ lowStockOnly: true }),
          api.getDispatchDelays(24),
          api.getCamps({ status: 'Full' }),
        ]);

        if (!mounted) return;

        const notifs: AppNotification[] = [];

        // 1. Critical Gaps
        for (const gap of gaps) {
          notifs.push({
            id: `gap-${gap.need_id}`,
            type: 'critical_gap',
            title: `Critical Supply Gap: ${gap.camp_name}`,
            message: `${gap.item_name} is at ${gap.fulfilment_percentage}% fulfilment. ${gap.remaining_quantity} ${gap.item_unit} required immediately in ${gap.district}.`,
            timestamp: 'Urgent Action Required',
            targetTab: 'needs',
            targetId: gap.need_id,
            read: readNotificationIds.has(`gap-${gap.need_id}`),
            priority: 'critical',
          });
        }

        // 2. Low Stock Alerts
        for (const item of inventory) {
          notifs.push({
            id: `stock-${item.id}`,
            type: 'low_stock',
            title: `Low Depot Stock: ${item.name}`,
            message: `Available stock (${item.stock} ${item.unit}) is at or below reorder threshold (${item.reorder_level} ${item.unit}).`,
            timestamp: 'Depot Warning',
            targetTab: 'inventory',
            targetId: item.id,
            read: readNotificationIds.has(`stock-${item.id}`),
            priority: 'warning',
          });
        }

        // 3. Dispatch Delay Alerts
        for (const d of delays) {
          notifs.push({
            id: `delay-${d.dispatch_id}`,
            type: 'dispatch_delay',
            title: `Convoy Delayed: ${d.camp_name}`,
            message: `Shipment #${d.dispatch_id.slice(-6)} (${d.quantity} ${d.item_unit} of ${d.item_name}) has remained ${d.status} for ${d.elapsed_display}.`,
            timestamp: `Delayed ${d.elapsed_display}`,
            targetTab: 'dispatches',
            targetId: d.dispatch_id,
            read: readNotificationIds.has(`delay-${d.dispatch_id}`),
            priority: d.delay_level,
          });
        }

        // 4. Camp Full Capacity Alerts
        for (const camp of camps) {
          notifs.push({
            id: `camp-full-${camp.id}`,
            type: 'camp_full',
            title: `Camp at Full Capacity: ${camp.name}`,
            message: `${camp.name} (${camp.district}) is sheltering ${camp.current_families} / ${camp.capacity} families (100% capacity). Divert incoming evacuees.`,
            timestamp: 'Shelter Alert',
            targetTab: 'camps',
            targetId: camp.id,
            read: readNotificationIds.has(`camp-full-${camp.id}`),
            priority: 'warning',
          });
        }

        setNotifications(notifs);
      } catch (err) {
        // Silently tolerate if offline
      }
    };

    fetchNotifications();
    return () => {
      mounted = false;
    };
  }, [refreshKey, readNotificationIds]);

  const unreadNotificationsCount = notifications.filter((n) => !readNotificationIds.has(n.id)).length;

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        activeTab,
        setActiveTab,
        refreshKey,
        triggerRefresh,
        toasts,
        notify,
        dismissToast,
        backendOnline,
        checkBackendHealth,
        preselectedNeedForDispatch,
        setPreselectedNeedForDispatch,
        preselectedCampFilter,
        setPreselectedCampFilter,
        notifications,
        unreadNotificationsCount,
        toggleNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
