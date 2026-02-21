
-- Add messages table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Fix conversations UPDATE policy to include admins
DROP POLICY IF EXISTS "Participants can update their conversations" ON public.conversations;
CREATE POLICY "Participants and admins can update conversations" 
ON public.conversations 
FOR UPDATE 
USING (
  (EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
    AND conversation_participants.user_id = auth.uid()
  ))
  OR has_role(auth.uid(), 'admin'::user_role)
);
