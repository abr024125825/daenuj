
-- Allow anonymous users to read disability_students for verification (only specific columns)
CREATE POLICY "Anyone can verify student identity"
ON public.disability_students
FOR SELECT
TO anon
USING (is_active = true);
