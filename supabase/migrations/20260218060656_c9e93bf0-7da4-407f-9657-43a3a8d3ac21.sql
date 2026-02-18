
-- Allow psychologists to manage their own provider assignments
CREATE POLICY "Psychologists can manage own assignments"
ON public.patient_provider_assignments
FOR ALL
USING (provider_id = auth.uid() AND get_user_role(auth.uid()) = 'psychologist'::user_role)
WITH CHECK (provider_id = auth.uid() AND get_user_role(auth.uid()) = 'psychologist'::user_role);

-- Add max_daily_patients to therapist_availability_slots
ALTER TABLE public.therapist_availability_slots 
ADD COLUMN IF NOT EXISTS max_daily_patients integer DEFAULT 8;

-- Add session structure columns (45 min session + 5 min buffer + 10 min break = 60 min total)
ALTER TABLE public.therapist_availability_slots
ADD COLUMN IF NOT EXISTS session_minutes integer DEFAULT 45,
ADD COLUMN IF NOT EXISTS buffer_minutes integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS break_minutes integer DEFAULT 10;

-- Add screening_session_id to patients for linking screening data
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS screening_session_id text;
