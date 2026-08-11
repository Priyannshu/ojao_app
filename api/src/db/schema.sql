-- ojao target schema — PostgreSQL + PostGIS (ARCHITECTURE.md section 4).
--
-- Idempotent: safe to run repeatedly. The migrate runner executes this whole
-- file inside a transaction. Coordinates are stored as geography(Point, 4326)
-- so ST_DWithin / ST_Distance operate in METERS without manual projection.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()

-- --- Enums ----------------------------------------------------------------
-- Target role vocabulary (section 3): maps legacy patient/staff/admin ->
-- USER / HOSPITAL_ADMIN / PLATFORM_ADMIN.
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('USER', 'HOSPITAL_ADMIN', 'PLATFORM_ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- users ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT,
  email         TEXT UNIQUE,
  phone         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          user_role   NOT NULL DEFAULT 'USER',
  status        user_status NOT NULL DEFAULT 'ACTIVE',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --- hospitals ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hospitals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name          TEXT NOT NULL,
  display_name        TEXT NOT NULL,
  description         TEXT,
  phone               TEXT,
  emergency_phone     TEXT,
  email               TEXT,
  address_line_1      TEXT,
  address_line_2      TEXT,
  city                TEXT,
  state               TEXT,
  postal_code         TEXT,
  country             TEXT,
  location            geography(Point, 4326),
  emergency_available BOOLEAN NOT NULL DEFAULT false,
  is_active           BOOLEAN NOT NULL DEFAULT false,
  is_verified         BOOLEAN NOT NULL DEFAULT false,
  verified_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Spatial index for nearby search (section 4). GiST over geography.
CREATE INDEX IF NOT EXISTS hospitals_location_idx ON hospitals USING GIST (location);
-- Partial index: the searchable set is only active + verified hospitals.
CREATE INDEX IF NOT EXISTS hospitals_searchable_idx
  ON hospitals (is_active, is_verified) WHERE is_active AND is_verified;

-- --- hospital_admins (explicit membership, replaces ambiguous clinicId) ----
CREATE TABLE IF NOT EXISTS hospital_admins (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, hospital_id)
);
CREATE INDEX IF NOT EXISTS hospital_admins_hospital_idx ON hospital_admins (hospital_id);

-- --- hospital_services ----------------------------------------------------
CREATE TABLE IF NOT EXISTS hospital_services (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id  UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  service_name TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hospital_services_hospital_idx ON hospital_services (hospital_id);

-- --- hospital_applications ------------------------------------------------
CREATE TABLE IF NOT EXISTS hospital_applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_name     TEXT NOT NULL,
  submitted_address TEXT,
  submitted_phone   TEXT,
  submitted_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted_location  geography(Point, 4326),
  status            application_status NOT NULL DEFAULT 'PENDING',
  review_notes      TEXT,
  reviewed_by       UUID REFERENCES users(id),
  reviewed_at       TIMESTAMPTZ,
  -- Set once the application is approved and a hospital record is created.
  hospital_id       UUID REFERENCES hospitals(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hospital_applications_status_idx ON hospital_applications (status);
CREATE INDEX IF NOT EXISTS hospital_applications_applicant_idx ON hospital_applications (applicant_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS hospital_applications_one_pending_per_applicant_idx
  ON hospital_applications (applicant_user_id) WHERE status = 'PENDING';

-- --- refresh_tokens (server-side, revocable) ------------------------------
-- Only the SHA-256 hash of the token is stored so a DB leak can't be replayed.
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens (user_id);

-- --- otp_challenges (WhatsApp registration + password recovery) ----------
-- Codes are stored as keyed HMACs. Keeping consumed rows preserves resend
-- counters without retaining a reusable credential.
CREATE TABLE IF NOT EXISTS otp_challenges (
  phone        TEXT NOT NULL,
  purpose      TEXT NOT NULL CHECK (purpose IN ('register', 'password_reset')),
  code_mac     TEXT,
  generation   UUID,
  expires_at   TIMESTAMPTZ,
  attempts     INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  window_start TIMESTAMPTZ,
  send_count   INTEGER NOT NULL DEFAULT 0,
  consumed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (phone, purpose)
);
CREATE INDEX IF NOT EXISTS otp_challenges_expires_idx ON otp_challenges (expires_at);

-- --- device_tokens (push registration, section 3 notifications) -----------
CREATE TABLE IF NOT EXISTS device_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  platform   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

-- --- audit_logs -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id),
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs (actor_user_id);
