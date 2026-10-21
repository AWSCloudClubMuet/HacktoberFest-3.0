import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function Header({ 
  currentPage, 
  userRole: _userRole, 
  apiConnected, 
  onRefresh, 
  isRefreshing,
  errorBanner,
  onDismissError,
  contextAction 
}) {
  const pageMeta = {
    dashboard: {
      title: 'Operational Overview',
      subtitle: 'Real-time logistics monitoring of camps, warehouse inventory, and critical supply gaps across Sindh'
    },
    camps: {
      title: 'Camp Registry',
      subtitle: 'Monitor shelter capacity, family admissions, and operating status of flood-relief camps'
    },
    inventory: {
      title: 'Warehouse Stock',
      subtitle: 'Track unreserved relief commodities, units of measure, and safety reorder thresholds'
    },
    needs: {
      title: 'Camp Demands & Needs',
      subtitle: 'Review prioritized commodity requirements, fulfilled quantities, and remaining unmet demand'
    },
    dispatches: {
      title: 'Dispatch Tracking',
      subtitle: 'Coordinate relief dispatches, manage warehouse stock reservations, and verify deliveries'
    },
    donations: {
      title: 'Donation Ledger',
      subtitle: 'Record cash contributions, allocate in-kind inventory supplies, and audit incoming aid'
    },
    volunteers: {
      title: 'Volunteer Personnel',
      subtitle: 'Coordinate medical, logistical, driving, cooking, and counselling personnel across camps'
    }
  };

  const meta = pageMeta[currentPage] || { title: 'ReliefHub', subtitle: 'Flood Relief Operations' };

  return (
    <header className="app-top-header">
      {/* Error or Alert Banner */}
      {errorBanner && (
        <div className="system-alert-banner">
          <AlertCircle size={16} />
          <span>{errorBanner}</span>
          <button type="button" className="alert-dismiss-btn" onClick={onDismissError}>
            ✕
          </button>
        </div>
      )}

      <div className="header-content-row">
        <div className="header-titles">
          <h1 className="header-page-title">{meta.title}</h1>
          <p className="header-page-subtitle">{meta.subtitle}</p>
        </div>

        <div className="header-actions-group">
          {/* Contextual Action from Page (e.g. Add Camp, Add Need) */}
          {contextAction}

          {/* Sync / Refresh Button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh active dataset from REST API"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>

          {/* API Health Status Pill */}
          <div 
            className={`api-status-pill ${apiConnected ? 'connected' : 'disconnected'}`}
            title={apiConnected ? 'Connected to local REST API (:3001)' : 'API disconnected or unreachable'}
          >
            <span className="status-dot" />
            <span className="status-text">{apiConnected ? 'API Live' : 'API Offline'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
