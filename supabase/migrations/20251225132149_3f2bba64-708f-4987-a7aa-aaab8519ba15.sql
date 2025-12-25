-- Create enum types
CREATE TYPE public.user_role AS ENUM ('admin', 'supervisor', 'volunteer');
CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.opportunity_status AS ENUM ('draft', 'published', 'completed');
CREATE TYPE public.time_slot AS ENUM ('morning', 'afternoon', 'evening');

-- Create profiles table for all users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'volunteer',
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table for role management (security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create faculties table
CREATE TABLE public.faculties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create majors table
CREATE TABLE public.majors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID REFERENCES public.faculties(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(faculty_id, name)
);

-- Create volunteer applications table
CREATE TABLE public.volunteer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  father_name TEXT NOT NULL,
  grandfather_name TEXT NOT NULL,
  family_name TEXT NOT NULL,
  university_email TEXT NOT NULL UNIQUE,
  phone_number TEXT NOT NULL,
  university_id TEXT NOT NULL UNIQUE,
  faculty_id UUID REFERENCES public.faculties(id) NOT NULL,
  major_id UUID REFERENCES public.majors(id) NOT NULL,
  academic_year TEXT NOT NULL,
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  previous_experience TEXT,
  motivation TEXT NOT NULL,
  availability JSONB DEFAULT '[]',
  status application_status DEFAULT 'pending' NOT NULL,
  rejection_reason TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create volunteers table (approved applications become volunteers)
CREATE TABLE public.volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  application_id UUID REFERENCES public.volunteer_applications(id) NOT NULL UNIQUE,
  total_hours NUMERIC DEFAULT 0,
  opportunities_completed INTEGER DEFAULT 0,
  rating NUMERIC(3,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create opportunities table
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT NOT NULL,
  required_volunteers INTEGER NOT NULL DEFAULT 1,
  faculty_restriction UUID REFERENCES public.faculties(id),
  status opportunity_status DEFAULT 'draft' NOT NULL,
  qr_code_active BOOLEAN DEFAULT false,
  qr_code_token TEXT,
  qr_closed_at TIMESTAMP WITH TIME ZONE,
  qr_closed_by UUID REFERENCES auth.users(id),
  qr_reopen_reason TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create opportunity registrations table
CREATE TABLE public.opportunity_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
  volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE CASCADE NOT NULL,
  status application_status DEFAULT 'pending' NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  UNIQUE(opportunity_id, volunteer_id)
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
  volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE CASCADE NOT NULL,
  registration_id UUID REFERENCES public.opportunity_registrations(id) ON DELETE CASCADE NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  check_in_method TEXT DEFAULT 'qr_code',
  manual_token TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  UNIQUE(opportunity_id, volunteer_id)
);

-- Create certificate templates table
CREATE TABLE public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_html TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create certificates table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) NOT NULL,
  template_id UUID REFERENCES public.certificate_templates(id),
  hours NUMERIC NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  certificate_number TEXT NOT NULL UNIQUE,
  UNIQUE(volunteer_id, opportunity_id)
);

-- Create training courses table
CREATE TABLE public.training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create training content table
CREATE TABLE public.training_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.training_courses(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'video', 'quiz')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create volunteer training progress table
CREATE TABLE public.volunteer_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.training_courses(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES public.training_content(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(volunteer_id, course_id, content_id)
);

-- Create evaluations table
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('volunteer_feedback', 'supervisor_rating')),
  ratings JSONB NOT NULL DEFAULT '[]',
  comments TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(volunteer_id, opportunity_id, type)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

-- RLS Policies for faculties (public read)
CREATE POLICY "Anyone can view faculties" ON public.faculties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage faculties" ON public.faculties FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for majors (public read)
CREATE POLICY "Anyone can view majors" ON public.majors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage majors" ON public.majors FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for volunteer_applications
CREATE POLICY "Users can view own application" ON public.volunteer_applications FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all applications" ON public.volunteer_applications FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY "Users can insert own application" ON public.volunteer_applications FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update applications" ON public.volunteer_applications FOR UPDATE TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));

-- RLS Policies for volunteers
CREATE POLICY "Users can view own volunteer record" ON public.volunteers FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all volunteers" ON public.volunteers FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY "Admins can manage volunteers" ON public.volunteers FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for opportunities
CREATE POLICY "Anyone can view published opportunities" ON public.opportunities FOR SELECT TO authenticated 
  USING (status = 'published' OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY "Admins can manage opportunities" ON public.opportunities FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));

-- RLS Policies for opportunity_registrations
CREATE POLICY "Volunteers can view own registrations" ON public.opportunity_registrations FOR SELECT TO authenticated 
  USING (volunteer_id IN (SELECT id FROM public.volunteers WHERE user_id = auth.uid()));
CREATE POLICY "Admins can view all registrations" ON public.opportunity_registrations FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY "Volunteers can register" ON public.opportunity_registrations FOR INSERT TO authenticated 
  WITH CHECK (volunteer_id IN (SELECT id FROM public.volunteers WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage registrations" ON public.opportunity_registrations FOR UPDATE TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));

-- RLS Policies for attendance
CREATE POLICY "Volunteers can view own attendance" ON public.attendance FOR SELECT TO authenticated 
  USING (volunteer_id IN (SELECT id FROM public.volunteers WHERE user_id = auth.uid()));
CREATE POLICY "Admins can view all attendance" ON public.attendance FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY "Attendance can be recorded" ON public.attendance FOR INSERT TO authenticated 
  WITH CHECK (true);

-- RLS Policies for certificates
CREATE POLICY "Volunteers can view own certificates" ON public.certificates FOR SELECT TO authenticated 
  USING (volunteer_id IN (SELECT id FROM public.volunteers WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage certificates" ON public.certificates FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));

-- RLS Policies for certificate_templates
CREATE POLICY "Anyone can view templates" ON public.certificate_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage templates" ON public.certificate_templates FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for training
CREATE POLICY "Anyone can view courses" ON public.training_courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage courses" ON public.training_courses FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view content" ON public.training_content FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage content" ON public.training_content FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Volunteers can view own progress" ON public.volunteer_training_progress FOR SELECT TO authenticated 
  USING (volunteer_id IN (SELECT id FROM public.volunteers WHERE user_id = auth.uid()));
CREATE POLICY "Volunteers can record progress" ON public.volunteer_training_progress FOR INSERT TO authenticated 
  WITH CHECK (volunteer_id IN (SELECT id FROM public.volunteers WHERE user_id = auth.uid()));

-- RLS Policies for evaluations (anonymous volunteer feedback)
CREATE POLICY "Volunteers can submit feedback" ON public.evaluations FOR INSERT TO authenticated 
  WITH CHECK (volunteer_id IN (SELECT id FROM public.volunteers WHERE user_id = auth.uid()) AND type = 'volunteer_feedback');
CREATE POLICY "Admins can view supervisor ratings only" ON public.evaluations FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') AND type = 'supervisor_rating');
CREATE POLICY "Admins can create supervisor ratings" ON public.evaluations FOR INSERT TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND type = 'supervisor_rating');

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can create notifications" ON public.notifications FOR INSERT TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'User'),
    'volunteer'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'volunteer');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.volunteer_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_volunteers_updated_at BEFORE UPDATE ON public.volunteers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate certificate number function
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  cert_number TEXT;
BEGIN
  cert_number := 'CSDC-' || to_char(now(), 'YYYY') || '-' || LPAD(nextval('certificate_seq')::TEXT, 6, '0');
  RETURN cert_number;
END;
$$;

-- Create sequence for certificate numbers
CREATE SEQUENCE IF NOT EXISTS certificate_seq START 1;