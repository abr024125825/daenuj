
-- Elections table
CREATE TABLE public.elections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  election_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, closed
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage elections" ON public.elections
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Authenticated users can view active elections" ON public.elections
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Voting boxes
CREATE TABLE public.voting_boxes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  location TEXT,
  location_ar TEXT,
  supervisor_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.voting_boxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage voting boxes" ON public.voting_boxes
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Supervisors can view assigned boxes" ON public.voting_boxes
  FOR SELECT USING (supervisor_id = auth.uid() OR has_role(auth.uid(), 'admin'::user_role));

-- Voters (students)
CREATE TABLE public.election_voters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  box_id UUID REFERENCES public.voting_boxes(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  student_name_ar TEXT,
  university_id TEXT NOT NULL,
  faculty_name TEXT,
  faculty_name_ar TEXT,
  national_id TEXT,
  has_voted BOOLEAN NOT NULL DEFAULT false,
  voted_at TIMESTAMPTZ,
  checked_in_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(election_id, university_id)
);

ALTER TABLE public.election_voters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage voters" ON public.election_voters
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Supervisors can view voters in their boxes" ON public.election_voters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.voting_boxes vb
      WHERE vb.id = election_voters.box_id
      AND vb.supervisor_id = auth.uid()
    )
  );

CREATE POLICY "Supervisors can check in voters in their boxes" ON public.election_voters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.voting_boxes vb
      WHERE vb.id = election_voters.box_id
      AND vb.supervisor_id = auth.uid()
    )
  );

-- Create indexes for performance with 12K+ records
CREATE INDEX idx_election_voters_election ON public.election_voters(election_id);
CREATE INDEX idx_election_voters_box ON public.election_voters(box_id);
CREATE INDEX idx_election_voters_university_id ON public.election_voters(university_id);
CREATE INDEX idx_election_voters_name ON public.election_voters(student_name);
CREATE INDEX idx_election_voters_has_voted ON public.election_voters(has_voted);
CREATE INDEX idx_voting_boxes_election ON public.voting_boxes(election_id);
CREATE INDEX idx_voting_boxes_supervisor ON public.voting_boxes(supervisor_id);

-- Updated_at triggers
CREATE TRIGGER update_elections_updated_at
  BEFORE UPDATE ON public.elections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_voting_boxes_updated_at
  BEFORE UPDATE ON public.voting_boxes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live results
ALTER PUBLICATION supabase_realtime ADD TABLE public.election_voters;
