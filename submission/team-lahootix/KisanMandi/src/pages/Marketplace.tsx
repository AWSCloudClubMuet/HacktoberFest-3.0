import React, { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  useListings,
  useCrops,
  useUsers,
  usePrices,
} from '../api/hooks'
import { useCurrentUser } from '../context/UserContext'
import { useTranslation } from '../i18n'
import { getMarketAverage } from '../lib/priceMath'
import { getMarketLabel } from '../lib/marketLabel'
import { formatPriceWithUnit, formatDateDisplay } from '../lib/format'
import { SINDH_DISTRICTS } from '../lib/validators'
import {
  CardSkeleton,
  ErrorBanner,
  EmptyState,
  PullToRefresh,
  Chip,
  AjrakGradeTag,
} from '../components'
import {
  Search,
  X,
  Plus,
  ArrowUpDown,
  Filter,
  Calendar,
  MapPin,
  User as UserIcon,
  ShoppingBag,
  RefreshCw,
} from 'lucide-react'

type SortOption = 'newest' | 'price_asc'

export const Marketplace: React.FC = () => {
  const navigate = useNavigate()
  const { isFarmer } = useCurrentUser()
  const { t, isRTL } = useTranslation()

  // 1. Fetch live data
  const {
    data: rawListings,
    isLoading: isLoadingListings,
    isRefetching: isRefetchingListings,
    error: listingsError,
    refetch: refetchListings,
  } = useListings({ status: 'Active' })

  const { data: crops, isLoading: isLoadingCrops } = useCrops()
  const { data: users, isLoading: isLoadingUsers } = useUsers()
  const { data: allPrices, refetch: refetchPrices } = usePrices({
    _sort: 'date',
    _order: 'desc',
  })

  // 2. Filters & Sort States
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCropId, setSelectedCropId] = useState<string>('All')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All')
  const [selectedGrade, setSelectedGrade] = useState<string>('All')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [showFiltersModal, setShowFiltersModal] = useState(false)

  // 3. Pre-calculate market average per crop
  const marketAvgMap = useMemo(() => {
    const map = new Map<number, number>()
    if (allPrices && crops) {
      crops.forEach((c) => {
        map.set(c.id, getMarketAverage(allPrices, c.id))
      })
    }
    return map
  }, [allPrices, crops])

  // 4. Client-side Join & Filter
  const enrichedListings = useMemo(() => {
    if (!rawListings) return []

    // Map & Join
    const joined = rawListings.map((listing) => {
      const crop = crops?.find((c) => c.id === listing.crop_id)
      const seller = users?.find((u) => u.id === listing.user_id)
      const marketAvg = marketAvgMap.get(listing.crop_id) || 0
      const marketLabel = getMarketLabel(listing.asking_price, marketAvg)

      return {
        ...listing,
        cropName: crop?.name || `Crop #${listing.crop_id}`,
        cropCategory: crop?.category || 'General',
        sellerName: seller?.name || 'Farmer',
        sellerPhone: listing.contact_phone || seller?.phone || '',
        marketAvg,
        marketLabel,
      }
    })

    // Filter
    const filtered = joined.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        item.cropName.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        item.sellerName.toLowerCase().includes(searchTerm.toLowerCase().trim())

      const matchesCrop =
        selectedCropId === 'All' || item.crop_id === Number(selectedCropId)

      const matchesDistrict =
        selectedDistrict === 'All' || item.district === selectedDistrict

      const matchesGrade =
        selectedGrade === 'All' || item.grade === selectedGrade

      return matchesSearch && matchesCrop && matchesDistrict && matchesGrade
    })

    // Sort
    return filtered.sort((a, b) => {
      if (sortBy === 'price_asc') {
        return a.asking_price - b.asking_price
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [rawListings, crops, users, marketAvgMap, searchTerm, selectedCropId, selectedDistrict, selectedGrade, sortBy])

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedCropId !== 'All' ||
    selectedDistrict !== 'All' ||
    selectedGrade !== 'All'

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCropId('All')
    setSelectedDistrict('All')
    setSelectedGrade('All')
  }

  const handleRefresh = async () => {
    await Promise.all([refetchListings(), refetchPrices()])
  }

  const isLoading = isLoadingListings || isLoadingCrops || isLoadingUsers

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefetchingListings}>
      <div className="space-y-4 max-w-4xl mx-auto pb-16">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-forest-950 p-4 sm:p-5 rounded-3xl border border-gray-100 dark:border-forest-800 shadow-xs">
          <div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <ShoppingBag className="w-5 h-5 text-forest dark:text-mint" />
              <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                {t('marketplace.title')}
              </h1>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('marketplace.subtitle')}
            </p>
          </div>

          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <button
              onClick={handleRefresh}
              disabled={isRefetchingListings}
              className="p-2.5 rounded-2xl text-gray-600 dark:text-gray-300 hover:text-forest hover:bg-forest-50 dark:hover:bg-forest-900 active:scale-95 transition border border-gray-200 dark:border-forest-700/60"
              title={t('common.refresh')}
              aria-label="Refresh listings"
            >
              <RefreshCw
                className={`w-4 h-4 rtl-flip ${isRefetchingListings ? 'animate-spin text-forest dark:text-neon' : ''}`}
              />
            </button>

            {isFarmer && (
              <Link
                to="/listings/new"
                className="px-4 py-2.5 bg-neon text-neon-dark rounded-2xl text-xs font-black shadow-xs hover:brightness-105 active:scale-95 transition flex items-center space-x-1.5 rtl:space-x-reverse"
              >
                <Plus className="w-4 h-4" />
                <span>+ {t('marketplace.postListing')}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Search, Filter Bar & Sorting */}
        <div className="bg-white dark:bg-forest-950 p-4 rounded-3xl border border-gray-100 dark:border-forest-800 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {/* Search Box */}
            <div className="relative flex-1 w-full">
              <Search className={`absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('marketplace.searchPlaceholder')}
                className={`w-full ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-2.5 bg-gray-50 dark:bg-forest-900/40 text-gray-900 dark:text-white border border-gray-200 dark:border-forest-800 rounded-2xl text-xs sm:text-sm placeholder-gray-400 focus:bg-white dark:focus:bg-forest-900 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={`absolute ${isRTL ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center space-x-1.5 rtl:space-x-reverse bg-gray-50 dark:bg-forest-900/40 border border-gray-200 dark:border-forest-800 px-3 py-2 rounded-2xl text-xs font-medium text-gray-700 dark:text-gray-300">
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent focus:outline-none cursor-pointer font-bold text-gray-900 dark:text-white"
                >
                  <option value="newest">{t('marketplace.newest')}</option>
                  <option value="price_asc">{t('marketplace.priceAsc')}</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowFiltersModal(!showFiltersModal)}
                className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center space-x-1.5 rtl:space-x-reverse transition ${
                  hasActiveFilters
                    ? 'border-forest bg-forest-50 dark:bg-forest-900 text-forest dark:text-mint'
                    : 'border-gray-200 dark:border-forest-800 bg-gray-50 dark:bg-forest-900/40 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">{t('common.filter')}</span>
              </button>
            </div>
          </div>

          {/* Quick Filter Selectors */}
          <div className="pt-2 border-t border-gray-100 dark:border-forest-800 flex flex-wrap items-center gap-2 text-xs">
            {/* Grade Filter */}
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
              <span className="text-gray-400 text-[11px] font-semibold mr-1 rtl:mr-0 rtl:ml-1">{t('common.grade')}:</span>
              {(['All', 'A', 'B', 'C'] as const).map((g) => (
                <Chip
                  key={g}
                  label={g === 'All' ? t('common.all') : `${t('common.grade')} ${g}`}
                  size="sm"
                  active={selectedGrade === g}
                  onClick={() => setSelectedGrade(g)}
                />
              ))}
            </div>

            {/* Crop Select */}
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
              <select
                value={selectedCropId}
                onChange={(e) => setSelectedCropId(e.target.value)}
                className="px-2.5 py-1 bg-gray-50 dark:bg-forest-900/40 border border-gray-200 dark:border-forest-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none"
              >
                <option value="All">{t('marketplace.filterCrop')}</option>
                {crops?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District Select */}
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="px-2.5 py-1 bg-gray-50 dark:bg-forest-900/40 border border-gray-200 dark:border-forest-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none"
              >
                <option value="All">{t('marketplace.filterDistrict')}</option>
                {SINDH_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto rtl:ml-0 rtl:mr-auto text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t('common.clearFilters')}</span>
              </button>
            )}
          </div>
        </div>

        {listingsError && (
          <ErrorBanner
            message="Failed to load marketplace listings."
            onRetry={() => handleRefresh()}
          />
        )}

        {/* Listings Grid with Woven Grade Tags (Requirement 2.3 #6) */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[1, 2, 3, 4].map((n) => (
              <CardSkeleton key={n} />
            ))}
          </div>
        ) : enrichedListings.length === 0 ? (
          <EmptyState
            title={t('marketplace.noListingsTitle')}
            description={
              hasActiveFilters
                ? 'No active listings match your selected search or filter criteria.'
                : t('marketplace.noListingsDesc')
            }
            action={
              hasActiveFilters
                ? {
                    label: t('common.clearFilters'),
                    onClick: clearFilters,
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {enrichedListings.map((listing) => {
              const label = listing.marketLabel

              return (
                <div
                  key={listing.id}
                  onClick={() => navigate(`/listings/${listing.id}`)}
                  className="bg-white dark:bg-forest-950 rounded-3xl p-5 border border-gray-100 dark:border-forest-800 shadow-xs hover:border-forest-300 dark:hover:border-forest-600 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Top: Crop name, Woven Grade Tag (Requirement 2.3 #6), Market Label */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white group-hover:text-forest-600 dark:group-hover:text-mint transition-colors">
                          {listing.cropName}
                        </h2>
                        <span className="text-[11px] text-gray-400">{listing.cropCategory}</span>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {/* Woven-label style grade chip */}
                        <AjrakGradeTag grade={listing.grade as 'A' | 'B' | 'C'} />

                        {/* Market Position Label with Percentage */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            label.label === 'Below'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : label.label === 'At'
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          <span dir="ltr">{label.formattedText}</span>
                        </span>
                      </div>
                    </div>

                    {/* Quantity & Location */}
                    <div className="mt-3.5 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                        <MapPin className="w-3.5 h-3.5 text-forest dark:text-mint" />
                        <span>{listing.district}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {t('marketplace.availableFrom')}: <span dir="ltr">{formatDateDisplay(listing.available_from)}</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                        <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                        <span>{t('marketplace.seller')}: <strong>{listing.sellerName}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Quantity & Asking Price */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-forest-800/80 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">
                        {t('common.quantity')}
                      </div>
                      <div className="text-sm font-black text-gray-800 dark:text-gray-200">
                        <span dir="ltr">{listing.quantity}</span> {t('common.maunds')}
                      </div>
                    </div>

                    <div className="text-right rtl:text-left">
                      <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">
                        {t('common.price')}
                      </div>
                      <div className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                        <span dir="ltr">{formatPriceWithUnit(listing.asking_price)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Floating Post Listing Button for Farmers */}
        {isFarmer && (
          <div className="fixed bottom-20 right-4 rtl:right-auto rtl:left-4 z-30 md:hidden">
            <Link
              to="/listings/new"
              className="px-4 py-3 bg-neon text-neon-dark rounded-full font-black text-xs shadow-lg flex items-center space-x-2 rtl:space-x-reverse active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{t('marketplace.postListing')}</span>
            </Link>
          </div>
        )}
      </div>
    </PullToRefresh>
  )
}

export default Marketplace
