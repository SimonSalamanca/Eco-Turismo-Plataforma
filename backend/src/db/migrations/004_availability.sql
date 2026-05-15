-- Migration: 004_availability.sql
-- Creates availability table

CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'blocked', 'special_price')),
  special_price INTEGER,
  reservation_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(listing_id, date)
);

CREATE INDEX IF NOT EXISTS idx_availability_listing_date ON availability(listing_id, date);
CREATE INDEX IF NOT EXISTS idx_availability_listing_status ON availability(listing_id, status);