CREATE DATABASE IF NOT EXISTS reliefhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE reliefhub;

CREATE TABLE IF NOT EXISTS camps (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  district VARCHAR(120) NOT NULL,
  capacity INT UNSIGNED NOT NULL,
  current_families INT UNSIGNED NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL,
  INDEX idx_camps_district (district),
  INDEX idx_camps_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS inventory (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit VARCHAR(60) NOT NULL,
  stock DECIMAL(14,2) NOT NULL DEFAULT 0,
  reorder_level DECIMAL(14,2) NOT NULL DEFAULT 0,
  INDEX idx_inventory_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS needs (
  id VARCHAR(80) PRIMARY KEY,
  camp_id VARCHAR(80) NOT NULL,
  inventory_item_id VARCHAR(80) NOT NULL,
  required_quantity DECIMAL(14,2) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  fulfilled_quantity DECIMAL(14,2) NOT NULL DEFAULT 0,
  INDEX idx_needs_camp (camp_id),
  INDEX idx_needs_item (inventory_item_id),
  INDEX idx_needs_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dispatches (
  id VARCHAR(80) PRIMARY KEY,
  camp_id VARCHAR(80) NOT NULL,
  need_id VARCHAR(80) NOT NULL,
  quantity DECIMAL(14,2) NOT NULL,
  status VARCHAR(32) NOT NULL,
  INDEX idx_dispatches_need (need_id),
  INDEX idx_dispatches_camp (camp_id),
  INDEX idx_dispatches_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS donations (
  id VARCHAR(80) PRIMARY KEY,
  type VARCHAR(32) NOT NULL,
  amount_or_quantity DECIMAL(14,2) NOT NULL,
  item_id VARCHAR(80) NULL,
  category VARCHAR(100) NOT NULL,
  INDEX idx_donations_type (type),
  INDEX idx_donations_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS volunteers (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  skill VARCHAR(100) NOT NULL,
  camp_id VARCHAR(80) NULL,
  INDEX idx_volunteers_camp (camp_id),
  INDEX idx_volunteers_skill (skill)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
