-- Add missing INSERT policy so posters can create assignments when accepting offers
CREATE POLICY IF NOT EXISTS "assignments_insert_poster" ON public.job_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id AND j.poster_id = auth.uid()
    )
  );
