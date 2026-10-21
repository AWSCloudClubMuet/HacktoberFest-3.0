import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAlerts, createAlert as apiCreateAlert, updateAlert as apiUpdateAlert, deleteAlert as apiDeleteAlert, getPrices, getCrops, getMarkets } from '../api.js';
import { isTriggered } from '../logic.js';
import { useAuth } from './AuthContext';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [prices, setPrices] = useState([]);
  const [crops, setCrops] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAndEvaluateAlerts = useCallback(async () => {
    if (!currentUser?.id) {
      setAlerts([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Fetch user alerts and current prices in parallel
      const [userAlerts, allPrices, allCrops, allMarkets] = await Promise.all([
        getAlerts({ user_id: currentUser.id }),
        getPrices(),
        getCrops(),
        getMarkets()
      ]);

      setCrops(allCrops || []);
      setMarkets(allMarkets || []);
      setPrices(allPrices || []);

      // Find latest date in prices ("Today")
      const latestDate = (allPrices || []).reduce(
        (max, p) => (p.date > max ? p.date : max),
        allPrices?.[0]?.date || ''
      );

      // Evaluate each alert using isTriggered(alert, latestPrice) from src/logic.js
      const evaluated = (userAlerts || []).map((alert) => {
        const cropMatch = (allCrops || []).find((c) => String(c.id) === String(alert.crop_id));
        const marketMatch = (allMarkets || []).find((m) => String(m.id) === String(alert.market_id));

        const priceItem = (allPrices || []).find(
          (p) =>
            String(p.crop_id) === String(alert.crop_id) &&
            String(p.market_id) === String(alert.market_id) &&
            p.date === latestDate
        );

        const latestPriceValue = priceItem ? Number(priceItem.price) : 0;
        const triggered = isTriggered(alert, latestPriceValue);

        return {
          ...alert,
          cropName: cropMatch?.name || 'Crop',
          marketName: marketMatch?.name || 'Market',
          latestPrice: latestPriceValue,
          triggered
        };
      });

      setAlerts(evaluated);
    } catch (err) {
      console.error('Alert evaluation error:', err);
      setError(err.message || 'Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchAndEvaluateAlerts();
  }, [fetchAndEvaluateAlerts]);

  // Create alert
  const createAlert = async (alertData) => {
    try {
      const payload = {
        id: `alt-${Date.now()}`,
        user_id: currentUser.id,
        crop_id: alertData.crop_id,
        market_id: alertData.market_id,
        condition: alertData.condition, // 'Above' or 'Below'
        target_price: Number(alertData.target_price),
        active_status: true
      };
      const created = await apiCreateAlert(payload);
      await fetchAndEvaluateAlerts();
      return created;
    } catch (err) {
      console.error('Failed to create alert:', err);
      throw err;
    }
  };

  // Toggle alert active_status
  const toggleAlertStatus = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await apiUpdateAlert(id, { active_status: newStatus });
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                active_status: newStatus,
                triggered: newStatus ? isTriggered({ ...a, active_status: true }, a.latestPrice) : false
              }
            : a
        )
      );
    } catch (err) {
      console.error('Failed to toggle alert status:', err);
      throw err;
    }
  };

  // Edit existing alert
  const editAlert = async (id, updates) => {
    try {
      const payload = {
        crop_id: updates.crop_id,
        market_id: updates.market_id,
        condition: updates.condition,
        target_price: Number(updates.target_price)
      };
      await apiUpdateAlert(id, payload);
      await fetchAndEvaluateAlerts();
    } catch (err) {
      console.error('Failed to update alert:', err);
      throw err;
    }
  };

  // Delete alert
  const deleteAlert = async (id) => {
    try {
      await apiDeleteAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Failed to delete alert:', err);
      throw err;
    }
  };

  // Triggered count for active alerts
  const triggeredAlerts = alerts.filter((a) => a.active_status && a.triggered);
  const unreadCount = triggeredAlerts.length;

  return (
    <AlertContext.Provider
      value={{
        alerts,
        crops,
        markets,
        triggeredAlerts,
        unreadCount,
        isLoading,
        error,
        createAlert,
        editAlert,
        toggleAlertStatus,
        deleteAlert,
        refreshAlerts: fetchAndEvaluateAlerts
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};

export default AlertContext;
