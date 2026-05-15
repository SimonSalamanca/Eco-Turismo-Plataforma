-- Migration: 005_reservations.sql
-- Creates reservations table

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL,
  tourist_id UUID NOT NULL,
  host_id UUID NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guests_count INTEGER NOT NULL DEFAULT 1,
  subtotal INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  cancellation_reason VARCHAR(500),
  stripe_payment_intent_id VARCHAR(255),
  confirmation_code VARCHAR(10) NOT NULL UNIQUE,
  version INTEGER DEFAULT 1,
  cancelled_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reservations_tourist_status ON reservations(tourist_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_host_status ON reservations(host_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_listing_id ON reservations(listing_id);
CREATE INDEX IF NOT EXISTS idx_reservations_confirmation_code ON reservations(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in_date, check_out_date);

-- Migration: 005b_reservations_fk.sql
-- Adds foreign key constraints for reservations table

ALTER TABLE reservations DROP CONSTRAINT IF EXISTS fk_reservations_listing;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS fk_reservations_tourist;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS fk_reservations_host;

ALTER TABLE reservations ADD CONSTRAINT fk_reservations_listing
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE;

ALTER TABLE reservations ADD CONSTRAINT fk_reservations_tourist
  FOREIGN KEY (tourist_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE reservations ADD CONSTRAINT fk_reservations_host
  FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE RESTRICT;

-- Migration: 005c_availability_fk.sql
-- Adds foreign key constraints for availability table

ALTER TABLE availability DROP CONSTRAINT IF EXISTS fk_availability_listing;
ALTER TABLE availability DROP CONSTRAINT IF EXISTS fk_availability_reservation;

ALTER TABLE availability ADD CONSTRAINT fk_availability_listing
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE;

ALTER TABLE availability ADD CONSTRAINT fk_availability_reservation
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL;