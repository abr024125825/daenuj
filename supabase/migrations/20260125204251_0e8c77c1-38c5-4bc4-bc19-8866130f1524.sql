-- Add target volunteer hours to academic semesters
ALTER TABLE public.academic_semesters 
ADD COLUMN IF NOT EXISTS target_volunteer_hours integer DEFAULT 20,
ADD COLUMN IF NOT EXISTS cumulative_target_hours integer DEFAULT 50;

-- Add comment explaining the fields
COMMENT ON COLUMN public.academic_semesters.target_volunteer_hours IS 'Target volunteer hours per semester for achievement tracking';
COMMENT ON COLUMN public.academic_semesters.cumulative_target_hours IS 'Cumulative target hours across all semesters for overall achievement';