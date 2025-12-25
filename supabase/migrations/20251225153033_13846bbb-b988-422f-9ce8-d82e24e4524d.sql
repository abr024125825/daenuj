-- Fix RLS: Allow volunteers to view their own feedback
CREATE POLICY "Volunteers can view own feedback" 
ON public.evaluations 
FOR SELECT 
USING (
  (volunteer_id IN (
    SELECT volunteers.id FROM volunteers WHERE volunteers.user_id = auth.uid()
  )) AND type = 'volunteer_feedback'
);

-- Allow admins to update and delete evaluations
CREATE POLICY "Admins can update evaluations"
ON public.evaluations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can delete evaluations"
ON public.evaluations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::user_role));

-- Allow admins to update and delete certificate templates
CREATE POLICY "Admins can update templates"
ON public.certificate_templates
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can delete templates"
ON public.certificate_templates
FOR DELETE
USING (has_role(auth.uid(), 'admin'::user_role));