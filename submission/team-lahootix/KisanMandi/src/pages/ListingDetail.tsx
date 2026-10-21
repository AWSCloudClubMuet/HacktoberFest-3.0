import React, { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  useListing,
  useCrop,
  useUser,
  usePrices,
  useMarkSoldListing,
  useDeleteListing,
} from '../api/hooks'
import { useCurrentUser } from '../context/UserContext'
import { useTranslation } from '../i18n'
import { getMarketAverage } from '../lib/priceMath'
import { getMarketLabel } from '../lib/marketLabel'
import {
  formatPriceWithUnit,
  formatPKR,
  formatDateDisplay,
} from '../lib/format'
import { toWhatsAppNumber } from '../lib/validators'
import {
  Spinner,
  ErrorBanner,
  EmptyState,
  ConfirmDialog,
  useToast,
  RilliSoldBanner,
  AjrakGradeTag,
} from '../components'
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  CheckCircle2,
  Edit2,
  Trash2,
  Info,
} from 'lucide-react'

export const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { currentUser } = useCurrentUser()
  const { t, isRTL } = useTranslation()

  const parsedId = id ? parseInt(id, 10) : NaN

  // 1. Fetch Listing
  const {
    data: listing,
    isLoading: isLoadingListing,
    error: listingError,
    refetch: refetchListing,
  } = useListing(parsedId)

  // 2. Fetch Crop, Seller, and Prices
  const { data: crop, isLoading: isLoadingCrop } = useCrop(listing?.crop_id ?? 0)
  const { data: seller, isLoading: isLoadingSeller } = useUser(listing?.user_id)
  const { data: allPrices } = usePrices({ _sort: 'date', _order: 'desc' })

  // Mutations
  const markSoldMutation = useMarkSoldListing()
  const deleteMutation = useDeleteListing()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMarkingSold, setIsMarkingSold] = useState(false)

  // Market benchmark calculation
  const marketAvg = useMemo(() => {
    if (!allPrices || !listing) return 0
    return getMarketAverage(allPrices, listing.crop_id)
  }, [allPrices, listing])

  const marketLabel = useMemo(() => {
    if (!listing || marketAvg <= 0) return null
    return getMarketLabel(listing.asking_price, marketAvg)
  }, [listing, marketAvg])

  // Total lot value
  const totalValue = useMemo(() => {
    if (!listing) return 0
    return listing.quantity * listing.asking_price
  }, [listing])

  // Seller phone & WhatsApp formatting
  const rawPhone = listing?.contact_phone || seller?.phone || ''
  const waNumber = toWhatsAppNumber(rawPhone)
  const waMessage = listing && crop
    ? `Assalam o Alaikum, I saw your listing for ${listing.quantity} maunds of ${crop.name} on KisanMandi.`
    : 'Assalam o Alaikum, I saw your produce listing on KisanMandi.'
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`

  // Ownership check
  const isOwner = currentUser && listing && listing.user_id === currentUser.id
  const isSold = listing?.status === 'Sold'

  // Mark Sold Handler
  const handleMarkSold = async () => {
    if (!listing) return
    setIsMarkingSold(true)
    try {
      await markSoldMutation.mutateAsync(listing.id)
      toast.success(isRTL ? 'فصل فروخت شدہ نشان زد کر دی گئی!' : 'Listing marked as Sold!')
      refetchListing()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to mark listing as sold.'
      toast.error(msg)
    } finally {
      setIsMarkingSold(false)
    }
  }

  // Delete Handler
  const handleDelete = async () => {
    if (!listing) return
    setIsDeleting(true)
    try {
      await deleteMutation.mutateAsync(listing.id)
      toast.success(isRTL ? 'لسٹنگ کامیابی سے حذف کر دی گئی!' : 'Listing deleted successfully!')
      setShowDeleteConfirm(false)
      navigate('/my-listings', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete listing.'
      toast.error(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isNaN(parsedId) || (!isLoadingListing && !listing && !listingError)) {
    return (
      <div className="py-12">
        <EmptyState
          title={t('listingDetail.listingNotFound')}
          description="The produce listing you requested does not exist or may have been deleted."
          action={{
            label: t('listingDetail.back'),
            onClick: () => navigate('/marketplace'),
          }}
        />
      </div>
    )
  }

  const isLoading = isLoadingListing || isLoadingCrop || isLoadingSeller

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-14">
      {/* Top Back Nav & Owner Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-1.5 rtl:space-x-reverse text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-forest dark:hover:text-mint transition py-1.5 px-3 rounded-xl bg-white dark:bg-forest-950 border border-gray-200 dark:border-forest-800 shadow-2xs active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 rtl-flip" />
          <span>{t('listingDetail.back')}</span>
        </button>

        {/* Owner-Only Controls in Header */}
        {isOwner && !isLoading && (
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {!isSold && (
              <button
                type="button"
                onClick={handleMarkSold}
                disabled={isMarkingSold}
                className="px-3 py-1.5 rounded-xl bg-forest dark:bg-forest-800 text-neon text-xs font-bold shadow-2xs active:scale-95 transition flex items-center space-x-1 rtl:space-x-reverse"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isMarkingSold ? t('common.loading') : t('listingDetail.markSold')}</span>
              </button>
            )}

            <Link
              to={`/listings/${listing?.id}/edit`}
              className="p-1.5 rounded-xl border border-gray-200 dark:border-forest-800 bg-white dark:bg-forest-950 hover:bg-gray-50 dark:hover:bg-forest-900 text-gray-700 dark:text-gray-300 transition"
              title={t('listingDetail.editListing')}
            >
              <Edit2 className="w-4 h-4" />
            </Link>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-forest-950 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition"
              title={t('listingDetail.deleteListing')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {listingError && (
        <ErrorBanner
          message="Failed to load produce listing details."
          onRetry={() => refetchListing()}
        />
      )}

      {isLoading ? (
        <div className="p-8 bg-white dark:bg-forest-950 rounded-3xl border border-gray-100 dark:border-forest-800 shadow-xs flex flex-col items-center justify-center">
          <Spinner size="md" label={t('common.loading')} />
        </div>
      ) : listing ? (
        <>
          {/* Sold Banner with Sindhi Rilli-patch background (Requirement 2.3 #6) */}
          {isSold && (
            <RilliSoldBanner text={t('marketplace.soldOverlay')} />
          )}

          {/* Main Card */}
          <div className="bg-white dark:bg-forest-950 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-forest-800 shadow-xs space-y-6">
            {/* Title & Grade */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    {crop?.name || 'Produce Listing'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-forest-50 dark:bg-forest-900 text-forest dark:text-mint border border-forest-200 dark:border-forest-700">
                    {crop?.category}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center space-x-1.5 rtl:space-x-reverse">
                  <MapPin className="w-3.5 h-3.5 text-forest dark:text-mint" />
                  <span>
                    {t('common.district')}: {listing.district}, Sindh
                  </span>
                </p>
              </div>

              {/* Grade Chip: styled like small woven-label tag */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <AjrakGradeTag grade={listing.grade as 'A' | 'B' | 'C'} />
              </div>
            </div>

            {/* Price & Quantity Highlight Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-background dark:bg-forest-900/40 rounded-3xl border border-gray-200/60 dark:border-forest-800/80">
              {/* Asking Price & Unit */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {t('common.price')}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-0.5">
                  <span dir="ltr">{formatPriceWithUnit(listing.asking_price)}</span>
                </div>
                {/* Market label */}
                {marketLabel && (
                  <div className="mt-1.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        marketLabel.label === 'Below'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : marketLabel.label === 'At'
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      <span dir="ltr">{marketLabel.formattedText}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Quantity & Estimated Total Lot Value */}
              <div className="sm:text-right rtl:sm:text-left pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-200/60 dark:border-forest-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {t('common.quantity')}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-forest dark:text-mint mt-0.5">
                  <span dir="ltr">{listing.quantity}</span> {t('common.maunds')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                  {isRTL ? 'کل تخمینہ:' : 'Est. Total:'} <strong dir="ltr">{formatPKR(totalValue)}</strong>
                </div>
              </div>
            </div>

            {/* Market Comparison Card */}
            {marketAvg > 0 && (
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-start space-x-3 rtl:space-x-reverse text-xs">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-blue-900 dark:text-blue-200">
                    {t('listingDetail.marketAvg')}
                  </div>
                  <p className="text-blue-800 dark:text-blue-300 leading-relaxed">
                    {isRTL
                      ? `سندھ کی منڈیوں میں ${crop?.name || 'اس فصل'} کا موجودہ اوسط ریٹ ${formatPriceWithUnit(marketAvg)} ہے۔ یہ لسٹنگ ${marketLabel?.formattedText} پر پیش کی گئی ہے۔`
                      : `The current average wholesale price for ${crop?.name} across all Sindh mandis is ${formatPriceWithUnit(marketAvg)}. This listing is offered at ${marketLabel?.formattedText}.`}
                  </p>
                </div>
              </div>
            )}

            {/* Produce Information Grid */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-forest-800 text-xs">
              <div>
                <span className="text-gray-400 dark:text-gray-500 font-medium">{t('listingDetail.availableFrom')}</span>
                <p className="font-bold text-gray-900 dark:text-white text-sm mt-0.5 flex items-center gap-1.5 rtl:space-x-reverse">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span dir="ltr">{formatDateDisplay(listing.available_from)}</span>
                </p>
              </div>

              <div>
                <span className="text-gray-400 dark:text-gray-500 font-medium">{t('common.status')}</span>
                <p className="font-bold text-sm mt-0.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                      isSold
                        ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    {isSold ? t('common.sold') : t('common.active')}
                  </span>
                </p>
              </div>
            </div>

            {/* Seller Contact Card */}
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-forest-900/40 border border-gray-100 dark:border-forest-800 space-y-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="w-10 h-10 rounded-2xl bg-forest dark:bg-forest-800 text-neon flex items-center justify-center font-bold text-sm shadow-2xs">
                  {seller?.name ? seller.name.charAt(0) : 'F'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                    {seller?.name || t('nav.farmerBadge')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {seller?.district || listing.district} • <span dir="ltr">{rawPhone}</span>
                  </p>
                </div>
              </div>

              {/* Call & WhatsApp Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Call Button */}
                <a
                  href={isSold ? undefined : `tel:${rawPhone}`}
                  className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 rtl:space-x-reverse transition shadow-xs ${
                    isSold
                      ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed pointer-events-none'
                      : 'bg-forest dark:bg-forest-800 text-white hover:bg-forest-700 active:scale-95'
                  }`}
                >
                  <Phone className="w-4 h-4 rtl-flip" />
                  <span>{t('listingDetail.callSeller')}</span>
                </a>

                {/* WhatsApp Button */}
                <a
                  href={isSold ? undefined : waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 rtl:space-x-reverse transition shadow-xs ${
                    isSold
                      ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed pointer-events-none'
                      : 'bg-[#25D366] text-white hover:bg-[#1EBE5D] active:scale-95'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{t('listingDetail.whatsAppSeller')}</span>
                </a>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={t('listingDetail.deleteListing')}
        message={t('listingDetail.confirmDelete')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}

export default ListingDetail
