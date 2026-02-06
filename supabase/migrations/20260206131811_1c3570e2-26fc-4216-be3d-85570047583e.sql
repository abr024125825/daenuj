
-- Create enum for disability exam status
CREATE TYPE public.disability_exam_status AS ENUM ('pending', 'assigned', 'confirmed', 'completed', 'cancelled');

-- Create enum for special needs types
CREATE TYPE public.special_need_type AS ENUM ('reader', 'extra_time', 'companion', 'scribe', 'separate_room', 'assistive_technology', 'other');

-- Create table for students with disabilities
CREATE TABLE public.disability_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    university_id TEXT NOT NULL UNIQUE,
    disability_type TEXT,
    disability_code TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_by UUID NOT NULL
);

-- Create table for disability exams
CREATE TABLE public.disability_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.disability_students(id) ON DELETE CASCADE NOT NULL,
    course_name TEXT NOT NULL,
    course_code TEXT,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    extra_time_minutes INTEGER DEFAULT 0,
    location TEXT,
    special_needs special_need_type[] DEFAULT '{}',
    special_needs_notes TEXT,
    status disability_exam_status DEFAULT 'pending' NOT NULL,
    semester_id UUID REFERENCES public.academic_semesters(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_by UUID NOT NULL
);

-- Create table for volunteer assignments to disability exams
CREATE TABLE public.disability_exam_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.disability_exams(id) ON DELETE CASCADE NOT NULL,
    volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE CASCADE NOT NULL,
    assigned_role special_need_type NOT NULL,
    status disability_exam_status DEFAULT 'assigned' NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    assigned_by UUID NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    UNIQUE(exam_id, volunteer_id, assigned_role)
);

-- Create table for activity logs
CREATE TABLE public.disability_exam_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.disability_exams(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES public.disability_exam_assignments(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    performed_by UUID NOT NULL,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    ip_address TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.disability_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disability_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disability_exam_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disability_exam_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disability_students
CREATE POLICY "Admins can manage disability students"
ON public.disability_students FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Volunteers can view assigned students"
ON public.disability_students FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.disability_exam_assignments dea
        JOIN public.disability_exams de ON de.id = dea.exam_id
        JOIN public.volunteers v ON v.id = dea.volunteer_id
        WHERE de.student_id = disability_students.id
        AND v.user_id = auth.uid()
    )
);

-- RLS Policies for disability_exams
CREATE POLICY "Admins can manage disability exams"
ON public.disability_exams FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Volunteers can view assigned exams"
ON public.disability_exams FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.disability_exam_assignments dea
        JOIN public.volunteers v ON v.id = dea.volunteer_id
        WHERE dea.exam_id = disability_exams.id
        AND v.user_id = auth.uid()
    )
);

-- RLS Policies for disability_exam_assignments
CREATE POLICY "Admins can manage assignments"
ON public.disability_exam_assignments FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Volunteers can view own assignments"
ON public.disability_exam_assignments FOR SELECT
USING (volunteer_id = get_volunteer_id(auth.uid()));

CREATE POLICY "Volunteers can update own assignments"
ON public.disability_exam_assignments FOR UPDATE
USING (volunteer_id = get_volunteer_id(auth.uid()));

-- RLS Policies for disability_exam_logs
CREATE POLICY "Admins can view all logs"
ON public.disability_exam_logs FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Admins can insert logs"
ON public.disability_exam_logs FOR INSERT
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_disability_exams_student ON public.disability_exams(student_id);
CREATE INDEX idx_disability_exams_date ON public.disability_exams(exam_date);
CREATE INDEX idx_disability_exams_status ON public.disability_exams(status);
CREATE INDEX idx_disability_exam_assignments_exam ON public.disability_exam_assignments(exam_id);
CREATE INDEX idx_disability_exam_assignments_volunteer ON public.disability_exam_assignments(volunteer_id);
CREATE INDEX idx_disability_exam_logs_exam ON public.disability_exam_logs(exam_id);

-- Create function to check volunteer availability conflicts
CREATE OR REPLACE FUNCTION public.check_volunteer_exam_conflict(
    _volunteer_id UUID,
    _exam_date DATE,
    _start_time TIME,
    _end_time TIME,
    _exclude_assignment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM disability_exam_assignments dea
        JOIN disability_exams de ON de.id = dea.exam_id
        WHERE dea.volunteer_id = _volunteer_id
        AND de.exam_date = _exam_date
        AND dea.status NOT IN ('cancelled', 'completed')
        AND (dea.id IS DISTINCT FROM _exclude_assignment_id)
        AND (
            (_start_time >= de.start_time AND _start_time < de.end_time)
            OR (_end_time > de.start_time AND _end_time <= de.end_time)
            OR (_start_time <= de.start_time AND _end_time >= de.end_time)
        )
    );
END;
$$;

-- Create function to get available volunteers for an exam
CREATE OR REPLACE FUNCTION public.get_available_volunteers_for_exam(
    _exam_date DATE,
    _start_time TIME,
    _end_time TIME
)
RETURNS TABLE(volunteer_id UUID, user_id UUID, full_name TEXT, availability_score INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id as volunteer_id,
        v.user_id,
        va.first_name || ' ' || va.father_name || ' ' || va.family_name as full_name,
        CASE 
            WHEN NOT check_volunteer_exam_conflict(v.id, _exam_date, _start_time, _end_time) THEN 100
            ELSE 0
        END as availability_score
    FROM volunteers v
    JOIN volunteer_applications va ON va.id = v.application_id
    WHERE v.is_active = true
    AND NOT check_volunteer_exam_conflict(v.id, _exam_date, _start_time, _end_time)
    ORDER BY availability_score DESC;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_disability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_disability_students_updated_at
BEFORE UPDATE ON public.disability_students
FOR EACH ROW EXECUTE FUNCTION public.update_disability_updated_at();

CREATE TRIGGER update_disability_exams_updated_at
BEFORE UPDATE ON public.disability_exams
FOR EACH ROW EXECUTE FUNCTION public.update_disability_updated_at();
