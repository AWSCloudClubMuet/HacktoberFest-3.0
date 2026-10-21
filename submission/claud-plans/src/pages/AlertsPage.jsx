import React, { useState } from 'react';
import { useAlerts } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  X,
  TrendingUp,
  TrendingDown,
  Power
} from 'lucide-react';

export const AlertsPage = () => {
  const { isFarmer, currentUser } = useAuth();
  const {
    alerts,
    crops,
    markets,
    triggeredAlerts,
    unreadCount,
    isLoading,
    createAlert,
    editAlert,
    toggleAlertStatus,
    deleteAlert,
    refreshAlerts
  } = useAlerts();

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [formData, setFormData] = useState({
    crop_id: '',
    market_id: '',
    condition: 'Above',
    target_price: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingAlert(null);
    setFormData({
      crop_id: crops[0]?.id || '',
      market_id: markets[0]?.id || '',
      condition: 'Above',
      target_price: ''
    });
    setFormError('');
    setIsFormOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (alert) => {
    setEditingAlert(alert);
    setFormData({
      crop_id: alert.crop_id,
      market_id: alert.market_id,
      condition: alert.condition || 'Above',
      target_price: alert.target_price
    });
    setFormError('');
    setIsFormOpen(true);
  };

  // Handle Submit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.crop_id || !formData.market_id || !formData.target_price) {
      setFormError('Please fill out all fields.');
      return;
    }
    const priceNum = Number(formData.target_price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Target price must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      if (editingAlert) {
        await editAlert(editingAlert.id, formData);
      } else {
        await createAlert(formData);
      }
      setIsFormOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to save alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Farmer Role Guard
  if (!isFarmer) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-earth-300 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <Bell className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-800">Farmer-Only Feature</h2>
        <p className="text-xs text-slate-500">
          Price target alerts are designed for registered Sindh farmers to monitor mandi selling opportunities.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Price Alerts</h1>
            {unreadCount > 0 && (
              <span
                id="header-triggered-badge"
                className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse"
              >
                {unreadCount} Triggered
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Rule-based threshold notifications for your mandi selling targets
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={refreshAlerts}
            className="p-2 rounded-xl bg-white border border-earth-300 text-slate-600 hover:bg-earth-50 shadow-sm transition-colors"
            title="Refresh and evaluate alerts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            type="button"
            id="new-alert-btn"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Alert</span>
          </button>
        </div>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-earth-300 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-earth-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">No Price Alerts Configured</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Set automated notifications for Wheat, Cotton, or Onion when market rates hit your target.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 text-white text-xs font-bold rounded-xl shadow"
          >
            <Plus className="w-3.5 h-3.5" /> Create Your First Alert
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert) => {
            const isAlertTriggered = alert.active_status && alert.triggered;

            return (
              <div
                key={alert.id}
                id={`alert-card-${alert.id}`}
                className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                  isAlertTriggered
                    ? 'bg-rose-50/80 border-rose-400 shadow-md ring-1 ring-rose-300'
                    : alert.active_status
                    ? 'bg-white border-earth-300 shadow-sm'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                {/* Triggered Highlight Banner */}
                {isAlertTriggered && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Price Alert Triggered! Target Reached</span>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-black text-slate-900 text-sm">{alert.cropName}</h3>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-earth-100 text-slate-600">
                        {alert.marketName}
                      </span>
                    </div>

                    {/* Condition details */}
                    <div className="flex items-center gap-1.5 text-xs font-bold mt-1">
                      <span
                        className={`inline-flex items-center gap-0.5 ${
                          alert.condition === 'Above' ? 'text-emerald-700' : 'text-blue-700'
                        }`}
                      >
                        {alert.condition === 'Above' ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        {alert.condition}
                      </span>
                      <span className="text-slate-800">Rs. {Number(alert.target_price).toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400 font-normal">/ 40 kg</span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Latest Mandi Rate: <strong className="text-slate-800">Rs. {alert.latestPrice?.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Active Toggle Switch */}
                  <div className="flex flex-col items-end gap-1">
                    <button
                      type="button"
                      id={`toggle-alert-${alert.id}`}
                      onClick={() => toggleAlertStatus(alert.id, alert.active_status)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                        alert.active_status
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-200 text-slate-600 border border-slate-300'
                      }`}
                      title="Toggle active status"
                    >
                      <Power className="w-3 h-3" />
                      <span>{alert.active_status ? 'Active' : 'Paused'}</span>
                    </button>
                  </div>
                </div>

                {/* Card Action Controls: Edit & Delete */}
                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-200/60 text-xs">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(alert)}
                    className="p-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                    title="Edit alert"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    id={`delete-alert-${alert.id}`}
                    onClick={() => deleteAlert(alert.id)}
                    className="p-1 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                    title="Delete alert"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Alert Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] bg-white rounded-3xl p-5 shadow-2xl border border-earth-300 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">
                {editingAlert ? 'Edit Price Alert' : 'Create Price Alert'}
              </h2>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-earth-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-3 text-xs">
              {/* Crop */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">Select Crop</label>
                <select
                  id="alert-crop-input"
                  value={formData.crop_id}
                  onChange={(e) => setFormData({ ...formData, crop_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-earth-300 bg-white font-semibold text-slate-800"
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Market */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">Select Mandi Market</label>
                <select
                  id="alert-market-input"
                  value={formData.market_id}
                  onChange={(e) => setFormData({ ...formData, market_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-earth-300 bg-white font-semibold text-slate-800"
                >
                  {markets.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.district})
                    </option>
                  ))}
                </select>
              </div>

              {/* Condition (Above / Below) */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">Trigger Condition</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, condition: 'Above' })}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1 ${
                      formData.condition === 'Above'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" /> Price Goes Above
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, condition: 'Below' })}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1 ${
                      formData.condition === 'Below'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" /> Price Drops Below
                  </button>
                </div>
              </div>

              {/* Target Price */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  Target Price (PKR / 40 kg)
                </label>
                <input
                  type="number"
                  id="alert-target-price-input"
                  min="1"
                  placeholder="e.g. 4200"
                  value={formData.target_price}
                  onChange={(e) => setFormData({ ...formData, target_price: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-earth-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-2 font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-alert-submit-btn"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingAlert ? 'Update Alert' : 'Save Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
