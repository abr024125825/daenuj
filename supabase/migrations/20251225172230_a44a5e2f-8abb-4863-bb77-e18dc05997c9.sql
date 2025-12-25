-- Fix faculties RLS - change to PERMISSIVE for public read access
DROP POLICY IF EXISTS "Anyone can view faculties" ON public.faculties;
CREATE POLICY "Anyone can view faculties" 
ON public.faculties 
FOR SELECT 
TO public
USING (true);

-- Fix majors RLS - change to PERMISSIVE for public read access
DROP POLICY IF EXISTS "Anyone can view majors" ON public.majors;
CREATE POLICY "Anyone can view majors" 
ON public.majors 
FOR SELECT 
TO public
USING (true);

-- Fix evaluations RLS - allow volunteers to see their own feedback submissions
DROP POLICY IF EXISTS "Volunteers can view own feedback" ON public.evaluations;
CREATE POLICY "Volunteers can view own feedback" 
ON public.evaluations 
FOR SELECT 
USING (
  volunteer_id IN (
    SELECT id FROM volunteers WHERE user_id = auth.uid()
  )
);

-- Fix profiles RLS - admins should also be able to view all profiles for settings
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Allow admins to view all user_roles for settings page
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::user_role) OR auth.uid() = user_id
);