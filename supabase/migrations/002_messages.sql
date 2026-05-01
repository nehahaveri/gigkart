-- ─────────────────────────────────────────────────────────────────────────────
-- GigKart — Messages table
-- One thread per job (between poster and assigned tasker).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.messages (
  id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     uuid         NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sender_id  uuid         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body       text         NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz  NOT NULL DEFAULT now()
);

-- Indexes ──────────────────────────────────────────────────────────────────────
CREATE INDEX idx_messages_job_id    ON public.messages (job_id, created_at);
CREATE INDEX idx_messages_sender_id ON public.messages (sender_id);

-- Row Level Security ───────────────────────────────────────────────────────────
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Only the poster of the job OR the assigned tasker can read messages.
CREATE POLICY "messages_select_parties" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = messages.job_id AND j.poster_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.job_assignments ja
      WHERE ja.job_id = messages.job_id AND ja.tasker_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Only parties can send messages, and sender_id must be themselves.
CREATE POLICY "messages_insert_parties" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.jobs j
        WHERE j.id = job_id AND j.poster_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.job_assignments ja
        WHERE ja.job_id = job_id AND ja.tasker_id = auth.uid()
      )
    )
  );
