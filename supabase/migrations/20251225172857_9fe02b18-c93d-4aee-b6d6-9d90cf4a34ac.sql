-- Drop the restrictive admin policy that only shows supervisor_rating
DROP POLICY IF EXISTS "Admins can view supervisor ratings only" ON public.evaluations;

-- Create a new policy that allows admins to view ALL evaluations
CREATE POLICY "Admins can view all evaluations" 
ON public.evaluations 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'supervisor'::user_role)
);