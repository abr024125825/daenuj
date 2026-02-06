-- Create function to check if user is disability coordinator
CREATE OR REPLACE FUNCTION public.is_disability_coordinator(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'disability_coordinator'
  );
$$;

-- Update RLS policies for disability tables to allow disability_coordinator access

-- disability_students policies
DROP POLICY IF EXISTS "Disability coordinators can manage students" ON public.disability_students;
CREATE POLICY "Disability coordinators can manage students"
ON public.disability_students
FOR ALL
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('admin', 'disability_coordinator')
)
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin', 'disability_coordinator')
);

-- disability_exams policies
DROP POLICY IF EXISTS "Disability coordinators can manage exams" ON public.disability_exams;
CREATE POLICY "Disability coordinators can manage exams"
ON public.disability_exams
FOR ALL
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('admin', 'disability_coordinator')
)
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin', 'disability_coordinator')
);

-- disability_exam_assignments policies
DROP POLICY IF EXISTS "Disability coordinators can manage assignments" ON public.disability_exam_assignments;
CREATE POLICY "Disability coordinators can manage assignments"
ON public.disability_exam_assignments
FOR ALL
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('admin', 'disability_coordinator')
)
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin', 'disability_coordinator')
);

-- disability_exam_logs policies
DROP POLICY IF EXISTS "Disability coordinators can view logs" ON public.disability_exam_logs;
CREATE POLICY "Disability coordinators can view logs"
ON public.disability_exam_logs
FOR SELECT
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('admin', 'disability_coordinator')
);

DROP POLICY IF EXISTS "Disability coordinators can insert logs" ON public.disability_exam_logs;
CREATE POLICY "Disability coordinators can insert logs"
ON public.disability_exam_logs
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin', 'disability_coordinator')
);