-- ============================================================================
-- HomeServe – Home Services Booking SaaS Platform
-- Database Schema (MySQL 8.0+)
-- Total Tables: 28 (3NF Normalized, InnoDB, utf8mb4_unicode_ci)
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS homeserve_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE homeserve_db;

-- ----------------------------------------------------------------------------
-- 1. users
-- Core identity table for all 4 RBAC roles: admin, customer, provider, technician
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'customer', 'provider', 'technician') NOT NULL DEFAULT 'customer',
    avatar_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_phone (phone),
    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. customers
-- Extended profile for customers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    loyalty_points INT NOT NULL DEFAULT 0,
    preferred_language VARCHAR(30) NOT NULL DEFAULT 'en',
    emergency_contact VARCHAR(30) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_customers_user_id (user_id),
    CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. service_providers
-- Extended profile, KYC verification, ratings, and commission settings for providers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_providers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    business_name VARCHAR(200) NOT NULL,
    business_description TEXT NULL,
    experience_years INT NOT NULL DEFAULT 0,
    verification_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    id_document_url VARCHAR(500) NULL,
    license_number VARCHAR(100) NULL,
    rejection_reason TEXT NULL,
    avg_rating FLOAT NOT NULL DEFAULT 0.0,
    total_reviews INT NOT NULL DEFAULT 0,
    total_completed_jobs INT NOT NULL DEFAULT 0,
    commission_rate FLOAT NOT NULL DEFAULT 15.0,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_service_providers_user_id (user_id),
    INDEX idx_providers_verification (verification_status),
    INDEX idx_providers_available (is_available),
    INDEX idx_providers_rating (avg_rating),
    CONSTRAINT fk_service_providers_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. technicians
-- Field technicians managed by a service provider
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS technicians (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    provider_id INT NOT NULL,
    specialization VARCHAR(150) NOT NULL,
    experience_years INT NOT NULL DEFAULT 0,
    id_proof_url VARCHAR(500) NULL,
    availability_status ENUM('available', 'busy', 'offline') NOT NULL DEFAULT 'available',
    avg_rating FLOAT NOT NULL DEFAULT 0.0,
    total_jobs_completed INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_technicians_user_id (user_id),
    INDEX idx_technicians_provider (provider_id),
    INDEX idx_technicians_status (availability_status),
    CONSTRAINT fk_technicians_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_technicians_provider FOREIGN KEY (provider_id) REFERENCES service_providers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. addresses
-- Multi-address management for users with geospatial coordinates
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    label VARCHAR(50) NOT NULL DEFAULT 'Home',
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255) NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    latitude FLOAT NULL,
    longitude FLOAT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_addresses_user (user_id),
    INDEX idx_addresses_city_postal (city, postal_code),
    CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. service_categories
-- Hierarchical service catalog categories (supports parent_id for subcategories)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    description TEXT NULL,
    icon_name VARCHAR(100) NULL,
    image_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_service_categories_slug (slug),
    INDEX idx_categories_parent (parent_id),
    INDEX idx_categories_active_order (is_active, display_order),
    CONSTRAINT fk_service_categories_parent FOREIGN KEY (parent_id) REFERENCES service_categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. services
-- Individual bookable services under categories
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    short_description VARCHAR(500) NULL,
    description TEXT NULL,
    base_price FLOAT NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    image_url VARCHAR(500) NULL,
    inclusions_json JSON NULL,
    exclusions_json JSON NULL,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_services_slug (slug),
    INDEX idx_services_category (category_id),
    INDEX idx_services_featured_active (is_featured, is_active),
    INDEX idx_services_price (base_price),
    CONSTRAINT fk_services_category FOREIGN KEY (category_id) REFERENCES service_categories (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. provider_services
-- Mapping between service providers and services with custom pricing
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS provider_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    service_id INT NOT NULL,
    custom_price FLOAT NOT NULL,
    custom_duration_minutes INT NOT NULL DEFAULT 60,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_provider_service (provider_id, service_id),
    INDEX idx_provider_services_service (service_id),
    CONSTRAINT fk_provider_services_provider FOREIGN KEY (provider_id) REFERENCES service_providers (id) ON DELETE CASCADE,
    CONSTRAINT fk_provider_services_service FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. service_areas
-- Geographic coverage areas and radius for providers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_areas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    service_radius_km FLOAT NOT NULL DEFAULT 15.0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_service_areas_provider (provider_id),
    INDEX idx_service_areas_city_postal (city, postal_code),
    CONSTRAINT fk_service_areas_provider FOREIGN KEY (provider_id) REFERENCES service_providers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. availability_slots
-- Time slot inventory for providers with unique constraint to prevent double booking
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS availability_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_booked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_provider_slot (provider_id, slot_date, start_time),
    INDEX idx_slots_date_booked (slot_date, is_booked),
    CONSTRAINT fk_availability_slots_provider FOREIGN KEY (provider_id) REFERENCES service_providers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. bookings
-- Core booking lifecycle, financial breakdown, and status tracking
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_reference VARCHAR(50) NOT NULL,
    customer_id INT NOT NULL,
    provider_id INT NOT NULL,
    service_id INT NOT NULL,
    address_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(20) NOT NULL,
    status ENUM(
        'Pending',
        'Confirmed',
        'Provider Assigned',
        'In Progress',
        'Completed',
        'Cancelled',
        'Rejected'
    ) NOT NULL DEFAULT 'Pending',
    problem_description TEXT NULL,
    reference_image_url VARCHAR(500) NULL,
    base_amount FLOAT NOT NULL,
    discount_amount FLOAT NOT NULL DEFAULT 0.0,
    tax_amount FLOAT NOT NULL DEFAULT 0.0,
    total_amount FLOAT NOT NULL,
    commission_amount FLOAT NOT NULL DEFAULT 0.0,
    provider_earning_amount FLOAT NOT NULL DEFAULT 0.0,
    coupon_code VARCHAR(50) NULL,
    cancellation_reason TEXT NULL,
    cancelled_by_role VARCHAR(30) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_bookings_reference (booking_reference),
    INDEX idx_bookings_customer (customer_id),
    INDEX idx_bookings_provider (provider_id),
    INDEX idx_bookings_service (service_id),
    INDEX idx_bookings_status (status),
    INDEX idx_bookings_appointment (provider_id, appointment_date, appointment_time),
    CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_provider FOREIGN KEY (provider_id) REFERENCES service_providers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_service FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_address FOREIGN KEY (address_id) REFERENCES addresses (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. booking_assignments
-- Technician dispatch and field execution tracking for bookings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    technician_id INT NOT NULL,
    assigned_by_user_id INT NOT NULL,
    assignment_status ENUM(
        'Assigned',
        'Accepted',
        'Rejected',
        'Arrived',
        'In Progress',
        'Completed'
    ) NOT NULL DEFAULT 'Assigned',
    arrival_time DATETIME NULL,
    start_time DATETIME NULL,
    completion_time DATETIME NULL,
    completion_remarks TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_assignments_booking (booking_id),
    INDEX idx_assignments_technician (technician_id),
    INDEX idx_assignments_status (assignment_status),
    CONSTRAINT fk_booking_assignments_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_assignments_technician FOREIGN KEY (technician_id) REFERENCES technicians (id) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_assignments_assigned_by FOREIGN KEY (assigned_by_user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 13. booking_images
-- Reference, before-service, after-service, and issue photographic evidence
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    uploaded_by_user_id INT NOT NULL,
    image_type ENUM('reference', 'before', 'after', 'issue') NOT NULL DEFAULT 'reference',
    image_url VARCHAR(500) NOT NULL,
    caption VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_booking_images_booking (booking_id),
    CONSTRAINT fk_booking_images_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_images_user FOREIGN KEY (uploaded_by_user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 14. booking_status_history
-- Immutable audit trail of all booking state transitions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    old_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NOT NULL,
    changed_by_user_id INT NOT NULL,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status_history_booking (booking_id),
    CONSTRAINT fk_status_history_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT fk_status_history_user FOREIGN KEY (changed_by_user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 15. payments
-- Razorpay payment orders, signature verification, idempotency, and refunds
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    customer_id INT NOT NULL,
    razorpay_order_id VARCHAR(100) NOT NULL,
    razorpay_payment_id VARCHAR(100) NULL,
    razorpay_signature VARCHAR(255) NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'razorpay',
    payment_type ENUM('full', 'advance', 'remaining') NOT NULL DEFAULT 'full',
    amount FLOAT NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status ENUM('Pending', 'Paid', 'Failed', 'Refunded') NOT NULL DEFAULT 'Pending',
    idempotency_key VARCHAR(100) NOT NULL,
    refund_reason TEXT NULL,
    refunded_at DATETIME NULL,
    paid_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_payments_razorpay_order (razorpay_order_id),
    UNIQUE KEY uq_payments_idempotency (idempotency_key),
    INDEX idx_payments_booking (booking_id),
    INDEX idx_payments_customer (customer_id),
    INDEX idx_payments_status (status),
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE RESTRICT,
    CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 16. invoices
-- Automated GST tax invoices generated upon booking/payment completion
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL,
    booking_id INT NOT NULL,
    payment_id INT NOT NULL,
    customer_id INT NOT NULL,
    provider_id INT NOT NULL,
    subtotal FLOAT NOT NULL,
    discount_amount FLOAT NOT NULL DEFAULT 0.0,
    tax_amount FLOAT NOT NULL DEFAULT 0.0,
    total_amount FLOAT NOT NULL,
    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME NOT NULL,
    pdf_url VARCHAR(500) NULL,
    billing_snapshot_json JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_invoices_number (invoice_number),
    UNIQUE KEY uq_invoices_booking (booking_id),
    INDEX idx_invoices_customer (customer_id),
    INDEX idx_invoices_provider (provider_id),
    CONSTRAINT fk_invoices_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE RESTRICT,
    CONSTRAINT fk_invoices_payment FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE RESTRICT,
    CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_invoices_provider FOREIGN KEY (provider_id) REFERENCES service_providers (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 17. coupons
-- Promotional discount codes managed by platform administrators
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    discount_type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
    discount_value FLOAT NOT NULL,
    min_order_amount FLOAT NOT NULL DEFAULT 0.0,
    max_discount_amount FLOAT NULL,
    usage_limit INT NOT NULL DEFAULT 100,
    used_count INT NOT NULL DEFAULT 0,
    valid_from DATETIME NOT NULL,
    valid_until DATETIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_coupons_code (code),
    INDEX idx_coupons_active_dates (is_active, valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 18. coupon_usages
-- Tracks redemptions of coupons per user and booking
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupon_usages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coupon_id INT NOT NULL,
    user_id INT NOT NULL,
    booking_id INT NOT NULL,
    discount_applied FLOAT NOT NULL,
    used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_coupon_booking (coupon_id, booking_id),
    INDEX idx_coupon_usages_user (user_id),
    CONSTRAINT fk_coupon_usages_coupon FOREIGN KEY (coupon_id) REFERENCES coupons (id) ON DELETE CASCADE,
    CONSTRAINT fk_coupon_usages_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_coupon_usages_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 19. reviews
-- Verified customer ratings, feedback, provider responses, and moderation
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    customer_id INT NOT NULL,
    provider_id INT NOT NULL,
    service_id INT NOT NULL,
    rating INT NOT NULL,
    comment TEXT NULL,
    provider_response TEXT NULL,
    provider_responded_at DATETIME NULL,
    moderation_status ENUM('approved', 'flagged', 'hidden') NOT NULL DEFAULT 'approved',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_reviews_booking (booking_id),
    INDEX idx_reviews_provider_status (provider_id, moderation_status),
    INDEX idx_reviews_service (service_id),
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_provider FOREIGN KEY (provider_id) REFERENCES service_providers (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_service FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 20. complaints
-- Dispute resolution and support ticketing workflow
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(50) NOT NULL,
    booking_id INT NOT NULL,
    raised_by_user_id INT NOT NULL,
    against_provider_id INT NULL,
    category VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('Open', 'In Review', 'Resolved', 'Closed') NOT NULL DEFAULT 'Open',
    priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
    admin_resolution TEXT NULL,
    resolved_by_user_id INT NULL,
    resolved_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_complaints_ticket (ticket_number),
    INDEX idx_complaints_booking (booking_id),
    INDEX idx_complaints_status_priority (status, priority),
    CONSTRAINT fk_complaints_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT fk_complaints_raised_by FOREIGN KEY (raised_by_user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_complaints_provider FOREIGN KEY (against_provider_id) REFERENCES service_providers (id) ON DELETE SET NULL,
    CONSTRAINT fk_complaints_resolved_by FOREIGN KEY (resolved_by_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 21. notifications
-- In-app real-time notification inbox for all platform users
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL DEFAULT 'general',
    reference_id INT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_user_read (user_id, is_read),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 22. provider_earnings
-- Ledger of gross booking value, platform commission, and net payout per booking
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS provider_earnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    booking_id INT NOT NULL,
    gross_amount FLOAT NOT NULL,
    commission_percentage FLOAT NOT NULL,
    commission_amount FLOAT NOT NULL,
    net_earning FLOAT NOT NULL,
    payout_status ENUM('pending', 'processed', 'paid') NOT NULL DEFAULT 'pending',
    payout_date DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_provider_earnings_booking (booking_id),
    INDEX idx_earnings_provider_status (provider_id, payout_status),
    CONSTRAINT fk_provider_earnings_provider FOREIGN KEY (provider_id) REFERENCES service_providers (id) ON DELETE CASCADE,
    CONSTRAINT fk_provider_earnings_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 23. provider_working_hours
-- Weekly operating schedule for providers (0=Monday .. 6=Sunday)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS provider_working_hours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    day_of_week INT NOT NULL COMMENT '0=Monday..6=Sunday',
    start_time VARCHAR(10) NOT NULL DEFAULT '09:00',
    end_time VARCHAR(10) NOT NULL DEFAULT '18:00',
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_provider_day (provider_id, day_of_week),
    CONSTRAINT fk_working_hours_provider FOREIGN KEY (provider_id) REFERENCES service_providers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 24. favorite_providers
-- Customer bookmarked/saved service providers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favorite_providers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    provider_id INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_favorite_customer_provider (customer_id, provider_id),
    CONSTRAINT fk_favorites_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_provider FOREIGN KEY (provider_id) REFERENCES service_providers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 25. subscriptions
-- SaaS subscription tiers for service providers (Starter, Professional, Enterprise)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    plan_tier ENUM('Starter', 'Professional', 'Enterprise') NOT NULL DEFAULT 'Starter',
    price FLOAT NOT NULL,
    billing_cycle ENUM('monthly', 'annual') NOT NULL DEFAULT 'monthly',
    commission_rate FLOAT NOT NULL DEFAULT 15.0,
    max_services INT NOT NULL DEFAULT 10,
    max_technicians INT NOT NULL DEFAULT 5,
    status ENUM('active', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    razorpay_subscription_id VARCHAR(100) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_subscriptions_provider_status (provider_id, status),
    CONSTRAINT fk_subscriptions_provider FOREIGN KEY (provider_id) REFERENCES service_providers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 26. password_reset_tokens
-- Single-use, time-bound hashed tokens for account recovery
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_reset_token_hash (token_hash),
    INDEX idx_reset_tokens_user (user_id),
    CONSTRAINT fk_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 27. refresh_tokens
-- Stateful JWT refresh token rotation & session revocation tracking
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    user_agent VARCHAR(255) NULL,
    ip_address VARCHAR(64) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_refresh_token_hash (token_hash),
    INDEX idx_refresh_tokens_user_revoked (user_id, is_revoked),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 28. payment_webhook_events
-- Idempotent log of incoming Razorpay webhook events to prevent replay attacks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_webhook_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload_json JSON NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_webhook_event_id (event_id),
    INDEX idx_webhook_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
