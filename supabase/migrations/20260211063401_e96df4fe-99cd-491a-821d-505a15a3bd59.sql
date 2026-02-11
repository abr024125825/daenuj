
-- Fix: Allow volunteers to view opportunities they participated in (even completed ones)
CREATE POLICY "Volunteers can view participated opportunities"
ON public.opportunities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM opportunity_registrations r
    WHERE r.opportunity_id = opportunities.id
    AND r.volunteer_id = get_volunteer_id(auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM certificates c
    WHERE c.opportunity_id = opportunities.id
    AND c.volunteer_id = get_volunteer_id(auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM badge_transactions bt
    WHERE bt.opportunity_id = opportunities.id
    AND bt.volunteer_id = get_volunteer_id(auth.uid())
  )
);

-- Make opportunity_id nullable for disability certificates
ALTER TABLE public.certificates ALTER COLUMN opportunity_id DROP NOT NULL;

-- Add certificate_type to distinguish regular vs disability certificates
ALTER TABLE public.certificates ADD COLUMN certificate_type text NOT NULL DEFAULT 'opportunity';

-- Add disability-specific metadata
ALTER TABLE public.certificates ADD COLUMN disability_hours numeric DEFAULT NULL;
ALTER TABLE public.certificates ADD COLUMN disability_assignments_count integer DEFAULT NULL;
ALTER TABLE public.certificates ADD COLUMN disability_students_helped integer DEFAULT NULL;
ALTER TABLE public.certificates ADD COLUMN date_range_start date DEFAULT NULL;
ALTER TABLE public.certificates ADD COLUMN date_range_end date DEFAULT NULL;
