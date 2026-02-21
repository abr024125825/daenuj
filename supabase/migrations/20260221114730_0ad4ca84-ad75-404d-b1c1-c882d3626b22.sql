
-- Allow admins to delete conversations
CREATE POLICY "delete_conversations"
ON public.conversations FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::user_role));

-- Allow admins to delete messages
CREATE POLICY "delete_messages"
ON public.messages FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::user_role));
