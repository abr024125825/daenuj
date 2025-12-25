-- Add 'waitlisted' to application_status enum
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'waitlisted';

-- Add DELETE policy for certificates
CREATE POLICY "Admins can delete certificates" 
ON public.certificates 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'supervisor'::user_role));