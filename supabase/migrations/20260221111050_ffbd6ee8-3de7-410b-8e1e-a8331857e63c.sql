-- Fix conversation RLS: change restrictive INSERT policies to permissive
-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Admins can create conversations" ON conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can create conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::user_role) 
    OR has_role(auth.uid(), 'supervisor'::user_role)
  );

CREATE POLICY "Authenticated users can create conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Also fix SELECT/UPDATE policies to be permissive
DROP POLICY IF EXISTS "Participants and admins can view conversations" ON conversations;
CREATE POLICY "Participants and admins can view conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin'::user_role)
  );

DROP POLICY IF EXISTS "Participants and admins can update conversations" ON conversations;
CREATE POLICY "Participants and admins can update conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id 
      AND conversation_participants.user_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin'::user_role)
  );

-- Fix conversation_participants policies to be permissive
DROP POLICY IF EXISTS "Admins can manage participants" ON conversation_participants;
CREATE POLICY "Admins can manage participants"
  ON conversation_participants
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

DROP POLICY IF EXISTS "Creators and admins can add participants" ON conversation_participants;
CREATE POLICY "Creators and admins can add participants"
  ON conversation_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'admin'::user_role)
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id AND c.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Participants can view conversation members" ON conversation_participants;
CREATE POLICY "Participants can view conversation members"
  ON conversation_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id AND cp2.user_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin'::user_role)
  );

DROP POLICY IF EXISTS "Users can update their own participant record" ON conversation_participants;
CREATE POLICY "Users can update their own participant record"
  ON conversation_participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix messages table policies too
DROP POLICY IF EXISTS "Participants can view messages" ON messages;
CREATE POLICY "Participants can view messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin'::user_role)
  );

DROP POLICY IF EXISTS "Participants can send messages" ON messages;
CREATE POLICY "Participants can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );
