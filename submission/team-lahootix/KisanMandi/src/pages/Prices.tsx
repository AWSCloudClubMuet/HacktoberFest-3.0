import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useCrops, useMarkets, usePrices, queryKeys } from '../api/hooks'
import { useUser } from '../context/UserContext'
import { useTranslation } from '../i18n'
import { getLatestPrice, getDailyChange } from '../lib/priceMath'
import { formatPriceWithUnit, formatChange, formatUpdatedTime } from '../lib/format'
import {
  CardSkeleton,
  ErrorBanner,
  EmptyState,
  Chip,
  PullToRefresh,
  AjrakStrip,
  AjrakBadgeRing,
  AjrakOverlay,
} from '../components'
import { SteppedBars } from '../components/illustrations/SteppedBars'
import { SindhiArchIcon } from '../components/illustrations/SindhiArchIcon'
import {
  Search,
  X,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  MapPin,
  Calendar,
  Calculator,
  Sun,
  Moon,
  Sunset,
} from 'lucide-react'

export const Prices: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentUser, isFarmer } = useUser()
  const { t, isRTL } = useTranslation()

  // 1. Fetch Markets & Crops
  const {
    data: markets,
    isLoading: isLoadingMarkets,
    error: marketsError,
    refetch: refetchMarkets,
  } = useMarkets()

  const {
    data: crops,
    isLoading: isLoadingCrops,
    error: cropsError,
    refetch: refetchCrops,
  } = useCrops()

  // Selected market ID from URL query param, default to first market
  const marketIdParam = searchParams.get('market')
  const selectedMarketId = useMemo(() => {
    if (marketIdParam) {
      const parsed = parseInt(marketIdParam, 10)
      if (!isNaN(parsed)) return parsed
    }
    return markets && markets.length > 0 ? markets[0].id : 1
  }, [marketIdParam, markets])

  const handleSelectMarket = (id: number) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev)
      updated.set('market', String(id))
      return updated
    })
  }

  // 2. Fetch prices efficiently for the selected market
  const {
    data: prices,
    isLoading: isLoadingPrices,
    isRefetching: isRefetchingPrices,
    error: pricesError,
    refetch: refetchPrices,
  } = usePrices({
    market_id: selectedMarketId,
    _sort: 'date',
    _order: 'desc',
  })

  // 3. Search & Category Filters State
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Debounce search by 250ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase())
    }, 250)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Derive unique categories from crops
  const categories = useMemo(() => {
    if (!crops) return ['All']
    const cats = Array.from(new Set(crops.map((c) => c.category)))
    return ['All', ...cats]
  }, [crops])

  // Filter crops by search query and category
  const filteredCrops = useMemo(() => {
    if (!crops) return []
    return crops.filter((crop) => {
      const matchesSearch =
        !debouncedSearch || crop.name.toLowerCase().includes(debouncedSearch)
      const matchesCategory =
        selectedCategory === 'All' || crop.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [crops, debouncedSearch, selectedCategory])

  // Pull-to-refresh & Manual refresh handler
  const handleRefresh = async () => {
    await Promise.all([
      refetchPrices(),
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts() }),
    ])
    setLastUpdated(new Date())
  }

  // Time-of-day greeting
  const greetingData = useMemo(() => {
    const hour = new Date().getHours()
    const name = currentUser?.name || 'Farmer'
    if (hour < 12) {
      return {
        text: t('greetings.morning', { name }),
        icon: <Sun className="w-4 h-4 text-amber-300" />,
      }
    } else if (hour < 18) {
      return {
        text: t('greetings.afternoon', { name }),
        icon: <Sunset className="w-4 h-4 text-amber-400" />,
      }
    } else {
      return {
        text: t('greetings.evening', { name }),
        icon: <Moon className="w-4 h-4 text-indigo-300" />,
      }
    }
  }, [currentUser, t])

  // Helper crop emoji mapping
  const getCropEmoji = (cropName: string) => {
    const name = cropName.toLowerCase()
    if (name.includes('mango')) return '🥭'
    if (name.includes('cotton')) return '☁️'
    if (name.includes('wheat')) return '🌾'
    if (name.includes('onion')) return '🧅'
    if (name.includes('tomato')) return '🍅'
    if (name.includes('banana')) return '🍌'
    if (name.includes('rice')) return '🍚'
    if (name.includes('sugarcane')) return '🎋'
    return '🌱'
  }

  const isInitialLoading = (isLoadingMarkets || isLoadingCrops || isLoadingPrices) && !prices

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefetchingPrices}>
      <div className="space-y-6 max-w-5xl mx-auto pb-10">
        {/* Prices Hero: Forest Green with SteppedBars, Faint Circle with Ajrak Overlay, and Ajrak Strip */}
        <div className="hero-grid relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-forest-800 via-forest-900 to-[#061b10] text-white shadow-[0_24px_60px_rgba(14,42,27,0.22)] border border-forest-700/70">
          <div className="absolute -left-20 -bottom-28 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -right-10 -top-24 w-72 h-72 rounded-full bg-neon/10 blur-3xl" />
          <div className="p-7 sm:p-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-7">
            <div className="max-w-lg text-center md:text-left rtl:md:text-right">
              {/* Time-of-day greeting badge with Sun/Moon icon */}
              <div className="inline-flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1 rounded-full bg-forest-800/80 border border-forest-700/60 text-xs font-semibold text-mint mb-2.5">
                {greetingData.icon}
                <span>{greetingData.text}</span>
              </div>

              {/* Main culture hero title */}
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black text-white tracking-[-0.035em] mb-2 leading-[1.05]">
                {t('app.heroTagline')}
              </h1>

              {/* Supporting tagline */}
              <p className="text-sm sm:text-base text-forest-100/85 max-w-lg leading-relaxed">
                {t('app.heroSubtagline')}
              </p>

              {/* Quick links & refresh */}
              <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start rtl:md:justify-start gap-2.5">
                {isFarmer && (
                  <Link
                    to={`/calculator?market=${selectedMarketId}`}
                    className="inline-flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 bg-neon text-neon-dark text-xs font-black rounded-xl hover:brightness-105 active:scale-95 transition shadow-sm"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>{t('nav.calculator')}</span>
                  </Link>
                )}
                <div className="inline-flex items-center space-x-1.5 rtl:space-x-reverse text-xs text-forest-200 bg-forest-800/60 px-3 py-1.5 rounded-xl border border-forest-700/50">
                  <span className="text-[11px] opacity-80">{t('common.updated')}:</span>
                  <span dir="ltr" className="font-semibold">{formatUpdatedTime(lastUpdated)}</span>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefetchingPrices}
                    aria-label="Refresh prices"
                    className="p-1 hover:text-white transition"
                    title={t('common.refresh')}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 rtl-flip ${isRefetchingPrices ? 'animate-spin text-neon' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Stepped Bars with Faint Outlined Circle & Subtle Ajrak Overlay */}
            <div className="animate-float-soft relative flex-shrink-0 flex items-center justify-center w-52 h-40 sm:w-64 sm:h-48">
              {/* Large Faint Outlined Circle */}
              <div className="absolute inset-0 rounded-full border border-forest-700/40 pointer-events-none" />
              {/* Subtle Ajrak Tile Overlay inside circle (6-8% opacity) */}
              <AjrakOverlay opacity={0.07} />
              {/* Stepped Bars from reference image */}
              <SteppedBars className="relative z-10 w-44 h-24 sm:w-48 sm:h-28 text-forest-300" />
            </div>
          </div>

          {/* Ajrak Band at the bottom of the hero (Requirement 2.3 #3) */}
          <AjrakStrip height={8} variant="sm" />
        </div>

        {/* Market Selector Chips with Sindhi Architectural Arch and Location markers (Requirement 2.3 #5) */}
        <div className="premium-panel p-4 sm:p-5 rounded-3xl dark:bg-forest-950">
          <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-xs font-bold text-gray-500 dark:text-gray-400 mb-2.5">
            <SindhiArchIcon size={14} className="text-forest dark:text-mint" />
            <span>{t('prices.selectMarket')}</span>
          </div>

          {isLoadingMarkets ? (
            <div className="flex space-x-2">
              <div className="h-9 w-32 bg-gray-100 dark:bg-forest-900 rounded-full animate-pulse" />
              <div className="h-9 w-32 bg-gray-100 dark:bg-forest-900 rounded-full animate-pulse" />
            </div>
          ) : marketsError ? (
            <ErrorBanner
              message={t('cropDetail.noData')}
              onRetry={() => refetchMarkets()}
              className="!py-2"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {markets?.map((m) => {
                const isSelected = m.id === selectedMarketId
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMarket(m.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 flex items-center space-x-1.5 rtl:space-x-reverse ${
                      isSelected
                        ? 'bg-forest dark:bg-forest-800 text-neon shadow-xs border border-forest dark:border-forest-700'
                        : 'bg-gray-50 dark:bg-forest-900/40 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-forest-900 border border-gray-200 dark:border-forest-800'
                    }`}
                  >
                    <SindhiArchIcon size={13} className={isSelected ? 'text-neon' : 'text-forest-600 dark:text-forest-400'} />
                    <span>{m.name}</span>
                    <span
                      className={`inline-flex items-center space-x-1 rtl:space-x-reverse text-[10px] px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-forest-950 text-mint'
                          : 'bg-gray-200/70 dark:bg-forest-800 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <MapPin className="w-2.5 h-2.5" />
                      <span>{m.district}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Search Input & Category Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('prices.searchPlaceholder')}
              className={`w-full ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-2.5 bg-white dark:bg-forest-950 text-gray-900 dark:text-white border border-gray-200 dark:border-forest-800 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest shadow-xs transition`}
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

          {/* Category Filter Chips */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <Chip
                key={cat}
                label={cat === 'All' ? t('common.all') : cat}
                active={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
                size="sm"
              />
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {(pricesError || cropsError) && (
          <ErrorBanner
            message="Unable to fetch crop prices from the market. Please try again."
            onRetry={() => {
              refetchPrices()
              refetchCrops()
            }}
          />
        )}

        {/* Crop Prices Cards List */}
        {isInitialLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <CardSkeleton key={n} />
            ))}
          </div>
        ) : filteredCrops.length === 0 ? (
          <EmptyState
            title={t('prices.noCropsFound')}
            description={t('prices.noCropsDesc')}
            action={{
              label: t('common.clearFilters'),
              onClick: () => {
                setSearchTerm('')
                setSelectedCategory('All')
              },
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredCrops.map((crop) => {
              const latest = prices ? getLatestPrice(prices, crop.id, selectedMarketId) : undefined
              const change = prices ? getDailyChange(prices, crop.id, selectedMarketId) : null
              const formattedChange = formatChange(change)
              const emoji = getCropEmoji(crop.name)

              return (
                <div
                  key={crop.id}
                  onClick={() =>
                    navigate(`/crops/${crop.id}?market=${selectedMarketId}`)
                  }
                  className="premium-card bg-white dark:bg-forest-950 rounded-3xl p-5 sm:p-6 border border-white dark:border-forest-800 hover:border-forest-200 dark:hover:border-forest-600 transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Top: Crop Icon with Ajrak Badge Ring (Requirement 2.3 #4), Crop Name & Category */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      {/* Circular crop icon badge with thin Ajrak-style ring */}
                      <AjrakBadgeRing size={44}>
                        <div className="w-11 h-11 rounded-full bg-forest-50 dark:bg-forest-900 flex items-center justify-center text-xl shadow-2xs group-hover:scale-105 transition-transform">
                          {emoji}
                        </div>
                      </AjrakBadgeRing>

                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-forest-600 dark:group-hover:text-mint transition-colors text-base sm:text-lg">
                          {crop.name}
                        </h3>
                        <div className="mt-1 flex items-center space-x-1.5 rtl:space-x-reverse">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-forest-900 text-gray-600 dark:text-gray-300">
                            {crop.category}
                          </span>
                          {latest && (
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center space-x-1 rtl:space-x-reverse">
                              <Calendar className="w-3 h-3" />
                              <span dir="ltr">{latest.date}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-1 rounded-full text-gray-300 dark:text-forest-700 group-hover:text-forest dark:group-hover:text-mint group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-all">
                      <ChevronRight className="w-5 h-5 rtl-flip" />
                    </div>
                  </div>

                  {/* Bottom: Price & Daily Change */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-forest-800/80 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                        {t('cropDetail.todayPrice')}
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        {latest ? (
                          <span dir="ltr">{formatPriceWithUnit(latest.price)}</span>
                        ) : (
                          t('cropDetail.noData')
                        )}
                      </div>
                    </div>

                    {/* Change indicator */}
                    {latest && (
                      <div
                        className={`flex items-center space-x-1 rtl:space-x-reverse px-2.5 py-1 rounded-xl text-xs font-bold border ${
                          formattedChange.sign === 'positive'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : formattedChange.sign === 'negative'
                            ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900'
                            : 'bg-gray-50 dark:bg-forest-900/40 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-forest-700'
                        }`}
                      >
                        {formattedChange.arrow && (
                          <span className="text-[11px]">{formattedChange.arrow}</span>
                        )}
                        <span dir="ltr">{formattedChange.text}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PullToRefresh>
  )
}

export default Prices
