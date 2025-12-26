-- Add access_password column to opportunities table for security
ALTER TABLE public.opportunities
ADD COLUMN access_password TEXT DEFAULT NULL;

-- Add access_password_set_by column to track who set the password
ALTER TABLE public.opportunities
ADD COLUMN access_password_set_by UUID DEFAULT NULL;

-- Add access_password_set_at column
ALTER TABLE public.opportunities
ADD COLUMN access_password_set_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add interests field to opportunities for volunteer matching
ALTER TABLE public.opportunities
ADD COLUMN target_interests TEXT[] DEFAULT '{}';

-- Add a column to track auto-approved registrations
ALTER TABLE public.opportunity_registrations
ADD COLUMN auto_approved BOOLEAN DEFAULT false;

-- Add withdrawn_at and withdrawal_reason columns for tracking withdrawals
ALTER TABLE public.opportunity_registrations
ADD COLUMN withdrawn_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE public.opportunity_registrations
ADD COLUMN withdrawal_reason TEXT DEFAULT NULL;