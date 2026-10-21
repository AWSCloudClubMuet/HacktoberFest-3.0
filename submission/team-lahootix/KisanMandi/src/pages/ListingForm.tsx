import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  listingSchema,
  type ListingFormData,
  SINDH_DISTRICTS,
  normalizePhone,
  isDateNotPast,
} from '../lib/validators'
import {
  useCrops,
  useListing,
  useCreateListing,
  useUpdateListing,
  usePrices,
} from '../api/hooks'
import { useCurrentUser } from '../context/UserContext'
import { useTranslation } from '../i18n'
import { getMarketAverage } from '../lib/priceMath'
import { getMarketLabel } from '../lib/marketLabel'
import { formatPKR } from '../lib/format'
import { Spinner, ErrorBanner, useToast } from '../components'
import {
  ArrowLeft,
  PackagePlus,
  Info,
  Check,
} from 'lucide-react'

export const ListingForm: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { currentUser } = useCurrentUser()
  const { t, isRTL } = useTranslation()

  const isEditMode = !!id
  const listingId = id ? parseInt(id, 10) : undefined

  // Compute today's date string YYYY-MM-DD for min attribute
  const todayStr = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }, [])

  // 1. Fetch auxiliary data
  const { data: crops, isLoading: isLoadingCrops } = useCrops()
  const { data: allPrices } = usePrices({ _sort: 'date', _order: 'desc' })

  // 2. Fetch existing listing if edit mode
  const {
    data: existingListing,
    isLoading: isLoadingListing,
    error: listingFetchError,
  } = useListing(listingId ?? 0)

  const createListing = useCreateListing()
  const updateListing = useUpdateListing()
  const [formError, setFormError] = useState<string | null>(null)

  // 3. React Hook Form Setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    mode: 'onChange',
    defaultValues: {
      crop_id: 1,
      quantity: 50,
      asking_price: 4000,
      district: currentUser?.district || 'Hyderabad',
      grade: 'A',
      available_from: todayStr,
      contact_phone: currentUser?.phone || '03001230001',
    },
  })

  const selectedCropId = watch('crop_id')
  const selectedGrade = watch('grade')
  const askingPriceInput = watch('asking_price')

  // Live Market Average & Position Hint
  const liveMarketAvg = useMemo(() => {
    if (!allPrices || !selectedCropId) return 0
    return getMarketAverage(allPrices, Number(selectedCropId))
  }, [allPrices, selectedCropId])

  const liveMarketLabel = useMemo(() => {
    if (liveMarketAvg <= 0 || !askingPriceInput) return null
    return getMarketLabel(Number(askingPriceInput), liveMarketAvg)
  }, [liveMarketAvg, askingPriceInput])

  // Prefill in edit mode and enforce ownership
  useEffect(() => {
    if (isEditMode && existingListing) {
      if (currentUser && existingListing.user_id !== currentUser.id) {
        toast.error('Not allowed: You do not own this listing.')
        navigate('/marketplace', { replace: true })
        return
      }

      reset({
        crop_id: existingListing.crop_id,
        quantity: existingListing.quantity,
        asking_price: existingListing.asking_price,
        district: existingListing.district,
        grade: existingListing.grade,
        available_from: existingListing.available_from,
        contact_phone: existingListing.contact_phone || currentUser?.phone || '',
      })
    }
  }, [isEditMode, existingListing, currentUser, reset, navigate, toast])

  // Submit Handler
  const onSubmit = async (data: ListingFormData) => {
    if (!currentUser) return
    setFormError(null)

    // Check "not in the past" rule:
    if (!isEditMode || (existingListing && data.available_from !== existingListing.available_from)) {
      if (!isDateNotPast(data.available_from)) {
        setError('available_from', {
          type: 'manual',
          message: 'Availability date cannot be in the past',
        })
        return
      }
    }

    const normalizedPhone = normalizePhone(data.contact_phone)
    if (!normalizedPhone) {
      setError('contact_phone', {
        type: 'manual',
        message: 'Please enter a valid Pakistani mobile number',
      })
      return
    }

    try {
      if (isEditMode && listingId) {
        await updateListing.mutateAsync({
          id: listingId,
          data: {
            crop_id: Number(data.crop_id),
            quantity: Number(data.quantity),
            asking_price: Number(data.asking_price),
            district: data.district,
            grade: data.grade,
            available_from: data.available_from,
            contact_phone: normalizedPhone,
          },
        })
        toast.success(isRTL ? 'لسٹنگ کامیابی سے اپ ڈیٹ ہو گئی!' : 'Listing updated successfully!')
      } else {
        await createListing.mutateAsync({
          user_id: currentUser.id,
          crop_id: Number(data.crop_id),
          quantity: Number(data.quantity),
          asking_price: Number(data.asking_price),
          district: data.district,
          grade: data.grade,
          available_from: data.available_from,
          status: 'Active',
          created_at: new Date().toISOString(),
          contact_phone: normalizedPhone,
        })
        toast.success(isRTL ? 'فصل کامیابی سے مارکیٹ میں لسٹ ہو گئی!' : 'Produce listing posted to marketplace!')
      }
      navigate('/marketplace', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save listing.'
      setFormError(msg)
    }
  }

  const isLoading = isLoadingCrops || (isEditMode && isLoadingListing)

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center">
        <Spinner size="md" label={t('common.loading')} />
      </div>
    )
  }

  if (isEditMode && listingFetchError) {
    return (
      <div className="py-12 max-w-md mx-auto">
        <ErrorBanner
          message="Listing not found or could not be loaded."
          onRetry={() => navigate('/marketplace')}
        />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-14">
      {/* Top Back Nav */}
      <div>
        <button
          onClick={() => navigate('/marketplace')}
          className="inline-flex items-center space-x-1.5 rtl:space-x-reverse text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-forest dark:hover:text-mint transition py-1.5 px-3 rounded-xl bg-white dark:bg-forest-950 border border-gray-200 dark:border-forest-800 shadow-2xs active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 rtl-flip" />
          <span>{t('listingDetail.back')}</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-forest-950 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-forest-800 shadow-xs">
        <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6 pb-4 border-b border-gray-100 dark:border-forest-800">
          <div className="w-10 h-10 rounded-2xl bg-forest-50 dark:bg-forest-900 text-forest dark:text-mint flex items-center justify-center">
            <PackagePlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              {isEditMode ? t('listingForm.editTitle') : t('listingForm.newTitle')}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('marketplace.subtitle')}
            </p>
          </div>
        </div>

        {formError && <ErrorBanner message={formError} className="mb-5" />}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Crop Selection */}
          <div>
            <label htmlFor="crop_id" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('listingForm.cropLabel')}
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

          {/* Quantity & Unit */}
          <div>
            <label htmlFor="quantity" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('listingForm.quantityLabel')}
            </label>
            <div className="relative">
              <input
                id="quantity"
                type="number"
                step="1"
                min="1"
                placeholder="50"
                {...register('quantity')}
                className={`w-full px-4 ${isRTL ? 'pl-20 pr-4' : 'pr-20 pl-4'} py-3 text-sm rounded-xl border bg-gray-50 dark:bg-forest-900/40 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-forest-900 focus:outline-none focus:ring-2 focus:ring-forest/20 transition ${
                  errors.quantity ? 'border-red-500' : 'border-gray-200 dark:border-forest-800 focus:border-forest'
                }`}
              />
              <span className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium`}>
                {t('common.maunds')}
              </span>
            </div>
            {errors.quantity && (
              <p className="text-xs text-red-600 mt-1">{errors.quantity.message}</p>
            )}
          </div>

          {/* Asking Price & Live Market Benchmark Hint */}
          <div>
            <label htmlFor="asking_price" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('listingForm.priceLabel')}
            </label>
            <div className="relative">
              <span className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400`}>
                Rs
              </span>
              <input
                id="asking_price"
                type="number"
                step="10"
                min="1"
                placeholder="4000"
                {...register('asking_price')}
                className={`w-full ${isRTL ? 'pr-12 pl-24' : 'pl-12 pr-24'} py-3 text-sm rounded-xl border bg-gray-50 dark:bg-forest-900/40 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-forest-900 focus:outline-none focus:ring-2 focus:ring-forest/20 transition ${
                  errors.asking_price ? 'border-red-500' : 'border-gray-200 dark:border-forest-800 focus:border-forest'
                }`}
              />
              <span className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium`}>
                {t('common.perMaund')}
              </span>
            </div>
            {errors.asking_price && (
              <p className="text-xs text-red-600 mt-1">{errors.asking_price.message}</p>
            )}

            {/* Live Market Position Hint */}
            {liveMarketAvg > 0 && liveMarketLabel && (
              <div className="mt-2 p-2.5 rounded-xl bg-gray-50 dark:bg-forest-900/40 border border-gray-100 dark:border-forest-800 flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1 rtl:space-x-reverse">
                  <Info className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    {t('listingDetail.marketAvg')}: <strong dir="ltr">{formatPKR(liveMarketAvg)}/maund</strong>
                  </span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[11px] border ${
                    liveMarketLabel.label === 'Below'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200'
                      : liveMarketLabel.label === 'At'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-200'
                  }`}
                  dir="ltr"
                >
                  {liveMarketLabel.formattedText}
                </span>
              </div>
            )}
          </div>

          {/* Quality Grade (Segmented Control A / B / C) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('listingForm.gradeLabel')}
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(['A', 'B', 'C'] as const).map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => setValue('grade', grade, { shouldValidate: true })}
                  className={`py-2.5 rounded-xl border-2 font-bold text-xs transition ${
                    selectedGrade === grade
                      ? 'border-forest dark:border-mint bg-forest-50 dark:bg-forest-900 text-forest dark:text-mint shadow-2xs'
                      : 'border-gray-200 dark:border-forest-800 bg-gray-50 dark:bg-forest-900/40 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {t('common.grade')} {grade}
                  <span className="block text-[10px] font-normal text-gray-400">
                    {grade === 'A' ? 'Premium' : grade === 'B' ? 'Standard' : 'Commercial'}
                  </span>
                </button>
              ))}
            </div>
            {errors.grade && (
              <p className="text-xs text-red-600 mt-1">{errors.grade.message}</p>
            )}
          </div>

          {/* District Dropdown */}
          <div>
            <label htmlFor="district" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('listingForm.districtLabel')}
            </label>
            <select
              id="district"
              {...register('district')}
              className={`w-full px-4 py-3 text-sm rounded-xl border bg-gray-50 dark:bg-forest-900/40 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-forest-900 focus:outline-none focus:ring-2 focus:ring-forest/20 transition ${
                errors.district ? 'border-red-500' : 'border-gray-200 dark:border-forest-800 focus:border-forest'
              }`}
            >
              {SINDH_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {errors.district && (
              <p className="text-xs text-red-600 mt-1">{errors.district.message}</p>
            )}
          </div>

          {/* Available From Date */}
          <div>
            <label htmlFor="available_from" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('listingForm.availableFromLabel')}
            </label>
            <input
              id="available_from"
              type="date"
              min={isEditMode ? undefined : todayStr}
              {...register('available_from')}
              className={`w-full px-4 py-3 text-sm rounded-xl border bg-gray-50 dark:bg-forest-900/40 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-forest-900 focus:outline-none focus:ring-2 focus:ring-forest/20 transition ${
                errors.available_from ? 'border-red-500' : 'border-gray-200 dark:border-forest-800 focus:border-forest'
              }`}
            />
            {errors.available_from && (
              <p className="text-xs text-red-600 mt-1">{errors.available_from.message}</p>
            )}
          </div>

          {/* Contact Mobile Phone */}
          <div>
            <label htmlFor="contact_phone" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('listingForm.phoneLabel')}
            </label>
            <input
              id="contact_phone"
              type="tel"
              dir="ltr"
              placeholder="03001234567"
              {...register('contact_phone')}
              className={`w-full px-4 py-3 text-sm rounded-xl border bg-gray-50 dark:bg-forest-900/40 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-forest-900 focus:outline-none focus:ring-2 focus:ring-forest/20 transition ${
                errors.contact_phone ? 'border-red-500' : 'border-gray-200 dark:border-forest-800 focus:border-forest'
              }`}
            />
            {errors.contact_phone && (
              <p className="text-xs text-red-600 mt-1">{errors.contact_phone.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end space-x-3 rtl:space-x-reverse">
            <button
              type="button"
              onClick={() => navigate('/marketplace')}
              disabled={isSubmitting}
              className="px-5 py-3 rounded-xl border border-gray-200 dark:border-forest-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-forest-900 transition"
            >
              {t('common.cancel')}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || createListing.isPending || updateListing.isPending}
              className="px-6 py-3 rounded-xl bg-neon text-neon-dark text-xs font-black shadow-md hover:brightness-105 active:scale-95 disabled:opacity-50 transition flex items-center space-x-1.5 rtl:space-x-reverse"
            >
              {isSubmitting || createListing.isPending || updateListing.isPending ? (
                <>
                  <Spinner size="sm" className="!p-0 border-t-neon-dark" />
                  <span>{t('common.loading')}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditMode ? t('listingForm.submitEdit') : t('listingForm.submitCreate')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ListingForm
