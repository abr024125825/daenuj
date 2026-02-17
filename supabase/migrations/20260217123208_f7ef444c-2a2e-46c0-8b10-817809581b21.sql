
-- 1. Create therapist availability slots table
CREATE TABLE public.therapist_availability_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  booking_window_days INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

ALTER TABLE public.therapist_availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Psychologists can manage own availability"
ON public.therapist_availability_slots FOR ALL
USING (provider_id = auth.uid())
WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Anyone can view active availability"
ON public.therapist_availability_slots FOR SELECT
USING (is_active = true);

-- 2. Make national_id nullable on patients (removing requirement)
ALTER TABLE public.patients ALTER COLUMN national_id DROP NOT NULL;
ALTER TABLE public.patients ALTER COLUMN national_id SET DEFAULT NULL;

-- 3. Add is_on_leave column to track therapist leave status
ALTER TABLE public.therapist_availability_slots ADD COLUMN IF NOT EXISTS provider_on_leave BOOLEAN DEFAULT false;

-- Actually, let's add leave tracking to a simpler place
-- Add a provider leave tracking via system_settings or a simple column

-- 4. Create a therapist_leave table
CREATE TABLE public.therapist_leaves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.therapist_leaves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Psychologists manage own leaves"
ON public.therapist_leaves FOR ALL
USING (provider_id = auth.uid())
WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Anyone can view leaves for booking"
ON public.therapist_leaves FOR SELECT
USING (true);

-- 5. Remove the provider_on_leave column since we have a leaves table
ALTER TABLE public.therapist_availability_slots DROP COLUMN IF EXISTS provider_on_leave;

-- 6. Update generate_file_number to new format: X-YYYY-S-NNNNN
-- First letter of name, year, semester (1=winter, 2=spring, 3=summer), sequential
CREATE OR REPLACE FUNCTION public.generate_file_number(_first_letter TEXT DEFAULT 'X', _year TEXT DEFAULT NULL, _semester INTEGER DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  yr TEXT;
  sem INTEGER;
  seq INTEGER;
  month_num INTEGER;
BEGIN
  -- Default year to current
  yr := COALESCE(_year, to_char(now(), 'YYYY'));
  
  -- Default semester based on current month
  IF _semester IS NOT NULL THEN
    sem := _semester;
  ELSE
    month_num := EXTRACT(MONTH FROM now())::INTEGER;
    IF month_num BETWEEN 9 AND 12 OR month_num = 1 THEN
      sem := 1; -- Winter (Sep-Jan)
    ELSIF month_num BETWEEN 2 AND 6 THEN
      sem := 2; -- Spring (Feb-Jun)
    ELSE
      sem := 3; -- Summer (Jul-Aug)
    END IF;
  END IF;
  
  -- Get next sequential number for this year-semester combo
  SELECT COALESCE(MAX(
    NULLIF(regexp_replace(split_part(file_number, '-', 4), '[^0-9]', '', 'g'), '')::integer
  ), -1) + 1
  INTO seq
  FROM public.patients
  WHERE file_number LIKE _first_letter || '-' || yr || '-' || sem || '-%';
  
  RETURN _first_letter || '-' || yr || '-' || sem || '-' || LPAD(seq::TEXT, 5, '0');
END;
$$;
