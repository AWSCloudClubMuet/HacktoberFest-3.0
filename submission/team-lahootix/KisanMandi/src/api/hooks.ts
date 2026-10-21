import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  usersApi,
  cropsApi,
  marketsApi,
  pricesApi,
  listingsApi,
  alertsApi,
  type PriceQueryParams,
  type ListingQueryParams,
  type AlertQueryParams,
} from './endpoints'
import type { User, Listing, Alert } from '../types'
import { isTriggered, getAlertStatus, type AlertStatusLabel } from '../lib/alertEval'
import { useCurrentUser } from '../context/UserContext'

// Query keys
export const queryKeys = {
  users: ['users'] as const,
  user: (id: number) => ['users', id] as const,
  crops: ['crops'] as const,
  crop: (id: number) => ['crops', id] as const,
  markets: ['markets'] as const,
  market: (id: number) => ['markets', id] as const,
  prices: (params?: PriceQueryParams) => ['prices', params] as const,
  price: (id: number) => ['prices', id] as const,
  listings: (params?: ListingQueryParams) => ['listings', params] as const,
  listing: (id: number) => ['listings', id] as const,
  alerts: (params?: AlertQueryParams) => ['alerts', params] as const,
  alert: (id: number) => ['alerts', id] as const,
}

// Crops Hooks
export function useCrops(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: queryKeys.crops,
    queryFn: () => cropsApi.list(params),
  })
}

export function useCrop(id: number) {
  return useQuery({
    queryKey: queryKeys.crop(id),
    queryFn: () => cropsApi.get(id),
    enabled: !!id && !isNaN(id),
  })
}

// Markets Hooks
export function useMarkets(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: queryKeys.markets,
    queryFn: () => marketsApi.list(params),
  })
}

export function useMarket(id: number) {
  return useQuery({
    queryKey: queryKeys.market(id),
    queryFn: () => marketsApi.get(id),
    enabled: !!id && !isNaN(id),
  })
}

// Prices Hooks
export function usePrices(params?: PriceQueryParams) {
  return useQuery({
    queryKey: queryKeys.prices(params),
    queryFn: () => pricesApi.list(params),
  })
}

// Users Hooks
export function useUsers(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => usersApi.list(params),
  })
}

export function useUser(id: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.user(id!),
    queryFn: () => usersApi.get(id!),
    enabled: !!id,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<User, 'id'>) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

// Listings Hooks
export function useListings(params?: ListingQueryParams) {
  return useQuery({
    queryKey: queryKeys.listings(params),
    queryFn: () => listingsApi.list(params),
  })
}

export function useListing(id: number) {
  return useQuery({
    queryKey: queryKeys.listing(id),
    queryFn: () => listingsApi.get(id),
    enabled: !!id && !isNaN(id),
  })
}

export function useCreateListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Listing, 'id'>) => listingsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
    },
  })
}

export function useUpdateListing() {
  const queryClient = useQueryClient()
  const { currentUser } = useCurrentUser()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Listing> }) => {
      // Logic-layer ownership safeguard: re-fetch from API to ensure ownership
      const existing = await listingsApi.get(id)
      if (!currentUser || existing.user_id !== currentUser.id) {
        throw new Error('Forbidden: You do not own this listing.')
      }
      return await listingsApi.update(id, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.listing(variables.id) })
    },
  })
}

export function useMarkSoldListing() {
  const queryClient = useQueryClient()
  const { currentUser } = useCurrentUser()

  return useMutation({
    mutationFn: async (id: number) => {
      // Logic-layer ownership safeguard: re-fetch from API to ensure ownership
      const existing = await listingsApi.get(id)
      if (!currentUser || existing.user_id !== currentUser.id) {
        throw new Error('Forbidden: You do not own this listing.')
      }
      return await listingsApi.update(id, { status: 'Sold' })
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.listing(id) })
    },
  })
}

export function useDeleteListing() {
  const queryClient = useQueryClient()
  const { currentUser } = useCurrentUser()

  return useMutation({
    mutationFn: async (id: number) => {
      // Logic-layer ownership safeguard: re-fetch from API to ensure ownership
      const existing = await listingsApi.get(id)
      if (!currentUser || existing.user_id !== currentUser.id) {
        throw new Error('Forbidden: You do not own this listing.')
      }
      return await listingsApi.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
    },
  })
}

// Alerts Hooks
export function useAlerts(params?: AlertQueryParams) {
  return useQuery({
    queryKey: queryKeys.alerts(params),
    queryFn: () => alertsApi.list(params),
  })
}

export function useAlert(id: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.alert(id!),
    queryFn: () => alertsApi.get(id!),
    enabled: !!id && !isNaN(id),
  })
}

export function useCreateAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Alert, 'id'>) => alertsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

export function useUpdateAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Alert> }) =>
      alertsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.alert(variables.id) })
    },
  })
}

export function useDeleteAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => alertsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

export interface EvaluatedAlert extends Alert {
  cropName: string
  cropCategory: string
  marketName: string
  marketDistrict: string
  latestPrice: number | null
  triggered: boolean
  status: AlertStatusLabel
}

/**
 * Custom hook to load alerts for the current farmer, evaluate against latest prices,
 * and calculate triggeredCount with automatic re-evaluation.
 */
export function useAlertStatus() {
  const { currentUser, isFarmer } = useCurrentUser()

  const {
    data: alerts,
    isLoading: isLoadingAlerts,
    error: alertsError,
    refetch: refetchAlerts,
  } = useAlerts(currentUser?.id ? { user_id: currentUser.id } : undefined)

  const { data: crops, isLoading: isLoadingCrops } = useCrops()
  const { data: markets, isLoading: isLoadingMarkets } = useMarkets()

  const {
    data: prices,
    isLoading: isLoadingPrices,
    refetch: refetchPrices,
  } = usePrices({
    _sort: 'date',
    _order: 'desc',
  })

  const evaluatedAlerts: EvaluatedAlert[] = useMemo(() => {
    if (!alerts || !isFarmer) return []

    const list = alerts.map((alert) => {
      const crop = crops?.find((c) => c.id === alert.crop_id)
      const market = markets?.find((m) => m.id === alert.market_id)

      // Find the most recent price for this crop & market
      const priceRecord = prices?.find(
        (p) => p.crop_id === alert.crop_id && p.market_id === alert.market_id,
      )
      const latestPrice = priceRecord ? priceRecord.price : null
      const triggered = isTriggered(alert, latestPrice)
      const status = getAlertStatus(alert, latestPrice)

      return {
        ...alert,
        cropName: crop?.name || `Crop #${alert.crop_id}`,
        cropCategory: crop?.category || 'General',
        marketName: market?.name || `Market #${alert.market_id}`,
        marketDistrict: market?.district || '',
        latestPrice,
        triggered,
        status,
      }
    })

    // Sort: Triggered first, then Waiting, then Inactive
    return list.sort((a, b) => {
      const priority = { Triggered: 0, Waiting: 1, Inactive: 2 }
      return priority[a.status] - priority[b.status]
    })
  }, [alerts, crops, markets, prices, isFarmer])

  const triggeredCount = useMemo(() => {
    return evaluatedAlerts.filter((a) => a.triggered).length
  }, [evaluatedAlerts])

  const refetch = async () => {
    await Promise.all([refetchAlerts(), refetchPrices()])
  }

  return {
    alerts: evaluatedAlerts,
    triggeredCount,
    isLoading: isLoadingAlerts || isLoadingCrops || isLoadingMarkets || isLoadingPrices,
    error: alertsError,
    refetch,
  }
}
