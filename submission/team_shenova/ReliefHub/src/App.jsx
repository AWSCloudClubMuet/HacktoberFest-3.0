import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Camps from './pages/Camps';
import Inventory from './pages/Inventory';
import Needs from './pages/Needs';
import Dispatches from './pages/Dispatches';
import Donations from './pages/Donations';
import Volunteers from './pages/Volunteers';
import { api } from './api/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [pageParams, setPageParams] = useState({});
  const [userRole, setUserRole] = useState('Admin'); // 'Admin' | 'Volunteer'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Core Data Collections
  const [camps, setCamps] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [donations, setDonations] = useState([]);
  const [volunteers, setVolunteers] = useState([]);

  // System State
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiConnected, setApiConnected] = useState(true);
  const [errorBanner, setErrorBanner] = useState(null);
  const [feedbackToast, setFeedbackToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  };

  // Fetch all collections over HTTP
  const fetchAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const [
        campsData,
        inventoryData,
        needsData,
        dispatchesData,
        donationsData,
        volunteersData
      ] = await Promise.all([
        api.getCamps(),
        api.getInventory(),
        api.getNeeds(),
        api.getDispatches(),
        api.getDonations(),
        api.getVolunteers()
      ]);

      setCamps(Array.isArray(campsData) ? campsData : []);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      setNeeds(Array.isArray(needsData) ? needsData : []);
      setDispatches(Array.isArray(dispatchesData) ? dispatchesData : []);
      setDonations(Array.isArray(donationsData) ? donationsData : []);
      setVolunteers(Array.isArray(volunteersData) ? volunteersData : []);

      setApiConnected(true);
      setErrorBanner(null);
    } catch (err) {
      console.error('Failed to load ReliefHub data:', err);
      setApiConnected(false);
      setErrorBanner(`API Communication Error: ${err.message}. Ensure mock backend is running on port 3001.`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Page navigation helper with optional params
  const handleNavigate = (page, params = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ==================== CRUD HANDLERS ====================

  // Camps
  const handleCreateCamp = async (campData) => {
    await api.createCamp(campData);
    await fetchAllData(true);
    showToast('Relief camp established successfully');
  };

  const handleUpdateCamp = async (id, patch) => {
    await api.updateCamp(id, patch);
    await fetchAllData(true);
    showToast('Camp details updated');
  };

  const handleDeleteCamp = async (id) => {
    await api.deleteCamp(id);
    await fetchAllData(true);
    showToast('Camp removed from registry');
  };

  // Inventory
  const handleCreateInventoryItem = async (itemData) => {
    await api.createInventoryItem(itemData);
    await fetchAllData(true);
    showToast('Commodity added to inventory');
  };

  const handleUpdateInventoryItem = async (id, patch) => {
    await api.updateInventoryItem(id, patch);
    await fetchAllData(true);
    showToast('Inventory record updated');
  };

  const handleDeleteInventoryItem = async (id) => {
    await api.deleteInventoryItem(id);
    await fetchAllData(true);
    showToast('Item deleted from warehouse catalog');
  };

  // Needs
  const handleCreateNeed = async (needData) => {
    await api.createNeed(needData);
    await fetchAllData(true);
    showToast('Camp need recorded successfully');
  };

  const handleUpdateNeed = async (id, patch) => {
    await api.updateNeed(id, patch);
    await fetchAllData(true);
    showToast('Need record updated');
  };

  const handleDeleteNeed = async (id) => {
    await api.deleteNeed(id);
    await fetchAllData(true);
    showToast('Need record removed');
  };

  // Dispatches
  const handleCreateDispatch = async (dispatchData) => {
    await api.createDispatch(dispatchData);
    await fetchAllData(true);
    showToast('Cargo dispatch created. Stock reserved immediately.');
  };

  const handleUpdateDispatch = async (id, patch) => {
    await api.updateDispatch(id, patch);
    await fetchAllData(true);
    if (patch.status === 'Delivered') {
      showToast('Dispatch marked Delivered. Camp fulfilled quantity updated.');
    } else if (patch.status === 'Cancelled') {
      showToast('Dispatch Cancelled. Warehouse stock restored.');
    } else {
      showToast(`Dispatch status updated to ${patch.status}`);
    }
  };

  // Donations
  const handleCreateDonation = async (donationData) => {
    await api.createDonation(donationData);
    await fetchAllData(true);
    showToast(donationData.type === 'Cash' 
      ? 'Cash donation recorded successfully' 
      : 'In-kind relief supplies credited to warehouse stock'
    );
  };

  const handleUpdateDonation = async (id, patch) => {
    await api.updateDonation(id, patch);
    await fetchAllData(true);
    showToast('Donation record updated successfully. Inventory adjusted safely.');
  };

  const handleDeleteDonation = async (id) => {
    await api.deleteDonation(id);
    await fetchAllData(true);
    showToast('Donation entry removed');
  };

  // Volunteers
  const handleCreateVolunteer = async (volunteerData) => {
    await api.createVolunteer(volunteerData);
    await fetchAllData(true);
    showToast('Volunteer registered successfully');
  };

  const handleUpdateVolunteer = async (id, patch) => {
    await api.updateVolunteer(id, patch);
    await fetchAllData(true);
    showToast('Volunteer profile updated');
  };

  const handleDeleteVolunteer = async (id) => {
    await api.deleteVolunteer(id);
    await fetchAllData(true);
    showToast('Volunteer removed from registry');
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={(page) => handleNavigate(page)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        userRole={userRole}
        onToggleRole={setUserRole}
      />

      {/* Main Content Area */}
      <div className={`app-main-viewport ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header
          currentPage={currentPage}
          userRole={userRole}
          apiConnected={apiConnected}
          onRefresh={() => fetchAllData()}
          isRefreshing={isRefreshing}
          errorBanner={errorBanner}
          onDismissError={() => setErrorBanner(null)}
        />

        {/* Floating Feedback Toast */}
        {feedbackToast && (
          <div className={`floating-toast toast-${feedbackToast.type} animate-slide-up`}>
            <span>{feedbackToast.message}</span>
            <button 
              type="button" 
              className="toast-close"
              onClick={() => setFeedbackToast(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Dynamic Page Router */}
        <main className="app-page-content" id="main-content">
          {isLoading ? (
            <div className="page-loading-skeleton">
              <div className="skeleton-spinner" />
              <p>Connecting to ReliefHub Operations Server...</p>
            </div>
          ) : (
            <>
              {currentPage === 'dashboard' && (
                <Dashboard
                  camps={camps}
                  inventory={inventory}
                  needs={needs}
                  dispatches={dispatches}
                  volunteers={volunteers}
                  onNavigate={handleNavigate}
                />
              )}

              {currentPage === 'camps' && (
                <Camps
                  camps={camps}
                  needs={needs}
                  userRole={userRole}
                  onCreateCamp={handleCreateCamp}
                  onUpdateCamp={handleUpdateCamp}
                  onDeleteCamp={handleDeleteCamp}
                  initialFilter={pageParams.filter || 'all'}
                />
              )}

              {currentPage === 'inventory' && (
                <Inventory
                  inventory={inventory}
                  userRole={userRole}
                  onCreateItem={handleCreateInventoryItem}
                  onUpdateItem={handleUpdateInventoryItem}
                  onDeleteItem={handleDeleteInventoryItem}
                  initialFilter={pageParams.filter || 'all'}
                />
              )}

              {currentPage === 'needs' && (
                <Needs
                  needs={needs}
                  camps={camps}
                  inventory={inventory}
                  dispatches={dispatches}
                  userRole={userRole}
                  onCreateNeed={handleCreateNeed}
                  onUpdateNeed={handleUpdateNeed}
                  onDeleteNeed={handleDeleteNeed}
                  onNavigateToDispatch={(dispatchParams) => handleNavigate('dispatches', dispatchParams)}
                />
              )}

              {currentPage === 'dispatches' && (
                <Dispatches
                  dispatches={dispatches}
                  camps={camps}
                  needs={needs}
                  inventory={inventory}
                  userRole={userRole}
                  onCreateDispatch={handleCreateDispatch}
                  onUpdateDispatch={handleUpdateDispatch}
                  prefilledCampId={pageParams.campId}
                  prefilledNeedId={pageParams.createForNeed}
                />
              )}

              {currentPage === 'donations' && (
                <Donations
                  donations={donations}
                  inventory={inventory}
                  userRole={userRole}
                  onCreateDonation={handleCreateDonation}
                  onUpdateDonation={handleUpdateDonation}
                  onDeleteDonation={handleDeleteDonation}
                />
              )}

              {currentPage === 'volunteers' && (
                <Volunteers
                  volunteers={volunteers}
                  camps={camps}
                  userRole={userRole}
                  onCreateVolunteer={handleCreateVolunteer}
                  onUpdateVolunteer={handleUpdateVolunteer}
                  onDeleteVolunteer={handleDeleteVolunteer}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
