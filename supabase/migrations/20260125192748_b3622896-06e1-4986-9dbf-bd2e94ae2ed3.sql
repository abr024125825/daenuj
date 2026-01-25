-- Create exam_schedules table for storing volunteer exam times
CREATE TABLE public.exam_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.volunteer_courses(id) ON DELETE CASCADE,
  semester_id UUID NOT NULL REFERENCES public.academic_semesters(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('first', 'second', 'midterm', 'final')),
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, exam_type)
);

-- Create system_settings table to store admin configurations in database
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Insert default settings
INSERT INTO public.system_settings (setting_key, setting_value) VALUES
  ('auto_approve_registrations', '{"enabled": false}'::jsonb),
  ('email_notifications', '{"enabled": true}'::jsonb),
  ('exam_schedule_enabled', '{"enabled": false}'::jsonb);

-- Enable RLS on exam_schedules
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for exam_schedules
CREATE POLICY "Volunteers can manage own exam schedules"
ON public.exam_schedules
FOR ALL
USING (volunteer_id IN (SELECT id FROM volunteers WHERE user_id = auth.uid()))
WITH CHECK (volunteer_id IN (SELECT id FROM volunteers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all exam schedules"
ON public.exam_schedules
FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'supervisor'::user_role));

CREATE POLICY "Admins can manage exam schedules"
ON public.exam_schedules
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- RLS policies for system_settings
CREATE POLICY "Anyone can view system settings"
ON public.system_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage system settings"
ON public.system_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Create trigger for updating updated_at
CREATE TRIGGER update_exam_schedules_updated_at
  BEFORE UPDATE ON public.exam_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();