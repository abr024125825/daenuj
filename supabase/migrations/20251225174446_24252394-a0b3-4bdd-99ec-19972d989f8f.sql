-- Create training quizzes table
CREATE TABLE public.training_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER NOT NULL DEFAULT 70,
  time_limit_minutes INTEGER,
  max_attempts INTEGER DEFAULT 3,
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz questions table
CREATE TABLE public.training_quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.training_quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create volunteer quiz attempts table
CREATE TABLE public.volunteer_quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.training_quizzes(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.training_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies for training_quizzes
CREATE POLICY "Admins can manage quizzes" ON public.training_quizzes
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Anyone can view quizzes" ON public.training_quizzes
  FOR SELECT USING (true);

-- RLS policies for training_quiz_questions
CREATE POLICY "Admins can manage quiz questions" ON public.training_quiz_questions
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Anyone can view quiz questions" ON public.training_quiz_questions
  FOR SELECT USING (true);

-- RLS policies for volunteer_quiz_attempts
CREATE POLICY "Volunteers can submit quiz attempts" ON public.volunteer_quiz_attempts
  FOR INSERT WITH CHECK (
    volunteer_id IN (SELECT id FROM volunteers WHERE user_id = auth.uid())
  );

CREATE POLICY "Volunteers can view own attempts" ON public.volunteer_quiz_attempts
  FOR SELECT USING (
    volunteer_id IN (SELECT id FROM volunteers WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all attempts" ON public.volunteer_quiz_attempts
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'supervisor'::user_role)
  );

-- Trigger for updated_at
CREATE TRIGGER update_training_quizzes_updated_at
  BEFORE UPDATE ON public.training_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();