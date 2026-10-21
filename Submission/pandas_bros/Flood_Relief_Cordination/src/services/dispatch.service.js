import api from '../api/client';
import { dispatchesApi } from '../api/dispatches.api';
import { needsApi } from '../api/needs.api';
import { inventoryApi } from '../api/inventory.api';

const pendingOperations = new Set();

const generateOperationKey = (type, id) => `${type}-${id}`;

const isOperationPending = (type, id) => {
  return pendingOperations.has(generateOperationKey(type, id));
};

const setOperationPending = (type, id, pending) => {
  const key = generateOperationKey(type, id);
  if (pending) {
    pendingOperations.add(key);
  } else {
    pendingOperations.delete(key);
  }
};

export const dispatchService = {
  async createDispatch(dispatchData) {
    const opKey = `create-dispatch-${dispatchData.need_id}-${dispatchData.quantity}`;
    if (isOperationPending('create', opKey)) {
      throw new Error('Dispatch creation already in progress');
    }
    setOperationPending('create', opKey, true);
    
    try {
      const [needRes, itemRes, dispatchesRes] = await Promise.all([
        needsApi.getById(dispatchData.need_id),
        Promise.resolve(null),
        dispatchesApi.getByNeed(dispatchData.need_id),
      ]);
      
      const need = needRes.data;
      let item = null;
      
      if (need.inventory_item_id) {
        const itemRes = await inventoryApi.getById(need.inventory_item_id);
        item = itemRes.data;
      }
      
      const existingDispatches = dispatchesRes.data;
      const required = Number(need.required_quantity) || 0;
      const fulfilled = Number(need.fulfilled_quantity) || 0;
      const activeDispatchQty = existingDispatches
        .filter(d => ['Pending', 'In Transit'].includes(d.status))
        .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
      
      const remainingDemand = Math.max(required - fulfilled - activeDispatchQty, 0);
      const requestedQty = Number(dispatchData.quantity);
      
      if (requestedQty > remainingDemand) {
        throw new Error(`Dispatch quantity (${requestedQty}) exceeds remaining unmet demand (${remainingDemand})`);
      }
      
      let availableStock = 0;
      if (item) {
        const stock = Number(item.stock) || 0;
        const reservedStock = existingDispatches
          .filter(d => ['Pending', 'In Transit'].includes(d.status))
          .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
        availableStock = Math.max(stock - reservedStock, 0);
        
        if (requestedQty > availableStock) {
          throw new Error(`Dispatch quantity (${requestedQty}) exceeds available stock (${availableStock})`);
        }
      }
      
      const newDispatch = {
        ...dispatchData,
        id: `dispatch-${Date.now()}`,
        status: 'Pending',
        created_at: new Date().toISOString(),
      };
      
      const dispatchRes = await dispatchesApi.create(newDispatch);
      
      if (item) {
        const newStock = (Number(item.stock) || 0) - requestedQty;
        await inventoryApi.patch(item.id, { stock: newStock });
      }
      
      return dispatchRes.data;
    } finally {
      setOperationPending('create', opKey, false);
    }
  },

  async updateDispatchStatus(dispatchId, newStatus) {
    const opKey = `update-${dispatchId}-${newStatus}`;
    if (isOperationPending('update', opKey)) {
      throw new Error('Status update already in progress');
    }
    setOperationPending('update', opKey, true);
    
    try {
      const dispatchRes = await dispatchesApi.getById(dispatchId);
      const dispatch = dispatchRes.data;
      const oldStatus = dispatch.status;
      
      if (oldStatus === newStatus) {
        return dispatch;
      }
      
      if (oldStatus === 'Delivered' && newStatus !== 'Delivered') {
        throw new Error('Cannot change status of a delivered dispatch. Use reversal workflow if needed.');
      }
      
      if (oldStatus === 'Cancelled' && newStatus !== 'Cancelled') {
        throw new Error('Cannot change status of a cancelled dispatch');
      }
      
      const needRes = await needsApi.getById(dispatch.need_id);
      const need = needRes.data;
      
      let item = null;
      if (need.inventory_item_id) {
        const itemRes = await inventoryApi.getById(need.inventory_item_id);
        item = itemRes.data;
      }
      
      const quantity = Number(dispatch.quantity) || 0;
      
      if (oldStatus === 'Pending' || oldStatus === 'In Transit') {
        if (newStatus === 'Delivered') {
          const newFulfilled = Math.min(
            (Number(need.fulfilled_quantity) || 0) + quantity,
            Number(need.required_quantity) || 0
          );
          await needsApi.patch(need.id, { fulfilled_quantity: newFulfilled });
          
          if (item) {
            const campRes = await api.get(`/camps/${dispatch.camp_id}`);
            const camp = campRes.data;
            
            const campNeedsRes = await needsApi.getByCamp(dispatch.camp_id);
            const campNeeds = campNeedsRes.data;
            const allFulfilled = campNeeds.every(n => 
              (Number(n.fulfilled_quantity) || 0) >= (Number(n.required_quantity) || 0)
            );
            
            if (allFulfilled && camp.status === 'Active') {
              await api.patch(`/camps/${dispatch.camp_id}`, { status: 'Full' });
            }
          }
        } else if (newStatus === 'Cancelled') {
          if (item) {
            const newStock = (Number(item.stock) || 0) + quantity;
            await inventoryApi.patch(item.id, { stock: newStock });
          }
        } else if (newStatus === 'In Transit' && oldStatus === 'Pending') {
        }
      } else if (oldStatus === 'Delivered' && newStatus === 'Cancelled') {
        throw new Error('Cannot cancel a delivered dispatch directly');
      }
      
      const updatedDispatch = {
        ...dispatch,
        status: newStatus,
        ...(newStatus === 'Delivered' ? { delivered_at: new Date().toISOString() } : {}),
        ...(newStatus === 'Cancelled' ? { cancelled_at: new Date().toISOString() } : {}),
      };
      
      const res = await dispatchesApi.update(dispatchId, updatedDispatch);
      return res.data;
    } finally {
      setOperationPending('update', opKey, false);
    }
  },

  async cancelDispatch(dispatchId) {
    return this.updateDispatchStatus(dispatchId, 'Cancelled');
  },

  async markInTransit(dispatchId) {
    return this.updateDispatchStatus(dispatchId, 'In Transit');
  },

  async markDelivered(dispatchId) {
    return this.updateDispatchStatus(dispatchId, 'Delivered');
  },
};