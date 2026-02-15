
-- Fix: Allow clinic_coordinator to manage patients
DROP POLICY IF EXISTS "Clinical staff can manage patients" ON public.patients;
CREATE POLICY "Clinical staff can manage patients"
ON public.patients FOR ALL
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role, 'clinic_coordinator'::user_role]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role, 'clinic_coordinator'::user_role]));

-- Fix: Allow disability_coordinator to insert exams (resolve conflicting policies)
DROP POLICY IF EXISTS "Admins can manage disability exams" ON public.disability_exams;

-- Add status tracking column for submissions
ALTER TABLE public.disability_student_exam_submissions
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Add rejection_reason column
ALTER TABLE public.disability_student_exam_submissions
ADD COLUMN IF NOT EXISTS rejection_reason text;
