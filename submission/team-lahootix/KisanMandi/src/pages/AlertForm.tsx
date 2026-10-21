import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { alertSchema, type AlertFormData } from '../lib/validators'
import {
  useCrops,
  useMarkets,
  useAlert,
  useCreateAlert,
  useUpdateAlert,
} from '../api/hooks'
import { useCurrentUser } from '../context/UserContext'
import { useTranslation } from '../i18n'
import { Spinner, ErrorBanner, useToast } from '../components'
import {
  ArrowLeft,
  Bell,
  TrendingUp,
  TrendingDown,
  Check,
  ShieldAlert,
} from 'lucide-react'

export const AlertForm: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { currentUser } = useCurrentUser()
  const { t, isRTL } = useTranslation()

  const isEditMode = !!id
  const alertId = id ? parseInt(id, 10) : undefined

  // 1. Fetch auxiliary data
  const { data: crops, isLoading: isLoadingCrops } = useCrops()
  const { data: markets, isLoading: isLoadingMarkets } = useMarkets()

  // 2. Fetch existing alert if in edit mode
  const {
    data: existingAlert,
    isLoading: isLoadingAlert,
    error: alertFetchError,
  } = useAlert(alertId)

  const createAlert = useCreateAlert()
  const updateAlert = useUpdateAlert()
  const [formError, setFormError] = useState<string | null>(null)

  // 3. React Hook Form Setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      crop_id: 1,
      market_id: 1,
      condition: 'Above',
      target_price: 4000,
      active_status: true,
    },
  })

  const selectedCondition = watch('condition')
  const activeStatus = watch('active_status')

  // 4. Prefill form from query parameters or loaded existing alert
  useEffect(() => {
    if (isEditMode && existingAlert) {
      // Ownership check: alert must belong to current user
      if (currentUser && existingAlert.user_id !== currentUser.id) {
        toast.error('Not allowed: You do not own this alert.')
        navigate('/alerts', { replace: true })
        return
      }

      reset({
        crop_id: existingAlert.crop_id,
        market_id: existingAlert.market_id,
        condition: existingAlert.condition,
        target_price: existingAlert.target_price,
        active_status: existingAlert.active_status,
      })
    } else if (!isEditMode) {
      // Check URL query params for prefill (e.g. from CropDetail)
      const cropParam = searchParams.get('crop')
      const marketParam = searchParams.get('market')

      if (cropParam) {
        const cId = parseInt(cropParam, 10)
        if (!isNaN(cId)) setValue('crop_id', cId)
      }
      if (marketParam) {
        const mId = parseInt(marketParam, 10)
        if (!isNaN(mId)) setValue('market_id', mId)
      }
    }
  }, [isEditMode, existingAlert, currentUser, reset, searchParams, setValue, navigate, toast])

  // 5. Submit Handler
  const onSubmit = async (data: AlertFormData) => {
    if (!currentUser) return
    setFormError(null)

    try {
      if (isEditMode && alertId) {
        await updateAlert.mutateAsync({
          id: alertId,
          data: {
            crop_id: Number(data.crop_id),
            market_id: Number(data.market_id),
            condition: data.condition,
            target_price: Number(data.target_price),
            active_status: data.active_status,
          },
        })
        toast.success(isRTL ? 'پرائس الرٹ کامیابی سے اپ ڈیٹ ہو گیا!' : 'Price alert updated successfully!')
      } else {
        await createAlert.mutateAsync({
          user_id: currentUser.id,
          crop_id: Number(data.crop_id),
          market_id: Number(data.market_id),
          condition: data.condition,
          target_price: Number(data.target_price),
          active_status: data.active_status,
        })
        toast.success(isRTL ? 'نیا پرائس الرٹ کامیابی سے شامل کر دیا گیا!' : 'Price alert created successfully!')
      }
      navigate('/alerts', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save alert.'
      setFormError(msg)
    }
  }

  const isLoading = isLoadingCrops || isLoadingMarkets || (isEditMode && isLoadingAlert)

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center">
        <Spinner size="md" label={t('common.loading')} />
      </div>
    )
  }

  if (isEditMode && alertFetchError) {
    return (
      <div className="py-12 max-w-md mx-auto">
        <ErrorBanner
          message="Alert not found or failed to load."
          onRetry={() => navigate('/alerts')}
        />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-12">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/alerts')}
          className="inline-flex items-center space-x-1.5 rtl:space-x-reverse text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-forest dark:hover:text-mint transition py-1.5 px-3 rounded-xl bg-white dark:bg-forest-950 border border-gray-200 dark:border-forest-800 shadow-2xs active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 rtl-flip" />
          <span>{t('common.back')}</span>
        </button>
      </div>

      {/* Main Form Card */}
      <div className="bg-white dark:bg-forest-950 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-forest-800 shadow-xs">
        <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6 pb-4 border-b border-gray-100 dark:border-forest-800">
          <div className="w-10 h-10 rounded-2xl bg-forest-50 dark:bg-forest-900 text-forest dark:text-mint flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              {isEditMode ? t('alertForm.editTitle') : t('alertForm.newTitle')}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('alerts.subtitle')}
            </p>
          </div>
        </div>

        {formError && <ErrorBanner message={formError} className="mb-5" />}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Crop Selector */}
          <div>
            <label htmlFor="crop_id" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('alertForm.cropLabel')}
            </label>
            <select
              id="crop_id"
              {...register('crop_id')}
              className={`w-full px-4 py-3 text-sm rounded-xl border bg-gray-50 dark:bg-forest-900/40 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-forest-900 focus:outline-none focus:ring-2 focus:ring-forest/20 transition ${
                errors.crop_id ? 'border-red-500' : 'border-gray-200 dark:border-forest-800 focus:border-forest'
              }`}
            >
              {crops?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.category})
                </option>
              ))}
            </select>
            {errors.crop_id && (
              <p className="text-xs text-red-600 mt-1">{errors.crop_id.message}</p>
            )}
          </div>

          {/* Market Selector */}
          <div>
            <label htmlFor="market_id" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('alertForm.marketLabel')}
            </label>
            <select
              id="market_id"
              {...register('market_id')}
              className={`w-full px-4 py-3 text-sm rounded-xl border bg-gray-50 dark:bg-forest-900/40 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-forest-900 focus:outline-none focus:ring-2 focus:ring-forest/20 transition ${
                errors.market_id ? 'border-red-500' : 'border-gray-200 dark:border-forest-800 focus:border-forest'
              }`}
            >
              {markets?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.district}
                </option>
              ))}
            </select>
            {errors.market_id && (
              <p className="text-xs text-red-600 mt-1">{errors.market_id.message}</p>
            )}
          </div>

          {/* Condition: Segmented Control Above / Below */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('alertForm.conditionLabel')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('condition', 'Above', { shouldValidate: true })}
                className={`py-3 px-4 rounded-2xl border-2 flex items-center justify-center space-x-2 rtl:space-x-reverse font-bold text-xs sm:text-sm transition ${
                  selectedCondition === 'Above'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                    : 'border-gray-200 dark:border-forest-800 bg-gray-50 dark:bg-forest-900/40 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>{t('alertForm.aboveLabel')}</span>
              </button>

              <button
                type="button"
                onClick={() => setValue('condition', 'Below', { shouldValidate: true })}
                className={`py-3 px-4 rounded-2xl border-2 flex items-center justify-center space-x-2 rtl:space-x-reverse font-bold text-xs sm:text-sm transition ${
                  selectedCondition === 'Below'
                    ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 shadow-2xs'
                    : 'border-gray-200 dark:border-forest-800 bg-gray-50 dark:bg-forest-900/40 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                <TrendingDown className="w-4 h-4 text-amber-600" />
                <span>{t('alertForm.belowLabel')}</span>
              </button>
            </div>
            {errors.condition && (
              <p className="text-xs text-red-600 mt-1">{errors.condition.message}</p>
            )}
          </div>

          {/* Target Price */}
          <div>
            <label htmlFor="target_price" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('alertForm.targetLabel')}
            </label>
            <div className="relative">
              <span className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400`}>
                Rs
              </span>
              <input
                id="target_price"
                type="number"
                step="10"
                min="1"
                placeholder="4000"
                {...register('target_price')}
                className={`w-full ${isRTL ? 'pr-12 pl-20' : 'pl-12 pr-20'} py-3 text-sm rounded-xl border bg-gray-50 dark:bg-forest-900/40 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-forest-900 focus:outline-none focus:ring-2 focus:ring-forest/20 transition ${
                  errors.target_price ? 'border-red-500' : 'border-gray-200 dark:border-forest-800 focus:border-forest'
                }`}
              />
              <span className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium`}>
                / 40 kg
              </span>
            </div>
            {errors.target_price && (
              <p className="text-xs text-red-600 mt-1">{errors.target_price.message}</p>
            )}
          </div>

          {/* Active Status Switch */}
          <div className="pt-2 flex items-center justify-between p-3.5 bg-gray-50 dark:bg-forest-900/40 rounded-2xl border border-gray-100 dark:border-forest-800">
            <div>
              <div className="text-xs font-bold text-gray-900 dark:text-white">{t('alertForm.activeLabel')}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                {isRTL ? 'فعال ہونے پر قیمت میچ ہوتے ہی الرٹ ٹریگر کرے گا' : 'When enabled, triggers and adds to your badge counter'}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={activeStatus}
                onChange={(e) => setValue('active_status', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] rtl:after:left-auto rtl:after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest dark:peer-checked:bg-neon"></div>
            </label>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 flex items-center justify-end space-x-3 rtl:space-x-reverse">
            <button
              type="button"
              onClick={() => navigate('/alerts')}
              disabled={isSubmitting}
              className="px-5 py-3 rounded-xl border border-gray-200 dark:border-forest-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-forest-900 transition"
            >
              {t('common.cancel')}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || createAlert.isPending || updateAlert.isPending}
              className="px-6 py-3 rounded-xl bg-neon text-neon-dark text-xs font-black shadow-md hover:brightness-105 active:scale-95 disabled:opacity-50 transition flex items-center space-x-1.5 rtl:space-x-reverse"
            >
              {isSubmitting || createAlert.isPending || updateAlert.isPending ? (
                <>
                  <Spinner size="sm" className="!p-0 border-t-neon-dark" />
                  <span>{t('common.loading')}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditMode ? t('alertForm.submitEdit') : t('alertForm.submitCreate')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="text-center text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1.5">
        <ShieldAlert className="w-4 h-4 text-forest dark:text-mint" />
        <span>Alerts trigger on exact target price equality (≥ or ≤)</span>
      </div>
    </div>
  )
}

export default AlertForm
