
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Faculty coordinators can view their faculty volunteers" ON public.volunteer_applications;
DROP POLICY IF EXISTS "Faculty coordinators can view their faculty volunteer records" ON public.volunteers;

-- Create improved RLS policy for faculty coordinators to view applications
CREATE POLICY "Faculty coordinators can view their faculty applications"
ON public.volunteer_applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'supervisor'
    AND p.faculty_id IS NOT NULL
    AND p.faculty_id = volunteer_applications.faculty_id
  )
);

-- Create improved RLS policy for faculty coordinators to view volunteers
CREATE POLICY "Faculty coordinators can view faculty volunteers"
ON public.volunteers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.volunteer_applications va
    JOIN public.profiles p ON p.faculty_id = va.faculty_id
    WHERE va.id = volunteers.application_id
    AND p.user_id = auth.uid()
    AND p.role = 'supervisor'
    AND p.faculty_id IS NOT NULL
  )
);

-- Allow faculty coordinators to view courses of their faculty volunteers
CREATE POLICY "Faculty coordinators can view faculty volunteer courses"
ON public.volunteer_courses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.volunteers v
    JOIN public.volunteer_applications va ON va.id = v.application_id
    JOIN public.profiles p ON p.faculty_id = va.faculty_id
    WHERE v.id = volunteer_courses.volunteer_id
    AND p.user_id = auth.uid()
    AND p.role = 'supervisor'
    AND p.faculty_id IS NOT NULL
  )
);

-- Allow faculty coordinators to view exam schedules of their faculty volunteers
CREATE POLICY "Faculty coordinators can view faculty volunteer exams"
ON public.exam_schedules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.volunteers v
    JOIN public.volunteer_applications va ON va.id = v.application_id
    JOIN public.profiles p ON p.faculty_id = va.faculty_id
    WHERE v.id = exam_schedules.volunteer_id
    AND p.user_id = auth.uid()
    AND p.role = 'supervisor'
    AND p.faculty_id IS NOT NULL
  )
);
