-- Create table for tracking certificate verification logs
CREATE TABLE public.certificate_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id UUID REFERENCES public.certificates(id) ON DELETE CASCADE,
  verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.certificate_verifications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert verification logs (public verification)
CREATE POLICY "Anyone can log verifications"
ON public.certificate_verifications
FOR INSERT
WITH CHECK (true);

-- Only admins can view verification logs
CREATE POLICY "Admins can view verification logs"
ON public.certificate_verifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add index for faster queries
CREATE INDEX idx_certificate_verifications_certificate_id ON public.certificate_verifications(certificate_id);
CREATE INDEX idx_certificate_verifications_verified_at ON public.certificate_verifications(verified_at DESC);