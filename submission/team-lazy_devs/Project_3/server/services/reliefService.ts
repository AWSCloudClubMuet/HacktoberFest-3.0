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
  InventoryCategory,
  CampStatus,
  NeedPriority,
  VolunteerSkill,
  DonationType,
} from '../../src/types/index.ts';
import { loadDatabase, withDbLock, resetDatabase, DatabaseSchema } from '../db.ts';

export class ServiceError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(statusCode: number, code: string, message: string, details?: any) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ReliefService {
  // ================= CAMPS =================
  static async getAllCamps(filters?: { district?: string; status?: string; search?: string }): Promise<Camp[]> {
    const db = loadDatabase();
    let result = [...db.camps];

    if (filters?.district && filters.district !== 'all') {
      result = result.filter(c => c.district.toLowerCase() === filters.district!.toLowerCase());
    }
    if (filters?.status && filters.status !== 'all') {
      result = result.filter(c => c.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.district.toLowerCase().includes(q));
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  static async getCampById(id: string): Promise<Camp> {
    const db = loadDatabase();
    const camp = db.camps.find(c => c.id === id);
    if (!camp) {
      throw new ServiceError(404, 'CAMP_NOT_FOUND', `Camp with ID "${id}" was not found.`);
    }
    return camp;
  }

  static async createCamp(data: {
    name: string;
    district: string;
    capacity: number;
    current_families: number;
    status?: CampStatus;
  }): Promise<Camp> {
    if (!data.name || !data.name.trim()) {
      throw new ServiceError(400, 'INVALID_INPUT', 'Camp name is required.');
    }
    if (!data.district || !data.district.trim()) {
      throw new ServiceError(400, 'INVALID_INPUT', 'Camp district is required.');
    }
    const capacity = Number(data.capacity);
    const families = Number(data.current_families ?? 0);

    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new ServiceError(400, 'INVALID_CAPACITY', 'Capacity must be a positive integer.');
    }
    if (!Number.isInteger(families) || families < 0) {
      throw new ServiceError(400, 'INVALID_FAMILIES', 'Current families must be a non-negative integer.');
    }
    if (families > capacity) {
      throw new ServiceError(400, 'EXCEEDS_CAPACITY', 'Current families cannot exceed camp capacity.');
    }

    // Determine status
    let status: CampStatus;
    if (data.status === 'Closed') {
      status = 'Closed';
    } else if (families >= capacity) {
      status = 'Full';
    } else {
      status = 'Open';
    }

    return withDbLock((db) => {
      const newCamp: Camp = {
        id: `camp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: data.name.trim(),
        district: data.district.trim(),
        capacity,
        current_families: families,
        status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.camps.push(newCamp);
      return { data: newCamp };
    });
  }

  static async updateCamp(id: string, updates: Partial<{
    name: string;
    district: string;
    capacity: number;
    current_families: number;
    status: CampStatus;
  }>): Promise<Camp> {
    return withDbLock((db) => {
      const campIndex = db.camps.findIndex(c => c.id === id);
      if (campIndex === -1) {
        throw new ServiceError(404, 'CAMP_NOT_FOUND', `Camp with ID "${id}" was not found.`);
      }

      const existing = db.camps[campIndex];
      const capacity = updates.capacity !== undefined ? Number(updates.capacity) : existing.capacity;
      const families = updates.current_families !== undefined ? Number(updates.current_families) : existing.current_families;

      if (!Number.isInteger(capacity) || capacity <= 0) {
        throw new ServiceError(400, 'INVALID_CAPACITY', 'Capacity must be a positive integer.');
      }
      if (!Number.isInteger(families) || families < 0) {
        throw new ServiceError(400, 'INVALID_FAMILIES', 'Current families must be a non-negative integer.');
      }
      if (families > capacity) {
        throw new ServiceError(400, 'EXCEEDS_CAPACITY', 'Current families cannot exceed camp capacity.');
      }

      let status = existing.status;
      if (updates.status !== undefined) {
        status = updates.status;
      }

      // Status rule handling:
      // If status is Closed, it remains Closed unless explicitly changed to Open or Full
      // If reopening (or if not Closed):
      if (status !== 'Closed') {
        if (families >= capacity) {
          status = 'Full';
        } else {
          status = 'Open';
        }
      }

      const updatedCamp: Camp = {
        ...existing,
        name: updates.name?.trim() ?? existing.name,
        district: updates.district?.trim() ?? existing.district,
        capacity,
        current_families: families,
        status,
        updated_at: new Date().toISOString(),
      };

      db.camps[campIndex] = updatedCamp;
      return { data: updatedCamp };
    });
  }

  static async deleteCamp(id: string): Promise<void> {
    return withDbLock((db) => {
      const campIndex = db.camps.findIndex(c => c.id === id);
      if (campIndex === -1) {
        throw new ServiceError(404, 'CAMP_NOT_FOUND', `Camp with ID "${id}" was not found.`);
      }

      // Check dependencies
      const activeNeeds = db.needs.filter(n => n.camp_id === id);
      const dispatches = db.dispatches.filter(d => d.camp_id === id);
      const volunteers = db.volunteers.filter(v => v.camp_id === id);

      if (activeNeeds.length > 0 || dispatches.length > 0 || volunteers.length > 0) {
        throw new ServiceError(
          409,
          'CAMP_DEPENDENCIES_EXIST',
          `Cannot delete camp "${db.camps[campIndex].name}" because it has active dependencies: ${activeNeeds.length} need(s), ${dispatches.length} dispatch(es), and ${volunteers.length} assigned volunteer(s). Please resolve or reassign these first.`
        );
      }

      db.camps.splice(campIndex, 1);
      return { data: undefined };
    });
  }

  // ================= INVENTORY =================
  static async getAllInventory(filters?: { category?: string; lowStockOnly?: boolean; search?: string }): Promise<InventoryItem[]> {
    const db = loadDatabase();
    let result = [...db.inventory];

    if (filters?.category && filters.category !== 'all') {
      result = result.filter(i => i.category.toLowerCase() === filters.category!.toLowerCase());
    }
    if (filters?.lowStockOnly) {
      result = result.filter(i => i.stock <= i.reorder_level);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  static async getInventoryById(id: string): Promise<InventoryItem> {
    const db = loadDatabase();
    const item = db.inventory.find(i => i.id === id);
    if (!item) {
      throw new ServiceError(404, 'INVENTORY_NOT_FOUND', `Inventory item "${id}" was not found.`);
    }
    return item;
  }

  static async createInventory(data: {
    name: string;
    category: InventoryCategory;
    unit: string;
    stock: number;
    reorder_level: number;
  }): Promise<InventoryItem> {
    if (!data.name || !data.name.trim()) {
      throw new ServiceError(400, 'INVALID_INPUT', 'Item name is required.');
    }
    if (!data.category) {
      throw new ServiceError(400, 'INVALID_INPUT', 'Item category is required.');
    }
    if (!data.unit || !data.unit.trim()) {
      throw new ServiceError(400, 'INVALID_INPUT', 'Item unit is required.');
    }
    const stock = Number(data.stock);
    const reorderLevel = Number(data.reorder_level);

    if (isNaN(stock) || stock < 0) {
      throw new ServiceError(400, 'INVALID_STOCK', 'Stock must be a non-negative number.');
    }
    if (isNaN(reorderLevel) || reorderLevel < 0) {
      throw new ServiceError(400, 'INVALID_REORDER_LEVEL', 'Reorder level must be a non-negative number.');
    }

    return withDbLock((db) => {
      const newItem: InventoryItem = {
        id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: data.name.trim(),
        category: data.category,
        unit: data.unit.trim(),
        stock,
        reorder_level: reorderLevel,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.inventory.push(newItem);
      return { data: newItem };
    });
  }

  static async updateInventory(id: string, updates: Partial<{
    name: string;
    category: InventoryCategory;
    unit: string;
    stock: number;
    reorder_level: number;
    daily_consumption: number;
  }>): Promise<InventoryItem> {
    return withDbLock((db) => {
      const idx = db.inventory.findIndex(i => i.id === id);
      if (idx === -1) {
        throw new ServiceError(404, 'INVENTORY_NOT_FOUND', `Inventory item "${id}" was not found.`);
      }
      const existing = db.inventory[idx];
      const stock = updates.stock !== undefined ? Number(updates.stock) : existing.stock;
      const reorderLevel = updates.reorder_level !== undefined ? Number(updates.reorder_level) : existing.reorder_level;

      if (isNaN(stock) || stock < 0) {
        throw new ServiceError(400, 'INVALID_STOCK', 'Stock cannot be negative.');
      }
      if (isNaN(reorderLevel) || reorderLevel < 0) {
        throw new ServiceError(400, 'INVALID_REORDER_LEVEL', 'Reorder level cannot be negative.');
      }

      let dailyConsumption = existing.daily_consumption;
      if (updates.daily_consumption !== undefined) {
        const parsed = Number(updates.daily_consumption);
        if (isNaN(parsed) || parsed < 0) {
          throw new ServiceError(400, 'INVALID_DAILY_CONSUMPTION', 'Daily consumption cannot be negative.');
        }
        dailyConsumption = parsed;
      }

      const updatedItem: InventoryItem = {
        ...existing,
        name: updates.name?.trim() ?? existing.name,
        category: updates.category ?? existing.category,
        unit: updates.unit?.trim() ?? existing.unit,
        stock,
        reorder_level: reorderLevel,
        daily_consumption: dailyConsumption,
        updated_at: new Date().toISOString(),
      };

      db.inventory[idx] = updatedItem;
      return { data: updatedItem };
    });
  }

  static async deleteInventory(id: string): Promise<void> {
    return withDbLock((db) => {
      const idx = db.inventory.findIndex(i => i.id === id);
      if (idx === -1) {
        throw new ServiceError(404, 'INVENTORY_NOT_FOUND', `Inventory item "${id}" was not found.`);
      }

      // Check dependencies
      const activeNeeds = db.needs.filter(n => n.inventory_item_id === id);
      const dispatches = db.dispatches.filter(d => {
        const need = db.needs.find(n => n.id === d.need_id);
        return need?.inventory_item_id === id;
      });

      if (activeNeeds.length > 0 || dispatches.length > 0) {
        throw new ServiceError(
          409,
          'INVENTORY_DEPENDENCIES_EXIST',
          `Cannot delete inventory item "${db.inventory[idx].name}" because it is referenced by ${activeNeeds.length} camp need(s) or dispatch history.`
        );
      }

      db.inventory.splice(idx, 1);
      return { data: undefined };
    });
  }

  // ================= NEEDS =================
  static async getAllNeeds(filters?: { campId?: string; priority?: string; category?: string; search?: string }): Promise<CampNeed[]> {
    const db = loadDatabase();
    let result = db.needs.map(n => {
      const camp = db.camps.find(c => c.id === n.camp_id);
      const item = db.inventory.find(i => i.id === n.inventory_item_id);

      // Calculate active reservations (Pending or In Transit)
      const activeReservations = db.dispatches
        .filter(d => d.need_id === n.id && (d.status === 'Pending' || d.status === 'In Transit'))
        .reduce((sum, d) => sum + d.quantity, 0);

      const unreserved = Math.max(0, n.required_quantity - n.fulfilled_quantity - activeReservations);
      const pct = n.required_quantity > 0 ? (n.fulfilled_quantity / n.required_quantity) * 100 : 0;

      return {
        ...n,
        camp_name: camp?.name ?? 'Unknown Camp',
        camp_district: camp?.district ?? 'Unknown District',
        item_name: item?.name ?? 'Unknown Item',
        item_category: item?.category,
        item_unit: item?.unit ?? 'units',
        active_reserved_quantity: activeReservations,
        remaining_unreserved_quantity: unreserved,
        fulfilment_percentage: Math.min(100, Math.round(pct * 10) / 10),
      };
    });

    if (filters?.campId && filters.campId !== 'all') {
      result = result.filter(n => n.camp_id === filters.campId);
    }
    if (filters?.priority && filters.priority !== 'all') {
      result = result.filter(n => n.priority === filters.priority);
    }
    if (filters?.category && filters.category !== 'all') {
      result = result.filter(n => n.item_category?.toLowerCase() === filters.category!.toLowerCase());
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(n =>
        n.camp_name?.toLowerCase().includes(q) ||
        n.camp_district?.toLowerCase().includes(q) ||
        n.item_name?.toLowerCase().includes(q)
      );
    }

    return result;
  }

  static async getNeedById(id: string): Promise<CampNeed> {
    const db = loadDatabase();
    const need = db.needs.find(n => n.id === id);
    if (!need) {
      throw new ServiceError(404, 'NEED_NOT_FOUND', `Camp need "${id}" was not found.`);
    }
    const camp = db.camps.find(c => c.id === need.camp_id);
    const item = db.inventory.find(i => i.id === need.inventory_item_id);
    const activeReservations = db.dispatches
      .filter(d => d.need_id === need.id && (d.status === 'Pending' || d.status === 'In Transit'))
      .reduce((sum, d) => sum + d.quantity, 0);
    const unreserved = Math.max(0, need.required_quantity - need.fulfilled_quantity - activeReservations);
    const pct = need.required_quantity > 0 ? (need.fulfilled_quantity / need.required_quantity) * 100 : 0;

    return {
      ...need,
      camp_name: camp?.name,
      camp_district: camp?.district,
      item_name: item?.name,
      item_category: item?.category,
      item_unit: item?.unit,
      active_reserved_quantity: activeReservations,
      remaining_unreserved_quantity: unreserved,
      fulfilment_percentage: Math.min(100, Math.round(pct * 10) / 10),
    };
  }

  static async createNeed(data: {
    camp_id: string;
    inventory_item_id: string;
    required_quantity: number;
    priority: NeedPriority;
  }): Promise<CampNeed> {
    const reqQty = Number(data.required_quantity);
    if (!reqQty || reqQty <= 0) {
      throw new ServiceError(400, 'INVALID_QUANTITY', 'Required quantity must be greater than zero.');
    }
    if (!['High', 'Medium', 'Low'].includes(data.priority)) {
      throw new ServiceError(400, 'INVALID_PRIORITY', 'Priority must be High, Medium, or Low.');
    }

    return withDbLock((db) => {
      const camp = db.camps.find(c => c.id === data.camp_id);
      if (!camp) {
        throw new ServiceError(404, 'CAMP_NOT_FOUND', `Camp "${data.camp_id}" does not exist.`);
      }
      const item = db.inventory.find(i => i.id === data.inventory_item_id);
      if (!item) {
        throw new ServiceError(404, 'INVENTORY_NOT_FOUND', `Inventory item "${data.inventory_item_id}" does not exist.`);
      }

      // Prevent duplicate need for same camp + item
      const duplicate = db.needs.find(n => n.camp_id === data.camp_id && n.inventory_item_id === data.inventory_item_id);
      if (duplicate) {
        throw new ServiceError(
          409,
          'DUPLICATE_NEED',
          `A need for item "${item.name}" already exists for camp "${camp.name}". Please edit the existing need instead.`
        );
      }

      const newNeed: CampNeed = {
        id: `need-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        camp_id: data.camp_id,
        inventory_item_id: data.inventory_item_id,
        required_quantity: reqQty,
        priority: data.priority,
        fulfilled_quantity: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.needs.push(newNeed);
      return {
        data: {
          ...newNeed,
          camp_name: camp.name,
          camp_district: camp.district,
          item_name: item.name,
          item_category: item.category,
          item_unit: item.unit,
          active_reserved_quantity: 0,
          remaining_unreserved_quantity: reqQty,
          fulfilment_percentage: 0,
        },
      };
    });
  }

  static async updateNeed(id: string, updates: Partial<{
    required_quantity: number;
    priority: NeedPriority;
  }>): Promise<CampNeed> {
    return withDbLock((db) => {
      const idx = db.needs.findIndex(n => n.id === id);
      if (idx === -1) {
        throw new ServiceError(404, 'NEED_NOT_FOUND', `Need "${id}" was not found.`);
      }
      const existing = db.needs[idx];
      let newReq = existing.required_quantity;

      if (updates.required_quantity !== undefined) {
        newReq = Number(updates.required_quantity);
        if (newReq <= 0) {
          throw new ServiceError(400, 'INVALID_QUANTITY', 'Required quantity must be greater than zero.');
        }

        // Active reservation calculation
        const activeReservations = db.dispatches
          .filter(d => d.need_id === id && (d.status === 'Pending' || d.status === 'In Transit'))
          .reduce((sum, d) => sum + d.quantity, 0);

        const minimumAllowed = existing.fulfilled_quantity + activeReservations;
        if (newReq < minimumAllowed) {
          throw new ServiceError(
            400,
            'CANNOT_REDUCE_BELOW_RESERVED',
            `Cannot reduce required quantity below ${minimumAllowed} (${existing.fulfilled_quantity} already fulfilled + ${activeReservations} active reserved).`
          );
        }
      }

      const updatedNeed: CampNeed = {
        ...existing,
        required_quantity: newReq,
        priority: updates.priority ?? existing.priority,
        updated_at: new Date().toISOString(),
      };

      db.needs[idx] = updatedNeed;
      const camp = db.camps.find(c => c.id === updatedNeed.camp_id);
      const item = db.inventory.find(i => i.id === updatedNeed.inventory_item_id);

      return {
        data: {
          ...updatedNeed,
          camp_name: camp?.name,
          camp_district: camp?.district,
          item_name: item?.name,
          item_category: item?.category,
          item_unit: item?.unit,
        },
      };
    });
  }

  static async deleteNeed(id: string): Promise<void> {
    return withDbLock((db) => {
      const idx = db.needs.findIndex(n => n.id === id);
      if (idx === -1) {
        throw new ServiceError(404, 'NEED_NOT_FOUND', `Need "${id}" was not found.`);
      }

      // Dependency check: reject if active dispatches exist
      const activeDispatches = db.dispatches.filter(
        d => d.need_id === id && (d.status === 'Pending' || d.status === 'In Transit')
      );
      if (activeDispatches.length > 0) {
        throw new ServiceError(
          409,
          'ACTIVE_DISPATCHES_EXIST',
          `Cannot delete need because it has ${activeDispatches.length} active (Pending/In Transit) dispatch(es). Cancel or complete them first.`
        );
      }

      db.needs.splice(idx, 1);
      return { data: undefined };
    });
  }

  // ================= DISPATCHES (STOCK RESERVATION & STATE MACHINE) =================
  static async getAllDispatches(filters?: { status?: string; campId?: string; search?: string }): Promise<Dispatch[]> {
    const db = loadDatabase();
    let result = db.dispatches.map(d => {
      const camp = db.camps.find(c => c.id === d.camp_id);
      const need = db.needs.find(n => n.id === d.need_id);
      const item = need ? db.inventory.find(i => i.id === need.inventory_item_id) : undefined;

      return {
        ...d,
        camp_name: camp?.name ?? 'Unknown Camp',
        camp_district: camp?.district ?? 'Unknown District',
        item_name: item?.name ?? 'Unknown Item',
        item_unit: item?.unit ?? 'units',
        item_category: item?.category,
      };
    });

    if (filters?.status && filters.status !== 'all') {
      result = result.filter(d => d.status === filters.status);
    }
    if (filters?.campId && filters.campId !== 'all') {
      result = result.filter(d => d.camp_id === filters.campId);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(d =>
        d.id.toLowerCase().includes(q) ||
        d.camp_name?.toLowerCase().includes(q) ||
        d.item_name?.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static async getDispatchById(id: string): Promise<Dispatch> {
    const db = loadDatabase();
    const d = db.dispatches.find(disp => disp.id === id);
    if (!d) {
      throw new ServiceError(404, 'DISPATCH_NOT_FOUND', `Dispatch "${id}" was not found.`);
    }
    const camp = db.camps.find(c => c.id === d.camp_id);
    const need = db.needs.find(n => n.id === d.need_id);
    const item = need ? db.inventory.find(i => i.id === need.inventory_item_id) : undefined;

    return {
      ...d,
      camp_name: camp?.name,
      camp_district: camp?.district,
      item_name: item?.name,
      item_unit: item?.unit,
      item_category: item?.category,
    };
  }

  /**
   * Atomic Dispatch Creation with Immediate Stock Reservation
   */
  static async createDispatch(data: {
    camp_id: string;
    need_id: string;
    quantity: number;
  }): Promise<Dispatch> {
    const requestedQty = Number(data.quantity);
    if (!requestedQty || requestedQty <= 0) {
      throw new ServiceError(400, 'INVALID_QUANTITY', 'Dispatch quantity must be greater than zero.');
    }

    return withDbLock((db) => {
      // 1. Verify camp
      const camp = db.camps.find(c => c.id === data.camp_id);
      if (!camp) {
        throw new ServiceError(404, 'CAMP_NOT_FOUND', `Camp "${data.camp_id}" not found.`);
      }

      // 2. Verify need and relationship
      const need = db.needs.find(n => n.id === data.need_id);
      if (!need) {
        throw new ServiceError(404, 'NEED_NOT_FOUND', `Need "${data.need_id}" not found.`);
      }
      if (need.camp_id !== data.camp_id) {
        throw new ServiceError(400, 'NEED_CAMP_MISMATCH', 'The selected need does not belong to the selected camp.');
      }

      // 3. Verify inventory item
      const item = db.inventory.find(i => i.id === need.inventory_item_id);
      if (!item) {
        throw new ServiceError(404, 'INVENTORY_NOT_FOUND', 'Linked inventory item not found.');
      }

      // 4. Calculate active reservations for this need
      const activeReservations = db.dispatches
        .filter(d => d.need_id === need.id && (d.status === 'Pending' || d.status === 'In Transit'))
        .reduce((sum, d) => sum + d.quantity, 0);

      const remainingUnreservedNeed = need.required_quantity - need.fulfilled_quantity - activeReservations;

      // 5. Stock check
      if (requestedQty > item.stock) {
        throw new ServiceError(
          400,
          'INSUFFICIENT_STOCK',
          `The requested quantity (${requestedQty} ${item.unit}) exceeds currently available warehouse stock (${item.stock} ${item.unit}).`
        );
      }

      // 6. Remaining unreserved need check
      if (requestedQty > remainingUnreservedNeed) {
        throw new ServiceError(
          400,
          'EXCEEDS_UNRESERVED_NEED',
          `The requested quantity (${requestedQty}) exceeds the remaining unreserved need (${remainingUnreservedNeed}).`
        );
      }

      // 7. Atomic deduction: Deduct reserved quantity from available inventory immediately
      item.stock -= requestedQty;
      item.updated_at = new Date().toISOString();

      // 8. Create dispatch record
      const newDispatch: Dispatch = {
        id: `disp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        camp_id: data.camp_id,
        need_id: data.need_id,
        quantity: requestedQty,
        status: 'Pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        delivered_at: null,
        cancelled_at: null,
      };

      db.dispatches.push(newDispatch);

      return {
        data: {
          ...newDispatch,
          camp_name: camp.name,
          camp_district: camp.district,
          item_name: item.name,
          item_unit: item.unit,
          item_category: item.category,
        },
      };
    });
  }

  /**
   * Mark In Transit: Pending -> In Transit
   */
  static async markInTransit(id: string): Promise<Dispatch> {
    return withDbLock((db) => {
      const idx = db.dispatches.findIndex(d => d.id === id);
      if (idx === -1) {
        throw new ServiceError(404, 'DISPATCH_NOT_FOUND', `Dispatch "${id}" not found.`);
      }
      const dispatch = db.dispatches[idx];

      if (dispatch.status !== 'Pending') {
        throw new ServiceError(
          400,
          'INVALID_STATUS_TRANSITION',
          `Cannot mark dispatch as In Transit because its current status is "${dispatch.status}". Only Pending dispatches can transition to In Transit.`
        );
      }

      dispatch.status = 'In Transit';
      dispatch.updated_at = new Date().toISOString();

      const camp = db.camps.find(c => c.id === dispatch.camp_id);
      const need = db.needs.find(n => n.id === dispatch.need_id);
      const item = need ? db.inventory.find(i => i.id === need.inventory_item_id) : undefined;

      return {
        data: {
          ...dispatch,
          camp_name: camp?.name,
          camp_district: camp?.district,
          item_name: item?.name,
          item_unit: item?.unit,
          item_category: item?.category,
        },
      };
    });
  }

  /**
   * Mark Delivered: Pending or In Transit -> Delivered
   * Fulfilment increases by dispatch.quantity exactly once.
   * Stock is NOT deducted again (already deducted on creation).
   */
  static async markDelivered(id: string): Promise<Dispatch> {
    return withDbLock((db) => {
      const idx = db.dispatches.findIndex(d => d.id === id);
      if (idx === -1) {
        throw new ServiceError(404, 'DISPATCH_NOT_FOUND', `Dispatch "${id}" not found.`);
      }
      const dispatch = db.dispatches[idx];

      if (dispatch.status === 'Delivered') {
        throw new ServiceError(
          400,
          'ALREADY_DELIVERED',
          'This dispatch has already been delivered.'
        );
      }
      if (dispatch.status === 'Cancelled') {
        throw new ServiceError(
          400,
          'CANNOT_DELIVER_CANCELLED',
          'A cancelled dispatch cannot be delivered.'
        );
      }

      // Fetch linked need
      const needIdx = db.needs.findIndex(n => n.id === dispatch.need_id);
      if (needIdx === -1) {
        throw new ServiceError(404, 'NEED_NOT_FOUND', 'Linked need record not found.');
      }
      const need = db.needs[needIdx];

      // Increase fulfilled quantity
      need.fulfilled_quantity = Math.min(
        need.required_quantity,
        need.fulfilled_quantity + dispatch.quantity
      );
      need.updated_at = new Date().toISOString();

      // Update dispatch status
      dispatch.status = 'Delivered';
      dispatch.delivered_at = new Date().toISOString();
      dispatch.updated_at = new Date().toISOString();

      const camp = db.camps.find(c => c.id === dispatch.camp_id);
      const item = db.inventory.find(i => i.id === need.inventory_item_id);

      return {
        data: {
          ...dispatch,
          camp_name: camp?.name,
          camp_district: camp?.district,
          item_name: item?.name,
          item_unit: item?.unit,
          item_category: item?.category,
        },
      };
    });
  }

  /**
   * Cancel Dispatch: Pending or In Transit -> Cancelled
   * Restores reserved quantity back to available inventory exactly once.
   * Fulfilled quantity is untouched.
   */
  static async cancelDispatch(id: string): Promise<Dispatch> {
    return withDbLock((db) => {
      const idx = db.dispatches.findIndex(d => d.id === id);
      if (idx === -1) {
        throw new ServiceError(404, 'DISPATCH_NOT_FOUND', `Dispatch "${id}" not found.`);
      }
      const dispatch = db.dispatches[idx];

      if (dispatch.status === 'Cancelled') {
        throw new ServiceError(
          400,
          'ALREADY_CANCELLED',
          'This dispatch is already cancelled. Stock cannot be restored again.'
        );
      }
      if (dispatch.status === 'Delivered') {
        throw new ServiceError(
          400,
          'CANNOT_CANCEL_DELIVERED',
          'A delivered dispatch cannot be cancelled.'
        );
      }

      // Fetch linked need & inventory item
      const need = db.needs.find(n => n.id === dispatch.need_id);
      if (!need) {
        throw new ServiceError(404, 'NEED_NOT_FOUND', 'Linked need record not found.');
      }
      const item = db.inventory.find(i => i.id === need.inventory_item_id);
      if (!item) {
        throw new ServiceError(404, 'INVENTORY_NOT_FOUND', 'Linked inventory item not found.');
      }

      // Restore inventory stock exactly once
      item.stock += dispatch.quantity;
      item.updated_at = new Date().toISOString();

      // Transition dispatch
      dispatch.status = 'Cancelled';
      dispatch.cancelled_at = new Date().toISOString();
      dispatch.updated_at = new Date().toISOString();

      const camp = db.camps.find(c => c.id === dispatch.camp_id);

      return {
        data: {
          ...dispatch,
          camp_name: camp?.name,
          camp_district: camp?.district,
          item_name: item.name,
          item_unit: item.unit,
          item_category: item.category,
        },
      };
    });
  }

  // ================= DONATIONS =================
  static async getAllDonations(filters?: { type?: string; search?: string }): Promise<Donation[]> {
    const db = loadDatabase();
    let result = db.donations.map(don => {
      const item = don.item_id ? db.inventory.find(i => i.id === don.item_id) : undefined;
      return {
        ...don,
        item_name: item?.name,
        item_unit: item?.unit,
      };
    });

    if (filters?.type && filters.type !== 'all') {
      result = result.filter(d => d.type.toLowerCase() === filters.type!.toLowerCase());
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(d =>
        d.category.toLowerCase().includes(q) ||
        (d.donor_name && d.donor_name.toLowerCase().includes(q)) ||
        (d.notes && d.notes.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static async getDonationById(id: string): Promise<Donation> {
    const db = loadDatabase();
    const don = db.donations.find(d => d.id === id);
    if (!don) {
      throw new ServiceError(404, 'DONATION_NOT_FOUND', `Donation "${id}" not found.`);
    }
    const item = don.item_id ? db.inventory.find(i => i.id === don.item_id) : undefined;
    return {
      ...don,
      item_name: item?.name,
      item_unit: item?.unit,
    };
  }

  static async createDonation(data: {
    type: DonationType;
    category: string;
    amount_or_quantity: number;
    item_id?: string | null;
    donor_name?: string;
    notes?: string;
    idempotency_key?: string;
  }): Promise<Donation> {
    if (!['Cash', 'In-Kind'].includes(data.type)) {
      throw new ServiceError(400, 'INVALID_DONATION_TYPE', 'Type must be "Cash" or "In-Kind".');
    }
    if (!data.category || !data.category.trim()) {
      throw new ServiceError(400, 'INVALID_INPUT', 'Donation category is required.');
    }
    const val = Number(data.amount_or_quantity);
    if (!val || val <= 0) {
      throw new ServiceError(400, 'INVALID_VALUE', 'Amount or quantity must be greater than zero.');
    }

    return withDbLock((db) => {
      // Idempotency check
      if (data.idempotency_key) {
        const existing = db.donations.find(d => d.idempotency_key === data.idempotency_key);
        if (existing) {
          const item = existing.item_id ? db.inventory.find(i => i.id === existing.item_id) : undefined;
          return {
            dbModified: false,
            data: {
              ...existing,
              item_name: item?.name,
              item_unit: item?.unit,
            },
          };
        }
      }

      let linkedItem: InventoryItem | undefined;

      if (data.type === 'In-Kind') {
        if (!data.item_id) {
          throw new ServiceError(400, 'MISSING_ITEM_ID', 'In-Kind donation must reference an inventory item.');
        }
        linkedItem = db.inventory.find(i => i.id === data.item_id);
        if (!linkedItem) {
          throw new ServiceError(404, 'INVENTORY_NOT_FOUND', `Inventory item "${data.item_id}" not found.`);
        }
        // In-Kind donation increases stock exactly once
        linkedItem.stock += val;
        linkedItem.updated_at = new Date().toISOString();
      } else {
        // Cash donation never touches inventory!
      }

      const newDonation: Donation = {
        id: `don-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: data.type,
        category: data.category.trim(),
        amount_or_quantity: val,
        item_id: data.type === 'In-Kind' ? (data.item_id ?? null) : null,
        donor_name: data.donor_name?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        idempotency_key: data.idempotency_key || undefined,
        created_at: new Date().toISOString(),
      };

      db.donations.push(newDonation);

      return {
        data: {
          ...newDonation,
          item_name: linkedItem?.name,
          item_unit: linkedItem?.unit,
        },
      };
    });
  }

  // ================= VOLUNTEERS =================
  static async getAllVolunteers(filters?: { skill?: string; assignedStatus?: string; search?: string }): Promise<Volunteer[]> {
    const db = loadDatabase();
    let result = db.volunteers.map(v => {
      const camp = v.camp_id ? db.camps.find(c => c.id === v.camp_id) : undefined;
      return {
        ...v,
        camp_name: camp?.name,
        camp_district: camp?.district,
      };
    });

    if (filters?.skill && filters.skill !== 'all') {
      result = result.filter(v => v.skill.toLowerCase() === filters.skill!.toLowerCase());
    }
    if (filters?.assignedStatus === 'assigned') {
      result = result.filter(v => v.camp_id !== null);
    } else if (filters?.assignedStatus === 'available') {
      result = result.filter(v => v.camp_id === null);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.skill.toLowerCase().includes(q) ||
        (v.camp_name && v.camp_name.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  static async getVolunteerById(id: string): Promise<Volunteer> {
    const db = loadDatabase();
    const v = db.volunteers.find(vol => vol.id === id);
    if (!v) {
      throw new ServiceError(404, 'VOLUNTEER_NOT_FOUND', `Volunteer "${id}" not found.`);
    }
    const camp = v.camp_id ? db.camps.find(c => c.id === v.camp_id) : undefined;
    return {
      ...v,
      camp_name: camp?.name,
      camp_district: camp?.district,
    };
  }

  static async registerVolunteer(data: {
    name: string;
    skill: VolunteerSkill;
    camp_id?: string | null;
  }): Promise<Volunteer> {
    if (!data.name || !data.name.trim()) {
      throw new ServiceError(400, 'INVALID_INPUT', 'Volunteer name is required.');
    }
    const validSkills: VolunteerSkill[] = ['Medical', 'Logistics', 'Cooking', 'Driving', 'Counselling'];
    if (!validSkills.includes(data.skill)) {
      throw new ServiceError(400, 'INVALID_SKILL', `Skill must be one of: ${validSkills.join(', ')}.`);
    }

    return withDbLock((db) => {
      let camp: Camp | undefined;
      if (data.camp_id) {
        camp = db.camps.find(c => c.id === data.camp_id);
        if (!camp) {
          throw new ServiceError(404, 'CAMP_NOT_FOUND', `Camp "${data.camp_id}" not found.`);
        }
        if (camp.status === 'Closed') {
          throw new ServiceError(400, 'CANNOT_ASSIGN_CLOSED_CAMP', 'Cannot assign volunteer to a Closed camp.');
        }
      }

      const newVolunteer: Volunteer = {
        id: `vol-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: data.name.trim(),
        skill: data.skill,
        camp_id: data.camp_id ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.volunteers.push(newVolunteer);

      return {
        data: {
          ...newVolunteer,
          camp_name: camp?.name,
          camp_district: camp?.district,
        },
      };
    });
  }

  static async updateVolunteer(id: string, updates: Partial<{
    name: string;
    skill: VolunteerSkill;
  }>): Promise<Volunteer> {
    return withDbLock((db) => {
      const idx = db.volunteers.findIndex(v => v.id === id);
      if (idx === -1) {
        throw new ServiceError(404, 'VOLUNTEER_NOT_FOUND', `Volunteer "${id}" not found.`);
      }
      const existing = db.volunteers[idx];

      const validSkills: VolunteerSkill[] = ['Medical', 'Logistics', 'Cooking', 'Driving', 'Counselling'];
      if (updates.skill && !validSkills.includes(updates.skill)) {
        throw new ServiceError(400, 'INVALID_SKILL', `Skill must be one of: ${validSkills.join(', ')}.`);
      }

      const updatedVol: Volunteer = {
        ...existing,
        name: updates.name?.trim() ?? existing.name,
        skill: updates.skill ?? existing.skill,
        updated_at: new Date().toISOString(),
      };

      db.volunteers[idx] = updatedVol;
      const camp = updatedVol.camp_id ? db.camps.find(c => c.id === updatedVol.camp_id) : undefined;

      return {
        data: {
          ...updatedVol,
          camp_name: camp?.name,
          camp_district: camp?.district,
        },
      };
    });
  }

  static async deleteVolunteer(id: string): Promise<void> {
    return withDbLock((db) => {
      const idx = db.volunteers.findIndex(v => v.id === id);
      if (idx === -1) {
        throw new ServiceError(404, 'VOLUNTEER_NOT_FOUND', `Volunteer "${id}" not found.`);
      }
      db.volunteers.splice(idx, 1);
      return { data: undefined };
    });
  }

  /**
   * Assign Volunteer to Camp:
   * Rejects if already assigned to another camp.
   * Rejects if target camp is Closed.
   */
  static async assignVolunteer(volunteerId: string, campId: string): Promise<Volunteer> {
    return withDbLock((db) => {
      const volIdx = db.volunteers.findIndex(v => v.id === volunteerId);
      if (volIdx === -1) {
        throw new ServiceError(404, 'VOLUNTEER_NOT_FOUND', `Volunteer "${volunteerId}" not found.`);
      }
      const volunteer = db.volunteers[volIdx];

      // Rule: If already assigned to a camp, reject until unassigned!
      if (volunteer.camp_id) {
        const currentCamp = db.camps.find(c => c.id === volunteer.camp_id);
        throw new ServiceError(
          409,
          'ALREADY_ASSIGNED',
          `Volunteer "${volunteer.name}" is already assigned to "${currentCamp?.name ?? volunteer.camp_id}". Please unassign them first before reassigning.`
        );
      }

      // Check target camp
      const targetCamp = db.camps.find(c => c.id === campId);
      if (!targetCamp) {
        throw new ServiceError(404, 'CAMP_NOT_FOUND', `Target camp "${campId}" not found.`);
      }

      // Rule: Cannot assign to Closed camp!
      if (targetCamp.status === 'Closed') {
        throw new ServiceError(
          400,
          'CANNOT_ASSIGN_CLOSED_CAMP',
          `Cannot assign volunteer to camp "${targetCamp.name}" because it is currently Closed.`
        );
      }

      volunteer.camp_id = campId;
      volunteer.updated_at = new Date().toISOString();

      return {
        data: {
          ...volunteer,
          camp_name: targetCamp.name,
          camp_district: targetCamp.district,
        },
      };
    });
  }

  static async unassignVolunteer(volunteerId: string): Promise<Volunteer> {
    return withDbLock((db) => {
      const volIdx = db.volunteers.findIndex(v => v.id === volunteerId);
      if (volIdx === -1) {
        throw new ServiceError(404, 'VOLUNTEER_NOT_FOUND', `Volunteer "${volunteerId}" not found.`);
      }
      const volunteer = db.volunteers[volIdx];
      volunteer.camp_id = null;
      volunteer.updated_at = new Date().toISOString();

      return {
        data: {
          ...volunteer,
          camp_name: undefined,
          camp_district: undefined,
        },
      };
    });
  }

  // ================= DASHBOARD & ANALYTICS =================
  static async getDashboardSummary(): Promise<DashboardSummary> {
    const db = loadDatabase();

    const activeCamps = db.camps.filter(c => c.status !== 'Closed');
    const familiesSheltered = activeCamps.reduce((sum, c) => sum + c.current_families, 0);

    const totalRequired = db.needs.reduce((sum, n) => sum + n.required_quantity, 0);
    const totalFulfilled = db.needs.reduce((sum, n) => sum + n.fulfilled_quantity, 0);
    const overallFulfilment = totalRequired > 0 ? (totalFulfilled / totalRequired) * 100 : 0;

    const lowStockItems = db.inventory.filter(i => i.stock <= i.reorder_level).length;
    const volunteersDeployed = db.volunteers.filter(v => v.camp_id !== null).length;

    const totalCashDonations = db.donations
      .filter(d => d.type === 'Cash')
      .reduce((sum, d) => sum + d.amount_or_quantity, 0);

    return {
      active_camps: activeCamps.length,
      total_camps: db.camps.length,
      families_sheltered: familiesSheltered,
      overall_fulfilment: Math.round(overallFulfilment * 10) / 10,
      low_stock_items: lowStockItems,
      volunteers_deployed: volunteersDeployed,
      total_volunteers: db.volunteers.length,
      total_cash_donations_pkr: totalCashDonations,
      total_dispatches: db.dispatches.length,
    };
  }

  static async getCategoryFulfilment(): Promise<CategoryFulfilment[]> {
    const db = loadDatabase();
    const categories: InventoryCategory[] = [
      'Food',
      'Clean Water',
      'Medicine',
      'Shelter',
      'Hygiene',
      'Clothing',
      'Other',
    ];

    return categories.map(cat => {
      // Find all inventory items in this category
      const itemIds = new Set(db.inventory.filter(i => i.category === cat).map(i => i.id));
      const catNeeds = db.needs.filter(n => itemIds.has(n.inventory_item_id));

      const required = catNeeds.reduce((sum, n) => sum + n.required_quantity, 0);
      const fulfilled = catNeeds.reduce((sum, n) => sum + n.fulfilled_quantity, 0);
      const pct = required > 0 ? (fulfilled / required) * 100 : 0;

      return {
        category: cat,
        required_quantity: required,
        fulfilled_quantity: fulfilled,
        percentage: Math.round(pct * 10) / 10,
        needs_count: catNeeds.length,
      };
    });
  }

  static async getCriticalGaps(): Promise<CriticalGap[]> {
    const db = loadDatabase();

    // Critical gaps condition:
    // priority === 'High' AND fulfilment percentage < 40%
    const gaps: CriticalGap[] = [];

    for (const need of db.needs) {
      if (need.priority !== 'High') continue;

      const pct = need.required_quantity > 0 ? (need.fulfilled_quantity / need.required_quantity) * 100 : 0;
      if (pct < 40) {
        const camp = db.camps.find(c => c.id === need.camp_id);
        const item = db.inventory.find(i => i.id === need.inventory_item_id);

        gaps.push({
          need_id: need.id,
          camp_id: need.camp_id,
          camp_name: camp?.name ?? 'Unknown Camp',
          district: camp?.district ?? 'Unknown District',
          inventory_item_id: need.inventory_item_id,
          item_name: item?.name ?? 'Unknown Item',
          item_unit: item?.unit ?? 'units',
          category: item?.category ?? 'Other',
          required_quantity: need.required_quantity,
          fulfilled_quantity: need.fulfilled_quantity,
          remaining_quantity: need.required_quantity - need.fulfilled_quantity,
          fulfilment_percentage: Math.round(pct * 10) / 10,
          priority: need.priority,
        });
      }
    }

    // Sort: lowest fulfilment percentage first; tie-breaker: largest remaining quantity
    return gaps.sort((a, b) => {
      if (a.fulfilment_percentage !== b.fulfilment_percentage) {
        return a.fulfilment_percentage - b.fulfilment_percentage;
      }
      return b.remaining_quantity - a.remaining_quantity;
    });
  }

  // ================= SMART RECOMMENDATIONS (FEATURE 1) =================
  static async getSmartRecommendations(): Promise<SmartRecommendation[]> {
    const db = loadDatabase();
    const recommendations: SmartRecommendation[] = [];

    for (const need of db.needs) {
      const camp = db.camps.find(c => c.id === need.camp_id);
      if (!camp) continue;

      // Invariant: Do not recommend dispatching resources to closed camps
      if (camp.status === 'Closed') continue;

      const item = db.inventory.find(i => i.id === need.inventory_item_id);
      if (!item) continue;

      // Active reservations for this need (Pending or In Transit)
      const activeReservations = db.dispatches
        .filter(d => d.need_id === need.id && (d.status === 'Pending' || d.status === 'In Transit'))
        .reduce((sum, d) => sum + d.quantity, 0);

      // Remaining unreserved demand
      const remainingUnreserved = Math.max(0, need.required_quantity - need.fulfilled_quantity - activeReservations);

      // Skip if demand is already completely covered by deliveries + pending/in-transit reservations
      if (remainingUnreserved <= 0) continue;

      const pct = need.required_quantity > 0 ? (need.fulfilled_quantity / need.required_quantity) * 100 : 0;
      const fulfilmentPercentage = Math.round(pct * 10) / 10;

      // Available stock in central warehouse (item.stock already reflects deductions upon dispatch creation)
      const availableStock = Math.max(0, item.stock);

      // Recommended quantity cannot exceed available stock OR remaining unreserved demand
      const recommendedQty = Math.min(availableStock, remainingUnreserved);

      let stockStatus: 'Sufficient' | 'Partial' | 'Insufficient stock' = 'Insufficient stock';
      if (availableStock >= remainingUnreserved && recommendedQty > 0) {
        stockStatus = 'Sufficient';
      } else if (availableStock > 0) {
        stockStatus = 'Partial';
      } else {
        stockStatus = 'Insufficient stock';
      }

      // Priority scoring formula (Higher score = higher recommended priority)
      // High: 300, Medium: 150, Low: 50
      const priorityWeight = need.priority === 'High' ? 300 : need.priority === 'Medium' ? 150 : 50;
      // Fulfilment deficiency weight: up to 200 pts for 0% fulfilment
      const deficiencyWeight = (100 - fulfilmentPercentage) * 2;
      // Affected population weight: up to 50 pts based on sheltered families
      const familiesWeight = Math.min(50, (camp.current_families || 0) * 0.1);
      const urgencyScore = Math.round(priorityWeight + deficiencyWeight + familiesWeight);

      // Rule-based explanatory rationale
      let explanation = '';
      if (need.priority === 'High' && fulfilmentPercentage < 40) {
        explanation = `URGENT: ${camp.name} in ${camp.district} faces a critical high-priority ${item.name} shortage with only ${fulfilmentPercentage}% fulfilled. ${remainingUnreserved} ${item.unit} needed for ${camp.current_families} sheltered families.`;
      } else if (need.priority === 'High') {
        explanation = `HIGH ATTENTION: ${camp.name} requires ${remainingUnreserved} ${item.unit} of ${item.name} (${fulfilmentPercentage}% current fulfilment) to support ongoing shelter operations.`;
      } else if (need.priority === 'Medium') {
        explanation = `MODERATE: Replenishing ${item.name} at ${camp.name} (${remainingUnreserved} ${item.unit} remaining) prevents stockout before next delivery cycle.`;
      } else {
        explanation = `ROUTINE: ${camp.name} has ${remainingUnreserved} ${item.unit} unreserved demand for ${item.name} at ${fulfilmentPercentage}% completion.`;
      }

      recommendations.push({
        need_id: need.id,
        camp_id: camp.id,
        camp_name: camp.name,
        district: camp.district,
        item_id: item.id,
        item_name: item.name,
        item_unit: item.unit,
        category: item.category,
        priority: need.priority,
        fulfilment_percentage: fulfilmentPercentage,
        remaining_unreserved_quantity: remainingUnreserved,
        available_stock: availableStock,
        recommended_quantity: recommendedQty,
        stock_status: stockStatus,
        explanation,
        urgency_score: urgencyScore,
        families_sheltered: camp.current_families || 0,
      });
    }

    // Sort by highest urgency score first, then lowest fulfilment %, then highest unreserved demand
    return recommendations.sort((a, b) => {
      if (b.urgency_score !== a.urgency_score) return b.urgency_score - a.urgency_score;
      if (a.fulfilment_percentage !== b.fulfilment_percentage) return a.fulfilment_percentage - b.fulfilment_percentage;
      return b.remaining_unreserved_quantity - a.remaining_unreserved_quantity;
    });
  }

  // ================= DISPATCH DELAY ALERTS (FEATURE 3) =================
  static async getDispatchDelayAlerts(thresholdHours: number = 24): Promise<DispatchDelayAlert[]> {
    const db = loadDatabase();
    const alerts: DispatchDelayAlert[] = [];
    const now = Date.now();

    for (const d of db.dispatches) {
      if (d.status !== 'Pending' && d.status !== 'In Transit') continue;

      const createdTime = new Date(d.created_at).getTime();
      if (isNaN(createdTime) || createdTime <= 0) {
        // Timestamp missing or invalid: record as uncalculable
        const camp = db.camps.find(c => c.id === d.camp_id);
        const need = db.needs.find(n => n.id === d.need_id);
        const item = need ? db.inventory.find(i => i.id === need.inventory_item_id) : undefined;

        alerts.push({
          dispatch_id: d.id,
          camp_name: camp?.name ?? 'Unknown Camp',
          camp_district: camp?.district ?? 'Unknown District',
          item_name: item?.name ?? 'Relief Supplies',
          item_unit: item?.unit ?? 'units',
          quantity: d.quantity,
          status: d.status,
          created_at: d.created_at,
          elapsed_hours: 0,
          elapsed_display: 'Timestamp unavailable',
          delay_level: 'warning',
        });
        continue;
      }

      const elapsedMs = now - createdTime;
      const elapsedHours = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60)));

      if (elapsedHours >= thresholdHours) {
        const camp = db.camps.find(c => c.id === d.camp_id);
        const need = db.needs.find(n => n.id === d.need_id);
        const item = need ? db.inventory.find(i => i.id === need.inventory_item_id) : undefined;

        let elapsedDisplay = '';
        if (elapsedHours >= 48) {
          const days = Math.floor(elapsedHours / 24);
          const remHours = elapsedHours % 24;
          elapsedDisplay = remHours > 0 ? `${days}d ${remHours}h` : `${days} days`;
        } else {
          elapsedDisplay = `${elapsedHours} hours`;
        }

        alerts.push({
          dispatch_id: d.id,
          camp_name: camp?.name ?? 'Unknown Camp',
          camp_district: camp?.district ?? 'Unknown District',
          item_name: item?.name ?? 'Relief Supplies',
          item_unit: item?.unit ?? 'units',
          quantity: d.quantity,
          status: d.status,
          created_at: d.created_at,
          elapsed_hours: elapsedHours,
          elapsed_display: elapsedDisplay,
          delay_level: elapsedHours >= thresholdHours * 2 ? 'critical' : 'warning',
        });
      }
    }

    return alerts.sort((a, b) => b.elapsed_hours - a.elapsed_hours);
  }

  static async resetSeedData(): Promise<void> {
    await resetDatabase();
  }
}
