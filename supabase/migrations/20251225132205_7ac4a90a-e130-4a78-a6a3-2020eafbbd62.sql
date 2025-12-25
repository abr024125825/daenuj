-- Fix function search path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix function search path for generate_certificate_number
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  cert_number TEXT;
BEGIN
  cert_number := 'CSDC-' || to_char(now(), 'YYYY') || '-' || LPAD(nextval('certificate_seq')::TEXT, 6, '0');
  RETURN cert_number;
END;
$$;