import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BadgeTransactionWithDetails {
  id: string;
  volunteer_id: string;
  opportunity_id: string;
  registration_id: string;
  checkout_code: string;
  checkout_time: string | null;
  checkout_condition: 'good' | 'damaged' | null;
  checkout_confirmed_at: string | null;
  checkout_confirmed_by: string | null;
  return_code: string | null;
  return_time: string | null;
  return_condition: 'good' | 'damaged' | 'lost' | null;
  return_confirmed_at: string | null;
  return_confirmed_by: string | null;
  status: 'pending' | 'checked_out' | 'returned' | 'lost';
  notes: string | null;
  created_at: string;
  updated_at: string;
  volunteer: {
    id: string;
    application: {
      first_name: string;
      father_name: string;
      family_name: string;
      university_id: string;
      phone_number: string;
      university_email: string;
    };
  };
  opportunity: {
    id: string;
    title: string;
    date: string;
    location: string;
  };
}

export function useAllBadgeTransactions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['all-badge-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badge_transactions')
        .select(`
          *,
          volunteer:volunteers(
            id,
            application:volunteer_applications(
              first_name,
              father_name,
              family_name,
              university_id,
              phone_number,
              university_email
            )
          ),
          opportunity:opportunities(
            id,
            title,
            date,
            location
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BadgeTransactionWithDetails[];
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from('badge_transactions')
        .delete()
        .eq('id', transactionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-badge-transactions'] });
      toast({ title: 'Success', description: 'Badge transaction deleted' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Calculate statistics
  const stats = {
    total: transactions?.length || 0,
    pending: transactions?.filter(t => t.status === 'pending').length || 0,
    checkedOut: transactions?.filter(t => t.status === 'checked_out').length || 0,
    returned: transactions?.filter(t => t.status === 'returned').length || 0,
    lost: transactions?.filter(t => t.status === 'lost').length || 0,
    damaged: transactions?.filter(t => 
      t.checkout_condition === 'damaged' || t.return_condition === 'damaged'
    ).length || 0,
  };

  // Get unique opportunities for filtering
  const opportunities = Array.from(
    new Map(
      transactions?.map(t => [t.opportunity_id, t.opportunity]) || []
    ).values()
  ).filter(Boolean);

  return {
    transactions,
    isLoading,
    stats,
    opportunities,
    refetch,
    deleteTransaction,
  };
}
