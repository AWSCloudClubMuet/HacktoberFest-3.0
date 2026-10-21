import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  useAlertStatus,
  useUpdateAlert,
  useDeleteAlert,
  type EvaluatedAlert,
} from '../api/hooks'
import { useTranslation } from '../i18n'
import { formatPriceWithUnit } from '../lib/format'
import {
  CardSkeleton,
  ErrorBanner,
  EmptyState,
  PullToRefresh,
  ConfirmDialog,
  useToast,
} from '../components'
import {
  Bell,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  Power,
} from 'lucide-react'

export const Alerts: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { alerts, triggeredCount, isLoading, error, refetch } = useAlertStatus()
  const updateAlert = useUpdateAlert()
  const deleteAlert = useDeleteAlert()
  const { t, isRTL } = useTranslation()

  const [alertToDelete, setAlertToDelete] = useState<EvaluatedAlert | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingId, setIsTogglingId] = useState<number | null>(null)

  // Toggle alert active_status
  const handleToggle = async (alert: EvaluatedAlert) => {
    setIsTogglingId(alert.id)
    try {
      await updateAlert.mutateAsync({
        id: alert.id,
        data: { active_status: !alert.active_status },
      })
      toast.success(
        alert.active_status
          ? `Alert for ${alert.cropName} paused`
          : `Alert for ${alert.cropName} activated`,
      )
    } catch {
      toast.error('Failed to update alert status.')
    } finally {
      setIsTogglingId(null)
    }
  }

  // Confirm delete alert
  const handleConfirmDelete = async () => {
    if (!alertToDelete) return
    setIsDeleting(true)
    try {
      await deleteAlert.mutateAsync(alertToDelete.id)
      toast.success(`Alert for ${alertToDelete.cropName} deleted.`)
      setAlertToDelete(null)
    } catch {
      toast.error('Failed to delete alert.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <PullToRefresh onRefresh={refetch}>
      <div className="space-y-4 max-w-4xl mx-auto pb-12">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-forest-950 p-4 sm:p-5 rounded-3xl border border-gray-100 dark:border-forest-800 shadow-xs">
          <div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Bell className="w-5 h-5 text-forest dark:text-mint" />
              <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{t('alerts.title')}</h1>
              {triggeredCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[var(--ajrak-crimson)] text-white text-xs font-bold shadow-2xs">
                  {triggeredCount} {t('common.triggered')}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('alerts.subtitle')}
            </p>
          </div>

          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <button
              onClick={() => refetch()}
              className="p-2.5 rounded-2xl text-gray-600 dark:text-gray-300 hover:text-forest hover:bg-forest-50 dark:hover:bg-forest-900 active:scale-95 transition border border-gray-200 dark:border-forest-800"
              title={t('common.refresh')}
              aria-label="Refresh alerts"
            >
              <RefreshCw className="w-4 h-4 rtl-flip" />
            </button>

            <Link
              to="/alerts/new"
              className="px-4 py-2.5 bg-neon text-neon-dark rounded-2xl text-xs font-black shadow-xs hover:brightness-105 active:scale-95 transition flex items-center space-x-1.5 rtl:space-x-reverse"
            >
              <Plus className="w-4 h-4" />
              <span>{t('alerts.newAlert')}</span>
            </Link>
          </div>
        </div>

        {error && (
          <ErrorBanner
            message="Failed to load your price alerts. Please try again."
            onRetry={() => refetch()}
          />
        )}

        {/* Alerts List */}
        {isLoading ? (
          <div className="space-y-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState
            title={t('alerts.noAlertsTitle')}
            description={t('alerts.noAlertsDesc')}
            action={{
              label: `+ ${t('alerts.newAlert')}`,
              onClick: () => navigate('/alerts/new'),
            }}
          />
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const isTriggered = alert.status === 'Triggered'
              const isInactive = alert.status === 'Inactive'

              return (
                <div
                  key={alert.id}
                  className={`rounded-3xl p-5 border transition-all duration-200 ${
                    isTriggered
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 shadow-sm'
                      : isInactive
                      ? 'bg-gray-50/60 dark:bg-forest-900/20 border-gray-200 dark:border-forest-800 opacity-75'
                      : 'bg-white dark:bg-forest-950 border-gray-100 dark:border-forest-800 shadow-xs hover:border-gray-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Crop, Market, Target Info */}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <h2 className="font-bold text-gray-900 dark:text-white text-base">{alert.cropName}</h2>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-forest-900 text-gray-600 dark:text-gray-300 font-medium">
                          {alert.cropCategory}
                        </span>

                        {/* Status Chip */}
                        {isTriggered && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[var(--ajrak-crimson)] text-white shadow-2xs animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{t('alerts.statusTriggered')}</span>
                          </span>
                        )}
                        {alert.status === 'Waiting' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{t('alerts.statusWaiting')}</span>
                          </span>
                        )}
                        {isInactive && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 dark:bg-forest-800 text-gray-600 dark:text-gray-300">
                            <Power className="w-3.5 h-3.5" />
                            <span>{t('alerts.statusInactive')}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {alert.marketName} • {alert.marketDistrict}
                      </p>

                      <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 rtl:space-x-reverse">
                          {alert.condition === 'Above' ? (
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          <span>{t('alerts.targetPrice')}:</span>
                          <span className="font-bold text-gray-900 dark:text-white" dir="ltr">
                            {alert.condition === 'Above' ? '≥' : '≤'} {formatPriceWithUnit(alert.target_price)}
                          </span>
                        </span>

                        <span className="text-gray-400">•</span>

                        <span className="text-gray-600 dark:text-gray-400">
                          {t('alerts.latestPrice')}:{' '}
                          <strong className="text-gray-900 dark:text-white" dir="ltr">
                            {alert.latestPrice
                              ? formatPriceWithUnit(alert.latestPrice)
                              : t('cropDetail.noData')}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions & Toggle */}
                    <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-forest-800 justify-end">
                      {/* Active Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggle(alert)}
                        disabled={isTogglingId === alert.id}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 rtl:space-x-reverse active:scale-95 ${
                          alert.active_status
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                            : 'bg-gray-200 dark:bg-forest-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300'
                        }`}
                        title={alert.active_status ? 'Click to pause' : 'Click to activate'}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{alert.active_status ? t('common.active') : t('common.inactive')}</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => navigate(`/alerts/${alert.id}/edit`)}
                        className="p-2 text-gray-500 hover:text-forest hover:bg-gray-100 dark:hover:bg-forest-900 rounded-xl transition"
                        title={t('common.edit')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setAlertToDelete(alert)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!alertToDelete}
          title={t('alerts.confirmDelete')}
          message={`Are you sure you want to delete the price alert for ${alertToDelete?.cropName} in ${alertToDelete?.marketName}?`}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
          isDestructive={true}
          isLoading={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setAlertToDelete(null)}
        />
      </div>
    </PullToRefresh>
  )
}

export default Alerts
