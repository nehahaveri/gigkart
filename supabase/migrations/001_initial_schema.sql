-- ─────────────────────────────────────────────────────────────────────────────
-- GigKart — Initial Schema
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- Helper: is the current session user an admin?
-- Called inside RLS policies — must be SECURITY DEFINER so it can read users.
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND 'admin' = ANY(roles)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────
-- Table: users
-- Mirrors auth.users; created automatically via trigger on signup.
-- ─────────────────────────────────────────
CREATE TABLE public.users (
  id                uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone             text        UNIQUE,
  email             text,
  full_name         text        NOT NULL DEFAULT '',
  avatar_url        text,
  roles             text[]      NOT NULL DEFAULT ARRAY['tasker'],
  city              text,
  aadhaar_verified  boolean     NOT NULL DEFAULT false,
  upi_id            text,
  rating_avg        numeric(3,2) NOT NULL DEFAULT 0,
  rating_count      integer     NOT NULL DEFAULT 0,
  completion_rate   numeric(5,2) NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- Table: jobs
-- ─────────────────────────────────────────
CREATE TABLE public.jobs (
  id                 uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id          uuid         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title              text         NOT NULL,
  description        text         NOT NULL,
  category           text         NOT NULL,
  sub_category       text,
  photos             text[]       NOT NULL DEFAULT '{}',
  duration_type      text         NOT NULL
                       CHECK (duration_type IN (
                         'few_hours','one_day','two_three_days',
                         'one_week','single_task','recurring'
                       )),
  date_needed        date         NOT NULL,
  deadline           timestamptz,
  address            text         NOT NULL,
  location           geography(Point, 4326),   -- PostGIS lat/lng, SRID 4326
  is_remote          boolean      NOT NULL DEFAULT false,
  num_taskers        integer      NOT NULL DEFAULT 1 CHECK (num_taskers >= 1),
  budget             numeric(12,2) NOT NULL CHECK (budget > 0),
  budget_type        text         NOT NULL DEFAULT 'fixed'
                       CHECK (budget_type IN ('fixed','hourly','negotiable')),
  payment_mode       text         NOT NULL DEFAULT 'escrow'
                       CHECK (payment_mode IN ('escrow','upfront','split')),
  search_radius_km   numeric(6,2) NOT NULL DEFAULT 10,
  is_urgent          boolean      NOT NULL DEFAULT false,
  status             text         NOT NULL DEFAULT 'open'
                       CHECK (status IN ('open','active','completed','disputed','cancelled')),
  escrow_payment_id  text,
  proof_submitted_at timestamptz,             -- set when any tasker submits proof
  created_at         timestamptz  NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- Table: offers
-- One offer per (job, tasker) pair; unique constraint enforced.
-- ─────────────────────────────────────────
CREATE TABLE public.offers (
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
-- Created when a poster accepts an offer.
-- payout_amount = accepted offer price × 0.90 (10% platform cut).
-- ─────────────────────────────────────────
CREATE TABLE public.job_assignments (
  id                 uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id             uuid         NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  offer_id           uuid         NOT NULL REFERENCES public.offers(id),
  tasker_id          uuid         NOT NULL REFERENCES public.users(id),
  proof_urls         text[]       NOT NULL DEFAULT '{}',
  proof_submitted_at timestamptz,             -- triggers 48-hr auto-release window
  completed_at       timestamptz,
  payout_amount      numeric(12,2),           -- offer price × 0.90, stored at acceptance
  razorpay_payout_id text,
  created_at         timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (job_id, tasker_id)
);

-- ─────────────────────────────────────────
-- Table: disputes
-- ─────────────────────────────────────────
CREATE TABLE public.disputes (
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
-- Both poster→tasker and tasker→poster reviews per completed job.
-- ─────────────────────────────────────────
CREATE TABLE public.reviews (
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
  created_at           timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (job_id, reviewer_id)  -- one review per reviewer per job
);

-- ─────────────────────────────────────────
-- Table: notifications
-- ─────────────────────────────────────────
CREATE TABLE public.notifications (
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
-- Indexes
-- ─────────────────────────────────────────

-- Spatial — used by ST_DWithin radius queries
CREATE INDEX idx_jobs_location        ON public.jobs USING GIST (location);

-- Jobs — most common filters
CREATE INDEX idx_jobs_status          ON public.jobs (status);
CREATE INDEX idx_jobs_poster_id       ON public.jobs (poster_id);
CREATE INDEX idx_jobs_category        ON public.jobs (category);
CREATE INDEX idx_jobs_created_at      ON public.jobs (created_at DESC);
CREATE INDEX idx_jobs_is_urgent       ON public.jobs (is_urgent) WHERE is_urgent = true;

-- Offers
CREATE INDEX idx_offers_job_id        ON public.offers (job_id);
CREATE INDEX idx_offers_tasker_id     ON public.offers (tasker_id);
CREATE INDEX idx_offers_status        ON public.offers (status);

-- Assignments — partial index for 48-hr auto-release cron scan
CREATE INDEX idx_assignments_job_id   ON public.job_assignments (job_id);
CREATE INDEX idx_assignments_tasker   ON public.job_assignments (tasker_id);
CREATE INDEX idx_assignments_pending_release
  ON public.job_assignments (proof_submitted_at)
  WHERE proof_submitted_at IS NOT NULL AND completed_at IS NULL;

-- Disputes
CREATE INDEX idx_disputes_job_id      ON public.disputes (job_id);
CREATE INDEX idx_disputes_status      ON public.disputes (status);

-- Reviews
CREATE INDEX idx_reviews_reviewee_id  ON public.reviews (reviewee_id);
CREATE INDEX idx_reviews_job_id       ON public.reviews (job_id);

-- Notifications — optimised for unread badge count
CREATE INDEX idx_notifications_user   ON public.notifications (user_id);
CREATE INDEX idx_notifications_unread ON public.notifications (user_id, read)
  WHERE read = false;

-- ─────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;

-- ── users ──────────────────────────────────────────────────────────────────
-- Any authenticated user can read any profile (needed for job cards).
CREATE POLICY "users_select_any" ON public.users
  FOR SELECT TO authenticated USING (true);

-- Users can update only their own row; admins can update any.
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- ── jobs ───────────────────────────────────────────────────────────────────
-- All authenticated users browse all jobs (marketplace is public once logged in).
CREATE POLICY "jobs_select_all" ON public.jobs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "jobs_insert_poster" ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK (poster_id = auth.uid());

CREATE POLICY "jobs_update_poster" ON public.jobs
  FOR UPDATE TO authenticated
  USING  (poster_id = auth.uid())
  WITH CHECK (poster_id = auth.uid());

CREATE POLICY "jobs_update_admin" ON public.jobs
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- ── offers ─────────────────────────────────────────────────────────────────
-- Tasker sees their own offers; poster sees offers on their jobs; admin sees all.
CREATE POLICY "offers_select" ON public.offers
  FOR SELECT TO authenticated
  USING (
    tasker_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = offers.job_id AND j.poster_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Taskers can bid on open jobs only.
CREATE POLICY "offers_insert_tasker" ON public.offers
  FOR INSERT TO authenticated
  WITH CHECK (
    tasker_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id AND j.status = 'open'
    )
  );

-- Tasker can withdraw their own offer.
CREATE POLICY "offers_update_tasker" ON public.offers
  FOR UPDATE TO authenticated
  USING  (tasker_id = auth.uid())
  WITH CHECK (tasker_id = auth.uid());

-- Poster can accept or reject offers on their jobs.
CREATE POLICY "offers_update_poster" ON public.offers
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = offers.job_id AND j.poster_id = auth.uid()
    )
  );

-- ── job_assignments ────────────────────────────────────────────────────────
-- Poster of the job and the assigned tasker can see the assignment.
CREATE POLICY "assignments_select" ON public.job_assignments
  FOR SELECT TO authenticated
  USING (
    tasker_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_assignments.job_id AND j.poster_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Only the poster creates an assignment (by accepting an offer).
CREATE POLICY "assignments_insert_poster" ON public.job_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id AND j.poster_id = auth.uid()
    )
  );

-- Tasker can submit proof (proof_urls, proof_submitted_at).
CREATE POLICY "assignments_update_tasker" ON public.job_assignments
  FOR UPDATE TO authenticated
  USING  (tasker_id = auth.uid())
  WITH CHECK (tasker_id = auth.uid());

-- Poster can mark completed / trigger payout fields.
CREATE POLICY "assignments_update_poster" ON public.job_assignments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_assignments.job_id AND j.poster_id = auth.uid()
    )
  );

-- Admin can update any assignment (dispute resolution, manual payouts).
CREATE POLICY "assignments_update_admin" ON public.job_assignments
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- ── disputes ───────────────────────────────────────────────────────────────
-- Parties involved in the job can see its disputes.
CREATE POLICY "disputes_select" ON public.disputes
  FOR SELECT TO authenticated
  USING (
    raised_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = disputes.job_id AND j.poster_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.job_assignments ja
      WHERE ja.job_id = disputes.job_id AND ja.tasker_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Only parties of an active/completed job can raise a dispute.
CREATE POLICY "disputes_insert" ON public.disputes
  FOR INSERT TO authenticated
  WITH CHECK (
    raised_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id
        AND j.status IN ('active', 'completed')
        AND (
          j.poster_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.job_assignments ja
            WHERE ja.job_id = j.id AND ja.tasker_id = auth.uid()
          )
        )
    )
  );

-- Only admin can update disputes (resolve them).
CREATE POLICY "disputes_update_admin" ON public.disputes
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- ── reviews ────────────────────────────────────────────────────────────────
-- Reviews are publicly readable (builds trust).
CREATE POLICY "reviews_select_all" ON public.reviews
  FOR SELECT TO authenticated USING (true);

-- Only parties of a completed job can leave a review.
CREATE POLICY "reviews_insert_parties" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id
        AND j.status = 'completed'
        AND (
          j.poster_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.job_assignments ja
            WHERE ja.job_id = j.id AND ja.tasker_id = auth.uid()
          )
        )
    )
  );

-- ── notifications ──────────────────────────────────────────────────────────
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can only mark their own notifications as read.
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────
-- Trigger: auto-create users row on Supabase Auth signup
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_user_rating();
