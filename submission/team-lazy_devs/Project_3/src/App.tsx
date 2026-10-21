/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';
import { ToastContainer } from './components/ui/Toast.tsx';
import { ConfirmDialog } from './components/ui/ConfirmDialog.tsx';

import { OverviewPage } from './pages/OverviewPage.tsx';
import { CampsPage } from './pages/CampsPage.tsx';
import { InventoryPage } from './pages/InventoryPage.tsx';
import { NeedsPage } from './pages/NeedsPage.tsx';
import { DispatchesPage } from './pages/DispatchesPage.tsx';
import { DonationsPage } from './pages/DonationsPage.tsx';
import { VolunteersPage } from './pages/VolunteersPage.tsx';
import { DemoInfoPage } from './pages/DemoInfoPage.tsx';

import { api } from './services/api.ts';

const MainLayout: React.FC = () => {
  const { activeTab, refreshKey, triggerRefresh, notify } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Badge counters for sidebar
  const [criticalGapsCount, setCriticalGapsCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchBadges = async () => {
      try {
        const [gaps, inv] = await Promise.all([
          api.getCriticalGaps(),
          api.getInventory({ lowStockOnly: true }),
        ]);
        if (mounted) {
          setCriticalGapsCount(gaps.length);
          setLowStockCount(inv.length);
        }
      } catch {
        // Silently tolerate if offline
      }
    };

    fetchBadges();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const handleResetConfirm = async () => {
    setIsResetting(true);
    try {
      await api.resetSeedData();
      notify('success', 'Database Reset', 'Reinitialized all collections to initial demo seed state.');
      triggerRefresh();
      setIsResetConfirmOpen(false);
    } catch (err: any) {
      notify('error', 'Reset Failed', err.message || 'Could not reset database.');
      setIsResetConfirmOpen(false);
    } finally {
      setIsResetting(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage />;
      case 'camps':
        return <CampsPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'needs':
        return <NeedsPage />;
      case 'dispatches':
        return <DispatchesPage />;
      case 'donations':
        return <DonationsPage />;
      case 'volunteers':
        return <VolunteersPage />;
      case 'demo':
        return <DemoInfoPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F3ED] text-[#263242] flex">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        criticalGapsCount={criticalGapsCount}
        lowStockCount={lowStockCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Top Header */}
        <Header
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onOpenResetConfirm={() => setIsResetConfirmOpen(true)}
          criticalGapsCount={criticalGapsCount}
          lowStockCount={lowStockCount}
        />

        {/* Dynamic Viewport View */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>

        {/* Global Footer */}
        <footer className="px-4 md:px-8 py-4 border-t border-[#E5E1D9] text-xs text-[#697586] bg-[#FFFFFF] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-[#263242]">ReliefHub</span> · Sindh Flood Operations Command
          </div>
          <div className="flex items-center gap-3">
            <span>Sindh Emergency Disaster Response</span>
            <span aria-hidden="true">·</span>
            <span>All Data Persistent & Verified</span>
          </div>
        </footer>
      </div>

      {/* Toast Notification Container */}
      <ToastContainer />

      {/* Reset Seed Data Confirmation */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetConfirm}
        title="Reset Demo Data to Initial State"
        message="This will reinitialize all camps, inventory items, camp needs, dispatches, donations, and volunteer rosters to the clean baseline. Any edits or new dispatches created during testing will be reset."
        confirmLabel="Reset Demo Data"
        isDestructive={true}
        isLoading={isResetting}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
