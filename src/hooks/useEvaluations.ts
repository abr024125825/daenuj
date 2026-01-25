import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';

interface Rating {
  category: string;
  score: number;
}

export function useEvaluations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: evaluations, isLoading } = useQuery({
    queryKey: ['evaluations'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          volunteer:volunteers(
            id,
            application:volunteer_applications(first_name, family_name)
          ),
          opportunity:opportunities(title, date)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createEvaluation = useMutation({
    mutationFn: async ({
      volunteerId,
      opportunityId,
      type,
      ratings,
      comments,
    }: {
      volunteerId: string;
      opportunityId: string;
      type: 'supervisor_rating' | 'volunteer_feedback';
      ratings: Rating[];
      comments?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('evaluations')
        .insert({
          volunteer_id: volunteerId,
          opportunity_id: opportunityId,
          type,
          ratings: ratings as unknown as Json,
          comments,
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;

      // Update volunteer rating if it's a supervisor rating
      if (type === 'supervisor_rating') {
        const avgScore = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
        
        const { data: currentVolunteer } = await supabase
          .from('volunteers')
          .select('rating')
          .eq('id', volunteerId)
          .single();

        const newRating = currentVolunteer?.rating 
          ? (Number(currentVolunteer.rating) + avgScore) / 2 
          : avgScore;

        await supabase
          .from('volunteers')
          .update({ rating: newRating })
          .eq('id', volunteerId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
      toast({ title: 'Success', description: 'Evaluation submitted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateEvaluation = useMutation({
    mutationFn: async ({
      id,
      ratings,
      comments,
    }: {
      id: string;
      ratings?: { category: string; score: number }[];
      comments?: string;
    }) => {
      const { data, error } = await supabase
        .from('evaluations')
        .update({
          ratings: ratings as unknown as Json,
          comments,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      toast({ title: 'Success', description: 'Evaluation updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteEvaluation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('evaluations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      toast({ title: 'Success', description: 'Evaluation deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    evaluations,
    isLoading,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
  };
}

export function useMyFeedback() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: feedback, isLoading } = useQuery({
    queryKey: ['my-feedback', user?.id],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!user) return [];

      const { data: volunteer } = await supabase
        .from('volunteers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!volunteer) return [];

      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          opportunity:opportunities(title, date)
        `)
        .eq('volunteer_id', volunteer.id)
        .eq('type', 'volunteer_feedback')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get opportunities eligible for feedback
  const { data: eligibleOpportunities } = useQuery({
    queryKey: ['eligible-feedback-opportunities', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: volunteer } = await supabase
        .from('volunteers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!volunteer) return [];

      // Get attended opportunities
      const { data: attendance } = await supabase
        .from('attendance')
        .select(`
          opportunity_id,
          opportunity:opportunities(id, title, date)
        `)
        .eq('volunteer_id', volunteer.id);

      // Get already submitted feedback
      const { data: submitted } = await supabase
        .from('evaluations')
        .select('opportunity_id')
        .eq('volunteer_id', volunteer.id)
        .eq('type', 'volunteer_feedback');

      const submittedIds = new Set(submitted?.map(s => s.opportunity_id) || []);

      return attendance?.filter(a => !submittedIds.has(a.opportunity_id)) || [];
    },
    enabled: !!user,
  });

  const submitFeedback = useMutation({
    mutationFn: async ({
      opportunityId,
      ratings,
      comments,
    }: {
      opportunityId: string;
      ratings: Rating[];
      comments?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: volunteer } = await supabase
        .from('volunteers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!volunteer) throw new Error('Volunteer record not found');

      const { data, error } = await supabase
        .from('evaluations')
        .insert({
          volunteer_id: volunteer.id,
          opportunity_id: opportunityId,
          type: 'volunteer_feedback',
          ratings: ratings as unknown as Json,
          comments,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['eligible-feedback-opportunities'] });
      toast({ title: 'Success', description: 'Feedback submitted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    feedback,
    eligibleOpportunities,
    isLoading,
    submitFeedback,
  };
}
