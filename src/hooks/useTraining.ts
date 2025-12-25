import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { TablesInsert } from '@/integrations/supabase/types';

export function useTrainingCourses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['training-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_courses')
        .select(`
          *,
          content:training_content(*)
        `)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const createCourse = useMutation({
    mutationFn: async (course: Omit<TablesInsert<'training_courses'>, 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('training_courses')
        .insert({ ...course, created_by: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-courses'] });
      toast({ title: 'Success', description: 'Course created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const addContent = useMutation({
    mutationFn: async (content: TablesInsert<'training_content'>) => {
      const { data, error } = await supabase
        .from('training_content')
        .insert(content)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-courses'] });
      toast({ title: 'Success', description: 'Content added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('training_courses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-courses'] });
      toast({ title: 'Success', description: 'Course deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteContent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('training_content')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-courses'] });
      toast({ title: 'Success', description: 'Content deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateCourse = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; description?: string; is_required?: boolean }) => {
      const { data, error } = await supabase
        .from('training_courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-courses'] });
      toast({ title: 'Success', description: 'Course updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    courses,
    isLoading,
    createCourse,
    addContent,
    deleteCourse,
    deleteContent,
    updateCourse,
  };
}

export function useMyTraining() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['training-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_courses')
        .select(`
          *,
          content:training_content(*)
        `)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['my-training-progress', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: volunteer } = await supabase
        .from('volunteers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!volunteer) return [];

      const { data, error } = await supabase
        .from('volunteer_training_progress')
        .select('*')
        .eq('volunteer_id', volunteer.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const markContentComplete = useMutation({
    mutationFn: async ({ courseId, contentId }: { courseId: string; contentId?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: volunteer } = await supabase
        .from('volunteers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!volunteer) throw new Error('Volunteer record not found');

      const { data, error } = await supabase
        .from('volunteer_training_progress')
        .insert({
          volunteer_id: volunteer.id,
          course_id: courseId,
          content_id: contentId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-training-progress'] });
      toast({ title: 'Progress saved' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getCompletedContentIds = () => {
    return new Set(progress?.map(p => p.content_id).filter(Boolean) || []);
  };

  const getCompletedCourseIds = () => {
    return new Set(progress?.filter(p => !p.content_id).map(p => p.course_id) || []);
  };

  const isCourseComplete = (courseId: string, contentCount: number) => {
    if (contentCount === 0) {
      return getCompletedCourseIds().has(courseId);
    }
    const completedContent = progress?.filter(p => p.course_id === courseId && p.content_id) || [];
    return completedContent.length >= contentCount;
  };

  return {
    courses,
    progress,
    isLoading: coursesLoading || progressLoading,
    markContentComplete,
    getCompletedContentIds,
    getCompletedCourseIds,
    isCourseComplete,
  };
}
