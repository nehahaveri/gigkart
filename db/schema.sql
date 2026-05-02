-- ─────────────────────────────────────────────────────────────────────────────
-- GigKart — Standalone PostgreSQL Schema (no Supabase dependency)
-- Run: psql -U postgres -d gigkart -f db/schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Extensions ──────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

-- ─────────────────────────────────────────
-- Table: users
-- Owns its own auth (email + password_hash). No auth.users dependency.
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email            text        UNIQUE NOT NULL,
  password_hash    text        NOT NULL DEFAULT '',
  phone            text,
  full_name        text        NOT NULL DEFAULT '',
  avatar_url       text,
  role             text[]      NOT NULL DEFAULT '{}',
  city             text,
  aadhaar_verified boolean     NOT NULL DEFAULT false,
  aadhaar_last4    text,
  upi_id           text,
  bank_account     text,
  skills           text[]      NOT NULL DEFAULT '{}',
  rating_avg       numeric(3,2) NOT NULL DEFAULT 0,
  rating_count     integer      NOT NULL DEFAULT 0,
  completion_rate  numeric(5,2) NOT NULL DEFAULT 0,
  created_at       timestamptz  NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- Table: jobs
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.jobs (
  id                 uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id          uuid         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title              text         NOT NULL,
  description        text         NOT NULL,
  category           text         NOT NULL,
  sub_category       text,
  photos             text[]       NOT NULL DEFAULT '{}',
  duration_type      text         NOT NULL
                       CHECK (duration_type IN (
                         'few_hours','1_day','2_3_days',
                         '1_week','single_task','recurring'
                       )),
  date_needed        date,
  deadline           timestamptz,
  address            text,
  location           geography(Point, 4326),
  is_remote          boolean      NOT NULL DEFAULT false,
  num_taskers        integer      NOT NULL DEFAULT 1 CHECK (num_taskers >= 1),
  budget             numeric(12,2) NOT NULL CHECK (budget > 0),
  budget_type        text         NOT NULL DEFAULT 'fixed'
                       CHECK (budget_type IN ('fixed','hourly','negotiable')),
  payment_mode       text         NOT NULL DEFAULT 'escrow'
                       CHECK (payment_mode IN ('escrow','upfront','50_50_split')),
  search_radius_km   numeric(6,2) NOT NULL DEFAULT 10,
  gender_pref        text         NOT NULL DEFAULT 'any'
                       CHECK (gender_pref IN ('any','male','female')),
  min_rating         numeric(3,2) NOT NULL DEFAULT 0,
  is_urgent          boolean      NOT NULL DEFAULT false,
  status             text         NOT NULL DEFAULT 'open'
                       CHECK (status IN ('open','active','completed','disputed','cancelled')),
  escrow_payment_id  text,
  created_at         timestamptz  NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- Table: offers
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.offers (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            uuid         NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  tasker_id         uuid         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  price             numeric(12,2) NOT NULL CHECK (price > 0),
  availability_note text         NOT NULL DEFAULT '',
  message           text         NOT NULL DEFAULT '',
  status            text         NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  created_at        timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (job_id, tasker_id)
);

-- ─────────────────────────────────────────
-- Table: job_assignments
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.job_assignments (
  id                 uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id             uuid         NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  offer_id           uuid         NOT NULL REFERENCES public.offers(id),
  tasker_id          uuid         NOT NULL REFERENCES public.users(id),
  proof_photos       text[]       NOT NULL DEFAULT '{}',
  submitted_at       timestamptz,
  approved_at        timestamptz,
  started_at         timestamptz,
  payout_amount      numeric(12,2),
  razorpay_payout_id text,
  created_at         timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (job_id, tasker_id)
);

-- ─────────────────────────────────────────
-- Table: messages
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     uuid         NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sender_id  uuid         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body       text         NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz  NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- Table: disputes
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.disputes (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        uuid         NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  raised_by     uuid         NOT NULL REFERENCES public.users(id),
  reason        text         NOT NULL,
  description   text         NOT NULL,
  evidence_urls text[]       NOT NULL DEFAULT '{}',
  status        text         NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','reviewing','resolved')),
  resolution    text,
  resolved_by   uuid         REFERENCES public.users(id),
  resolved_at   timestamptz,
  created_at    timestamptz  NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- Table: reviews
-- revealed_at: both reviews must exist before either is revealed (blind review)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id                   uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id               uuid         NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  reviewer_id          uuid         NOT NULL REFERENCES public.users(id),
  reviewee_id          uuid         NOT NULL REFERENCES public.users(id),
  overall_rating       numeric(2,1) NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  quality_rating       numeric(2,1) NOT NULL CHECK (quality_rating BETWEEN 1 AND 5),
  punctuality_rating   numeric(2,1) NOT NULL CHECK (punctuality_rating BETWEEN 1 AND 5),
  communication_rating numeric(2,1) NOT NULL CHECK (communication_rating BETWEEN 1 AND 5),
  rehire_flag          boolean      NOT NULL DEFAULT false,
  text                 text,
  revealed_at          timestamptz,
  created_at           timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (job_id, reviewer_id)
);

-- ─────────────────────────────────────────
-- Table: notifications
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       text         NOT NULL,
  title      text         NOT NULL,
  body       text         NOT NULL,
  data       jsonb,
  read       boolean      NOT NULL DEFAULT false,
  created_at timestamptz  NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- Table: kyc_requests
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kyc_requests (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  legal_name       text        NOT NULL,
  id_type          text        NOT NULL
                     CHECK (id_type IN ('aadhaar', 'passport', 'driving_license')),
  id_number_last4  text        NOT NULL
                     CHECK (id_number_last4 ~ '^[0-9]{4}$'),
  front_url        text        NOT NULL,
  back_url         text,
  selfie_url       text        NOT NULL,
  status           text        NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by      uuid        REFERENCES public.users(id),
  reviewed_at      timestamptz,
  submitted_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- ─────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_jobs_location   ON public.jobs USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_jobs_status     ON public.jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_poster     ON public.jobs (poster_id);
CREATE INDEX IF NOT EXISTS idx_jobs_category   ON public.jobs (category);
CREATE INDEX IF NOT EXISTS idx_jobs_created    ON public.jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_urgent     ON public.jobs (is_urgent) WHERE is_urgent = true;
CREATE INDEX IF NOT EXISTS idx_offers_job      ON public.offers (job_id);
CREATE INDEX IF NOT EXISTS idx_offers_tasker   ON public.offers (tasker_id);
CREATE INDEX IF NOT EXISTS idx_offers_status   ON public.offers (status);
CREATE INDEX IF NOT EXISTS idx_asgn_job        ON public.job_assignments (job_id);
CREATE INDEX IF NOT EXISTS idx_asgn_tasker     ON public.job_assignments (tasker_id);
CREATE INDEX IF NOT EXISTS idx_asgn_pending    ON public.job_assignments (submitted_at)
  WHERE submitted_at IS NOT NULL AND approved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_job    ON public.messages (job_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews (reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_job     ON public.reviews (job_id);
CREATE INDEX IF NOT EXISTS idx_notif_user      ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notif_unread    ON public.notifications (user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_kyc_status      ON public.kyc_requests (status);

-- ─────────────────────────────────────────
-- Function: nearby_jobs
-- Returns open jobs within radius_km of (lat, lng), ordered by distance.
-- Remote jobs (is_remote = true) are always included.
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.nearby_jobs(
  lat          double precision,
  lng          double precision,
  radius_km    double precision DEFAULT 50,
  p_category   text             DEFAULT NULL,
  p_limit      integer          DEFAULT 20,
  p_offset     integer          DEFAULT 0
)
RETURNS TABLE (
  id               uuid,
  poster_id        uuid,
  title            text,
  description      text,
  category         text,
  sub_category     text,
  photos           text[],
  duration_type    text,
  date_needed      date,
  deadline         timestamptz,
  address          text,
  location         geography,
  is_remote        boolean,
  num_taskers      integer,
  budget           numeric,
  budget_type      text,
  payment_mode     text,
  search_radius_km numeric,
  is_urgent        boolean,
  status           text,
  escrow_payment_id text,
  created_at       timestamptz,
  distance_km      double precision
)
LANGUAGE sql STABLE
SET search_path = public, extensions
AS $$
  SELECT
    j.id, j.poster_id, j.title, j.description,
    j.category, j.sub_category, j.photos, j.duration_type,
    j.date_needed, j.deadline, j.address, j.location,
    j.is_remote, j.num_taskers, j.budget, j.budget_type,
    j.payment_mode, j.search_radius_km, j.is_urgent,
    j.status, j.escrow_payment_id, j.created_at,
    CASE
      WHEN j.location IS NOT NULL
        THEN ST_Distance(
               j.location,
               ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
             ) / 1000.0
      ELSE NULL
    END AS distance_km
  FROM public.jobs j
  WHERE
    j.status = 'open'
    AND (p_category IS NULL OR j.category = p_category)
    AND (
      j.is_remote = true
      OR j.location IS NULL
      OR ST_DWithin(
           j.location,
           ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
           radius_km * 1000
         )
    )
  ORDER BY
    j.is_urgent DESC,
    CASE WHEN j.location IS NOT NULL
      THEN ST_Distance(j.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography)
      ELSE 999999999
    END ASC,
    j.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
$$;

-- ─────────────────────────────────────────
-- Trigger: keep users.rating_avg + rating_count in sync
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS trigger AS $$
BEGIN
  UPDATE public.users SET
    rating_avg   = (
      SELECT ROUND(AVG(overall_rating)::numeric, 2)
      FROM public.reviews WHERE reviewee_id = NEW.reviewee_id
    ),
    rating_count = (
      SELECT COUNT(*) FROM public.reviews WHERE reviewee_id = NEW.reviewee_id
    )
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_review_created ON public.reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_user_rating();
