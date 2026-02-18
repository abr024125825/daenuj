-- Create file_open_requests table for screening-to-patient linking
CREATE TABLE IF NOT EXISTS public.file_open_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  student_name TEXT NOT NULL,
  student_email TEXT,
  student_phone TEXT,
  student_dob DATE,
  student_national_id TEXT,
  gender TEXT,
  screening_summary TEXT,
  suggested_icd_codes JSONB DEFAULT '[]'::jsonb,
  severity_level TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  patient_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.file_open_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a file open request (from screening page)
CREATE POLICY "Anyone can submit file open requests"
ON public.file_open_requests FOR INSERT
WITH CHECK (true);

-- Psychologists can view and manage requests
CREATE POLICY "Psychologists can manage file open requests"
ON public.file_open_requests FOR ALL
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]));

-- Auto-update updated_at
CREATE TRIGGER update_file_open_requests_updated_at
  BEFORE UPDATE ON public.file_open_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
