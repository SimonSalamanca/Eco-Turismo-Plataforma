-- =====================================================
-- CREAR USUARIO Y BASE DE DATOS (ejecutar primero)
-- =====================================================
CREATE USER ecoturismo WITH PASSWORD 'ecoturismo123';
CREATE DATABASE ecoturismo OWNER ecoturismo;

-- Conectar a la base de datos
\c ecoturismo

-- =====================================================
-- TABLA: USERS
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "reservation_confirmation": true, "reservation_cancellation": true, "new_review": true, "payment_receipts": true}',
    token_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: HOST_PROFILES
-- =====================================================
CREATE TABLE host_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_host_profiles_user_id ON host_profiles(user_id);

-- =====================================================
-- TABLA: LISTINGS
-- =====================================================
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_listings_department_municipality ON listings(department, municipality);
CREATE INDEX idx_listings_lat_lon ON listings(latitude, longitude);
CREATE INDEX idx_listings_host_id ON listings(host_id);
CREATE INDEX idx_listings_status_type ON listings(status, type);

-- =====================================================
-- TABLA: RESERVATIONS
-- =====================================================
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    tourist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    guests_count INTEGER NOT NULL DEFAULT 1,
    subtotal INTEGER NOT NULL,
    platform_fee INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    cancellation_reason VARCHAR(500),
    cancelled_by VARCHAR(10) CHECK (cancelled_by IN ('tourist', 'host', 'admin')),
    stripe_payment_intent_id VARCHAR(255),
    confirmation_code VARCHAR(10) NOT NULL UNIQUE,
    version INTEGER DEFAULT 1,
    cancelled_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reservations_tourist_status ON reservations(tourist_id, status);
CREATE INDEX idx_reservations_host_status ON reservations(host_id, status);
CREATE INDEX idx_reservations_listing_id ON reservations(listing_id);
CREATE INDEX idx_reservations_confirmation_code ON reservations(confirmation_code);

-- =====================================================
-- TABLA: AVAILABILITY (se crea DESPUES de reservations)
-- =====================================================
CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'blocked', 'special_price')),
    special_price INTEGER,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_availability_listing_date ON availability(listing_id, date);
CREATE INDEX idx_availability_listing_status ON availability(listing_id, status);

-- =====================================================
-- TABLA: PAYMENTS
-- =====================================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    tourist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    amount INTEGER NOT NULL,
    platform_commission INTEGER NOT NULL,
    host_payout INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'COP',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    receipt_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX idx_payments_tourist_id ON payments(tourist_id);

-- =====================================================
-- TABLA: REVIEWS
-- =====================================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    tourist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment VARCHAR(500),
    host_response VARCHAR(500),
    host_responded_at TIMESTAMP,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_listing_id ON reviews(listing_id);
CREATE INDEX idx_reviews_tourist_id ON reviews(tourist_id);

-- =====================================================
-- TABLA: SUBSCRIPTIONS
-- =====================================================
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(20) DEFAULT 'basic' CHECK (plan IN ('basic', 'premium', 'pro')),
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
    status VARCHAR(20) DEFAULT 'trialing' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
    stripe_subscription_id VARCHAR(255),
    stripe_price_id VARCHAR(255),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_host_status ON subscriptions(host_id, status);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- =====================================================
-- TABLA: NOTIFICATIONS
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT,
    sent_at TIMESTAMP,
    error_message VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_type ON notifications(user_id, type);

-- =====================================================
-- TABLA: AUDIT_LOGS
-- =====================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_admin_created ON audit_logs(admin_id, created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- =====================================================
-- TABLA: CONTENT_REPORTS
-- =====================================================
CREATE TABLE content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(10) NOT NULL CHECK (content_type IN ('listing', 'review')),
    content_id UUID NOT NULL,
    reason VARCHAR(500) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'edited', 'removed')),
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_reports_content ON content_reports(content_type, content_id);
CREATE INDEX idx_content_reports_status ON content_reports(status);

-- =====================================================
-- TABLA: FAVORITES
-- =====================================================
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tourist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tourist_id, listing_id)
);

CREATE INDEX idx_favorites_tourist_id ON favorites(tourist_id);
CREATE INDEX idx_favorites_listing_id ON favorites(listing_id);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ecoturismo;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ecoturismo;