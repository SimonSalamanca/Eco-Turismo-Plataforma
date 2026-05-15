-- Migration: 003_listings.sql
-- Creates listings table

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('accommodation', 'activity')),
  description TEXT,
  price_per_unit INTEGER NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  categories TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted')),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address VARCHAR(500),
  department VARCHAR(100),
  municipality VARCHAR(100),
  photos JSONB DEFAULT '[]',
  average_rating DECIMAL(2, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  badge VARCHAR(20) DEFAULT 'none' CHECK (badge IN ('none', 'premium', 'pro')),
  search_boost INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(department, municipality);
CREATE INDEX IF NOT EXISTS idx_listings_coords ON listings(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_listings_host_id ON listings(host_id);
CREATE INDEX IF NOT EXISTS idx_listings_status_type ON listings(status, type);
CREATE INDEX IF NOT EXISTS idx_listings_department ON listings(department);