
-- Create security definer function to check conversation membership
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE user_id = _user_id AND conversation_id = _conversation_id
  )
$$;

-- Drop all existing policies on conversation_participants
DROP POLICY IF EXISTS "Admins can manage participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Creators and admins can add participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Participants can view conversation members" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON public.conversation_participants;

-- Recreate policies using security definer function
CREATE POLICY "select_conversation_participants"
ON public.conversation_participants FOR SELECT
USING (
  public.is_conversation_participant(auth.uid(), conversation_id)
  OR public.has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "insert_conversation_participants"
ON public.conversation_participants FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::user_role)
  OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid())
);

CREATE POLICY "update_conversation_participants"
ON public.conversation_participants FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "delete_conversation_participants"
ON public.conversation_participants FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::user_role));

-- Drop and recreate conversations policies
DROP POLICY IF EXISTS "Participants and admins can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants and admins can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;

CREATE POLICY "select_conversations"
ON public.conversations FOR SELECT
USING (
  public.is_conversation_participant(auth.uid(), id)
  OR public.has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "insert_conversations"
ON public.conversations FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  OR public.has_role(auth.uid(), 'admin'::user_role)
  OR public.has_role(auth.uid(), 'supervisor'::user_role)
);

CREATE POLICY "update_conversations"
ON public.conversations FOR UPDATE
USING (
  public.is_conversation_participant(auth.uid(), id)
  OR public.has_role(auth.uid(), 'admin'::user_role)
);

-- Drop and recreate messages policies
DROP POLICY IF EXISTS "Participants and admins can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants and admins can send messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

CREATE POLICY "select_messages"
ON public.messages FOR SELECT
USING (
  public.is_conversation_participant(auth.uid(), conversation_id)
  OR public.has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "insert_messages"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND (
    public.is_conversation_participant(auth.uid(), conversation_id)
    OR public.has_role(auth.uid(), 'admin'::user_role)
  )
);

CREATE POLICY "update_messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id);
