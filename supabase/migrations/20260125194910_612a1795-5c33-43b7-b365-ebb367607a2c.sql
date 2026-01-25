
-- Add faculty_id to profiles for faculty coordinators
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES public.faculties(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_faculty_id ON public.profiles(faculty_id);

-- Update RLS policies to allow faculty coordinators to view their faculty's volunteers
CREATE POLICY "Faculty coordinators can view their faculty volunteers"
ON public.volunteer_applications
FOR SELECT
TO authenticated
USING (
  faculty_id IN (
    SELECT faculty_id FROM public.profiles WHERE user_id = auth.uid() AND faculty_id IS NOT NULL
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Allow faculty coordinators to view volunteers from their faculty
CREATE POLICY "Faculty coordinators can view their faculty volunteer records"
ON public.volunteers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.volunteer_applications va
    JOIN public.profiles p ON p.faculty_id = va.faculty_id
    WHERE va.id = volunteers.application_id
    AND p.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);
