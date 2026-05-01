-- Add started_at to job_assignments so taskers can mark when they begin work
ALTER TABLE public.job_assignments ADD COLUMN IF NOT EXISTS started_at timestamptz;
