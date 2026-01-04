import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Opportunity = Tables<'opportunities'>;
type OpportunityInsert = TablesInsert<'opportunities'>;
type OpportunityUpdate = TablesUpdate<'opportunities'>;

export function useOpportunities() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: opportunities, isLoading, error } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          faculty:faculties(id, name),
          registrations:opportunity_registrations(count)
        `)
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const createOpportunity = useMutation({
    mutationFn: async (opportunity: Omit<OpportunityInsert, 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('opportunities')
        .insert({ ...opportunity, created_by: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast({ title: 'Success', description: 'Opportunity created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateOpportunity = useMutation({
    mutationFn: async ({ id, ...updates }: OpportunityUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('opportunities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast({ title: 'Success', description: 'Opportunity updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const publishOpportunity = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('opportunities')
        .update({ status: 'published' })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast({ title: 'Success', description: 'Opportunity published' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const generateQRCode = useMutation({
    mutationFn: async (id: string) => {
      const token = crypto.randomUUID();
      const { data, error } = await supabase
        .from('opportunities')
        .update({ qr_code_token: token, qr_code_active: true })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast({ title: 'Success', description: 'QR code generated' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const closeQRCode = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('opportunities')
        .update({ 
          qr_code_active: false, 
          qr_closed_at: new Date().toISOString(),
          qr_closed_by: user?.id 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast({ title: 'Success', description: 'QR code closed' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const reopenQRCode = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const token = crypto.randomUUID();
      const { data, error } = await supabase
        .from('opportunities')
        .update({ 
          qr_code_active: true,
          qr_code_token: token,
          qr_reopen_reason: reason,
          qr_closed_at: null,
          qr_closed_by: null
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast({ title: 'Success', description: 'QR code reopened' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteOpportunity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast({ title: 'Success', description: 'Opportunity deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const completeOpportunity = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('opportunities')
        .update({ status: 'completed' })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast({ title: 'Success', description: 'Opportunity marked as completed' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    opportunities,
    isLoading,
    error,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    publishOpportunity,
    completeOpportunity,
    generateQRCode,
    closeQRCode,
    reopenQRCode,
  };
}

export function useOpportunityRegistrations(opportunityId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: registrations, isLoading } = useQuery({
    queryKey: ['opportunity-registrations', opportunityId],
    queryFn: async () => {
      if (!opportunityId) return [];
      const { data, error } = await supabase
        .from('opportunity_registrations')
        .select(`
          *,
          volunteer:volunteers(
            id,
            user_id,
            application:volunteer_applications(first_name, father_name, family_name, university_id)
          )
        `)
        .eq('opportunity_id', opportunityId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!opportunityId,
  });

  const registerForOpportunity = useMutation({
    mutationFn: async ({ opportunityId, volunteerId }: { opportunityId: string; volunteerId: string }) => {
      // Check if volunteer has completed all required training courses
      const { data: requiredCourses } = await supabase
        .from('training_courses')
        .select('id')
        .eq('is_required', true);

      if (requiredCourses && requiredCourses.length > 0) {
        // Get required quizzes for these courses
        const { data: requiredQuizzes } = await supabase
          .from('training_quizzes')
          .select('id, course_id')
          .in('course_id', requiredCourses.map(c => c.id))
          .eq('is_required', true);

        if (requiredQuizzes && requiredQuizzes.length > 0) {
          // Check if volunteer has passed all required quizzes
          const { data: passedAttempts } = await supabase
            .from('volunteer_quiz_attempts')
            .select('quiz_id')
            .eq('volunteer_id', volunteerId)
            .eq('passed', true);

          const passedQuizIds = new Set(passedAttempts?.map(a => a.quiz_id) || []);
          const allRequiredQuizzesPassed = requiredQuizzes.every(q => passedQuizIds.has(q.id));

          if (!allRequiredQuizzesPassed) {
            throw new Error('You must complete all required training courses before registering for opportunities');
          }
        }
      }

      // Check if opportunity is full
      const { data: opportunity } = await supabase
        .from('opportunities')
        .select('required_volunteers')
        .eq('id', opportunityId)
        .single();

      const { data: approvedCount } = await supabase
        .from('opportunity_registrations')
        .select('id', { count: 'exact' })
        .eq('opportunity_id', opportunityId)
        .eq('status', 'approved');

      const isFull = (approvedCount?.length || 0) >= (opportunity?.required_volunteers || 0);

      const { data, error } = await supabase
        .from('opportunity_registrations')
        .insert({ 
          opportunity_id: opportunityId, 
          volunteer_id: volunteerId,
          status: isFull ? 'waitlisted' : 'pending'
        })
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, isWaitlisted: isFull };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      toast({ 
        title: 'Success', 
        description: data.isWaitlisted 
          ? 'Added to waiting list - spots are full' 
          : 'Registration submitted' 
      });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const approveRegistration = useMutation({
    mutationFn: async (registrationId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('opportunity_registrations')
        .update({ 
          status: 'approved', 
          approved_at: new Date().toISOString(),
          approved_by: user?.id 
        })
        .eq('id', registrationId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-registrations'] });
      toast({ title: 'Success', description: 'Registration approved' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const rejectRegistration = useMutation({
    mutationFn: async (registrationId: string) => {
      // First get the registration to know the opportunity
      const { data: registration } = await supabase
        .from('opportunity_registrations')
        .select('opportunity_id, status')
        .eq('id', registrationId)
        .single();

      const wasApproved = registration?.status === 'approved';

      const { data, error } = await supabase
        .from('opportunity_registrations')
        .update({ status: 'rejected' })
        .eq('id', registrationId)
        .select()
        .single();
      
      if (error) throw error;

      // If the rejected registration was approved, promote first waitlisted
      if (wasApproved && registration?.opportunity_id) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: waitlisted } = await supabase
          .from('opportunity_registrations')
          .select('id')
          .eq('opportunity_id', registration.opportunity_id)
          .eq('status', 'waitlisted')
          .order('registered_at', { ascending: true })
          .limit(1)
          .single();

        if (waitlisted) {
          await supabase
            .from('opportunity_registrations')
            .update({ 
              status: 'approved',
              approved_at: new Date().toISOString(),
              approved_by: user?.id 
            })
            .eq('id', waitlisted.id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-registrations'] });
      toast({ title: 'Success', description: 'Registration rejected' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const manualCheckIn = useMutation({
    mutationFn: async ({ opportunityId, volunteerId, registrationId }: { opportunityId: string; volunteerId: string; registrationId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Check if already checked in
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('opportunity_id', opportunityId)
        .eq('volunteer_id', volunteerId)
        .single();

      if (existingAttendance) throw new Error('Already checked in');

      // Record attendance
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          opportunity_id: opportunityId,
          volunteer_id: volunteerId,
          registration_id: registrationId,
          check_in_method: 'manual',
          recorded_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({ title: 'Success', description: 'Volunteer checked in manually' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    registrations,
    isLoading,
    registerForOpportunity,
    approveRegistration,
    rejectRegistration,
    manualCheckIn,
  };
}

export function useMyRegistrations() {
  const { data: registrations, isLoading } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: volunteer } = await supabase
        .from('volunteers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!volunteer) return [];

      const { data, error } = await supabase
        .from('opportunity_registrations')
        .select(`
          *,
          opportunity:opportunities(*)
        `)
        .eq('volunteer_id', volunteer.id);
      
      if (error) throw error;
      return data;
    },
  });

  return { registrations, isLoading };
}

export function useAttendance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const checkIn = useMutation({
    mutationFn: async ({ token }: { token: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get volunteer record
      const { data: volunteer } = await supabase
        .from('volunteers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!volunteer) throw new Error('Volunteer record not found');

      // Find the opportunity with this token
      const { data: opportunity } = await supabase
        .from('opportunities')
        .select('id, qr_code_active')
        .eq('qr_code_token', token)
        .single();

      if (!opportunity) throw new Error('Invalid QR code or token');
      if (!opportunity.qr_code_active) throw new Error('Check-in is closed for this opportunity');

      // Check if already registered
      const { data: registration } = await supabase
        .from('opportunity_registrations')
        .select('id, status')
        .eq('opportunity_id', opportunity.id)
        .eq('volunteer_id', volunteer.id)
        .single();

      if (!registration) throw new Error('You are not registered for this opportunity');
      if (registration.status !== 'approved') throw new Error('Your registration is not approved');

      // Check if already checked in
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('opportunity_id', opportunity.id)
        .eq('volunteer_id', volunteer.id)
        .maybeSingle();

      if (existingAttendance) throw new Error('You have already checked in');

      // Record attendance
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          opportunity_id: opportunity.id,
          volunteer_id: volunteer.id,
          registration_id: registration.id,
          check_in_method: 'qr_code',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['opportunity-registrations'] });
      toast({ title: 'Success', description: 'Check-in successful!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return { checkIn };
}
