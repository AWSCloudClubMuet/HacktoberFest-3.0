import {
  Camp,
  InventoryItem,
  CampNeed,
  Dispatch,
  Donation,
  Volunteer,
  DashboardSummary,
  CategoryFulfilment,
  CriticalGap,
  SmartRecommendation,
  DispatchDelayAlert,
  UserRole,
  ApiErrorResponse,
} from '../types/index.ts';

const BASE_URL = '/api';

class ApiService {
  private role: UserRole = 'admin';

  setRole(newRole: UserRole) {
    this.role = newRole;
  }

  getRole(): UserRole {
    return this.role;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-role': this.role,
      ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return {} as T;
    }

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const err = (json as ApiErrorResponse)?.error;
      const error = new Error(err?.message || `Request failed with status ${response.status}`);
      (error as any).code = err?.code || 'API_ERROR';
      (error as any).status = response.status;
      (error as any).details = err?.details;
      throw error;
    }

    return (json?.data !== undefined ? json.data : json) as T;
  }

  // Health
  async getHealth(): Promise<{ status: string; system: string; database: any }> {
    return this.request('/health');
  }

  // Camps
  async getCamps(filters?: { district?: string; status?: string; search?: string }): Promise<Camp[]> {
    const params = new URLSearchParams();
    if (filters?.district) params.append('district', filters.district);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/camps${qs}`);
  }

  async getCamp(id: string): Promise<Camp> {
    return this.request(`/camps/${id}`);
  }

  async createCamp(data: { name: string; district: string; capacity: number; current_families: number; status?: string }): Promise<Camp> {
    return this.request('/camps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCamp(id: string, data: Partial<Camp>): Promise<Camp> {
    return this.request(`/camps/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCamp(id: string): Promise<void> {
    return this.request(`/camps/${id}`, {
      method: 'DELETE',
    });
  }

  // Inventory
  async getInventory(filters?: { category?: string; lowStockOnly?: boolean; search?: string }): Promise<InventoryItem[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.lowStockOnly) params.append('lowStockOnly', 'true');
    if (filters?.search) params.append('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/inventory${qs}`);
  }

  async getInventoryItem(id: string): Promise<InventoryItem> {
    return this.request(`/inventory/${id}`);
  }

  async createInventory(data: Partial<InventoryItem>): Promise<InventoryItem> {
    return this.request('/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInventory(id: string, data: Partial<InventoryItem>): Promise<InventoryItem> {
    return this.request(`/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteInventory(id: string): Promise<void> {
    return this.request(`/inventory/${id}`, {
      method: 'DELETE',
    });
  }

  // Needs
  async getNeeds(filters?: { campId?: string; priority?: string; category?: string; search?: string }): Promise<CampNeed[]> {
    const params = new URLSearchParams();
    if (filters?.campId) params.append('campId', filters.campId);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/needs${qs}`);
  }

  async getNeed(id: string): Promise<CampNeed> {
    return this.request(`/needs/${id}`);
  }

  async createNeed(data: { camp_id: string; inventory_item_id: string; required_quantity: number; priority: string }): Promise<CampNeed> {
    return this.request('/needs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNeed(id: string, data: Partial<CampNeed>): Promise<CampNeed> {
    return this.request(`/needs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteNeed(id: string): Promise<void> {
    return this.request(`/needs/${id}`, {
      method: 'DELETE',
    });
  }

  // Dispatches
  async getDispatches(filters?: { status?: string; campId?: string; search?: string }): Promise<Dispatch[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.campId) params.append('campId', filters.campId);
    if (filters?.search) params.append('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/dispatches${qs}`);
  }

  async createDispatch(data: { camp_id: string; need_id: string; quantity: number }): Promise<Dispatch> {
    return this.request('/dispatches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markInTransit(id: string): Promise<Dispatch> {
    return this.request(`/dispatches/${id}/in-transit`, {
      method: 'POST',
    });
  }

  async markDelivered(id: string): Promise<Dispatch> {
    return this.request(`/dispatches/${id}/deliver`, {
      method: 'POST',
    });
  }

  async cancelDispatch(id: string): Promise<Dispatch> {
    return this.request(`/dispatches/${id}/cancel`, {
      method: 'POST',
    });
  }

  // Donations
  async getDonations(filters?: { type?: string; search?: string }): Promise<Donation[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.search) params.append('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/donations${qs}`);
  }

  async createDonation(data: Partial<Donation>): Promise<Donation> {
    return this.request('/donations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Volunteers
  async getVolunteers(filters?: { skill?: string; assignedStatus?: string; search?: string }): Promise<Volunteer[]> {
    const params = new URLSearchParams();
    if (filters?.skill) params.append('skill', filters.skill);
    if (filters?.assignedStatus) params.append('assignedStatus', filters.assignedStatus);
    if (filters?.search) params.append('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/volunteers${qs}`);
  }

  async registerVolunteer(data: Partial<Volunteer>): Promise<Volunteer> {
    return this.request('/volunteers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVolunteer(id: string, data: Partial<Volunteer>): Promise<Volunteer> {
    return this.request(`/volunteers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteVolunteer(id: string): Promise<void> {
    return this.request(`/volunteers/${id}`, {
      method: 'DELETE',
    });
  }

  async assignVolunteer(id: string, campId: string): Promise<Volunteer> {
    return this.request(`/volunteers/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ camp_id: campId }),
    });
  }

  async unassignVolunteer(id: string): Promise<Volunteer> {
    return this.request(`/volunteers/${id}/unassign`, {
      method: 'POST',
    });
  }

  // Analytics
  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.request('/dashboard/summary');
  }

  async getCategoryFulfilment(): Promise<CategoryFulfilment[]> {
    return this.request('/dashboard/category-fulfilment');
  }

  async getCriticalGaps(): Promise<CriticalGap[]> {
    return this.request('/dashboard/critical-gaps');
  }

  async getSmartRecommendations(): Promise<SmartRecommendation[]> {
    return this.request('/dashboard/recommendations');
  }

  async getDispatchDelays(thresholdHours: number = 24): Promise<DispatchDelayAlert[]> {
    return this.request(`/dashboard/dispatch-delays?threshold=${thresholdHours}`);
  }

  async updateInventoryDailyConsumption(id: string, dailyConsumption: number): Promise<InventoryItem> {
    return this.request(`/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ daily_consumption: dailyConsumption }),
    });
  }

  // Reset seed
  async resetSeedData(): Promise<{ status: string; message: string }> {
    return this.request('/admin/reset-seed', {
      method: 'POST',
    });
  }

  // Live test runner
  async runTests(): Promise<{ total: number; passed: number; results: Array<{ testId: string; name: string; passed: boolean; message?: string }> }> {
    return this.request('/test/run', {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
