-- ============================================================================
-- FoodBridge AI: Supabase Database Schema (College Hackathon Edition)
-- Problem ID: HACK-P197 | Intelligent Food Redistribution Network
-- ============================================================================
-- Architecture:
--   - Express backend with custom JWT authentication and role-based middleware.
--   - Supabase PostgreSQL accessed securely via SUPABASE_SERVICE_ROLE_KEY.
--   - Clean, rerunnable DDL designed for 1-click execution in Supabase SQL Editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. ENUMERATED TYPES (Idempotent Definition)
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('DONOR', 'RECIPIENT', 'VOLUNTEER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('ACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE organization_type AS ENUM (
    'RESTAURANT', 'HOTEL', 'BAKERY', 'SUPERMARKET', 'CATERER',
    'COMMUNITY_KITCHEN', 'NGO', 'ORPHANAGE', 'SHELTER', 'CHARITY', 'COMMUNITY_GROUP'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE food_category AS ENUM (
    'COOKED_MEALS', 'BAKERY', 'FRUITS', 'VEGETABLES', 'DAIRY',
    'PACKAGED', 'RAW_INGREDIENTS', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE dietary_type AS ENUM ('VEGETARIAN', 'NON_VEGETARIAN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE measurement_unit AS ENUM (
    'MEAL_BOXES', 'PLATES', 'KILOGRAMS', 'LITRES', 'PACKETS', 'PIECES'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM (
    'AVAILABLE', 'PARTIALLY_RESERVED', 'FULLY_RESERVED', 'EXPIRED', 'COMPLETED', 'REMOVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM (
    'PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'COLLECTED', 'COMPLETED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE delivery_task_status AS ENUM (
    'AVAILABLE', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_type AS ENUM (
    'BICYCLE', 'MOTORCYCLE', 'CAR', 'ELECTRIC_VAN', 'TRUCK'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- 3. CORE IDENTITY & USER ACCESS (Table 1: users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  account_status account_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. DONOR ORGANIZATIONAL PROFILES (Table 2: donor_profiles)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_name VARCHAR(255) NOT NULL,
  organization_type organization_type NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  verification_status verification_status NOT NULL DEFAULT 'VERIFIED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_donor_user UNIQUE(user_id)
);

-- ----------------------------------------------------------------------------
-- 5. RECIPIENT NGO PROFILES (Table 3: ngo_profiles)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ngo_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_name VARCHAR(255) NOT NULL,
  organization_type organization_type NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  capacity_meals INTEGER NOT NULL DEFAULT 50 CHECK (capacity_meals > 0),
  dietary_preferences dietary_type[] DEFAULT ARRAY['VEGETARIAN', 'NON_VEGETARIAN']::dietary_type[],
  verification_status verification_status NOT NULL DEFAULT 'PENDING',
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_ngo_user UNIQUE(user_id)
);

-- ----------------------------------------------------------------------------
-- 6. VOLUNTEER COURIER PROFILES (Table 4: volunteer_profiles)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS volunteer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  vehicle_type vehicle_type NOT NULL DEFAULT 'MOTORCYCLE',
  vehicle_number VARCHAR(100),
  is_available BOOLEAN NOT NULL DEFAULT true,
  current_latitude NUMERIC(10, 6),
  current_longitude NUMERIC(10, 6),
  total_deliveries_completed INTEGER NOT NULL DEFAULT 0 CHECK (total_deliveries_completed >= 0),
  average_rating NUMERIC(3, 2) NOT NULL DEFAULT 5.0 CHECK (average_rating >= 1.0 AND average_rating <= 5.0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_volunteer_user UNIQUE(user_id)
);

-- ----------------------------------------------------------------------------
-- 7. FOOD DONATIONS / SURPLUS LISTINGS (Table 5: donations)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES donor_profiles(id) ON DELETE CASCADE,
  food_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  category food_category NOT NULL,
  dietary_type dietary_type NOT NULL,
  total_quantity NUMERIC(10, 2) NOT NULL CHECK (total_quantity > 0),
  available_quantity NUMERIC(10, 2) NOT NULL CHECK (available_quantity >= 0),
  reserved_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  collected_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (collected_quantity >= 0),
  unit measurement_unit NOT NULL,
  preparation_time TIMESTAMPTZ NOT NULL,
  storage_method TEXT NOT NULL,
  handling_instructions TEXT NOT NULL,
  allergen_information TEXT,
  pickup_location TEXT NOT NULL,
  pickup_start TIMESTAMPTZ NOT NULL,
  pickup_end TIMESTAMPTZ NOT NULL,
  collection_deadline TIMESTAMPTZ NOT NULL,
  listing_status listing_status NOT NULL DEFAULT 'AVAILABLE',
  donor_declaration_confirmed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_quantity_conservation CHECK (
    available_quantity + reserved_quantity + collected_quantity = total_quantity
  )
);

-- ----------------------------------------------------------------------------
-- 8. DONATION CLAIMS / NGO REQUESTS (Table 6: donation_claims)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donation_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES ngo_profiles(id) ON DELETE CASCADE,
  requested_quantity NUMERIC(10, 2) NOT NULL CHECK (requested_quantity > 0),
  request_status request_status NOT NULL DEFAULT 'PENDING',
  pickup_window VARCHAR(100) NOT NULL,
  donor_confirmed BOOLEAN NOT NULL DEFAULT false,
  recipient_confirmed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  rejection_reason TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. VOLUNTEER DELIVERY TASKS (Table 7: delivery_tasks)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES donation_claims(id) ON DELETE CASCADE,
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES donor_profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES ngo_profiles(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES volunteer_profiles(id) ON DELETE SET NULL,
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  pickup_latitude NUMERIC(10, 6) NOT NULL,
  pickup_longitude NUMERIC(10, 6) NOT NULL,
  delivery_latitude NUMERIC(10, 6) NOT NULL,
  delivery_longitude NUMERIC(10, 6) NOT NULL,
  status delivery_task_status NOT NULL DEFAULT 'AVAILABLE',
  estimated_distance_km NUMERIC(6, 2) NOT NULL DEFAULT 3.5,
  pickup_window VARCHAR(100) NOT NULL,
  pickup_confirmed_at TIMESTAMPTZ,
  delivered_confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 10. PICKUP DETAILS (Dual Independent Confirmation) (Table 8: pickup_details)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pickup_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES donation_claims(id) ON DELETE CASCADE,
  pickup_reference VARCHAR(50) NOT NULL UNIQUE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  pickup_status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
  donor_confirmed_at TIMESTAMPTZ,
  recipient_confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- ----------------------------------------------------------------------------
-- 11. FEEDBACK & PARTNER REVIEW (Table 9: feedback)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES donation_claims(id) ON DELETE CASCADE,
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewer_role user_role NOT NULL,
  target_donor_id UUID REFERENCES donor_profiles(id) ON DELETE SET NULL,
  target_ngo_id UUID REFERENCES ngo_profiles(id) ON DELETE SET NULL,
  target_volunteer_id UUID REFERENCES volunteer_profiles(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  food_condition_rating INTEGER NOT NULL CHECK (food_condition_rating >= 1 AND food_condition_rating <= 5),
  punctuality_rating INTEGER NOT NULL CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 12. IN-APP NOTIFICATIONS (Table 10: notifications)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 13. SAFETY & COMPLIANCE REPORTS (Table 11: reports)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 14. ADMIN AUDIT LOGS (Table 12: admin_audit_logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(100) NOT NULL,
  target_id VARCHAR(255) NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 15. PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(listing_status);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donation_claims_donation ON donation_claims(donation_id);
CREATE INDEX IF NOT EXISTS idx_donation_claims_recipient ON donation_claims(recipient_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tasks_status ON delivery_tasks(status);
CREATE INDEX IF NOT EXISTS idx_delivery_tasks_volunteer ON delivery_tasks(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_feedback_donation ON feedback(donation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_pickup_reference ON pickup_details(pickup_reference);

-- ----------------------------------------------------------------------------
-- 16. ATOMIC INVENTORY & OVER-CLAIM PREVENTION TRIGGER
-- ----------------------------------------------------------------------------
-- Enforces that an NGO cannot claim more food than is available,
-- and updates the donation's available & reserved quantities atomically.
-- On REJECTED or CANCELLED, restores reserved inventory to available_quantity exactly once.
CREATE OR REPLACE FUNCTION fn_handle_donation_claim()
RETURNS TRIGGER AS $$
DECLARE
  v_available NUMERIC(10, 2);
  v_reserved NUMERIC(10, 2);
  v_collected NUMERIC(10, 2);
  v_status listing_status;
BEGIN
  -- Row-level lock to prevent race conditions
  SELECT available_quantity, reserved_quantity, collected_quantity, listing_status
  INTO v_available, v_reserved, v_collected, v_status
  FROM donations
  WHERE id = NEW.donation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donation listing % not found.', NEW.donation_id;
  END IF;

  -- 1. INSERT: Initial Claim Request
  IF TG_OP = 'INSERT' THEN
    IF v_status NOT IN ('AVAILABLE', 'PARTIALLY_RESERVED') THEN
      RAISE EXCEPTION 'Donation listing is not open for claims (current status: %).', v_status;
    END IF;

    IF NEW.requested_quantity > v_available THEN
      RAISE EXCEPTION 'Claim rejected: Requested % units exceeds available inventory of % units.',
        NEW.requested_quantity, v_available;
    END IF;

    -- Adjust inventory: move from available to reserved
    UPDATE donations
    SET available_quantity = available_quantity - NEW.requested_quantity,
        reserved_quantity = reserved_quantity + NEW.requested_quantity,
        listing_status = CASE
          WHEN (available_quantity - NEW.requested_quantity) <= 0 THEN 'FULLY_RESERVED'::listing_status
          ELSE 'PARTIALLY_RESERVED'::listing_status
        END,
        updated_at = NOW()
    WHERE id = NEW.donation_id;

  -- 2. UPDATE: Status Changes (Restore inventory on REJECTED / CANCELLED exactly once)
  ELSIF TG_OP = 'UPDATE' THEN
    -- Exactly-once guard:
    -- Only restore when transitioning TO REJECTED or CANCELLED from an active reservation.
    -- If already REJECTED or CANCELLED, this condition is FALSE, strictly preventing double restoration.
    IF NEW.request_status IN ('REJECTED', 'CANCELLED') 
       AND OLD.request_status NOT IN ('REJECTED', 'CANCELLED', 'COLLECTED', 'COMPLETED') THEN

      DECLARE
        v_restore_qty NUMERIC(10, 2) := OLD.requested_quantity;
        v_new_available NUMERIC(10, 2) := v_available + v_restore_qty;
        v_new_reserved NUMERIC(10, 2) := GREATEST(0, v_reserved - v_restore_qty);
      BEGIN
        UPDATE donations
        SET available_quantity = v_new_available,
            reserved_quantity = v_new_reserved,
            listing_status = CASE
              WHEN v_new_reserved = 0 AND v_collected = 0 THEN 'AVAILABLE'::listing_status
              ELSE 'PARTIALLY_RESERVED'::listing_status
            END,
            updated_at = NOW()
        WHERE id = NEW.donation_id;
      END;

    -- Transition from reserved to collected when pickup completes
    ELSIF NEW.request_status IN ('COLLECTED', 'COMPLETED')
       AND OLD.request_status NOT IN ('COLLECTED', 'COMPLETED', 'REJECTED', 'CANCELLED') THEN

      DECLARE
        v_claim_qty NUMERIC(10, 2) := OLD.requested_quantity;
        v_new_reserved NUMERIC(10, 2) := GREATEST(0, v_reserved - v_claim_qty);
        v_new_collected NUMERIC(10, 2) := v_collected + v_claim_qty;
      BEGIN
        UPDATE donations
        SET reserved_quantity = v_new_reserved,
            collected_quantity = v_new_collected,
            listing_status = CASE
              WHEN v_available = 0 AND v_new_reserved = 0 THEN 'COMPLETED'::listing_status
              ELSE listing_status
            END,
            updated_at = NOW()
        WHERE id = NEW.donation_id;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_handle_donation_claim ON donation_claims;
CREATE TRIGGER trg_handle_donation_claim
BEFORE INSERT OR UPDATE ON donation_claims
FOR EACH ROW EXECUTE FUNCTION fn_handle_donation_claim();

-- ----------------------------------------------------------------------------
-- 17. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
-- Enable RLS across all 12 tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Backend Service Role has full access across all tables
-- (Express server communicates securely using SUPABASE_SERVICE_ROLE_KEY)
DROP POLICY IF EXISTS "service_role_users" ON users;
CREATE POLICY "service_role_users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_donor_profiles" ON donor_profiles;
CREATE POLICY "service_role_donor_profiles" ON donor_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_ngo_profiles" ON ngo_profiles;
CREATE POLICY "service_role_ngo_profiles" ON ngo_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_volunteer_profiles" ON volunteer_profiles;
CREATE POLICY "service_role_volunteer_profiles" ON volunteer_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_donations" ON donations;
CREATE POLICY "service_role_donations" ON donations FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_donation_claims" ON donation_claims;
CREATE POLICY "service_role_donation_claims" ON donation_claims FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_delivery_tasks" ON delivery_tasks;
CREATE POLICY "service_role_delivery_tasks" ON delivery_tasks FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_pickup_details" ON pickup_details;
CREATE POLICY "service_role_pickup_details" ON pickup_details FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_feedback" ON feedback;
CREATE POLICY "service_role_feedback" ON feedback FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_notifications" ON notifications;
CREATE POLICY "service_role_notifications" ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_reports" ON reports;
CREATE POLICY "service_role_reports" ON reports FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_admin_audit_logs" ON admin_audit_logs;
CREATE POLICY "service_role_admin_audit_logs" ON admin_audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public Read-Only Access (Only for non-sensitive public browse data)
DROP POLICY IF EXISTS "public_read_available_donations" ON donations;
CREATE POLICY "public_read_available_donations" ON donations
  FOR SELECT TO anon, authenticated
  USING (listing_status IN ('AVAILABLE', 'PARTIALLY_RESERVED'));

DROP POLICY IF EXISTS "public_read_feedback" ON feedback;
CREATE POLICY "public_read_feedback" ON feedback
  FOR SELECT TO anon, authenticated
  USING (true);

-- Explicitly ensure public access to sensitive profile tables is removed
-- Donor and NGO profiles contain private phones, contact persons, and addresses,
-- and are accessible strictly through the authenticated Express backend.
DROP POLICY IF EXISTS "public_read_donor_profiles" ON donor_profiles;
DROP POLICY IF EXISTS "public_read_ngo_profiles" ON ngo_profiles;

