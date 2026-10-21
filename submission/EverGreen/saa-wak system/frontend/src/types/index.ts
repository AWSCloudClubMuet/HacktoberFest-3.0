export type UserRole = 'farmer' | 'buyer';

export interface User {
  id: string;
  displayName: string;
  role: UserRole;
  district: string;
  phone?: string;
  avatarSeed?: string;
  createdAt: string;
}

export interface Crop {
  id: string;
  name: string;
  sindhiName?: string;
  category: 'Grains' | 'Cash Crops' | 'Vegetables' | 'Fruits' | 'Spices';
  unit: string; // e.g. "PKR per 40 kg"
  symbol: string; // tasteful minimal fruit/vegetable symbol
  description?: string;
  isActive: boolean;
}

export interface Market {
  id: string;
  name: string;
  sindhiName?: string;
  district: string;
  province: string;
  isActive: boolean;
  distanceKmApprox?: number;
}

export interface PriceRecord {
  id: string;
  cropId: string;
  marketId: string;
  date: string; // YYYY-MM-DD
  price: number;
  unit: string;
  sourceLabel: string;
}

export type ListingStatus = 'available' | 'reserved' | 'sold';

export interface Listing {
  id: string;
  sellerId: string;
  cropId: string;
  quantity: number;
  unit: string;
  grade: 'Grade A' | 'Grade B' | 'Export Quality' | 'Standard';
  askingPricePerUnit: number;
  marketId: string;
  district: string;
  description?: string;
  contactMethod?: string;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
}

export type AlertCondition = 'above' | 'below';

export interface Alert {
  id: string;
  userId: string;
  cropId: string;
  marketId: string;
  condition: AlertCondition;
  targetPrice: number;
  isEnabled: boolean;
  lastEvaluatedPrice?: number | null;
  lastTriggeredAt?: string | null;
  createdAt: string;
}

export type PricePosition = 'below' | 'near' | 'above' | 'unavailable';

export interface DailyChange {
  latestPrice: number;
  previousPrice: number;
  absoluteChange: number;
  percentageChange: number | null;
  direction: 'up' | 'down' | 'neutral';
  date: string;
  unit: string;
}

export interface ProfitCalculationInput {
  cropId?: string;
  quantity: number;
  baselineSellingPrice: number;
  costPerUnit: number;
  adjustmentPercent: number; // -20 to +20
}

export interface ProfitCalculationResult {
  quantity: number;
  baselinePrice: number;
  adjustedPrice: number;
  baselineRevenue: number;
  adjustedRevenue: number;
  totalCost: number;
  baselineProfit: number;
  adjustedProfit: number;
  marginPercent: number | null;
  differenceOutcome: number;
}
