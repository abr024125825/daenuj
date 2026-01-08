-- Fix 1: Restrict profiles table - only allow users to view their own profile or admins to view all
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::user_role)
  OR has_role(auth.uid(), 'supervisor'::user_role)
);

-- Fix 2: Tighten volunteer_applications - supervisors can only view applications for their assigned opportunities
DROP POLICY IF EXISTS "Admins can view all applications" ON public.volunteer_applications;

CREATE POLICY "Admins can view all applications" 
ON public.volunteer_applications 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Supervisors can view applications for their opportunities" 
ON public.volunteer_applications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM opportunity_registrations oreg
    JOIN opportunities o ON o.id = oreg.opportunity_id
    WHERE oreg.volunteer_id IN (
      SELECT v.id FROM volunteers v WHERE v.application_id = volunteer_applications.id
    )
    AND o.supervisor_id = auth.uid()
  )
);

-- Fix 3: Fix conversations table policy - correct the column reference
DROP POLICY IF EXISTS "Participants can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can update their conversations" ON public.conversations;

CREATE POLICY "Participants can view their conversations" 
ON public.conversations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id 
    AND conversation_participants.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Participants can update their conversations" 
ON public.conversations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id 
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Fix 4: Fix conversation_participants policy - correct the self-reference
DROP POLICY IF EXISTS "Participants can view conversation members" ON public.conversation_participants;

CREATE POLICY "Participants can view conversation members" 
ON public.conversation_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp2
    WHERE cp2.conversation_id = conversation_participants.conversation_id 
    AND cp2.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::user_role)
);