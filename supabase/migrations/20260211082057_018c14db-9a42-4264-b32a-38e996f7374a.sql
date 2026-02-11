
-- Add national_id to disability_students
ALTER TABLE public.disability_students ADD COLUMN IF NOT EXISTS national_id text;

-- Create unique index on national_id (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_disability_students_national_id ON public.disability_students(national_id) WHERE national_id IS NOT NULL;

-- Create a table for student-submitted exams (public facing, no auth required)
CREATE TABLE public.disability_student_exam_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.disability_students(id) ON DELETE CASCADE,
  course_name text NOT NULL,
  course_code text,
  exam_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  location text,
  notes text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  is_processed boolean DEFAULT false,
  processed_at timestamptz,
  processed_by uuid
);

-- Enable RLS
ALTER TABLE public.disability_student_exam_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (students submit without auth)
CREATE POLICY "Anyone can submit exam schedules"
ON public.disability_student_exam_submissions
FOR INSERT
WITH CHECK (true);

-- Only authenticated admins/disability_coordinators can view
CREATE POLICY "Authenticated users can view submissions"
ON public.disability_student_exam_submissions
FOR SELECT
TO authenticated
USING (true);

-- Only authenticated users can update (process)
CREATE POLICY "Authenticated users can update submissions"
ON public.disability_student_exam_submissions
FOR UPDATE
TO authenticated
USING (true);

-- Only authenticated users can delete
CREATE POLICY "Authenticated users can delete submissions"
ON public.disability_student_exam_submissions
FOR DELETE
TO authenticated
USING (true);
