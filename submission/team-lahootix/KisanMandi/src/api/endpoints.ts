import { apiClient } from './client'
import type { User, Crop, Market, Price, Listing, Alert } from '../types'

// Users API
export const usersApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    apiClient<User[]>('/users', { params }),
  get: (id: number) => apiClient<User>(`/users/${id}`),
  create: (data: Omit<User, 'id'>) =>
    apiClient<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<User>) =>
    apiClient<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiClient<void>(`/users/${id}`, {
      method: 'DELETE',
    }),
}

// Crops API
export const cropsApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    apiClient<Crop[]>('/crops', { params }),
  get: (id: number) => apiClient<Crop>(`/crops/${id}`),
}

// Markets API
export const marketsApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    apiClient<Market[]>('/markets', { params }),
  get: (id: number) => apiClient<Market>(`/markets/${id}`),
}

// Prices API
export interface PriceQueryParams {
  crop_id?: number
  market_id?: number
  date?: string
  date_gte?: string
  _sort?: string
  _order?: 'asc' | 'desc'
  [key: string]: string | number | boolean | undefined
}

export const pricesApi = {
  list: (params?: PriceQueryParams) => apiClient<Price[]>('/prices', { params }),
  get: (id: number) => apiClient<Price>(`/prices/${id}`),
}

// Listings API
export interface ListingQueryParams {
  user_id?: number
  crop_id?: number
  district?: string
  grade?: string
  status?: string
  _sort?: string
  _order?: 'asc' | 'desc'
  [key: string]: string | number | boolean | undefined
}

export const listingsApi = {
  list: (params?: ListingQueryParams) => apiClient<Listing[]>('/listings', { params }),
  get: (id: number) => apiClient<Listing>(`/listings/${id}`),
  create: (data: Omit<Listing, 'id'>) =>
    apiClient<Listing>('/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Listing>) =>
    apiClient<Listing>(`/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiClient<void>(`/listings/${id}`, {
      method: 'DELETE',
    }),
}

// Alerts API
export interface AlertQueryParams {
  user_id?: number
  crop_id?: number
  market_id?: number
  active_status?: boolean
  [key: string]: string | number | boolean | undefined
}

export const alertsApi = {
  list: (params?: AlertQueryParams) => apiClient<Alert[]>('/alerts', { params }),
  get: (id: number) => apiClient<Alert>(`/alerts/${id}`),
  create: (data: Omit<Alert, 'id'>) =>
    apiClient<Alert>('/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Alert>) =>
    apiClient<Alert>(`/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiClient<void>(`/alerts/${id}`, {
      method: 'DELETE',
    }),
}
