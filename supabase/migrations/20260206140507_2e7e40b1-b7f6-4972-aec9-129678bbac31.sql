-- Add volunteer_type to volunteers table to distinguish employment vs general volunteers
ALTER TABLE public.volunteers 
ADD COLUMN IF NOT EXISTS volunteer_type TEXT DEFAULT 'general' CHECK (volunteer_type IN ('general', 'employment'));

-- Add comment for clarity
COMMENT ON COLUMN public.volunteers.volunteer_type IS 'Type of volunteer: general (optional assignments) or employment (mandatory assignments)';

-- Add withdrawal_reason and withdrawn_at to disability_exam_assignments
ALTER TABLE public.disability_exam_assignments
ADD COLUMN IF NOT EXISTS withdrawal_reason TEXT,
ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS withdrawn_by UUID;