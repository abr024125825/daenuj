import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type Certificate = Tables<'certificates'>;
type CertificateTemplate = Tables<'certificate_templates'>;

export function useCertificateTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['certificate-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<TablesInsert<'certificate_templates'>, 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('certificate_templates')
        .insert({ ...template, created_by: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates'] });
      toast({ title: 'Success', description: 'Template created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    templates,
    isLoading,
    createTemplate,
  };
}

export function useCertificates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          volunteer:volunteers(
            id,
            application:volunteer_applications(first_name, father_name, family_name)
          ),
          opportunity:opportunities(title, date),
          template:certificate_templates(name)
        `)
        .order('issued_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const issueCertificate = useMutation({
    mutationFn: async ({
      volunteerId,
      opportunityId,
      hours,
      templateId,
    }: {
      volunteerId: string;
      opportunityId: string;
      hours: number;
      templateId?: string;
    }) => {
      // Generate certificate number using database function
      const { data: certNumber, error: certError } = await supabase
        .rpc('generate_certificate_number');
      
      if (certError) throw certError;

      const { data, error } = await supabase
        .from('certificates')
        .insert({
          volunteer_id: volunteerId,
          opportunity_id: opportunityId,
          hours,
          template_id: templateId,
          certificate_number: certNumber,
        })
        .select()
        .single();
      
      if (error) throw error;

      // Update volunteer's total hours
      const { data: volunteer } = await supabase
        .from('volunteers')
        .select('total_hours, opportunities_completed')
        .eq('id', volunteerId)
        .single();

      if (volunteer) {
        await supabase
          .from('volunteers')
          .update({
            total_hours: (volunteer.total_hours || 0) + hours,
            opportunities_completed: (volunteer.opportunities_completed || 0) + 1,
          })
          .eq('id', volunteerId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
      toast({ title: 'Success', description: 'Certificate issued successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    certificates,
    isLoading,
    issueCertificate,
  };
}

export function useMyCertificates() {
  const { user } = useAuth();

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['my-certificates', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: volunteer } = await supabase
        .from('volunteers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!volunteer) return [];

      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          opportunity:opportunities(title, date, location),
          template:certificate_templates(name, template_html)
        `)
        .eq('volunteer_id', volunteer.id)
        .order('issued_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return { certificates, isLoading };
}
