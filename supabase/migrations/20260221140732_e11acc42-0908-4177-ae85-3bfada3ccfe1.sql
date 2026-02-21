
-- Add access_token to voting_boxes for token-based booth access
ALTER TABLE public.voting_boxes ADD COLUMN IF NOT EXISTS access_token TEXT UNIQUE;

-- Add faculty_id to voting_boxes for faculty-based assignment
ALTER TABLE public.voting_boxes ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES public.faculties(id);

-- Create function to generate unique access tokens
CREATE OR REPLACE FUNCTION public.generate_box_access_token()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  token TEXT;
BEGIN
  token := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4)) || '-' ||
           upper(substr(md5(random()::text || clock_timestamp()::text), 5, 4)) || '-' ||
           upper(substr(md5(random()::text || clock_timestamp()::text), 9, 4));
  RETURN token;
END;
$$;

-- Auto-generate access token on new voting box creation
CREATE OR REPLACE FUNCTION public.auto_generate_box_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.access_token IS NULL THEN
    NEW.access_token := generate_box_access_token();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_generate_box_token
BEFORE INSERT ON public.voting_boxes
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_box_token();

-- Generate tokens for existing boxes that don't have one
UPDATE public.voting_boxes SET access_token = generate_box_access_token() WHERE access_token IS NULL;

-- Add delete cascade for election voters when election is deleted
-- (voters should be deleted when election is deleted)
ALTER TABLE public.election_voters DROP CONSTRAINT IF EXISTS election_voters_election_id_fkey;
ALTER TABLE public.election_voters ADD CONSTRAINT election_voters_election_id_fkey 
  FOREIGN KEY (election_id) REFERENCES public.elections(id) ON DELETE CASCADE;

-- Voting boxes should also cascade delete with election
ALTER TABLE public.voting_boxes DROP CONSTRAINT IF EXISTS voting_boxes_election_id_fkey;
ALTER TABLE public.voting_boxes ADD CONSTRAINT voting_boxes_election_id_fkey 
  FOREIGN KEY (election_id) REFERENCES public.elections(id) ON DELETE CASCADE;
