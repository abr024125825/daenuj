
-- 2. Add EMR password to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emr_password TEXT;

-- 3. Add provider assignment to patients
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS assigned_provider_id UUID;

-- 4. Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  provider_id UUID NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  appointment_type TEXT NOT NULL DEFAULT 'follow_up',
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view appointments" ON public.appointments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordinators and admins manage appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'clinic_coordinator')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'clinic_coordinator')
  );

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Create patient_provider_assignments table
CREATE TABLE IF NOT EXISTS public.patient_provider_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  provider_id UUID NOT NULL,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(patient_id, provider_id)
);

ALTER TABLE public.patient_provider_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view provider assignments" ON public.patient_provider_assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordinators and admins manage provider assignments" ON public.patient_provider_assignments
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'clinic_coordinator')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'clinic_coordinator')
  );

-- 6. Update referrals default
ALTER TABLE public.patient_referrals ALTER COLUMN referred_to SET DEFAULT 'University Student Health Clinic';

-- 7. Helper function for clinic coordinator role check
CREATE OR REPLACE FUNCTION public.is_clinic_coordinator(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'clinic_coordinator'
  )
$$;
