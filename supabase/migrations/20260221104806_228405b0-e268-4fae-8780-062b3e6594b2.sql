
-- Update messages SELECT policy to include admins
DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON public.messages;
CREATE POLICY "Participants and admins can view messages"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
    AND cp.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::user_role)
);

-- Update INSERT policy to allow admins
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants and admins can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::user_role)
  )
);

-- Update conversations policies for broader access
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Allow admin to view all conversations
DROP POLICY IF EXISTS "Participants can view their conversations" ON public.conversations;
CREATE POLICY "Participants and admins can view conversations"
ON public.conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversations.id
    AND cp.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::user_role)
);

-- Allow conversation creators to add participants
DROP POLICY IF EXISTS "Conversation creators and admins can manage participants" ON public.conversation_participants;
CREATE POLICY "Creators and admins can add participants"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::user_role)
  OR EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_participants.conversation_id
    AND c.created_by = auth.uid()
  )
);
