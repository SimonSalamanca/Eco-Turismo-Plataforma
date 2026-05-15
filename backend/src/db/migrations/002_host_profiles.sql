-- Migration: 002_host_profiles.sql
-- Creates host_profiles table

CREATE TABLE IF NOT EXISTS host_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  business_type VARCHAR(20) DEFAULT 'accommodation' CHECK (business_type IN ('accommodation', 'activity', 'both')),
  department VARCHAR(100),
  municipality VARCHAR(100),
  description VARCHAR(500),
  bank_info_encrypted TEXT,
  subscription_plan VARCHAR(20) DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'premium', 'pro')),
  subscription_status VARCHAR(20) DEFAULT 'trialing' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing')),
  subscription_expires_at TIMESTAMP,
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_host_profiles_user_id ON host_profiles(user_id);