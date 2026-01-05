-- Create table for academic semesters/years
CREATE TABLE public.academic_semesters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  academic_year TEXT NOT NULL,
  semester_number INTEGER NOT NULL CHECK (semester_number >= 1 AND semester_number <= 3),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create table for volunteer course schedules
CREATE TABLE public.volunteer_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
  semester_id UUID NOT NULL REFERENCES public.academic_semesters(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Enable RLS
ALTER TABLE public.academic_semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for academic_semesters
CREATE POLICY "Anyone can view active semesters" 
ON public.academic_semesters 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage semesters" 
ON public.academic_semesters 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for volunteer_courses
CREATE POLICY "Volunteers can view own courses" 
ON public.volunteer_courses 
FOR SELECT 
USING (volunteer_id IN (SELECT id FROM volunteers WHERE user_id = auth.uid()));

CREATE POLICY "Volunteers can manage own courses" 
ON public.volunteer_courses 
FOR ALL 
USING (volunteer_id IN (SELECT id FROM volunteers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all courses" 
ON public.volunteer_courses 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'supervisor'::user_role));

-- Create indexes for better performance
CREATE INDEX idx_volunteer_courses_volunteer_id ON public.volunteer_courses(volunteer_id);
CREATE INDEX idx_volunteer_courses_semester_id ON public.volunteer_courses(semester_id);
CREATE INDEX idx_volunteer_courses_day_time ON public.volunteer_courses(day_of_week, start_time, end_time);
CREATE INDEX idx_academic_semesters_active ON public.academic_semesters(is_active);

-- Add triggers for updated_at
CREATE TRIGGER update_academic_semesters_updated_at
BEFORE UPDATE ON public.academic_semesters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_volunteer_courses_updated_at
BEFORE UPDATE ON public.volunteer_courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();