import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CertificateVerificationLog {
  id: string;
  certificate_id: string;
  verified_at: string;
  ip_address: string | null;
  user_agent: string | null;
  certificate?: {
    certificate_number: string;
    volunteer?: {
      application?: {
        first_name: string;
        family_name: string;
      };
    };
    opportunity?: {
      title: string;
    };
  };
}

export function useCertificateVerifications() {
  const { data: verifications, isLoading, refetch } = useQuery({
    queryKey: ['certificate-verifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_verifications')
        .select(`
          *,
          certificate:certificates(
            certificate_number,
            volunteer:volunteers(
              application:volunteer_applications(first_name, family_name)
            ),
            opportunity:opportunities(title)
          )
        `)
        .order('verified_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as CertificateVerificationLog[];
    },
  });

  return {
    verifications,
    isLoading,
    refetch,
  };
}
