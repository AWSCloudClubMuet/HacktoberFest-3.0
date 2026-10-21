CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE CHECK (username = lower(username)),
  name TEXT NOT NULL CHECK (length(trim(name)) >= 3),
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'system_administrator',
    'relief_coordinator',
    'warehouse_manager',
    'field_volunteer',
    'finance_audit_officer'
  )),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_sessions_expiry_idx ON auth_sessions(expires_at);

CREATE TABLE IF NOT EXISTS camps (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  families INTEGER NOT NULL DEFAULT 0 CHECK (families >= 0 AND families <= capacity),
  status TEXT NOT NULL CHECK (status IN ('Active', 'Full', 'Closed')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  accessibility_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (accessibility_status IN ('accessible', 'limited', 'inaccessible', 'unknown')),
  last_assessed_at TIMESTAMPTZ,
  hazard_information JSONB,
  hazard_source TEXT,
  hazard_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((latitude IS NULL) = (longitude IS NULL)),
  CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  CHECK (status = 'Closed' OR (status = 'Full' AND families = capacity)
      OR (status = 'Active' AND families < capacity))
);
CREATE INDEX IF NOT EXISTS camps_district_status_idx ON camps(district, status);
CREATE UNIQUE INDEX IF NOT EXISTS camps_name_district_unique_idx
  ON camps(district, lower(name));

CREATE OR REPLACE FUNCTION reliefhub_sync_camp_status() RETURNS trigger AS $$
BEGIN
  IF NEW.status <> 'Closed' THEN
    IF NEW.families >= NEW.capacity THEN
      NEW.status := 'Full';
    ELSE
      NEW.status := 'Active';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS camps_sync_status ON camps;
CREATE TRIGGER camps_sync_status
  BEFORE INSERT OR UPDATE OF status, capacity, families ON camps
  FOR EACH ROW EXECUTE FUNCTION reliefhub_sync_camp_status();

CREATE TABLE IF NOT EXISTS inventory_items (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  on_hand BIGINT NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
  reorder_level BIGINT NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_batches (
  id BIGSERIAL PRIMARY KEY,
  item_id BIGINT NOT NULL REFERENCES inventory_items(id),
  batch_number TEXT,
  expiry_date DATE,
  warehouse_location TEXT,
  quantity_on_hand BIGINT NOT NULL CHECK (quantity_on_hand >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inventory_batches_expiry_idx ON inventory_batches(expiry_date);

CREATE TABLE IF NOT EXISTS camp_needs (
  id BIGSERIAL PRIMARY KEY,
  camp_id BIGINT NOT NULL REFERENCES camps(id),
  item_id BIGINT NOT NULL REFERENCES inventory_items(id),
  required BIGINT NOT NULL CHECK (required > 0),
  fulfilled BIGINT NOT NULL DEFAULT 0 CHECK (fulfilled >= 0 AND fulfilled <= required),
  priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(camp_id, item_id)
);
CREATE INDEX IF NOT EXISTS camp_needs_priority_idx ON camp_needs(priority, camp_id);

CREATE TABLE IF NOT EXISTS volunteers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  skill TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  camp_id BIGINT REFERENCES camps(id),
  user_id BIGINT UNIQUE REFERENCES users(id),
  service_hours NUMERIC(8, 2) NOT NULL DEFAULT 0 CHECK (service_hours >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donations (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('Cash', 'In-Kind')),
  donor TEXT NOT NULL,
  amount BIGINT NOT NULL DEFAULT 0 CHECK (amount >= 0),
  item_id BIGINT REFERENCES inventory_items(id),
  quantity BIGINT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  category TEXT NOT NULL,
  donation_date DATE NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((type = 'Cash' AND amount > 0 AND item_id IS NULL AND quantity = 0)
      OR (type = 'In-Kind' AND amount = 0 AND item_id IS NOT NULL AND quantity > 0))
);

CREATE TABLE IF NOT EXISTS dispatches (
  id BIGSERIAL PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  need_id BIGINT NOT NULL REFERENCES camp_needs(id),
  camp_id BIGINT NOT NULL REFERENCES camps(id),
  item_id BIGINT NOT NULL REFERENCES inventory_items(id),
  quantity BIGINT NOT NULL CHECK (quantity > 0),
  received_quantity BIGINT NOT NULL DEFAULT 0
    CHECK (received_quantity >= 0 AND received_quantity <= quantity),
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_transit', 'delivered', 'cancelled')),
  source_warehouse TEXT NOT NULL,
  driver TEXT NOT NULL,
  vehicle TEXT,
  departure_at TIMESTAMPTZ,
  estimated_arrival TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  recipient_confirmation TEXT,
  evidence_reference TEXT,
  discrepancy_reason TEXT,
  created_by BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dispatches_need_status_idx ON dispatches(need_id, status);
CREATE INDEX IF NOT EXISTS dispatches_status_eta_idx ON dispatches(status, estimated_arrival);

CREATE TABLE IF NOT EXISTS dispatch_events (
  id BIGSERIAL PRIMARY KEY,
  dispatch_id BIGINT NOT NULL REFERENCES dispatches(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_id BIGINT NOT NULL REFERENCES users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id BIGSERIAL PRIMARY KEY,
  item_id BIGINT NOT NULL REFERENCES inventory_items(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'opening_balance', 'donation_receipt', 'reservation', 'reservation_release',
    'dispatch_delivery', 'damage', 'expiry', 'missing', 'return', 'adjustment'
  )),
  on_hand_delta BIGINT NOT NULL DEFAULT 0,
  reserved_delta BIGINT NOT NULL DEFAULT 0,
  reference TEXT,
  reason TEXT,
  actor_id BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (on_hand_delta <> 0 OR reserved_delta <> 0)
);
CREATE INDEX IF NOT EXISTS inventory_movements_item_time_idx
  ON inventory_movements(item_id, created_at DESC);

CREATE TABLE IF NOT EXISTS idempotent_operations (
  actor_id BIGINT NOT NULL REFERENCES users(id),
  idempotency_key TEXT NOT NULL,
  operation TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(actor_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id BIGINT REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx
  ON audit_logs(entity_type, entity_id, created_at DESC);

CREATE OR REPLACE VIEW inventory_stock_position AS
SELECT i.id AS item_id,
       i.on_hand,
       COALESCE(SUM(d.quantity) FILTER (WHERE d.status IN ('pending', 'in_transit')), 0)::BIGINT AS reserved,
       i.on_hand - COALESCE(SUM(d.quantity) FILTER (WHERE d.status IN ('pending', 'in_transit')), 0)::BIGINT AS available
FROM inventory_items i
LEFT JOIN dispatches d ON d.item_id = i.id
GROUP BY i.id, i.on_hand;
