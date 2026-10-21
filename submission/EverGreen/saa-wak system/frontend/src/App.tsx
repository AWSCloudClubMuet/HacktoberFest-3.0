import React, { useState, useEffect, useCallback } from 'react';
import { User, Crop, Market, PriceRecord, Listing, Alert } from './types';
import * as api from './lib/api';
import {
  getHasOnboarded,
  setHasOnboarded,
  loadUsers,
  loadCrops,
  loadMarkets,
  loadPrices,
  loadListings,
  loadAlerts,
  getActiveUserId,
} from './lib/storage';
import { AppShell, NavTab } from './components/AppShell';
import { OnboardingModal } from './components/OnboardingModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ListingFormModal } from './components/ListingFormModal';
import { AlertFormModal } from './components/AlertFormModal';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { PricesPage } from './pages/PricesPage';
import { InsightsPage } from './pages/InsightsPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { AlertsPage } from './pages/AlertsPage';
import { ProfitCalculatorPage } from './pages/ProfitCalculatorPage';
import { MyListingsPage } from './pages/MyListingsPage';
import { MessagingPanel } from './components/MessagingPanel';
import { AiAssistantPanel } from './components/AiAssistantPanel';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [allUsers, setAllUsers] = useState<User[]>(() => loadUsers());
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const users = loadUsers();
    const activeId = getActiveUserId();
    return users.find((u) => u.id === activeId) || users[0] || null;
  });
  const [crops, setCrops] = useState<Crop[]>(() => loadCrops());
  const [markets, setMarkets] = useState<Market[]>(() => loadMarkets());
  const [allPrices, setAllPrices] = useState<PriceRecord[]>(() => loadPrices());
  const [listings, setListings] = useState<Listing[]>(() => loadListings());
  const [alerts, setAlerts] = useState<Alert[]>(() => loadAlerts());

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isEvaluatingAlerts, setIsEvaluatingAlerts] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Navigation contextual hints
  const [insightsCropId, setInsightsCropId] = useState<string>('crop-wheat');
  const [insightsMarketId, setInsightsMarketId] = useState<string>('market-hyd');

  // Quick modals accessible globally
  const [isGlobalListingModalOpen, setIsGlobalListingModalOpen] = useState(false);
  const [isGlobalAlertModalOpen, setIsGlobalAlertModalOpen] = useState(false);
  const [globalAlertPrefill, setGlobalAlertPrefill] = useState<{ cropId?: string; marketId?: string }>({});

  const addToast = (type: 'success' | 'error' | 'info', text: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial load & background sync
  const loadInitialData = useCallback(async () => {
    try {
      await api.ensureDemoAuth();

      const [uList, curUser, cList, mList, pList, lList, aList] = await Promise.all([
        api.getUsers(),
        api.getCurrentUser(),
        api.getCrops(),
        api.getMarkets(),
        api.getPrices(),
        api.getListings(),
        api.getAlerts(),
      ]);

      if (uList && uList.length > 0) setAllUsers(uList);
      if (curUser) setCurrentUser(curUser);
      if (cList && cList.length > 0) setCrops(cList);
      if (mList && mList.length > 0) setMarkets(mList);
      if (pList && pList.length > 0) setAllPrices(pList);
      if (lList && lList.length > 0) setListings(lList);
      if (aList && aList.length > 0) setAlerts(aList);

      // Evaluate alerts immediately in memory without duplicate network roundtrips
      if (curUser) {
        const { alerts: evaluatedAlerts, triggeredCount } = await api.evaluateAlerts(
          curUser.id,
          aList && aList.length > 0 ? aList : undefined,
          pList && pList.length > 0 ? pList : undefined
        );
        if (evaluatedAlerts && evaluatedAlerts.length > 0) setAlerts(evaluatedAlerts);

        if (!getHasOnboarded()) {
          setIsOnboardingOpen(true);
        } else if (triggeredCount > 0 && curUser.role === 'farmer') {
          addToast('info', `${triggeredCount} price alert condition(s) currently met today!`);
        }
      }

      setLastRefreshedAt(new Date());
    } catch (err) {
      console.warn('Background sync warning:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Refresh data handler
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      const [pList, lList] = await Promise.all([api.getPrices(), api.getListings()]);
      setAllPrices(pList);
      setListings(lList);

      if (currentUser) {
        const { alerts: evaluated, triggeredCount } = await api.evaluateAlerts(currentUser.id);
        setAlerts(evaluated);
        if (triggeredCount > 0 && currentUser.role === 'farmer') {
          addToast('info', `Refreshed! ${triggeredCount} price alert(s) triggered.`);
        } else {
          addToast('success', 'Crop prices & marketplace refreshed.');
        }
      } else {
        addToast('success', 'Crop prices refreshed.');
      }
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Refresh error:', err);
      addToast('error', 'Failed to refresh prices.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Evaluate alerts action
  const handleEvaluateAlerts = async () => {
    if (!currentUser) return;
    setIsEvaluatingAlerts(true);
    try {
      const { alerts: evaluated, triggeredCount } = await api.evaluateAlerts(currentUser.id);
      setAlerts(evaluated);
      if (triggeredCount > 0) {
        addToast('success', `Evaluated! ${triggeredCount} alert condition(s) currently triggered.`);
      } else {
        addToast('info', 'Alerts evaluated against current mandi prices. None triggered.');
      }
    } catch (err) {
      console.error('Failed to evaluate alerts:', err);
      addToast('error', 'Error evaluating alerts.');
    } finally {
      setIsEvaluatingAlerts(false);
    }
  };

  // Switch demo user
  const handleSelectUser = async (user: User) => {
    api.setCurrentUserId(user.id);
    setCurrentUser(user);
    setHasOnboarded(true);

    // If user is buyer and currently on a farmer-only tab, redirect to overview
    if (user.role === 'buyer' && (currentTab === 'alerts' || currentTab === 'my-listings')) {
      setCurrentTab('overview');
    }

    // Re-evaluate alerts for the new user
    const { alerts: evaluated } = await api.evaluateAlerts(user.id);
    setAlerts(evaluated);

    addToast('success', `Switched demo profile to: ${user.displayName} (${user.role})`);
  };

  // Reset database back to seed
  const handleResetData = async () => {
    try {
      await api.resetDatabase();
      await loadInitialData();
      addToast('success', 'All data reset back to initial 336 seed records.');
    } catch (err) {
      console.error('Reset error:', err);
      addToast('error', 'Failed to reset seed data.');
    }
  };

  // Listing CRUD
  const handleCreateListing = async (
    data: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const created = await api.createListing(data);
      setListings((prev) => [created, ...prev]);
      addToast('success', 'Produce listing published to Sindh marketplace!');
    } catch (err) {
      console.error('Failed to create listing:', err);
      addToast('error', 'Failed to create listing.');
      throw err;
    }
  };

  const handleUpdateListing = async (
    id: string,
    updates: Partial<Omit<Listing, 'id' | 'createdAt'>>
  ) => {
    try {
      const updated = await api.updateListing(id, updates);
      setListings((prev) => prev.map((l) => (l.id === id ? updated : l)));
      addToast('success', 'Listing updated successfully.');
    } catch (err) {
      console.error('Failed to update listing:', err);
      addToast('error', 'Failed to update listing.');
      throw err;
    }
  };

  const handleDeleteListing = async (id: string) => {
    try {
      await api.deleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
      addToast('success', 'Produce listing removed.');
    } catch (err) {
      console.error('Failed to delete listing:', err);
      addToast('error', 'Failed to delete listing.');
      throw err;
    }
  };

  // Alert CRUD
  const handleCreateAlert = async (
    data: Omit<Alert, 'id' | 'createdAt' | 'lastEvaluatedPrice' | 'lastTriggeredAt'>
  ) => {
    try {
      const created = await api.createAlert(data);
      // Immediately evaluate
      const prices = allPrices.filter((p) => p.cropId === data.cropId && p.marketId === data.marketId);
      const latestP = prices.sort((a, b) => b.date.localeCompare(a.date))[0]?.price;
      const enrichedAlert: Alert = {
        ...created,
        lastEvaluatedPrice: latestP || null,
        lastTriggeredAt:
          latestP &&
          ((data.condition === 'above' && latestP >= data.targetPrice) ||
            (data.condition === 'below' && latestP <= data.targetPrice))
            ? new Date().toISOString()
            : null,
      };

      setAlerts((prev) => [enrichedAlert, ...prev]);
      addToast('success', 'Price alert threshold created.');
    } catch (err) {
      console.error('Failed to create alert:', err);
      addToast('error', 'Failed to create alert.');
      throw err;
    }
  };

  const handleToggleAlert = async (id: string, isEnabled: boolean) => {
    try {
      const updated = await api.updateAlert(id, { isEnabled });
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      addToast('info', isEnabled ? 'Alert enabled.' : 'Alert paused.');
    } catch (err) {
      console.error('Failed to toggle alert:', err);
      addToast('error', 'Failed to update alert state.');
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await api.deleteAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      addToast('success', 'Price alert removed.');
    } catch (err) {
      console.error('Failed to delete alert:', err);
      addToast('error', 'Failed to delete alert.');
    }
  };

  // Tab navigation helper
  const handleNavigate = (tab: NavTab, meta?: { cropId?: string; marketId?: string }) => {
    if (meta?.cropId) setInsightsCropId(meta.cropId);
    if (meta?.marketId) setInsightsMarketId(meta.marketId);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Global Alert Modal trigger
  const handleOpenAlertModal = (cropId?: string, marketId?: string) => {
    setGlobalAlertPrefill({ cropId, marketId });
    setIsGlobalAlertModalOpen(true);
  };

  // Compute triggered alerts count for badge
  const userTriggeredAlertsCount = alerts.filter((a) => {
    if (!currentUser || a.userId !== currentUser.id || !a.isEnabled) return false;
    if (!a.lastEvaluatedPrice) return false;
    return (
      (a.condition === 'above' && a.lastEvaluatedPrice >= a.targetPrice) ||
      (a.condition === 'below' && a.lastEvaluatedPrice <= a.targetPrice)
    );
  }).length;

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-6 text-center text-[#2F332C]">
        <span className="text-3xl mb-3">🌱</span>
        <h2 className="text-xl font-bold text-[#2D452B]">saa-wak · ساوڪ</h2>
        <p className="text-xs text-[#767B70] mt-1">Loading Sindh Mandi price records and agricultural seed data...</p>
      </div>
    );
  }

  return (
    <>
      {/* Main Shell */}
      <AppShell
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        allUsers={allUsers}
        onSelectUser={handleSelectUser}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onRefreshData={handleRefreshData}
        isRefreshing={isRefreshing}
        alertCount={userTriggeredAlertsCount}
      >
        {currentTab === 'overview' && (
          <OverviewPage
            crops={crops}
            markets={markets}
            allPrices={allPrices}
            listings={listings}
            alerts={alerts}
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onOpenListingModal={() => setIsGlobalListingModalOpen(true)}
            onOpenAlertModal={() => handleOpenAlertModal()}
          />
        )}

        {currentTab === 'prices' && (
          <PricesPage
            crops={crops}
            markets={markets}
            allPrices={allPrices}
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onOpenAlertModal={handleOpenAlertModal}
          />
        )}

        {currentTab === 'insights' && (
          <InsightsPage
            crops={crops}
            markets={markets}
            allPrices={allPrices}
            currentUser={currentUser}
            initialCropId={insightsCropId}
            initialMarketId={insightsMarketId}
            onOpenAlertModal={handleOpenAlertModal}
          />
        )}

        {currentTab === 'marketplace' && (
          <MarketplacePage
            listings={listings}
            crops={crops}
            markets={markets}
            users={allUsers}
            allPrices={allPrices}
            currentUser={currentUser}
            onCreateListing={handleCreateListing}
            onUpdateListing={handleUpdateListing}
            onDeleteListing={handleDeleteListing}
          />
        )}

        {currentTab === 'alerts' && currentUser.role === 'farmer' && (
          <AlertsPage
            alerts={alerts}
            crops={crops}
            markets={markets}
            allPrices={allPrices}
            currentUser={currentUser}
            onCreateAlert={handleCreateAlert}
            onToggleAlert={handleToggleAlert}
            onDeleteAlert={handleDeleteAlert}
            onEvaluateAlerts={handleEvaluateAlerts}
            isEvaluating={isEvaluatingAlerts}
          />
        )}

        {currentTab === 'calculator' && (
          <ProfitCalculatorPage
            crops={crops}
            allPrices={allPrices}
          />
        )}

        {currentTab === 'my-listings' && currentUser.role === 'farmer' && (
          <MyListingsPage
            listings={listings}
            crops={crops}
            markets={markets}
            currentUser={currentUser}
            allPrices={allPrices}
            onCreateListing={handleCreateListing}
            onUpdateListing={handleUpdateListing}
            onDeleteListing={handleDeleteListing}
          />
        )}

        {currentTab === 'messages' && (
          <div className="p-4 md:p-6 max-w-5xl mx-auto">
            <MessagingPanel currentUser={currentUser} />
          </div>
        )}

        {currentTab === 'ai' && (
          <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <AiAssistantPanel
              currentUser={currentUser}
              cropId={insightsCropId}
              marketId={insightsMarketId}
              onClose={() => setCurrentTab('overview')}
            />
          </div>
        )}
      </AppShell>

      {/* Onboarding & Demo Role Switcher Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => {
          setIsOnboardingOpen(false);
          setHasOnboarded(true);
        }}
        users={allUsers}
        currentUserId={currentUser.id}
        onSelectUser={handleSelectUser}
      />

      {/* Global Listing Modal */}
      <ListingFormModal
        isOpen={isGlobalListingModalOpen}
        onClose={() => setIsGlobalListingModalOpen(false)}
        onSubmit={handleCreateListing}
        crops={crops}
        markets={markets}
        currentUser={currentUser}
      />

      {/* Global Alert Modal */}
      <AlertFormModal
        isOpen={isGlobalAlertModalOpen}
        onClose={() => setIsGlobalAlertModalOpen(false)}
        onSubmit={handleCreateAlert}
        crops={crops}
        markets={markets}
        currentUser={currentUser}
        allPrices={allPrices}
        initialCropId={globalAlertPrefill.cropId}
        initialMarketId={globalAlertPrefill.marketId}
      />

      {/* Floating Toast Notification Container */}
      <ToastContainer
        toasts={toasts}
        onDismiss={removeToast}
      />
    </>
  );
}

export default App;
