import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function usePsychologicalProfiles() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['psych-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('psychological_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createProfile = useMutation({
    mutationFn: async (profile: {
      student_name: string;
      university_id: string;
      phone?: string;
      faculty?: string;
      academic_year?: string;
      disability_type?: string;
      referral_source?: string;
    }) => {
      const { data, error } = await supabase
        .from('psychological_profiles')
        .insert({ ...profile, created_by: user!.id, status: 'active' })
        .select()
        .single();
      if (error) throw error;

      // Audit log
      await supabase.from('psychological_audit_log').insert({
        profile_id: data.id,
        action: 'profile_created',
        performed_by: user!.id,
        details: { student_name: profile.student_name },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psych-profiles'] });
      toast({ title: 'Profile Created', description: 'New student profile created successfully' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const updateProfile = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from('psychological_profiles')
        .update(updates)
        .eq('id', id);
      if (error) throw error;

      await supabase.from('psychological_audit_log').insert({
        profile_id: id,
        action: 'profile_updated',
        performed_by: user!.id,
        details: updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psych-profiles'] });
      toast({ title: 'Updated', description: 'Profile updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  return { profiles, profilesLoading, createProfile, updateProfile };
}

export function usePsychProfile(profileId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['psych-profile', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('psychological_profiles')
        .select('*')
        .eq('id', profileId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profileId && !!user,
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['psych-sessions', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('psychological_sessions')
        .select('*')
        .eq('profile_id', profileId!)
        .order('session_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profileId && !!user,
  });

  const { data: assessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: ['psych-assessments', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('psychological_assessments')
        .select('*')
        .eq('profile_id', profileId!)
        .order('assessed_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profileId && !!user,
  });

  const { data: treatmentPlans, isLoading: plansLoading } = useQuery({
    queryKey: ['psych-treatment-plans', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('profile_id', profileId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profileId && !!user,
  });

  const { data: interventions, isLoading: interventionsLoading } = useQuery({
    queryKey: ['psych-interventions', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intervention_logs')
        .select('*')
        .eq('profile_id', profileId!)
        .order('intervention_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profileId && !!user,
  });

  const { data: attachments, isLoading: attachmentsLoading } = useQuery({
    queryKey: ['psych-attachments', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('psychological_attachments')
        .select('*')
        .eq('profile_id', profileId!)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profileId && !!user,
  });

  // Session CRUD
  const createSession = useMutation({
    mutationFn: async (session: {
      session_date: string;
      session_type: string;
      duration_minutes: number;
      summary?: string;
      techniques_used?: string;
      homework?: string;
      private_notes?: string;
      improvement_rating?: number;
    }) => {
      const { data, error } = await supabase
        .from('psychological_sessions')
        .insert({ ...session, profile_id: profileId!, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psych-sessions', profileId] });
      toast({ title: 'Session Added' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  // Assessment CRUD
  const createAssessment = useMutation({
    mutationFn: async (assessment: {
      reason_for_visit?: string;
      main_symptoms?: string;
      problem_duration?: string;
      psychiatric_history?: string;
      medication_history?: string;
      assessment_scale?: string;
      assessment_score?: number;
      risk_level?: string;
    }) => {
      const { data, error } = await supabase
        .from('psychological_assessments')
        .insert({ ...assessment, profile_id: profileId!, assessed_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psych-assessments', profileId] });
      toast({ title: 'Assessment Saved' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  // Treatment plan CRUD
  const createTreatmentPlan = useMutation({
    mutationFn: async (plan: {
      preliminary_diagnosis?: string;
      therapeutic_approach?: string;
      short_term_goals?: string;
      long_term_goals?: string;
      expected_sessions?: number;
    }) => {
      const { data, error } = await supabase
        .from('treatment_plans')
        .insert({ ...plan, profile_id: profileId!, created_by: user!.id, plan_status: 'active' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psych-treatment-plans', profileId] });
      toast({ title: 'Treatment Plan Saved' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  // Intervention CRUD
  const createIntervention = useMutation({
    mutationFn: async (intervention: {
      intervention_type: string;
      notes?: string;
      outcome?: string;
    }) => {
      const { data, error } = await supabase
        .from('intervention_logs')
        .insert({ ...intervention, profile_id: profileId!, performed_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psych-interventions', profileId] });
      toast({ title: 'Intervention Logged' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const isLoading = profileLoading || sessionsLoading || assessmentsLoading || plansLoading || interventionsLoading || attachmentsLoading;

  return {
    profile,
    sessions,
    assessments,
    treatmentPlans,
    interventions,
    attachments,
    isLoading,
    createSession,
    createAssessment,
    createTreatmentPlan,
    createIntervention,
  };
}
