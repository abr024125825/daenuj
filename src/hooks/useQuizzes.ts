import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  points: number;
  order_index: number;
}

interface Quiz {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  passing_score: number;
  time_limit_minutes: number | null;
  max_attempts: number;
  is_required: boolean;
  order_index: number;
  questions?: QuizQuestion[];
}

interface QuizAttempt {
  id: string;
  volunteer_id: string;
  quiz_id: string;
  answers: Record<string, string>;
  score: number;
  passed: boolean;
  started_at: string;
  completed_at: string | null;
}

export function useQuizzes(courseId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['quizzes', courseId],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      let query = supabase
        .from('training_quizzes')
        .select(`
          *,
          questions:training_quiz_questions(*)
        `)
        .order('order_index', { ascending: true });

      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Quiz[];
    },
  });

  const createQuiz = useMutation({
    mutationFn: async (quiz: Omit<Quiz, 'id' | 'questions'>) => {
      const { data, error } = await supabase
        .from('training_quizzes')
        .insert(quiz)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast({ title: 'Quiz created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateQuiz = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Quiz> & { id: string }) => {
      const { data, error } = await supabase
        .from('training_quizzes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast({ title: 'Quiz updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteQuiz = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('training_quizzes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast({ title: 'Quiz deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const addQuestion = useMutation({
    mutationFn: async (question: Omit<QuizQuestion, 'id'> & { quiz_id: string }) => {
      const { data, error } = await supabase
        .from('training_quiz_questions')
        .insert(question)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast({ title: 'Question added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateQuestion = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QuizQuestion> & { id: string }) => {
      const { data, error } = await supabase
        .from('training_quiz_questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast({ title: 'Question updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('training_quiz_questions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast({ title: 'Question deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    quizzes,
    isLoading,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    addQuestion,
    updateQuestion,
    deleteQuestion,
  };
}

export function useMyQuizAttempts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: attempts, isLoading } = useQuery({
    queryKey: ['my-quiz-attempts', user?.id],
    staleTime: 3 * 60 * 1000,
    queryFn: async () => {
      if (!user) return [];

      const { data: volunteer } = await supabase
        .from('volunteers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!volunteer) return [];

      const { data, error } = await supabase
        .from('volunteer_quiz_attempts')
        .select('*')
        .eq('volunteer_id', volunteer.id);
      
      if (error) throw error;
      return data as QuizAttempt[];
    },
    enabled: !!user,
  });

  const submitQuiz = useMutation({
    mutationFn: async ({ 
      quizId, 
      answers, 
      questions 
    }: { 
      quizId: string; 
      answers: Record<string, string>; 
      questions: QuizQuestion[];
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: volunteer } = await supabase
        .from('volunteers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!volunteer) throw new Error('Volunteer record not found');

      // Calculate score
      let correctAnswers = 0;
      let totalPoints = 0;
      
      questions.forEach(q => {
        totalPoints += q.points;
        if (answers[q.id] === q.correct_answer) {
          correctAnswers += q.points;
        }
      });

      const scorePercentage = totalPoints > 0 ? Math.round((correctAnswers / totalPoints) * 100) : 0;

      // Get quiz passing score
      const { data: quiz } = await supabase
        .from('training_quizzes')
        .select('passing_score')
        .eq('id', quizId)
        .single();

      const passed = scorePercentage >= (quiz?.passing_score || 70);

      const { data, error } = await supabase
        .from('volunteer_quiz_attempts')
        .insert({
          volunteer_id: volunteer.id,
          quiz_id: quizId,
          answers,
          score: scorePercentage,
          passed,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-quiz-attempts'] });
      if (data.passed) {
        toast({ 
          title: 'Congratulations! 🎉', 
          description: `You passed the quiz with a score of ${data.score}%` 
        });
      } else {
        toast({ 
          title: 'Try again', 
          description: `Your score is ${data.score}%. Try again to pass.`,
          variant: 'destructive'
        });
      }
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getQuizAttempts = (quizId: string) => {
    return attempts?.filter(a => a.quiz_id === quizId) || [];
  };

  const hasPassedQuiz = (quizId: string) => {
    return attempts?.some(a => a.quiz_id === quizId && a.passed) || false;
  };

  const getAttemptCount = (quizId: string) => {
    return attempts?.filter(a => a.quiz_id === quizId).length || 0;
  };

  return {
    attempts,
    isLoading,
    submitQuiz,
    getQuizAttempts,
    hasPassedQuiz,
    getAttemptCount,
  };
}
