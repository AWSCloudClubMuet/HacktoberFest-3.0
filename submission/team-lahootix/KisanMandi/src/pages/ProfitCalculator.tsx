import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useCrops, useMarkets, usePrices } from '../api/hooks'
import { useUser } from '../context/UserContext'
import { useTranslation } from '../i18n'
import { getLatestPrice, getDailyChange } from '../lib/priceMath'
import { calculateProfit, ProfitResult } from '../lib/profitMath'
import { formatPKR, formatPriceWithUnit, formatChange } from '../lib/format'
import {
  Calculator,
  TrendingUp,
  DollarSign,
  PieChart,
  Sliders,
  AlertCircle,
  ArrowRight,
  Info,
  CheckCircle2,
} from 'lucide-react'
import { Spinner, ErrorBanner } from '../components'
import { SindhProduceIconsBadge } from '../components/illustrations/SindhiProduceIcons'

const QUICK_SHIFTS = [-20, -10, 0, 10, 20]

export const ProfitCalculator: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isBuyer, loading: userLoading } = useUser()
  const { t, isRTL } = useTranslation()

  // Guard: Buyers redirected to /prices
  useEffect(() => {
    if (!userLoading && isBuyer) {
      navigate('/prices', { replace: true })
    }
  }, [userLoading, isBuyer, navigate])

  // 1. Fetch crops & markets
  const {
    data: crops,
    isLoading: isLoadingCrops,
    error: cropsError,
  } = useCrops()

  const {
    data: markets,
    isLoading: isLoadingMarkets,
    error: marketsError,
  } = useMarkets()

  // 2. Crop & Market Selection state (with query param prefill)
  const cropParam = searchParams.get('crop')
  const marketParam = searchParams.get('market')

  const [selectedCropId, setSelectedCropId] = useState<number>(() => {
    if (cropParam) {
      const p = parseInt(cropParam, 10)
      if (!isNaN(p)) return p
    }
    return 1
  })

  const [selectedMarketId, setSelectedMarketId] = useState<number>(() => {
    if (marketParam) {
      const p = parseInt(marketParam, 10)
      if (!isNaN(p)) return p
    }
    return 1
  })

  // Synchronize when crops/markets load if default is needed
  useEffect(() => {
    if (crops && crops.length > 0 && !cropParam) {
      setSelectedCropId((prev) => (crops.some((c) => c.id === prev) ? prev : crops[0].id))
    }
  }, [crops, cropParam])

  useEffect(() => {
    if (markets && markets.length > 0 && !marketParam) {
      setSelectedMarketId((prev) => (markets.some((m) => m.id === prev) ? prev : markets[0].id))
    }
  }, [markets, marketParam])

  // Update URL params on selection change
  const handleCropChange = (newCropId: number) => {
    setSelectedCropId(newCropId)
    setSearchParams((prev) => {
      const u = new URLSearchParams(prev)
      u.set('crop', String(newCropId))
      return u
    })
  }

  const handleMarketChange = (newMarketId: number) => {
    setSelectedMarketId(newMarketId)
    setSearchParams((prev) => {
      const u = new URLSearchParams(prev)
      u.set('market', String(newMarketId))
      return u
    })
  }

  // 3. User inputs: Quantity (maunds) and Cost of Production (PKR/maund)
  const [quantityStr, setQuantityStr] = useState<string>('100')
  const [costStr, setCostStr] = useState<string>('3000')

  // 4. What-if slider shift percentage (-20 to +20, default 0)
  const [shiftPct, setShiftPct] = useState<number>(0)

  // 5. Fetch prices for selected crop and market
  const {
    data: prices,
    isLoading: isLoadingPrices,
    error: pricesError,
  } = usePrices({
    crop_id: selectedCropId,
    market_id: selectedMarketId,
    _sort: 'date',
    _order: 'desc',
  })

  // Benchmark latest price and daily change
  const latestPriceObj = useMemo(() => {
    if (!prices || prices.length === 0) return undefined
    return getLatestPrice(prices, selectedCropId, selectedMarketId)
  }, [prices, selectedCropId, selectedMarketId])

  const benchmarkPrice = latestPriceObj?.price ?? 0

  const dailyChange = useMemo(() => {
    if (!prices || prices.length === 0) return null
    return getDailyChange(prices, selectedCropId, selectedMarketId)
  }, [prices, selectedCropId, selectedMarketId])

  const formattedChange = formatChange(dailyChange)

  // Parse numeric values safely
  const parsedQty = parseFloat(quantityStr)
  const validQty = !isNaN(parsedQty) && parsedQty > 0 ? parsedQty : 0
  const qtyError =
    quantityStr.trim() === ''
      ? 'Quantity is required'
      : isNaN(parsedQty) || parsedQty <= 0
      ? 'Quantity must be greater than 0 maunds'
      : null

  const parsedCost = parseFloat(costStr)
  const validCost = !isNaN(parsedCost) && parsedCost >= 0 ? parsedCost : 0
  const costError =
    costStr.trim() === ''
      ? 'Cost of production is required'
      : isNaN(parsedCost) || parsedCost < 0
      ? 'Cost must be 0 or greater'
      : null

  // 6. Live profit calculation for current what-if shift
  const currentResult: ProfitResult = useMemo(() => {
    return calculateProfit({
      quantity: validQty,
      price: benchmarkPrice,
      costPerUnit: validCost,
      shiftPct,
    })
  }, [validQty, benchmarkPrice, validCost, shiftPct])

  // 7. Scenarios calculation for Comparison Table (-20%, 0%, +20%)
  const scenarios = useMemo(() => {
    const list = [
      { key: 'bear', name: t('profitCalculator.scenarioBear'), shift: -20 },
      { key: 'base', name: t('profitCalculator.scenarioBase'), shift: 0 },
      { key: 'bull', name: t('profitCalculator.scenarioBull'), shift: 20 },
    ]
    return list.map((sc) => {
      const res = calculateProfit({
        quantity: validQty,
        price: benchmarkPrice,
        costPerUnit: validCost,
        shiftPct: sc.shift,
      })
      return {
        ...sc,
        result: res,
      }
    })
  }, [validQty, benchmarkPrice, validCost, t])

  if (userLoading || isLoadingCrops || isLoadingMarkets) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Spinner size="lg" label={t('common.loading')} />
      </div>
    )
  }

  if (cropsError || marketsError) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <ErrorBanner
          message="Failed to load calculator configuration data. Please try again."
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header with SindhProduceIconsBadge (Requirement 2.3 #10) */}
      <div className="bg-white dark:bg-forest-950 p-5 rounded-3xl border border-gray-100 dark:border-forest-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="w-9 h-9 rounded-2xl bg-forest-50 dark:bg-forest-900 text-forest dark:text-mint flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {t('profitCalculator.title')}
            </h1>
            {/* Decorative Sindhri mango, cotton, wheat line icon group (Requirement 2.3 #10) */}
            <SindhProduceIconsBadge />
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('profitCalculator.subtitle')}
          </p>
        </div>

        <Link
          to={`/crops/${selectedCropId}?market=${selectedMarketId}`}
          className="inline-flex items-center space-x-1.5 rtl:space-x-reverse text-xs font-semibold text-forest dark:text-mint hover:text-forest-700 bg-forest-50 dark:bg-forest-900 px-3.5 py-2 rounded-xl transition border border-forest-200 dark:border-forest-700 self-start sm:self-auto"
        >
          <span>{t('cropDetail.trendsTitle')}</span>
          <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
        </Link>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-white dark:bg-forest-950 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-forest-800 shadow-xs space-y-5">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center space-x-2 rtl:space-x-reverse">
          <Sliders className="w-4 h-4 text-forest dark:text-mint" />
          <span>{t('common.details')}</span>
        </h2>

        {/* Crop & Market Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Crop Selector */}
          <div>
            <label
              htmlFor="calc-crop-select"
              className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
            >
              {t('profitCalculator.cropLabel')}
            </label>
            <select
              id="calc-crop-select"
              value={selectedCropId}
              onChange={(e) => handleCropChange(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-forest-900/40 text-gray-900 dark:text-white font-semibold text-sm rounded-xl border border-gray-200 dark:border-forest-800 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition"
            >
              {crops?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.category})
                </option>
              ))}
            </select>
          </div>

          {/* Market Selector */}
          <div>
            <label
              htmlFor="calc-market-select"
              className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
            >
              {t('profitCalculator.marketLabel')}
            </label>
            <select
              id="calc-market-select"
              value={selectedMarketId}
              onChange={(e) => handleMarketChange(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-forest-900/40 text-gray-900 dark:text-white font-semibold text-sm rounded-xl border border-gray-200 dark:border-forest-800 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition"
            >
              {markets?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.district})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Benchmark Selling Price Card */}
        <div className="bg-forest-50/70 dark:bg-forest-900/40 border border-forest-200/80 dark:border-forest-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-forest-800 dark:text-mint">
              {t('profitCalculator.sellingPriceLabel')}
            </div>
            <div className="flex items-baseline space-x-2 rtl:space-x-reverse mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white" dir="ltr">
                {benchmarkPrice > 0 ? formatPKR(benchmarkPrice) : 'Rs 0'}
              </span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('common.perMaund')}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {isLoadingPrices ? (
              <span className="text-xs text-gray-500">{t('common.loading')}</span>
            ) : dailyChange ? (
              <span
                className={`inline-flex items-center space-x-1 rtl:space-x-reverse px-2.5 py-1 rounded-full text-xs font-bold ${
                  dailyChange.amount >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                <span>{formattedChange.arrow}</span>
                <span dir="ltr">{formattedChange.text}</span>
              </span>
            ) : (
              <span className="text-xs text-gray-400">No daily change data</span>
            )}
          </div>
        </div>

        {/* Inputs: Quantity & Cost */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Quantity */}
          <div>
            <label
              htmlFor="calc-quantity"
              className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
            >
              {t('profitCalculator.quantityLabel')}
            </label>
            <div className="relative">
              <input
                id="calc-quantity"
                type="number"
                min="0"
                step="any"
                value={quantityStr}
                onChange={(e) => setQuantityStr(e.target.value)}
                placeholder="e.g. 100"
                className={`w-full px-3.5 py-2.5 text-gray-900 dark:text-white font-semibold text-sm rounded-xl border transition focus:outline-none focus:ring-2 ${
                  qtyError
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/30'
                    : 'border-gray-200 dark:border-forest-800 focus:border-forest focus:ring-forest/20 bg-gray-50 dark:bg-forest-900/40 focus:bg-white dark:focus:bg-forest-900'
                }`}
              />
              <span className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-2.5 text-xs font-medium text-gray-400 pointer-events-none`}>
                {t('common.maunds')}
              </span>
            </div>
            {qtyError && (
              <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center space-x-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>{qtyError}</span>
              </p>
            )}
          </div>

          {/* Cost of Production per unit */}
          <div>
            <label
              htmlFor="calc-cost"
              className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
            >
              {t('profitCalculator.costLabel')}
            </label>
            <div className="relative">
              <input
                id="calc-cost"
                type="number"
                min="0"
                step="any"
                value={costStr}
                onChange={(e) => setCostStr(e.target.value)}
                placeholder="e.g. 3000"
                className={`w-full px-3.5 py-2.5 text-gray-900 dark:text-white font-semibold text-sm rounded-xl border transition focus:outline-none focus:ring-2 ${
                  costError
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/30'
                    : 'border-gray-200 dark:border-forest-800 focus:border-forest focus:ring-forest/20 bg-gray-50 dark:bg-forest-900/40 focus:bg-white dark:focus:bg-forest-900'
                }`}
              />
              <span className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-2.5 text-xs font-medium text-gray-400 pointer-events-none`}>
                PKR / {t('common.maund')}
              </span>
            </div>
            {costError && (
              <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center space-x-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>{costError}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* What-If Simulation Control */}
      <div className="bg-white dark:bg-forest-950 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-forest-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center space-x-2 rtl:space-x-reverse">
              <TrendingUp className="w-4 h-4 text-forest dark:text-mint" />
              <span>{t('profitCalculator.whatIfLabel')}</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              -20% .. +20%
            </p>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('profitCalculator.adjustedPrice')}:</span>
            <span className="text-sm font-extrabold text-forest dark:text-mint px-2.5 py-1 bg-forest-50 dark:bg-forest-900 border border-forest-200 dark:border-forest-700 rounded-lg" dir="ltr">
              {formatPKR(currentResult.adjustedPrice)} / maund
            </span>
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-rose-600">-20%</span>
            <span
              className={`text-sm px-3 py-0.5 rounded-full font-bold ${
                shiftPct > 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : shiftPct < 0
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-gray-100 dark:bg-forest-900 text-gray-700 dark:text-gray-300'
              }`}
              dir="ltr"
            >
              {shiftPct > 0 ? `+${shiftPct}%` : `${shiftPct}%`}
            </span>
            <span className="text-emerald-600">+20%</span>
          </div>

          <input
            id="what-if-slider"
            type="range"
            min="-20"
            max="20"
            step="1"
            value={shiftPct}
            onChange={(e) => setShiftPct(parseInt(e.target.value, 10))}
            className="w-full h-2.5 bg-gray-200 dark:bg-forest-800 rounded-lg appearance-none cursor-pointer accent-forest dark:accent-neon"
            aria-label="What-if price shift slider"
          />
        </div>

        {/* Quick Shift Buttons */}
        <div className="flex items-center justify-between gap-1.5 pt-1">
          {QUICK_SHIFTS.map((val) => {
            const isSelected = shiftPct === val
            const label = val === 0 ? '0% Benchmark' : val > 0 ? `+${val}%` : `${val}%`
            return (
              <button
                key={val}
                type="button"
                onClick={() => setShiftPct(val)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-forest dark:bg-forest-800 text-neon border-forest dark:border-forest-700 shadow-xs scale-102'
                    : 'bg-gray-50 dark:bg-forest-900/40 hover:bg-gray-100 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-forest-800'
                }`}
                dir="ltr"
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Live Financial Outputs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Revenue */}
        <div className="bg-white dark:bg-forest-950 p-4 rounded-3xl border border-gray-100 dark:border-forest-800 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t('profitCalculator.revenue')}
          </div>
          <div className="my-2">
            <div className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
              <span dir="ltr">{formatPKR(currentResult.revenue)}</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5" dir="ltr">
              {validQty > 0 ? `${validQty} maunds × ${formatPKR(currentResult.adjustedPrice)}` : '0 maunds'}
            </div>
          </div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center space-x-1 rtl:space-x-reverse">
            <DollarSign className="w-3 h-3" />
            <span>Gross Inflow</span>
          </div>
        </div>

        {/* Total Cost */}
        <div className="bg-white dark:bg-forest-950 p-4 rounded-3xl border border-gray-100 dark:border-forest-800 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t('profitCalculator.totalCost')}
          </div>
          <div className="my-2">
            <div className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
              <span dir="ltr">{formatPKR(currentResult.totalCost)}</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5" dir="ltr">
              {validQty > 0 ? `${validQty} maunds × ${formatPKR(validCost)}` : '0 maunds'}
            </div>
          </div>
          <div className="text-[10px] text-gray-500 font-semibold flex items-center space-x-1 rtl:space-x-reverse">
            <span>Expenses</span>
          </div>
        </div>

        {/* Net Profit / Loss */}
        <div
          className={`p-4 rounded-3xl border shadow-xs flex flex-col justify-between transition-colors ${
            currentResult.profit >= 0
              ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
              : 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {currentResult.profit >= 0 ? t('profitCalculator.profit') : t('profitCalculator.loss')}
            </span>
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                currentResult.profit >= 0
                  ? 'bg-emerald-200/80 text-emerald-900'
                  : 'bg-rose-200/80 text-rose-900'
              }`}
            >
              {currentResult.profit >= 0 ? t('profitCalculator.profit') : t('profitCalculator.loss')}
            </span>
          </div>

          <div className="my-2">
            <div
              className={`text-lg sm:text-xl font-black tracking-tight ${
                currentResult.profit >= 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
              }`}
            >
              <span dir="ltr">
                {currentResult.profit < 0 ? '-' : '+'}
                {formatPKR(Math.abs(currentResult.profit))}
              </span>
            </div>
            <div className="text-[10px] opacity-75 mt-0.5">
              Revenue − Production Cost
            </div>
          </div>

          <div className="text-[10px] font-bold flex items-center space-x-1 rtl:space-x-reverse">
            {currentResult.profit >= 0 ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-300">Surplus</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-rose-600" />
                <span className="text-rose-700 dark:text-rose-300">Deficit</span>
              </>
            )}
          </div>
        </div>

        {/* Profit Margin % */}
        <div className="bg-white dark:bg-forest-950 p-4 rounded-3xl border border-gray-100 dark:border-forest-800 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t('profitCalculator.margin')}
          </div>
          <div className="my-2">
            <div
              className={`text-lg sm:text-xl font-black tracking-tight ${
                currentResult.marginPct === null
                  ? 'text-gray-400'
                  : currentResult.marginPct >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              <span dir="ltr">
                {currentResult.marginPct !== null
                  ? `${currentResult.marginPct >= 0 ? '+' : ''}${currentResult.marginPct}%`
                  : '–'}
              </span>
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              {currentResult.revenue > 0 ? 'Profit / Revenue' : 'Zero revenue'}
            </div>
          </div>
          <div className="text-[10px] text-gray-500 font-semibold flex items-center space-x-1 rtl:space-x-reverse">
            <PieChart className="w-3 h-3" />
            <span>Return on Sales</span>
          </div>
        </div>
      </div>

      {/* Scenario Comparison Table (-20%, 0%, +20%) */}
      <div className="bg-white dark:bg-forest-950 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-forest-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              {t('profitCalculator.scenariosTitle')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              -20% / 0% / +20%
            </p>
          </div>
        </div>

        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full text-left rtl:text-right text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-forest-800 text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">{t('profitCalculator.scenarioCol')}</th>
                <th className="py-2.5 px-3">{t('profitCalculator.priceCol')}</th>
                <th className="py-2.5 px-3">{t('profitCalculator.revenueCol')}</th>
                <th className="py-2.5 px-3">{t('profitCalculator.totalCost')}</th>
                <th className="py-2.5 px-3">{t('profitCalculator.profitCol')}</th>
                <th className="py-2.5 px-3 text-right rtl:text-left">{t('profitCalculator.marginCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-forest-900">
              {scenarios.map((sc) => {
                const isSelected = shiftPct === sc.shift
                const isProfit = sc.result.profit >= 0
                return (
                  <tr
                    key={sc.key}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-forest-50/60 dark:bg-forest-900/60 font-semibold'
                        : 'hover:bg-gray-50 dark:hover:bg-forest-900/20'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-forest dark:bg-neon flex-shrink-0" />
                        )}
                        <span className={isSelected ? 'text-forest dark:text-mint font-bold' : 'text-gray-900 dark:text-white'}>
                          {sc.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-gray-800 dark:text-gray-200">
                      <span dir="ltr">{formatPKR(sc.result.adjustedPrice)}</span>
                    </td>
                    <td className="py-3 px-3 text-gray-700 dark:text-gray-300">
                      <span dir="ltr">{formatPKR(sc.result.revenue)}</span>
                    </td>
                    <td className="py-3 px-3 text-gray-700 dark:text-gray-300">
                      <span dir="ltr">{formatPKR(sc.result.totalCost)}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          isProfit
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        <span dir="ltr">
                          {isProfit ? '+' : '-'}
                          {formatPKR(Math.abs(sc.result.profit))}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right rtl:text-left font-bold">
                      {sc.result.marginPct !== null ? (
                        <span
                          className={
                            sc.result.marginPct >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }
                          dir="ltr"
                        >
                          {sc.result.marginPct >= 0 ? `+${sc.result.marginPct}%` : `${sc.result.marginPct}%`}
                        </span>
                      ) : (
                        <span className="text-gray-400">–</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Helpful Tip Footer */}
      <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-4 flex items-start space-x-3 rtl:space-x-reverse">
        <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
          <strong>Tip for Sindh Farmers:</strong> Mandi prices fluctuate daily depending on arrivals and seasonal demand. Use the Bull and Bear scenarios above to calculate your break-even point before transporting your produce to market.
        </div>
      </div>
    </div>
  )
}

export default ProfitCalculator
