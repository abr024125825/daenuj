-- Add supervisor assignment to opportunities
ALTER TABLE public.opportunities 
ADD COLUMN supervisor_id UUID REFERENCES auth.users(id);

-- Create index for better query performance
CREATE INDEX idx_opportunities_supervisor ON public.opportunities(supervisor_id);

-- Allow supervisors to view opportunities assigned to them
CREATE POLICY "Supervisors can view assigned opportunities"
ON public.opportunities
FOR SELECT
TO authenticated
USING (
  supervisor_id = auth.uid() OR
  public.has_role(auth.uid(), 'admin')
);

-- Allow supervisors to update attendance for their opportunities
CREATE POLICY "Supervisors can manage attendance for assigned opportunities"
ON public.attendance
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.opportunities o
    WHERE o.id = opportunity_id
    AND (o.supervisor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.opportunities o
    WHERE o.id = opportunity_id
    AND (o.supervisor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- Allow supervisors to view registrations for their opportunities
CREATE POLICY "Supervisors can view registrations for assigned opportunities"
ON public.opportunity_registrations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.opportunities o
    WHERE o.id = opportunity_id
    AND (o.supervisor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);