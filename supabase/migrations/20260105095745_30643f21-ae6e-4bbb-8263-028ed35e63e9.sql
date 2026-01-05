-- Add schedule submission tracking to volunteers table
ALTER TABLE public.volunteers 
ADD COLUMN IF NOT EXISTS schedule_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS schedule_submitted_for_semester UUID REFERENCES public.academic_semesters(id);

-- Add semester open/close control
ALTER TABLE public.academic_semesters
ADD COLUMN IF NOT EXISTS is_schedule_open BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS schedule_closed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS schedule_closed_by UUID REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_volunteers_schedule_semester ON public.volunteers(schedule_submitted_for_semester);