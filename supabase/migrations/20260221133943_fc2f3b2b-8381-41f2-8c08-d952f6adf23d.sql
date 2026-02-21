
-- Add allowed_ip column to voting_boxes for IP binding
ALTER TABLE public.voting_boxes ADD COLUMN IF NOT EXISTS allowed_ip text;
