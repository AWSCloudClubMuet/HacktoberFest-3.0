import React, { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  useListings,
  useCrops,
  useMarkSoldListing,
  useDeleteListing,
} from '../api/hooks'
import { useCurrentUser } from '../context/UserContext'
import { useTranslation } from '../i18n'
import { formatPriceWithUnit, formatDateDisplay } from '../lib/format'
import type { Listing } from '../types'
import {
  CardSkeleton,
  ErrorBanner,
  EmptyState,
  PullToRefresh,
  ConfirmDialog,
  useToast,
  AjrakGradeTag,
} from '../components'
import {
  Package,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
  Check,
} from 'lucide-react'

type TabType = 'Active' | 'Sold'

export const MyListings: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { currentUser } = useCurrentUser()
  const { t, isRTL } = useTranslation()

  // 1. Fetch current user's listings
  const {
    data: rawListings,
    isLoading: isLoadingListings,
    isRefetching: isRefetchingListings,
    error: listingsError,
    refetch: refetchListings,
  } = useListings(currentUser?.id ? { user_id: currentUser.id } : undefined)

  const { data: crops, isLoading: isLoadingCrops } = useCrops()

  // Mutations
  const markSoldMutation = useMarkSoldListing()
  const deleteMutation = useDeleteListing()

  const [activeTab, setActiveTab] = useState<TabType>('Active')
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [markingSoldId, setMarkingSoldId] = useState<number | null>(null)

  // 2. Client-side Join with Crops
  const enrichedListings = useMemo(() => {
    if (!rawListings) return []
    return rawListings.map((listing) => {
      const crop = crops?.find((c) => c.id === listing.crop_id)
      return {
        ...listing,
        cropName: crop?.name || `Crop #${listing.crop_id}`,
        cropCategory: crop?.category || 'General',
      }
    })
  }, [rawListings, crops])

  // Filter by Tab
  const activeListings = useMemo(
    () => enrichedListings.filter((l) => l.status === 'Active'),
    [enrichedListings],
  )
  const soldListings = useMemo(
    () => enrichedListings.filter((l) => l.status === 'Sold'),
    [enrichedListings],
  )

  const displayedListings = activeTab === 'Active' ? activeListings : soldListings

  // Mark Sold Handler
  const handleMarkSold = async (listing: Listing) => {
    setMarkingSoldId(listing.id)
    try {
      await markSoldMutation.mutateAsync(listing.id)
      toast.success(isRTL ? 'فصل فروخت شدہ نشان زد کر دی گئی!' : 'Listing marked as Sold and moved to Sold tab.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to mark as sold.'
      toast.error(msg)
    } finally {
      setMarkingSoldId(null)
    }
  }

  // Delete Handler
  const handleConfirmDelete = async () => {
    if (!listingToDelete) return
    setIsDeleting(true)
    try {
      await deleteMutation.mutateAsync(listingToDelete.id)
      toast.success(isRTL ? 'لسٹنگ کامیابی سے حذف کر دی گئی!' : 'Listing deleted successfully.')
      setListingToDelete(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete listing.'
      toast.error(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  const isLoading = isLoadingListings || isLoadingCrops

  return (
    <PullToRefresh onRefresh={() => refetchListings()} isRefreshing={isRefetchingListings}>
      <div className="space-y-4 max-w-4xl mx-auto pb-16">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-forest-950 p-4 sm:p-5 rounded-3xl border border-gray-100 dark:border-forest-800 shadow-xs">
          <div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Package className="w-5 h-5 text-forest dark:text-mint" />
              <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                {t('myListings.title')}
              </h1>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('myListings.subtitle')}
            </p>
          </div>

          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <button
              onClick={() => refetchListings()}
              disabled={isRefetchingListings}
              className="p-2.5 rounded-2xl text-gray-600 dark:text-gray-300 hover:text-forest hover:bg-forest-50 dark:hover:bg-forest-900 active:scale-95 transition border border-gray-200 dark:border-forest-800"
              title={t('common.refresh')}
              aria-label="Refresh listings"
            >
              <RefreshCw
                className={`w-4 h-4 rtl-flip ${isRefetchingListings ? 'animate-spin text-forest dark:text-neon' : ''}`}
              />
            </button>

            <Link
              to="/listings/new"
              className="px-4 py-2.5 bg-neon text-neon-dark rounded-2xl text-xs font-black shadow-xs hover:brightness-105 active:scale-95 transition flex items-center space-x-1.5 rtl:space-x-reverse"
            >
              <Plus className="w-4 h-4" />
              <span>+ {t('marketplace.postListing')}</span>
            </Link>
          </div>
        </div>

        {/* Active vs Sold Tabs */}
        <div className="flex space-x-2 rtl:space-x-reverse bg-white dark:bg-forest-950 p-2 rounded-2xl border border-gray-100 dark:border-forest-800 shadow-xs">
          <button
            onClick={() => setActiveTab('Active')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 rtl:space-x-reverse ${
              activeTab === 'Active'
                ? 'bg-forest dark:bg-forest-800 text-neon shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-forest-900/40'
            }`}
          >
            <span>{t('myListings.tabActive', { count: activeListings.length })}</span>
          </button>

          <button
            onClick={() => setActiveTab('Sold')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 rtl:space-x-reverse ${
              activeTab === 'Sold'
                ? 'bg-forest dark:bg-forest-800 text-neon shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-forest-900/40'
            }`}
          >
            <span>{t('myListings.tabSold', { count: soldListings.length })}</span>
          </button>
        </div>

        {listingsError && (
          <ErrorBanner
            message="Failed to load your listings."
            onRetry={() => refetchListings()}
          />
        )}

        {/* Listings Content */}
        {isLoading ? (
          <div className="space-y-3">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : displayedListings.length === 0 ? (
          <EmptyState
            title={
              activeTab === 'Active'
                ? t('myListings.noActiveTitle')
                : t('myListings.noSoldTitle')
            }
            description={
              activeTab === 'Active'
                ? t('myListings.noActiveDesc')
                : t('myListings.noSoldDesc')
            }
            action={
              activeTab === 'Active'
                ? {
                    label: `+ ${t('myListings.postCta')}`,
                    onClick: () => navigate('/listings/new'),
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {displayedListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white dark:bg-forest-950 rounded-3xl p-5 border border-gray-100 dark:border-forest-800 shadow-xs hover:border-forest-200 dark:hover:border-forest-700 transition-all flex flex-col justify-between"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left: Info */}
                  <div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Link
                        to={`/listings/${listing.id}`}
                        className="font-bold text-base text-gray-900 dark:text-white hover:text-forest dark:hover:text-mint transition"
                      >
                        {listing.cropName}
                      </Link>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-forest-900 text-gray-600 dark:text-gray-300 font-medium">
                        {listing.cropCategory}
                      </span>
                      <AjrakGradeTag grade={listing.grade as 'A' | 'B' | 'C'} />
                      {listing.status === 'Sold' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold">
                          {t('common.sold')}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1 rtl:space-x-reverse">
                        <MapPin className="w-3.5 h-3.5 text-forest dark:text-mint" />
                        <span>{listing.district}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 rtl:space-x-reverse">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {t('marketplace.availableFrom')}: <span dir="ltr">{formatDateDisplay(listing.available_from)}</span>
                        </span>
                      </span>
                    </div>

                    <div className="mt-3 flex items-center space-x-4 rtl:space-x-reverse">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">
                          {t('common.quantity')}
                        </span>
                        <div className="text-sm font-black text-gray-900 dark:text-white">
                          <span dir="ltr">{listing.quantity}</span> {t('common.maunds')}
                        </div>
                      </div>

                      <div className="border-l rtl:border-l-0 rtl:border-r border-gray-100 dark:border-forest-800 pl-4 rtl:pl-0 rtl:pr-4">
                        <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">
                          {t('common.price')}
                        </span>
                        <div className="text-sm font-black text-forest dark:text-mint">
                          <span dir="ltr">{formatPriceWithUnit(listing.asking_price)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-forest-800 justify-end">
                    {/* Mark Sold Button (Active Tab Only) */}
                    {listing.status === 'Active' && (
                      <button
                        type="button"
                        onClick={() => handleMarkSold(listing)}
                        disabled={markingSoldId === listing.id}
                        className="px-3 py-1.5 rounded-xl bg-forest-50 dark:bg-forest-900/60 hover:bg-forest-100 text-forest dark:text-mint border border-forest-200 dark:border-forest-700 text-xs font-bold transition flex items-center space-x-1 rtl:space-x-reverse active:scale-95"
                        title={t('listingDetail.markSold')}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{markingSoldId === listing.id ? t('common.loading') : t('listingDetail.markSold')}</span>
                      </button>
                    )}

                    {/* Edit Button */}
                    <Link
                      to={`/listings/${listing.id}/edit`}
                      className="p-2 text-gray-500 hover:text-forest hover:bg-gray-100 dark:hover:bg-forest-900 rounded-xl transition"
                      title={t('common.edit')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setListingToDelete(listing)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!listingToDelete}
          title={t('listingDetail.deleteListing')}
          message={t('listingDetail.confirmDelete')}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
          isDestructive={true}
          isLoading={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setListingToDelete(null)}
        />
      </div>
    </PullToRefresh>
  )
}

export default MyListings
