import React, { useMemo } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import {
  useCrop,
  useMarkets,
  usePrices,
} from '../api/hooks'
import { useCurrentUser } from '../context/UserContext'
import { useTranslation } from '../i18n'
import {
  getLatestPrice,
  getDailyChange,
  getStats,
  getMarketComparison,
} from '../lib/priceMath'
import {
  formatPriceWithUnit,
  formatPKR,
  formatChange,
  formatChartDate,
  formatDateDisplay,
} from '../lib/format'
import {
  Spinner,
  ErrorBanner,
  EmptyState,
  Badge,
  AjrakStrip,
  AjrakBestMarketRibbon,
} from '../components'
import { SindhProduceIconsBadge } from '../components/illustrations/SindhiProduceIcons'
import {
  ArrowLeft,
  Bell,
  Calculator,
  TrendingUp,
  MapPin,
  Award,
  ArrowDownRight,
  TrendingDown,
} from 'lucide-react'

export const CropDetail: React.FC = () => {
  const { cropId } = useParams<{ cropId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isFarmer } = useCurrentUser()
  const { t, isRTL } = useTranslation()

  const parsedCropId = cropId ? parseInt(cropId, 10) : NaN

  // 1. Fetch Crop details
  const {
    data: crop,
    isLoading: isLoadingCrop,
    error: cropError,
    refetch: refetchCrop,
  } = useCrop(parsedCropId)

  // 2. Fetch all markets
  const {
    data: markets,
    isLoading: isLoadingMarkets,
    error: marketsError,
    refetch: refetchMarkets,
  } = useMarkets()

  // Selected market ID from URL query param
  const marketIdParam = searchParams.get('market')
  const selectedMarketId = useMemo(() => {
    if (marketIdParam) {
      const parsed = parseInt(marketIdParam, 10)
      if (!isNaN(parsed)) return parsed
    }
    return markets && markets.length > 0 ? markets[0].id : 1
  }, [marketIdParam, markets])

  const handleSelectMarket = (mId: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('market', String(mId))
      return next
    })
  }

  // 3. Fetch 14-day historical prices for selected market & crop (sorted asc for chart)
  const {
    data: marketPrices,
    isLoading: isLoadingMarketPrices,
    error: marketPricesError,
    refetch: refetchMarketPrices,
  } = usePrices({
    crop_id: parsedCropId,
    market_id: selectedMarketId,
    _sort: 'date',
    _order: 'asc',
  })

  // 4. Fetch all latest prices for this crop across all markets (for comparison)
  const {
    data: allCropPrices,
    isLoading: isLoadingAllPrices,
    refetch: refetchAllPrices,
  } = usePrices({
    crop_id: parsedCropId,
    _sort: 'date',
    _order: 'desc',
  })

  // 5. Chart Data & Stats Preparation
  const chartData = useMemo(() => {
    if (!marketPrices || marketPrices.length === 0) return []
    return marketPrices.map((p) => ({
      rawDate: p.date,
      date: formatChartDate(p.date),
      price: p.price,
    }))
  }, [marketPrices])

  const stats = useMemo(() => {
    if (!marketPrices || marketPrices.length === 0) return { min: 0, max: 0, avg: 0 }
    return getStats(marketPrices.map((p) => p.price))
  }, [marketPrices])

  const latestPrice = useMemo(() => {
    if (!marketPrices) return undefined
    return getLatestPrice(marketPrices, parsedCropId, selectedMarketId)
  }, [marketPrices, parsedCropId, selectedMarketId])

  const dailyChange = useMemo(() => {
    if (!marketPrices) return null
    return getDailyChange(marketPrices, parsedCropId, selectedMarketId)
  }, [marketPrices, parsedCropId, selectedMarketId])

  const formattedChange = formatChange(dailyChange)

  // 6. Market Comparison Data
  const marketComparison = useMemo(() => {
    if (!allCropPrices || !markets) return []
    return getMarketComparison(allCropPrices, markets, parsedCropId)
  }, [allCropPrices, markets, parsedCropId])

  // Custom Chart Dot to highlight Min & Max points
  const renderCustomDot = (props: any): React.ReactElement => {
    const { cx, cy, payload } = props
    if (cx === undefined || cy === undefined || !payload) return <g key="empty" />

    const isMin = payload.price === stats.min
    const isMax = payload.price === stats.max

    if (isMax) {
      return (
        <circle
          key={`max-${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={5}
          fill="#3D9E64"
          stroke="#FFFFFF"
          strokeWidth={2}
        />
      )
    }

    if (isMin) {
      return (
        <circle
          key={`min-${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={5}
          fill="#D1453B"
          stroke="#FFFFFF"
          strokeWidth={2}
        />
      )
    }

    return (
      <circle
        key={`dot-${cx}-${cy}`}
        cx={cx}
        cy={cy}
        r={3}
        fill="#143825"
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />
    )
  }

  // 404 Validation
  if (isNaN(parsedCropId) || (!isLoadingCrop && !crop && !cropError)) {
    return (
      <div className="py-12">
        <EmptyState
          title={t('cropDetail.cropNotFound')}
          description="The crop you are looking for does not exist or may have been removed."
          action={{
            label: t('cropDetail.back'),
            onClick: () => navigate('/prices'),
          }}
        />
      </div>
    )
  }

  const isLoading = isLoadingCrop || isLoadingMarkets || isLoadingMarketPrices
  const selectedMarket = markets?.find((m) => m.id === selectedMarketId)

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-12">
      {/* Top Navigation / Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/prices?market=${selectedMarketId}`)}
          className="inline-flex items-center space-x-1.5 rtl:space-x-reverse text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-forest dark:hover:text-mint transition py-1.5 px-3 rounded-xl bg-white dark:bg-forest-950 border border-gray-200 dark:border-forest-800 shadow-2xs active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 rtl-flip" />
          <span>{t('cropDetail.back')}</span>
        </button>

        {crop && (
          <Badge variant="primary" className="text-xs">
            {crop.category}
          </Badge>
        )}
      </div>

      {/* Global Error Banner */}
      {(cropError || marketsError || marketPricesError) && (
        <ErrorBanner
          message="Failed to load crop details. Please try again."
          onRetry={() => {
            refetchCrop()
            refetchMarkets()
            refetchMarketPrices()
            refetchAllPrices()
          }}
        />
      )}

      {isLoading ? (
        <div className="p-8 bg-white dark:bg-forest-950 rounded-3xl border border-gray-100 dark:border-forest-800 shadow-xs flex flex-col items-center justify-center">
          <Spinner size="md" label={t('common.loading')} />
        </div>
      ) : crop ? (
        <>
          {/* Header Card: Crop Name, Decorative Produce Line Icons (Requirement 2.3 #10), Market Selector, Today's Price */}
          <div className="bg-white dark:bg-forest-950 rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-forest-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    {crop.name}
                  </h1>
                  {/* Decorative Sindhri mango, cotton, wheat line icon group (Requirement 2.3 #10) */}
                  <SindhProduceIconsBadge />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5 rtl:space-x-reverse">
                  <MapPin className="w-3.5 h-3.5 text-forest dark:text-mint" />
                  <span>
                    {selectedMarket ? selectedMarket.name : 'Selected Mandi'} • {selectedMarket?.district}
                  </span>
                </p>
              </div>

              {/* Today's Price & Daily Change */}
              <div className="text-left sm:text-right rtl:sm:text-left">
                <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500">
                  {t('cropDetail.todayPrice')}
                </div>
                <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                  {latestPrice ? <span dir="ltr">{formatPriceWithUnit(latestPrice.price)}</span> : t('cropDetail.noData')}
                </div>
                {latestPrice && (
                  <div className="mt-1 flex items-center sm:justify-end rtl:sm:justify-start space-x-1.5 rtl:space-x-reverse">
                    <span
                      className={`inline-flex items-center space-x-1 rtl:space-x-reverse px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        formattedChange.sign === 'positive'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : formattedChange.sign === 'negative'
                          ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900'
                          : 'bg-gray-50 dark:bg-forest-900/40 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-forest-700'
                      }`}
                    >
                      {formattedChange.arrow && <span>{formattedChange.arrow}</span>}
                      <span dir="ltr">{formattedChange.text}</span>
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                      {isRTL ? 'گزشتہ روز سے' : 'vs yesterday'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Mandi Switcher Chips */}
            <div className="pt-3 border-t border-gray-100 dark:border-forest-800">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-2">
                {t('prices.selectMarket')}:
              </span>
              <div className="flex flex-wrap gap-2">
                {markets?.map((m) => {
                  const isSelected = m.id === selectedMarketId
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMarket(m.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 rtl:space-x-reverse ${
                        isSelected
                          ? 'bg-forest dark:bg-forest-800 text-neon shadow-xs'
                          : 'bg-gray-50 dark:bg-forest-900/40 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-forest-900 border border-gray-200 dark:border-forest-800'
                      }`}
                    >
                      <span>{m.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 14-Day Line Chart Card with Subtle Ajrak Strip along top edge (Requirement 2.3 #10) */}
          <div className="relative bg-white dark:bg-forest-950 rounded-3xl border border-gray-100 dark:border-forest-800 shadow-xs overflow-hidden">
            {/* Subtle Ajrak Strip along chart card top edge */}
            <AjrakStrip height={6} variant="sm" />

            <div className="p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    {t('cropDetail.trendsTitle')}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isRTL ? 'مسلسل 14 یوم کے منڈی ہول سیل ریٹ (روپے / من)' : 'Consecutive wholesale prices in PKR/maund'}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3D9E64]" /> {t('cropDetail.statsMax')} (<span dir="ltr">{formatPKR(stats.max)}</span>)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D1453B]" /> {t('cropDetail.statsMin')} (<span dir="ltr">{formatPKR(stats.min)}</span>)
                  </span>
                </div>
              </div>

              {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                  {t('cropDetail.noData')}
                </div>
              ) : (
                <div className="h-64 sm:h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={{ stroke: '#E2E8F0' }}
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        dy={5}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        tickFormatter={(val) => `Rs ${val}`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-forest-950 text-white p-2.5 rounded-xl shadow-xl text-xs backdrop-blur-xs border border-forest-800">
                                <p className="text-gray-300 font-medium">
                                  {formatDateDisplay(data.rawDate)}
                                </p>
                                <p className="text-sm font-bold text-neon mt-0.5" dir="ltr">
                                  {formatPriceWithUnit(data.price)}
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#257F4F"
                        strokeWidth={2.5}
                        dot={renderCustomDot}
                        activeDot={{ r: 6, fill: '#DFFF38', stroke: '#0E2A1B', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="text-right rtl:text-left text-[10px] text-gray-400 dark:text-gray-500">
                {isRTL ? 'آج کے دن تک کے 14 ریکارڈز' : 'Showing exactly 14 consecutive daily records ending today'}
              </div>
            </div>
          </div>

          {/* 14-Day Stats Row: Min, Max, Average */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-forest-950 rounded-2xl p-4 border border-gray-100 dark:border-forest-800 shadow-2xs text-center">
              <span className="text-[11px] font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider flex items-center justify-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                <span>{t('cropDetail.statsMin')}</span>
              </span>
              <div className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mt-1">
                <span dir="ltr">{formatPKR(stats.min)}</span>
              </div>
              <span className="text-[10px] text-gray-400">14 {isRTL ? 'دن' : 'days'}</span>
            </div>

            <div className="bg-white dark:bg-forest-950 rounded-2xl p-4 border border-gray-100 dark:border-forest-800 shadow-2xs text-center">
              <span className="text-[11px] font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider flex items-center justify-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-forest dark:text-mint" />
                <span>{t('cropDetail.statsAvg')}</span>
              </span>
              <div className="text-lg sm:text-xl font-black text-forest dark:text-mint mt-1">
                <span dir="ltr">{formatPKR(stats.avg)}</span>
              </div>
              <span className="text-[10px] text-gray-400">14 {isRTL ? 'دن' : 'days'}</span>
            </div>

            <div className="bg-white dark:bg-forest-950 rounded-2xl p-4 border border-gray-100 dark:border-forest-800 shadow-2xs text-center">
              <span className="text-[11px] font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider flex items-center justify-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('cropDetail.statsMax')}</span>
              </span>
              <div className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mt-1">
                <span dir="ltr">{formatPKR(stats.max)}</span>
              </div>
              <span className="text-[10px] text-gray-400">14 {isRTL ? 'دن' : 'days'}</span>
            </div>
          </div>

          {/* Market Comparison Section: Best Place to Sell with Ajrak Ribbon (Requirement 2.3 #4) */}
          <div className="bg-white dark:bg-forest-950 rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-forest-800 shadow-xs space-y-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {t('cropDetail.comparisonTitle')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isRTL ? 'سب سے زیادہ قیمت والی منڈی سب سے اوپر' : 'Sorted by best selling price (highest first) across Sindh wholesale markets'}
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              {marketComparison.map((item) => (
                <div
                  key={item.marketId}
                  className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                    item.isBest
                      ? 'border-forest/50 dark:border-forest-600 bg-forest-50/50 dark:bg-forest-900/50 shadow-xs'
                      : 'border-gray-100 dark:border-forest-800 bg-gray-50/50 dark:bg-forest-900/20 hover:bg-white dark:hover:bg-forest-900/40 hover:border-gray-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{item.marketName}</span>
                        {/* Crimson and Ivory Ajrak Corner Ribbon for Best Place to Sell (Requirement 2.3 #4) */}
                        {item.isBest && (
                          <AjrakBestMarketRibbon label={t('cropDetail.bestMarketBadge')} />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {t('common.district')}: {item.district}
                      </div>
                    </div>

                    <div className="text-left sm:text-right rtl:sm:text-left">
                      {item.hasData ? (
                        <>
                          <div className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                            <span dir="ltr">{formatPriceWithUnit(item.price)}</span>
                          </div>
                          <div className="text-[11px] font-medium">
                            {item.isBest ? (
                              <span className="text-forest dark:text-mint font-bold">
                                {isRTL ? 'سب سے زیادہ ریٹ' : 'Highest market price'}
                              </span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400 flex items-center sm:justify-end rtl:sm:justify-start gap-0.5">
                                <ArrowDownRight className="w-3.5 h-3.5 rtl-flip" />
                                <span dir="ltr">{formatPKR(Math.abs(item.diffVsBest))}</span> {isRTL ? 'فرق' : 'vs best'}
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-400 font-medium">{t('cropDetail.noData')}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Farmer Actions (Rendered for Farmers Only) */}
          {isFarmer && (
            <div className="bg-white dark:bg-forest-950 rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-forest-800 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {t('common.actions')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  to={`/alerts/new?crop=${parsedCropId}&market=${selectedMarketId}`}
                  className="p-3.5 rounded-2xl border border-forest/20 bg-forest-50/60 dark:bg-forest-900/60 hover:bg-forest-50 dark:hover:bg-forest-900 text-forest dark:text-mint font-bold text-sm flex items-center justify-center gap-2 shadow-2xs active:scale-95 transition"
                >
                  <Bell className="w-4 h-4" />
                  <span>{t('cropDetail.setAlertBtn')}</span>
                </Link>

                <Link
                  to={`/calculator?crop=${parsedCropId}&market=${selectedMarketId}`}
                  className="p-3.5 rounded-2xl border border-neon/40 bg-neon text-neon-dark font-black text-sm flex items-center justify-center gap-2 shadow-2xs hover:brightness-105 active:scale-95 transition"
                >
                  <Calculator className="w-4 h-4" />
                  <span>{t('cropDetail.calcProfitBtn')}</span>
                </Link>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

export default CropDetail
