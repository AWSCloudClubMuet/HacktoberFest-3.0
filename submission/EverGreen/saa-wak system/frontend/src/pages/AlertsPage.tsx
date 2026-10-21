import React, { useState } from 'react';
import { Alert, Crop, Market, User, PriceRecord } from '../types';
import { formatPKR, formatDate } from '../lib/formatters';
import { AlertFormModal } from '../components/AlertFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  Bell,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface AlertsPageProps {
  alerts: Alert[];
  crops: Crop[];
  markets: Market[];
  allPrices: PriceRecord[];
  currentUser: User;
  onCreateAlert: (alertData: Omit<Alert, 'id' | 'createdAt' | 'lastEvaluatedPrice' | 'lastTriggeredAt'>) => Promise<void>;
  onToggleAlert: (id: string, isEnabled: boolean) => Promise<void>;
  onDeleteAlert: (id: string) => Promise<void>;
  onEvaluateAlerts: () => Promise<void>;
  isEvaluating: boolean;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  alerts,
  crops,
  markets,
  allPrices,
  currentUser,
  onCreateAlert,
  onToggleAlert,
  onDeleteAlert,
  onEvaluateAlerts,
  isEvaluating,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingAlert, setDeletingAlert] = useState<Alert | null>(null);

  // Filter alerts for current farmer
  const userAlerts = alerts.filter((a) => a.userId === currentUser.id);

  const handleConfirmDelete = async () => {
    if (deletingAlert) {
      await onDeleteAlert(deletingAlert.id);
      setDeletingAlert(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E8E7DF]">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#2D452B]">
              Price Threshold Alerts
            </h2>
            <p className="text-xs text-[#767B70] mt-0.5">
              Automated threshold triggers evaluated against latest mandi rates
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onEvaluateAlerts}
              disabled={isEvaluating}
              className="bg-[#EEF2E8] hover:bg-[#E3EAD9] text-[#2D452B] border border-[#DCE8D3] px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#4A6B42] ${isEvaluating ? 'animate-spin' : ''}`} />
              <span>Evaluate Rates</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="bg-[#2D452B] hover:bg-[#4A6B42] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Alert</span>
            </button>
          </div>
        </div>
      </div>

      {/* Demo Evaluation Notice */}
      <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#E8E7DF] flex items-start gap-3 text-xs text-[#555A50]">
        <Info className="w-4 h-4 text-[#4A6B42] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#2F332C]">Evaluation Frequency:</strong> In this demo prototype, alerts are evaluated locally whenever crop prices are refreshed or loaded. No SMS or push notifications are dispatched.
        </div>
      </div>

      {/* Alerts List */}
      {userAlerts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-[#E8E7DF] text-center max-w-md mx-auto">
          <Bell className="w-8 h-8 mx-auto mb-2 text-[#4A6B42] opacity-60" />
          <h4 className="font-bold text-base text-[#2D452B] mb-1">
            No Price Alerts Configured
          </h4>
          <p className="text-xs text-[#767B70] mb-5">
            Set an alert to receive immediate feedback when Wheat, Cotton, or Onion quotations meet your target selling point.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#2D452B] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#4A6B42] transition-colors cursor-pointer"
          >
            Create Alert
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {userAlerts.map((alert) => {
            const crop = crops.find((c) => c.id === alert.cropId);
            const market = markets.find((m) => m.id === alert.marketId);

            // Determine if triggered right now
            const isTriggered =
              alert.isEnabled &&
              alert.lastEvaluatedPrice !== null &&
              alert.lastEvaluatedPrice !== undefined &&
              ((alert.condition === 'above' && alert.lastEvaluatedPrice >= alert.targetPrice) ||
                (alert.condition === 'below' && alert.lastEvaluatedPrice <= alert.targetPrice));

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-2xl p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isTriggered
                    ? 'border-[#C8E6C9] bg-[#FAFDF9]'
                    : 'border-[#E8E7DF]'
                }`}
              >
                {/* Left: Crop symbol & Trigger condition */}
                <div className="flex items-center gap-3.5">
                  <span className="text-2xl shrink-0">
                    {crop?.symbol || '🌾'}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-base text-[#2F332C]">
                        {crop?.name || 'Crop Alert'}
                      </h4>
                      <span className="text-xs text-[#767B70]">
                        · {market?.name || 'Mandi'}
                      </span>

                      {/* Triggered Status Badge */}
                      {isTriggered ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#186F43] bg-[#EEF5EB] px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#186F43]" />
                          Condition Triggered
                        </span>
                      ) : !alert.isEnabled ? (
                        <span className="text-[11px] text-[#767B70] bg-[#FAF9F5] px-2 py-0.5 rounded-md">
                          Paused
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#4A6B42] bg-[#EEF2E8] px-2 py-0.5 rounded-md">
                          Active Monitoring
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#767B70] mt-1">
                      <span>Condition:</span>
                      <strong className="text-[#2F332C] inline-flex items-center gap-0.5">
                        {alert.condition === 'above' ? (
                          <>
                            <ArrowUpRight className="w-3.5 h-3.5 text-[#186F43]" />
                            Rises Above (≥)
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="w-3.5 h-3.5 text-[#B3261E]" />
                            Drops Below (≤)
                          </>
                        )}
                      </strong>
                      <span className="font-bold text-[#2D452B] tabular-nums">
                        {formatPKR(alert.targetPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle: Evaluated Price */}
                <div className="sm:text-right shrink-0">
                  <div className="text-[11px] text-[#767B70]">Latest Mandi Rate</div>
                  <div className="text-base font-bold text-[#2D452B] tabular-nums">
                    {alert.lastEvaluatedPrice
                      ? formatPKR(alert.lastEvaluatedPrice)
                      : 'Not evaluated yet'}
                  </div>
                  {alert.lastTriggeredAt && (
                    <div className="text-[10px] text-[#186F43] font-medium mt-0.5 tabular-nums">
                      Triggered {formatDate(alert.lastTriggeredAt)}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-xs text-[#767B70] font-medium hidden sm:inline">
                      {alert.isEnabled ? 'Active' : 'Disabled'}
                    </span>
                    <input
                      type="checkbox"
                      checked={alert.isEnabled}
                      onChange={(e) => onToggleAlert(alert.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#E8E7DF] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E8E7DF] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4A6B42] relative cursor-pointer" />
                  </label>

                  <button
                    type="button"
                    onClick={() => setDeletingAlert(alert)}
                    className="p-2 text-[#B3261E] hover:bg-[#FDE8E8] rounded-xl border border-[#E8E7DF] transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Delete alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Alert Modal */}
      <AlertFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={onCreateAlert}
        crops={crops}
        markets={markets}
        currentUser={currentUser}
        allPrices={allPrices}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingAlert)}
        title="Delete Price Alert"
        message="Are you sure you want to delete this price threshold alert?"
        confirmLabel="Yes, Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingAlert(null)}
      />
    </div>
  );
};
