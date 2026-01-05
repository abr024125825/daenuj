-- Create badge transactions table for tracking equipment checkout/return
CREATE TABLE public.badge_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  volunteer_id UUID NOT NULL REFERENCES public.volunteers(id),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id),
  registration_id UUID NOT NULL REFERENCES public.opportunity_registrations(id),
  
  -- Checkout info
  checkout_code TEXT NOT NULL,
  checkout_time TIMESTAMP WITH TIME ZONE,
  checkout_condition TEXT CHECK (checkout_condition IN ('good', 'damaged')),
  checkout_confirmed_at TIMESTAMP WITH TIME ZONE,
  checkout_confirmed_by UUID REFERENCES auth.users(id),
  
  -- Return info
  return_code TEXT,
  return_time TIMESTAMP WITH TIME ZONE,
  return_condition TEXT CHECK (return_condition IN ('good', 'damaged', 'lost')),
  return_confirmed_at TIMESTAMP WITH TIME ZONE,
  return_confirmed_by UUID REFERENCES auth.users(id),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'checked_out', 'returned', 'lost')),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one transaction per volunteer per opportunity
  UNIQUE(volunteer_id, opportunity_id)
);

-- Enable RLS
ALTER TABLE public.badge_transactions ENABLE ROW LEVEL SECURITY;

-- Admins and supervisors can manage all transactions
CREATE POLICY "Admins can manage badge transactions"
ON public.badge_transactions
FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

-- Volunteers can view their own transactions
CREATE POLICY "Volunteers can view own badge transactions"
ON public.badge_transactions
FOR SELECT
USING (volunteer_id IN (SELECT id FROM volunteers WHERE user_id = auth.uid()));

-- Volunteers can update their own transactions (for confirming checkout/return)
CREATE POLICY "Volunteers can confirm own transactions"
ON public.badge_transactions
FOR UPDATE
USING (volunteer_id IN (SELECT id FROM volunteers WHERE user_id = auth.uid()));

-- Create function to generate unique checkout codes
CREATE OR REPLACE FUNCTION public.generate_badge_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  code TEXT;
BEGIN
  code := upper(substr(md5(random()::text), 1, 6));
  RETURN code;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_badge_transactions_updated_at
BEFORE UPDATE ON public.badge_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_badge_transactions_opportunity ON public.badge_transactions(opportunity_id);
CREATE INDEX idx_badge_transactions_volunteer ON public.badge_transactions(volunteer_id);
CREATE INDEX idx_badge_transactions_status ON public.badge_transactions(status);