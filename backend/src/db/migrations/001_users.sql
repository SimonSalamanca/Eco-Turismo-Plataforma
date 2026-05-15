-- Migration: 001_users.sql
-- Creates users table

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  profile_photo_url VARCHAR(500),
  role VARCHAR(20) DEFAULT 'tourist' CHECK (role IN ('tourist', 'host', 'admin', 'local_business')),
  status VARCHAR(30) DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'active', 'suspended')),
  email_verified_at TIMESTAMP,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  notification_preferences JSONB DEFAULT '{"email":true,"sms":false,"reservation_confirmation":true,"reservation_cancellation":true,"new_review":true,"payment_receipts":true}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);