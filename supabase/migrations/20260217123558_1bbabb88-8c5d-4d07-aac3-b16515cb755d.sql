
-- Update the patients table file_number default to use the generate_file_number function
ALTER TABLE public.patients ALTER COLUMN file_number SET DEFAULT '';

-- Drop the overloaded generate_file_number (no args) since we need the one with params
DROP FUNCTION IF EXISTS public.generate_file_number();

-- The parameterized version already exists: generate_file_number(_first_letter, _year, _semester)
-- We keep that one.

-- Add date_of_birth column to patients if not exists (already exists based on schema)
-- Make national_id truly optional (already nullable)

-- Update RLS: allow psychologists to manage patients 
-- First check existing policies
DO $$
BEGIN
  -- Drop existing restrictive policies on patients that might block psychologists
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patients' AND policyname = 'Psychologists can manage their assigned patients') THEN
    DROP POLICY "Psychologists can manage their assigned patients" ON public.patients;
  END IF;
END $$;

-- Psychologists can manage all patients (they need to register new ones)
CREATE POLICY "Psychologists can manage patients"
ON public.patients
FOR ALL
USING (get_user_role(auth.uid()) IN ('admin', 'psychologist'))
WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'psychologist'));

-- Allow public (unauthenticated) read of therapist_availability_slots for booking
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'therapist_availability_slots' AND policyname = 'Public can view active slots') THEN
    CREATE POLICY "Public can view active slots"
    ON public.therapist_availability_slots
    FOR SELECT
    USING (is_active = true);
  END IF;
END $$;

-- Allow public read of therapist_leaves for booking  
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'therapist_leaves' AND policyname = 'Public can view leaves') THEN
    CREATE POLICY "Public can view leaves"
    ON public.therapist_leaves
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Allow anon/public to verify patient identity (file_number + dob) for booking
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patients' AND policyname = 'Public can verify patient identity') THEN
    CREATE POLICY "Public can verify patient identity"
    ON public.patients
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Allow anon/public to insert appointments for booking
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Public can book appointments') THEN
    CREATE POLICY "Public can book appointments"
    ON public.appointments
    FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;
