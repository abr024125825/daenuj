-- Create achievement badges table
CREATE TABLE public.achievement_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id uuid NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
  badge_type text NOT NULL CHECK (badge_type IN ('semester_target', 'cumulative_target', 'first_opportunity', 'ten_opportunities', 'fifty_hours', 'hundred_hours')),
  semester_id uuid REFERENCES public.academic_semesters(id) ON DELETE SET NULL,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  hours_at_achievement numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(volunteer_id, badge_type, semester_id)
);

-- Enable RLS
ALTER TABLE public.achievement_badges ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Volunteers can view own badges"
  ON public.achievement_badges FOR SELECT
  USING (volunteer_id = get_volunteer_id(auth.uid()));

CREATE POLICY "Admins can manage badges"
  ON public.achievement_badges FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'supervisor'::user_role));

CREATE POLICY "System can insert badges"
  ON public.achievement_badges FOR INSERT
  WITH CHECK (true);

-- Create achievement certificates table (different from opportunity certificates)
CREATE TABLE public.achievement_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id uuid NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.achievement_badges(id) ON DELETE CASCADE,
  certificate_number text NOT NULL UNIQUE,
  achievement_type text NOT NULL,
  hours_achieved numeric NOT NULL,
  issued_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(volunteer_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.achievement_certificates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Volunteers can view own achievement certificates"
  ON public.achievement_certificates FOR SELECT
  USING (volunteer_id = get_volunteer_id(auth.uid()));

CREATE POLICY "Admins can manage achievement certificates"
  ON public.achievement_certificates FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'supervisor'::user_role));

-- Add indexes for performance
CREATE INDEX idx_achievement_badges_volunteer ON public.achievement_badges(volunteer_id);
CREATE INDEX idx_achievement_badges_type ON public.achievement_badges(badge_type);
CREATE INDEX idx_achievement_certificates_volunteer ON public.achievement_certificates(volunteer_id);

-- Function to generate achievement certificate number
CREATE OR REPLACE FUNCTION public.generate_achievement_cert_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  cert_number TEXT;
BEGIN
  cert_number := 'ACH-' || to_char(now(), 'YYYY') || '-' || LPAD(floor(random() * 1000000)::TEXT, 6, '0');
  RETURN cert_number;
END;
$$;