-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Faculty coordinators can view faculty volunteers" ON public.volunteers;
DROP POLICY IF EXISTS "Faculty coordinators can view their faculty applications" ON public.volunteer_applications;
DROP POLICY IF EXISTS "Faculty coordinators can view faculty volunteer courses" ON public.volunteer_courses;
DROP POLICY IF EXISTS "Faculty coordinators can view faculty volunteer exams" ON public.exam_schedules;
DROP POLICY IF EXISTS "Supervisors can view applications for their opportunities" ON public.volunteer_applications;
DROP POLICY IF EXISTS "Volunteers can view own courses" ON public.volunteer_courses;
DROP POLICY IF EXISTS "Volunteers can manage own courses" ON public.volunteer_courses;
DROP POLICY IF EXISTS "Volunteers can manage own exam schedules" ON public.exam_schedules;

-- Create helper functions to avoid recursion

-- Function to check if user is a faculty coordinator for a given faculty_id
CREATE OR REPLACE FUNCTION public.is_faculty_coordinator(_user_id uuid, _faculty_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id 
    AND role = 'supervisor'
    AND faculty_id = _faculty_id
    AND faculty_id IS NOT NULL
  )
$$;

-- Function to get volunteer_id for a user
CREATE OR REPLACE FUNCTION public.get_volunteer_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.volunteers WHERE user_id = _user_id LIMIT 1
$$;

-- Function to get faculty_id from volunteer_id
CREATE OR REPLACE FUNCTION public.get_volunteer_faculty_id(_volunteer_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT va.faculty_id 
  FROM public.volunteers v
  JOIN public.volunteer_applications va ON va.id = v.application_id
  WHERE v.id = _volunteer_id
  LIMIT 1
$$;

-- Function to get faculty_id from application_id
CREATE OR REPLACE FUNCTION public.get_application_faculty_id(_application_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT faculty_id FROM public.volunteer_applications WHERE id = _application_id LIMIT 1
$$;

-- Function to get user's faculty_id from profile
CREATE OR REPLACE FUNCTION public.get_user_faculty_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT faculty_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Recreate policies using security definer functions

-- volunteers table policies
CREATE POLICY "Faculty coordinators can view faculty volunteers"
ON public.volunteers
FOR SELECT
TO authenticated
USING (
  public.is_faculty_coordinator(auth.uid(), public.get_application_faculty_id(application_id))
);

-- volunteer_applications table policies
CREATE POLICY "Faculty coordinators can view their faculty applications"
ON public.volunteer_applications
FOR SELECT
TO authenticated
USING (
  public.is_faculty_coordinator(auth.uid(), faculty_id)
);

-- volunteer_courses table policies
CREATE POLICY "Faculty coordinators can view faculty volunteer courses"
ON public.volunteer_courses
FOR SELECT
TO authenticated
USING (
  public.is_faculty_coordinator(auth.uid(), public.get_volunteer_faculty_id(volunteer_id))
);

CREATE POLICY "Volunteers can view own courses"
ON public.volunteer_courses
FOR SELECT
TO authenticated
USING (volunteer_id = public.get_volunteer_id(auth.uid()));

CREATE POLICY "Volunteers can manage own courses"
ON public.volunteer_courses
FOR ALL
TO authenticated
USING (volunteer_id = public.get_volunteer_id(auth.uid()))
WITH CHECK (volunteer_id = public.get_volunteer_id(auth.uid()));

-- exam_schedules table policies
CREATE POLICY "Faculty coordinators can view faculty volunteer exams"
ON public.exam_schedules
FOR SELECT
TO authenticated
USING (
  public.is_faculty_coordinator(auth.uid(), public.get_volunteer_faculty_id(volunteer_id))
);

CREATE POLICY "Volunteers can manage own exam schedules"
ON public.exam_schedules
FOR ALL
TO authenticated
USING (volunteer_id = public.get_volunteer_id(auth.uid()))
WITH CHECK (volunteer_id = public.get_volunteer_id(auth.uid()));