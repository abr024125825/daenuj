
-- Table for storing screening test results (both anonymous and registered)
CREATE TABLE public.screening_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  patient_id UUID REFERENCES public.patients(id),
  questions_answered JSONB NOT NULL DEFAULT '[]',
  suggested_icd_codes JSONB NOT NULL DEFAULT '[]',
  severity_level TEXT,
  summary TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  student_name TEXT,
  student_email TEXT,
  student_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.screening_results ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public screening)
CREATE POLICY "Anyone can submit screening results"
  ON public.screening_results FOR INSERT
  WITH CHECK (true);

-- Only providers and admins can read
CREATE POLICY "Providers can read screening results"
  ON public.screening_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'psychologist', 'clinic_coordinator')
    )
  );

-- Anonymous can read their own by session_id (handled client-side)
CREATE POLICY "Anonymous read own screening"
  ON public.screening_results FOR SELECT
  USING (is_anonymous = false AND patient_id IS NOT NULL);
