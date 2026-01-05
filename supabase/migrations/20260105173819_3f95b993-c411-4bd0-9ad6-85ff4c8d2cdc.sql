-- Allow volunteers to update their own schedule submission fields
CREATE POLICY "Volunteers can update their own schedule"
ON public.volunteers
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);