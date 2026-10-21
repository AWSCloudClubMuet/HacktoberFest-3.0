import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'db.json');
const PORT = process.env.PORT || 3001;

// ==================== DISPATCH STATE MACHINE ====================
export const ALLOWED_DISPATCH_TRANSITIONS = {
  'Pending': ['In Transit', 'Cancelled'],
  'In Transit': ['Delivered', 'Cancelled'],
  'Delivered': [],
  'Cancelled': []
};

export function validateDispatchTransition(currentStatus, newStatus) {
  if (!newStatus || typeof newStatus !== 'string') {
    return { valid: false, error: 'Status must be a non-empty string' };
  }
  const validStatuses = ['Pending', 'In Transit', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(newStatus)) {
    return { valid: false, error: `Unknown dispatch status '${newStatus}'` };
  }
  if (currentStatus === newStatus) {
    return { valid: true, isNoOp: true };
  }
  if (currentStatus === 'Delivered' || currentStatus === 'Cancelled') {
    return { valid: false, error: `Cannot transition terminal dispatch state '${currentStatus}' to '${newStatus}'` };
  }
  const allowed = ALLOWED_DISPATCH_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    return { valid: false, error: `Invalid dispatch status transition from '${currentStatus}' to '${newStatus}'` };
  }
  return { valid: true, isNoOp: false };
}

// ==================== DATABASE PERSISTENCE ====================
let writeQueue = Promise.resolve();

export function readDB() {
  const targetFile = process.env.DB_FILE || DB_FILE;
  if (!fs.existsSync(targetFile)) {
    throw new Error(`Database file not found at ${targetFile}`);
  }
  const raw = fs.readFileSync(targetFile, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Database file is corrupted or not valid JSON: ${err.message}`);
  }
}

export function writeDBSafe(data) {
  const targetFile = process.env.DB_FILE || DB_FILE;
  return new Promise((resolve, reject) => {
    writeQueue = writeQueue.then(async () => {
      const jsonStr = JSON.stringify(data, null, 2);
      const tmpFile = `${targetFile}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
      try {
        fs.writeFileSync(tmpFile, jsonStr, 'utf-8');
        try {
          fs.copyFileSync(tmpFile, targetFile);
          fs.unlinkSync(tmpFile);
        } catch (copyErr) {
          fs.writeFileSync(targetFile, jsonStr, 'utf-8');
        }
        resolve(true);
      } catch (err) {
        console.error('Safe write failed:', err.message);
        try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (e) {}
        reject(err);
      }
    }).catch(err => {
      reject(err);
    });
  });
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJson(res, statusCode, data) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { 
      body += chunk; 
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body || !body.trim()) return resolve({});
      try {
        const parsed = JSON.parse(body);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          return reject(new Error('Request body must be a JSON object'));
        }
        resolve(parsed);
      } catch (err) {
        reject(new Error('Malformed JSON payload: ' + err.message));
      }
    });
    req.on('error', reject);
  });
}

function generateId(collectionName, existingList = []) {
  const prefix = collectionName.slice(0, 4);
  let id;
  let attempts = 0;
  do {
    id = `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
    attempts++;
  } while (existingList.some(item => item.id === id) && attempts < 100);
  return id;
}

// ==================== HTTP REQUEST HANDLER ====================
export const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method;

  // Basic health check
  if (pathname === '/health' && method === 'GET') {
    return sendJson(res, 200, { status: 'ok', service: 'ReliefHub API' });
  }

  // Collection regex: /camps, /camps/:id, etc.
  const match = pathname.match(/^\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?$/);
  if (!match) {
    return sendJson(res, 404, { error: 'Not found', path: pathname });
  }

  const collectionName = match[1];
  const id = match[2];

  let db;
  try {
    db = readDB();
  } catch (err) {
    return sendJson(res, 500, { error: 'Database read failure: ' + err.message });
  }

  if (!Array.isArray(db[collectionName])) {
    return sendJson(res, 404, { error: `Collection '${collectionName}' not found` });
  }

  const collection = db[collectionName];

  // -------------------------------------------------------------
  // 1. GET Collection
  // -------------------------------------------------------------
  if (!id && method === 'GET') {
    let results = [...collection];
    for (const [key, value] of url.searchParams.entries()) {
      if (value) {
        results = results.filter(item => {
          const prop = item[key];
          if (typeof prop === 'string') {
            return prop.toLowerCase().includes(value.toLowerCase());
          }
          return String(prop) === value;
        });
      }
    }
    return sendJson(res, 200, results);
  }

  // -------------------------------------------------------------
  // 2. GET Single Item
  // -------------------------------------------------------------
  if (id && method === 'GET') {
    const item = collection.find(x => String(x.id) === String(id));
    if (!item) return sendJson(res, 404, { error: `Item with id ${id} not found in ${collectionName}` });
    return sendJson(res, 200, item);
  }

  // -------------------------------------------------------------
  // 3. POST Item (Creation with Hardened Validation)
  // -------------------------------------------------------------
  if (!id && method === 'POST') {
    let body;
    try {
      body = await parseBody(req);
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }

    let newId;
    if (body.id) {
      if (collection.some(item => String(item.id) === String(body.id))) {
        return sendJson(res, 409, { error: `Record with id '${body.id}' already exists in ${collectionName}` });
      }
      newId = String(body.id);
    } else {
      newId = generateId(collectionName, collection);
    }

    // --- CAMPS CREATION ---
    if (collectionName === 'camps') {
      const { name, district, capacity, current_families, status } = body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return sendJson(res, 400, { error: 'Camp name is required' });
      }
      if (!district || typeof district !== 'string' || !district.trim()) {
        return sendJson(res, 400, { error: 'District is required' });
      }
      const capNum = Number(capacity);
      if (!Number.isFinite(capNum) || capNum <= 0) {
        return sendJson(res, 400, { error: 'Capacity must be a finite positive number' });
      }
      const famNum = current_families !== undefined ? Number(current_families) : 0;
      if (!Number.isFinite(famNum) || famNum < 0) {
        return sendJson(res, 400, { error: 'Current families cannot be negative' });
      }
      if (famNum > capNum) {
        return sendJson(res, 400, { error: `Current families (${famNum}) cannot exceed total camp capacity (${capNum})` });
      }

      let calcStatus = status || 'Active';
      if (calcStatus !== 'Closed') {
        calcStatus = famNum >= capNum ? 'Full' : 'Active';
      }

      const newCamp = {
        id: newId,
        name: name.trim(),
        district: district.trim(),
        capacity: capNum,
        current_families: famNum,
        status: calcStatus
      };
      collection.push(newCamp);
      await writeDBSafe(db);
      return sendJson(res, 201, newCamp);
    }

    // --- INVENTORY CREATION ---
    if (collectionName === 'inventory') {
      const { name, category, unit, stock, reorder_level } = body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return sendJson(res, 400, { error: 'Inventory item name is required' });
      }
      if (!category || typeof category !== 'string' || !category.trim()) {
        return sendJson(res, 400, { error: 'Inventory category is required' });
      }
      if (!unit || typeof unit !== 'string' || !unit.trim()) {
        return sendJson(res, 400, { error: 'Unit of measurement is required' });
      }
      const stockNum = Number(stock !== undefined ? stock : 0);
      if (!Number.isFinite(stockNum) || stockNum < 0) {
        return sendJson(res, 400, { error: 'Stock cannot be negative' });
      }
      const reorderNum = Number(reorder_level !== undefined ? reorder_level : 0);
      if (!Number.isFinite(reorderNum) || reorderNum < 0) {
        return sendJson(res, 400, { error: 'Reorder level cannot be negative' });
      }

      const newItem = {
        id: newId,
        name: name.trim(),
        category: category.trim(),
        unit: unit.trim(),
        stock: stockNum,
        reorder_level: reorderNum
      };
      collection.push(newItem);
      await writeDBSafe(db);
      return sendJson(res, 201, newItem);
    }

    // --- NEEDS CREATION ---
    if (collectionName === 'needs') {
      const { camp_id, inventory_item_id, required_quantity, priority } = body;
      if (!camp_id) return sendJson(res, 400, { error: 'Camp selection is required' });
      if (!inventory_item_id) return sendJson(res, 400, { error: 'Inventory item selection is required' });

      const camp = (db.camps || []).find(c => String(c.id) === String(camp_id));
      if (!camp) return sendJson(res, 404, { error: 'Referenced camp not found' });

      const inv = (db.inventory || []).find(i => String(i.id) === String(inventory_item_id));
      if (!inv) return sendJson(res, 404, { error: 'Referenced inventory item not found' });

      const reqQty = Number(required_quantity);
      if (!Number.isFinite(reqQty) || reqQty <= 0) {
        return sendJson(res, 400, { error: 'Required quantity must be a finite positive number' });
      }

      const validPriorities = ['High', 'Medium', 'Low'];
      const prio = validPriorities.includes(priority) ? priority : 'High';

      const newNeed = {
        id: newId,
        camp_id: String(camp_id),
        inventory_item_id: String(inventory_item_id),
        required_quantity: reqQty,
        fulfilled_quantity: 0, // Invariant: Initial fulfilment must always be 0
        priority: prio
      };
      collection.push(newNeed);
      await writeDBSafe(db);
      return sendJson(res, 201, newNeed);
    }

    // --- DISPATCHES CREATION (Priority 1) ---
    if (collectionName === 'dispatches') {
      const { camp_id, need_id, quantity } = body;
      const qty = Number(quantity);

      if (!camp_id || !need_id || !Number.isFinite(qty) || qty <= 0) {
        return sendJson(res, 400, { error: 'Valid camp_id, need_id, and positive finite quantity required' });
      }

      const camp = (db.camps || []).find(c => String(c.id) === String(camp_id));
      if (!camp) {
        return sendJson(res, 404, { error: 'Specified camp not found' });
      }

      const need = (db.needs || []).find(n => String(n.id) === String(need_id));
      if (!need) {
        return sendJson(res, 404, { error: 'Specified need not found' });
      }

      if (String(need.camp_id) !== String(camp_id)) {
        return sendJson(res, 400, { error: 'Need does not belong to specified camp' });
      }

      const inv = (db.inventory || []).find(i => String(i.id) === String(need.inventory_item_id));
      if (!inv) {
        return sendJson(res, 400, { error: 'Inventory item associated with need not found' });
      }

      if (qty > inv.stock) {
        return sendJson(res, 400, { 
          error: `Insufficient warehouse stock. Available: ${inv.stock} ${inv.unit}, Requested: ${qty}` 
        });
      }

      // Calculate active reservations for this need
      const activeDispatches = (db.dispatches || []).filter(
        d => String(d.need_id) === String(need.id) && (d.status === 'Pending' || d.status === 'In Transit')
      );
      const reservedDemand = activeDispatches.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
      const remainingDemand = need.required_quantity - need.fulfilled_quantity - reservedDemand;

      if (qty > remainingDemand) {
        return sendJson(res, 400, { 
          error: `Dispatch quantity (${qty}) exceeds remaining unmet demand (${remainingDemand})` 
        });
      }

      // Deduct stock immediately (unreserved stock model)
      inv.stock -= qty;

      // Invariant: Status must ALWAYS be forced to Pending on creation
      const newDispatch = {
        id: newId,
        camp_id: String(camp_id),
        need_id: String(need_id),
        quantity: qty,
        status: 'Pending'
      };

      collection.push(newDispatch);
      await writeDBSafe(db);
      return sendJson(res, 201, newDispatch);
    }

    // --- DONATIONS CREATION ---
    if (collectionName === 'donations') {
      const { type, amount_or_quantity, item_id, category } = body;
      const val = Number(amount_or_quantity);
      if (!type || (type !== 'Cash' && type !== 'In-Kind')) {
        return sendJson(res, 400, { error: 'Type must be Cash or In-Kind' });
      }
      if (!Number.isFinite(val) || val <= 0) {
        return sendJson(res, 400, { error: 'Amount or quantity must be a finite positive number' });
      }
      if (!category || typeof category !== 'string' || !category.trim()) {
        return sendJson(res, 400, { error: 'Category is required' });
      }

      let referencedItemId = null;
      if (type === 'In-Kind') {
        if (!item_id) {
          return sendJson(res, 400, { error: 'In-Kind donations require a valid inventory item_id' });
        }
        const inv = (db.inventory || []).find(i => String(i.id) === String(item_id));
        if (!inv) {
          return sendJson(res, 404, { error: 'Inventory item not found for In-Kind donation' });
        }
        inv.stock += val;
        referencedItemId = String(item_id);
      }

      const newDonation = {
        id: newId,
        type,
        amount_or_quantity: val,
        item_id: referencedItemId,
        category: category.trim()
      };
      collection.push(newDonation);
      await writeDBSafe(db);
      return sendJson(res, 201, newDonation);
    }

    // --- VOLUNTEERS CREATION ---
    if (collectionName === 'volunteers') {
      const { name, skill, camp_id } = body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return sendJson(res, 400, { error: 'Volunteer full name is required' });
      }
      const validSkills = ['Medical', 'Logistics', 'Cooking', 'Driving', 'Counselling'];
      if (!skill || !validSkills.includes(skill)) {
        return sendJson(res, 400, { error: 'Skill must be one of Medical, Logistics, Cooking, Driving, or Counselling' });
      }

      let assignedCampId = null;
      if (camp_id && String(camp_id).trim() !== '') {
        const camp = (db.camps || []).find(c => String(c.id) === String(camp_id));
        if (!camp) {
          return sendJson(res, 404, { error: 'Assigned camp does not exist' });
        }
        if (camp.status === 'Closed') {
          return sendJson(res, 400, { error: 'Cannot assign a volunteer to a Closed camp.' });
        }
        assignedCampId = String(camp_id);
      }

      const newVolunteer = {
        id: newId,
        name: name.trim(),
        skill,
        camp_id: assignedCampId
      };
      collection.push(newVolunteer);
      await writeDBSafe(db);
      return sendJson(res, 201, newVolunteer);
    }

    // Fallback standard creation
    const newItem = { ...body, id: newId };
    collection.push(newItem);
    await writeDBSafe(db);
    return sendJson(res, 201, newItem);
  }

  // -------------------------------------------------------------
  // 4. PATCH / PUT Item (Mutation with Hardened Invariants)
  // -------------------------------------------------------------
  if (id && (method === 'PATCH' || method === 'PUT')) {
    let body;
    try {
      body = await parseBody(req);
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }

    const index = collection.findIndex(x => String(x.id) === String(id));
    if (index === -1) {
      return sendJson(res, 404, { error: `Item with id ${id} not found in ${collectionName}` });
    }

    const currentItem = collection[index];

    // --- DISPATCH WORKFLOW TRANSITIONS (Priority 1) ---
    if (collectionName === 'dispatches') {
      // Reject any attempts to mutate immutable dispatch properties
      if (body.camp_id !== undefined && String(body.camp_id) !== String(currentItem.camp_id)) {
        return sendJson(res, 400, { error: 'Dispatch camp_id cannot be modified after creation' });
      }
      if (body.need_id !== undefined && String(body.need_id) !== String(currentItem.need_id)) {
        return sendJson(res, 400, { error: 'Dispatch need_id cannot be modified after creation' });
      }
      if (body.quantity !== undefined && Number(body.quantity) !== Number(currentItem.quantity)) {
        return sendJson(res, 400, { error: 'Dispatch quantity cannot be modified after creation' });
      }
      if (body.id !== undefined && String(body.id) !== String(currentItem.id)) {
        return sendJson(res, 400, { error: 'Dispatch ID cannot be changed' });
      }

      if (body.status !== undefined) {
        const transition = validateDispatchTransition(currentItem.status, body.status);
        if (!transition.valid) {
          return sendJson(res, 400, { error: transition.error });
        }

        // Idempotent no-op
        if (transition.isNoOp) {
          return sendJson(res, 200, currentItem);
        }

        const need = (db.needs || []).find(n => String(n.id) === String(currentItem.need_id));
        if (!need) {
          return sendJson(res, 400, { error: 'Associated need not found for dispatch' });
        }

        const inv = (db.inventory || []).find(i => String(i.id) === String(need.inventory_item_id));
        if (!inv) {
          return sendJson(res, 400, { error: 'Associated inventory item not found for dispatch' });
        }

        // Delivery Transition (In Transit -> Delivered)
        if (body.status === 'Delivered') {
          // Increase fulfilled_quantity exactly once
          need.fulfilled_quantity += currentItem.quantity;
          currentItem.status = 'Delivered';
        }

        // Cancellation Transition (Pending -> Cancelled or In Transit -> Cancelled)
        else if (body.status === 'Cancelled') {
          // Restore stock exactly once
          inv.stock += currentItem.quantity;
          currentItem.status = 'Cancelled';
        }

        // En route Transition (Pending -> In Transit)
        else if (body.status === 'In Transit') {
          currentItem.status = 'In Transit';
        }

        await writeDBSafe(db);
        return sendJson(res, 200, currentItem);
      }

      return sendJson(res, 200, currentItem);
    }

    // --- NEEDS MUTATION SAFEGUARDS (Priority 1) ---
    if (collectionName === 'needs') {
      // 1. Fulfilment is strictly read-only
      if (body.fulfilled_quantity !== undefined && Number(body.fulfilled_quantity) !== Number(currentItem.fulfilled_quantity)) {
        return sendJson(res, 400, { error: 'fulfilled_quantity is read-only and managed exclusively through verified dispatches' });
      }

      // 2. Validate required_quantity invariant
      if (body.required_quantity !== undefined) {
        const newReq = Number(body.required_quantity);
        if (!Number.isFinite(newReq) || newReq <= 0) {
          return sendJson(res, 400, { error: 'Required quantity must be a finite positive number' });
        }

        const activeDispatches = (db.dispatches || []).filter(
          d => String(d.need_id) === String(id) && (d.status === 'Pending' || d.status === 'In Transit')
        );
        const activeReservedDemand = activeDispatches.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
        const minRequired = currentItem.fulfilled_quantity + activeReservedDemand;

        if (newReq < minRequired) {
          return sendJson(res, 400, { 
            error: `Cannot reduce required quantity below fulfilled plus active reserved demand (${minRequired})` 
          });
        }
        currentItem.required_quantity = newReq;
      }

      if (body.camp_id !== undefined) {
        const camp = (db.camps || []).find(c => String(c.id) === String(body.camp_id));
        if (!camp) return sendJson(res, 404, { error: 'Referenced camp not found' });
        currentItem.camp_id = String(body.camp_id);
      }

      if (body.inventory_item_id !== undefined) {
        const inv = (db.inventory || []).find(i => String(i.id) === String(body.inventory_item_id));
        if (!inv) return sendJson(res, 404, { error: 'Referenced inventory item not found' });
        currentItem.inventory_item_id = String(body.inventory_item_id);
      }

      if (body.priority !== undefined) {
        const validPriorities = ['High', 'Medium', 'Low'];
        if (!validPriorities.includes(body.priority)) {
          return sendJson(res, 400, { error: 'Priority must be High, Medium, or Low' });
        }
        currentItem.priority = body.priority;
      }

      await writeDBSafe(db);
      return sendJson(res, 200, currentItem);
    }

    // --- CAMPS MUTATION & CLOSURE RULES ---
    if (collectionName === 'camps') {
      const capNum = body.capacity !== undefined ? Number(body.capacity) : currentItem.capacity;
      const famNum = body.current_families !== undefined ? Number(body.current_families) : currentItem.current_families;

      if (!Number.isFinite(capNum) || capNum <= 0) {
        return sendJson(res, 400, { error: 'Capacity must be a finite positive number' });
      }
      if (!Number.isFinite(famNum) || famNum < 0) {
        return sendJson(res, 400, { error: 'Current families cannot be negative' });
      }
      if (famNum > capNum) {
        return sendJson(res, 400, { error: `Current families (${famNum}) cannot exceed total camp capacity (${capNum})` });
      }

      if (body.name !== undefined) {
        if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
          return sendJson(res, 400, { error: 'Camp name cannot be empty' });
        }
        currentItem.name = body.name.trim();
      }

      if (body.district !== undefined) {
        if (!body.district || typeof body.district !== 'string' || !body.district.trim()) {
          return sendJson(res, 400, { error: 'District cannot be empty' });
        }
        currentItem.district = body.district.trim();
      }

      // Check Camp Closure Policy
      if (body.status === 'Closed') {
        const hasAssignedVolunteers = (db.volunteers || []).some(v => String(v.camp_id) === String(id));
        if (hasAssignedVolunteers) {
          return sendJson(res, 400, { 
            error: 'Cannot close camp while volunteers are assigned to it. Please reassign or unassign volunteers first.' 
          });
        }
        currentItem.status = 'Closed';
      } else if (body.status === 'Active' || body.status === 'Full') {
        // Explicit reopening or status change
        currentItem.status = famNum >= capNum ? 'Full' : 'Active';
      } else if (body.status === undefined) {
        // Automatic status update if not intentionally closed
        if (currentItem.status !== 'Closed') {
          currentItem.status = famNum >= capNum ? 'Full' : 'Active';
        }
      }

      currentItem.capacity = capNum;
      currentItem.current_families = famNum;

      await writeDBSafe(db);
      return sendJson(res, 200, currentItem);
    }

    // --- INVENTORY MUTATION ---
    if (collectionName === 'inventory') {
      if (body.stock !== undefined) {
        const s = Number(body.stock);
        if (!Number.isFinite(s) || s < 0) {
          return sendJson(res, 400, { error: 'Stock cannot be negative' });
        }
        currentItem.stock = s;
      }
      if (body.reorder_level !== undefined) {
        const r = Number(body.reorder_level);
        if (!Number.isFinite(r) || r < 0) {
          return sendJson(res, 400, { error: 'Reorder level cannot be negative' });
        }
        currentItem.reorder_level = r;
      }
      if (body.name !== undefined) {
        if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
          return sendJson(res, 400, { error: 'Item name cannot be empty' });
        }
        currentItem.name = body.name.trim();
      }
      if (body.category !== undefined) {
        if (!body.category || typeof body.category !== 'string' || !body.category.trim()) {
          return sendJson(res, 400, { error: 'Category cannot be empty' });
        }
        currentItem.category = body.category.trim();
      }
      if (body.unit !== undefined) {
        if (!body.unit || typeof body.unit !== 'string' || !body.unit.trim()) {
          return sendJson(res, 400, { error: 'Unit cannot be empty' });
        }
        currentItem.unit = body.unit.trim();
      }

      await writeDBSafe(db);
      return sendJson(res, 200, currentItem);
    }

    // --- DONATIONS MUTATION & STOCK RECONCILIATION ---
    if (collectionName === 'donations') {
      if (currentItem.type === 'In-Kind') {
        const oldInv = (db.inventory || []).find(i => String(i.id) === String(currentItem.item_id));
        const oldQty = Number(currentItem.amount_or_quantity);
        const newItemId = body.item_id ? String(body.item_id) : String(currentItem.item_id);
        const newQty = body.amount_or_quantity !== undefined ? Number(body.amount_or_quantity) : oldQty;

        if (!Number.isFinite(newQty) || newQty <= 0) {
          return sendJson(res, 400, { error: 'Quantity must be a finite positive number' });
        }

        if (newItemId === String(currentItem.item_id)) {
          const diff = newQty - oldQty;
          if (oldInv) {
            if (diff < 0 && (oldInv.stock + diff < 0)) {
              return sendJson(res, 400, { 
                error: `Cannot reduce donation quantity below available inventory stock (${oldInv.stock} available)` 
              });
            }
            oldInv.stock += diff;
          }
        } else {
          // Changed item
          const newInv = (db.inventory || []).find(i => String(i.id) === String(newItemId));
          if (!newInv) return sendJson(res, 404, { error: 'New inventory item not found' });
          if (oldInv) {
            if (oldInv.stock - oldQty < 0) {
              return sendJson(res, 400, { 
                error: `Cannot change donation item because previous donated stock has already been dispatched. Available: ${oldInv.stock}` 
              });
            }
            oldInv.stock -= oldQty;
          }
          newInv.stock += newQty;
          currentItem.item_id = newItemId;
        }

        currentItem.amount_or_quantity = newQty;
      } else {
        // Cash donation
        if (body.amount_or_quantity !== undefined) {
          const val = Number(body.amount_or_quantity);
          if (!Number.isFinite(val) || val <= 0) {
            return sendJson(res, 400, { error: 'Cash donation amount must be a finite positive number' });
          }
          currentItem.amount_or_quantity = val;
        }
      }

      if (body.category !== undefined) {
        if (!body.category || typeof body.category !== 'string' || !body.category.trim()) {
          return sendJson(res, 400, { error: 'Category cannot be empty' });
        }
        currentItem.category = body.category.trim();
      }

      await writeDBSafe(db);
      return sendJson(res, 200, currentItem);
    }

    // --- VOLUNTEERS MUTATION ---
    if (collectionName === 'volunteers') {
      if (body.name !== undefined) {
        if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
          return sendJson(res, 400, { error: 'Volunteer name cannot be empty' });
        }
        currentItem.name = body.name.trim();
      }
      if (body.skill !== undefined) {
        const validSkills = ['Medical', 'Logistics', 'Cooking', 'Driving', 'Counselling'];
        if (!validSkills.includes(body.skill)) {
          return sendJson(res, 400, { error: 'Skill must be one of Medical, Logistics, Cooking, Driving, or Counselling' });
        }
        currentItem.skill = body.skill;
      }
      if (body.camp_id !== undefined) {
        if (body.camp_id && String(body.camp_id).trim() !== '') {
          const camp = (db.camps || []).find(c => String(c.id) === String(body.camp_id));
          if (!camp) return sendJson(res, 404, { error: 'Assigned camp does not exist' });
          if (camp.status === 'Closed') {
            return sendJson(res, 400, { error: 'Cannot assign a volunteer to a Closed camp.' });
          }
          currentItem.camp_id = String(body.camp_id);
        } else {
          currentItem.camp_id = null;
        }
      }

      await writeDBSafe(db);
      return sendJson(res, 200, currentItem);
    }

    // Fallback item mutation
    Object.assign(currentItem, body, { id: currentItem.id });
    await writeDBSafe(db);
    return sendJson(res, 200, currentItem);
  }

  // -------------------------------------------------------------
  // 5. DELETE Item (Referential Integrity Safeguards)
  // -------------------------------------------------------------
  if (id && method === 'DELETE') {
    const index = collection.findIndex(x => String(x.id) === String(id));
    if (index === -1) {
      return sendJson(res, 404, { error: `Item with id ${id} not found in ${collectionName}` });
    }

    const itemToDelete = collection[index];

    // INVENTORY REFERENTIAL INTEGRITY (Section 4.1)
    if (collectionName === 'inventory') {
      const hasNeeds = (db.needs || []).some(n => String(n.inventory_item_id) === String(id));
      if (hasNeeds) {
        return sendJson(res, 400, { 
          error: 'Cannot delete inventory item while linked camp needs exist. Resolve dependent needs first.' 
        });
      }
      const hasDonations = (db.donations || []).some(d => d.type === 'In-Kind' && String(d.item_id) === String(id));
      if (hasDonations) {
        return sendJson(res, 400, { 
          error: 'Cannot delete inventory item while linked in-kind donation records exist.' 
        });
      }
    }

    // NEED REFERENTIAL INTEGRITY (Section 4.2)
    if (collectionName === 'needs') {
      const hasDispatches = (db.dispatches || []).some(d => String(d.need_id) === String(id));
      if (hasDispatches) {
        return sendJson(res, 400, { 
          error: 'Cannot delete need while linked dispatches exist. Deleting this need would corrupt dispatch reservations and delivery history.' 
        });
      }
    }

    // CAMP REFERENTIAL INTEGRITY (Section 4.3)
    if (collectionName === 'camps') {
      const hasNeeds = (db.needs || []).some(n => String(n.camp_id) === String(id));
      if (hasNeeds) {
        return sendJson(res, 400, { 
          error: 'Cannot delete camp with active recorded needs. Resolve or reassign needs first.' 
        });
      }
      const hasDispatches = (db.dispatches || []).some(d => String(d.camp_id) === String(id));
      if (hasDispatches) {
        return sendJson(res, 400, { 
          error: 'Cannot delete camp with linked dispatches.' 
        });
      }
      const hasVolunteers = (db.volunteers || []).some(v => String(v.camp_id) === String(id));
      if (hasVolunteers) {
        return sendJson(res, 400, { 
          error: 'Cannot delete camp with deployed volunteers. Please unassign volunteers first.' 
        });
      }
    }

    // IN-KIND DONATION STOCK REVERSAL SAFEGUARD (Section 8)
    if (collectionName === 'donations' && itemToDelete.type === 'In-Kind') {
      const inv = (db.inventory || []).find(i => String(i.id) === String(itemToDelete.item_id));
      if (inv) {
        const donationQty = Number(itemToDelete.amount_or_quantity) || 0;
        if (inv.stock < donationQty) {
          return sendJson(res, 400, { 
            error: `Cannot delete in-kind donation because donated inventory stock has already been dispatched or consumed. Available stock (${inv.stock}) is less than donation contribution (${donationQty}).` 
          });
        }
        inv.stock -= donationQty;
      }
    }

    const [removed] = collection.splice(index, 1);
    await writeDBSafe(db);
    return sendJson(res, 200, { message: 'Item deleted', item: removed });
  }

  return sendJson(res, 404, { error: 'Not found', path: pathname });
});

// Auto-start listener if executed directly
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  server.listen(PORT, () => {
    console.log(`ReliefHub REST API running at http://localhost:${PORT}`);
    console.log(`Endpoints available:`);
    console.log(`  - /camps`);
    console.log(`  - /inventory`);
    console.log(`  - /needs`);
    console.log(`  - /dispatches`);
    console.log(`  - /donations`);
    console.log(`  - /volunteers`);
  });
}
