export type UserRole = 'Farmer' | 'Buyer'
export type ListingGrade = 'A' | 'B' | 'C'
export type ListingStatus = 'Active' | 'Sold'
export type AlertCondition = 'Above' | 'Below'

export interface User {
  id: number
  name: string
  phone: string
  district: string
  role: UserRole
}

export interface Crop {
  id: number
  name: string
  category: string
}

export interface Market {
  id: number
  name: string
  district: string
}

export interface Price {
  id: number
  crop_id: number
  market_id: number
  date: string // YYYY-MM-DD
  price: number // PKR per 40 kg (1 maund)
}

export interface Listing {
  id: number
  user_id: number
  crop_id: number
  quantity: number // in maunds
  asking_price: number // PKR per maund
  district: string
  grade: ListingGrade
  available_from: string // YYYY-MM-DD
  status: ListingStatus
  created_at: string // ISO datetime string
  contact_phone?: string
}

export interface Alert {
  id: number
  user_id: number
  crop_id: number
  market_id: number
  condition: AlertCondition
  target_price: number
  active_status: boolean
}
