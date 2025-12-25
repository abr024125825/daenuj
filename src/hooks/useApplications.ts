import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VolunteerApplication {
  id: string;
  user_id: string;
  first_name: string;
  father_name: string;
  grandfather_name: string;
  family_name: string;
  university_email: string;
  phone_number: string;
  university_id: string;
  faculty_id: string;
  major_id: string;
  academic_year: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  skills: string[];
  interests: string[];
  previous_experience: string | null;
  motivation: string;
  availability: any;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  faculty?: { id: string; name: string };
  major?: { id: string; name: string };
}

export function useVolunteerApplications(status?: 'pending' | 'approved' | 'rejected') {
  return useQuery({
    queryKey: ['volunteer-applications', status],
    queryFn: async () => {
      let query = supabase
        .from('volunteer_applications')
        .select(`
          *,
          faculty:faculties(id, name),
          major:majors(id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as VolunteerApplication[];
    },
  });
}

export function useVolunteerApplication(id: string) {
  return useQuery({
    queryKey: ['volunteer-application', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('volunteer_applications')
        .select(`
          *,
          faculty:faculties(id, name),
          major:majors(id, name)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as VolunteerApplication | null;
    },
    enabled: !!id,
  });
}

export function useMyApplication() {
  return useQuery({
    queryKey: ['my-application'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('volunteer_applications')
        .select(`
          *,
          faculty:faculties(id, name),
          major:majors(id, name)
        `)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as VolunteerApplication | null;
    },
  });
}

export function useSubmitApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (applicationData: Omit<VolunteerApplication, 'id' | 'user_id' | 'status' | 'rejection_reason' | 'reviewed_at' | 'reviewed_by' | 'created_at' | 'updated_at' | 'faculty' | 'major'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('volunteer_applications')
        .insert({
          ...applicationData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-application'] });
      toast({
        title: 'Application Submitted!',
        description: 'Your volunteer application has been sent for review.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'Could not submit application',
      });
    },
  });
}

export function useReviewApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      applicationId, 
      status, 
      rejectionReason 
    }: { 
      applicationId: string; 
      status: 'approved' | 'rejected';
      rejectionReason?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update application status
      const { error: updateError } = await supabase
        .from('volunteer_applications')
        .update({
          status,
          rejection_reason: rejectionReason || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // If approved, create volunteer record
      if (status === 'approved') {
        const { data: application } = await supabase
          .from('volunteer_applications')
          .select('user_id')
          .eq('id', applicationId)
          .single();

        if (application) {
          const { error: volunteerError } = await supabase
            .from('volunteers')
            .insert({
              user_id: application.user_id,
              application_id: applicationId,
            });

          if (volunteerError) throw volunteerError;

          // Update user role to active volunteer
          const { error: roleError } = await supabase
            .from('profiles')
            .update({ is_active: true })
            .eq('user_id', application.user_id);

          if (roleError) throw roleError;
        }
      }

      return { applicationId, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-applications'] });
      toast({
        title: data.status === 'approved' ? 'Application Approved!' : 'Application Rejected',
        description: data.status === 'approved' 
          ? 'The volunteer has been added to the system.'
          : 'The application has been rejected.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Review Failed',
        description: error.message || 'Could not review application',
      });
    },
  });
}
