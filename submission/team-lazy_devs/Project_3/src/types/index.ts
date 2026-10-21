export type CampStatus = 'Open' | 'Full' | 'Closed';

export interface Camp {
  id: string;
  name: string;
  district: string;
  capacity: number;
  current_families: number;
  status: CampStatus;
  created_at: string;
  updated_at: string;
}

export type InventoryCategory =
  | 'Food'
  | 'Clean Water'
  | 'Medicine'
  | 'Shelter'
  | 'Hygiene'
  | 'Clothing'
  | 'Other';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  stock: number;
  reorder_level: number;
  created_at: string;
  updated_at: string;
  daily_consumption?: number; // Estimated daily consumption for stock shortage forecast
}

export type NeedPriority = 'High' | 'Medium' | 'Low';

export interface CampNeed {
  id: string;
  camp_id: string;
  inventory_item_id: string;
  required_quantity: number;
  priority: NeedPriority;
  fulfilled_quantity: number;
  created_at: string;
  updated_at: string;
  // Denormalized / joined fields for display convenience
  camp_name?: string;
  camp_district?: string;
  item_name?: string;
  item_category?: InventoryCategory;
  item_unit?: string;
  active_reserved_quantity?: number;
  remaining_unreserved_quantity?: number;
  fulfilment_percentage?: number;
}

export type DispatchStatus = 'Pending' | 'In Transit' | 'Delivered' | 'Cancelled';

export interface Dispatch {
  id: string;
  camp_id: string;
  need_id: string;
  quantity: number;
  status: DispatchStatus;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
  cancelled_at: string | null;
  // Denormalized / joined fields
  camp_name?: string;
  camp_district?: string;
  item_name?: string;
  item_unit?: string;
  item_category?: InventoryCategory;
}

export type DonationType = 'Cash' | 'In-Kind';

export interface Donation {
  id: string;
  type: DonationType;
  category: string;
  amount_or_quantity: number;
  item_id: string | null;
  donor_name?: string;
  notes?: string;
  idempotency_key?: string;
  created_at: string;
  // Joined fields
  item_name?: string;
  item_unit?: string;
}

export type VolunteerSkill =
  | 'Medical'
  | 'Logistics'
  | 'Cooking'
  | 'Driving'
  | 'Counselling';

export interface Volunteer {
  id: string;
  name: string;
  skill: VolunteerSkill;
  camp_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  camp_name?: string;
  camp_district?: string;
}

export interface DashboardSummary {
  active_camps: number;
  total_camps: number;
  families_sheltered: number;
  overall_fulfilment: number;
  low_stock_items: number;
  volunteers_deployed: number;
  total_volunteers: number;
  total_cash_donations_pkr: number;
  total_dispatches: number;
}

export interface CategoryFulfilment {
  category: InventoryCategory;
  required_quantity: number;
  fulfilled_quantity: number;
  percentage: number;
  needs_count: number;
}

export interface CriticalGap {
  need_id: string;
  camp_id: string;
  camp_name: string;
  district: string;
  inventory_item_id: string;
  item_name: string;
  item_unit: string;
  category: InventoryCategory;
  required_quantity: number;
  fulfilled_quantity: number;
  remaining_quantity: number;
  fulfilment_percentage: number;
  priority: NeedPriority;
}

export type UserRole = 'admin' | 'volunteer';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface SmartRecommendation {
  need_id: string;
  camp_id: string;
  camp_name: string;
  district: string;
  item_id: string;
  item_name: string;
  item_unit: string;
  category: InventoryCategory;
  priority: NeedPriority;
  fulfilment_percentage: number;
  remaining_unreserved_quantity: number;
  available_stock: number;
  recommended_quantity: number;
  stock_status: 'Sufficient' | 'Partial' | 'Insufficient stock';
  explanation: string;
  urgency_score: number;
  families_sheltered: number;
}

export type NotificationType = 'critical_gap' | 'low_stock' | 'dispatch_delay' | 'camp_full';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  targetTab: 'needs' | 'inventory' | 'dispatches' | 'camps';
  targetId?: string;
  read: boolean;
  priority: 'critical' | 'warning' | 'info';
}

export interface DispatchDelayAlert {
  dispatch_id: string;
  camp_name: string;
  camp_district: string;
  item_name: string;
  item_unit: string;
  quantity: number;
  status: DispatchStatus;
  created_at: string;
  elapsed_hours: number;
  elapsed_display: string;
  delay_level: 'critical' | 'warning';
}
