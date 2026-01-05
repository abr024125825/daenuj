import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BadgeTransaction {
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
}

// Generate a random 6-character code
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function useBadgeTransactions(opportunityId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['badge-transactions', opportunityId],
    queryFn: async () => {
      if (!opportunityId) return [];

      const { data, error } = await supabase
        .from('badge_transactions')
        .select(`
          *,
          volunteer:volunteers(
            id,
            user_id,
            application:volunteer_applications(
              first_name,
              father_name,
              family_name,
              university_id,
              phone_number,
              university_email
            )
          )
        `)
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!opportunityId,
  });

  // Create badge transactions for all approved volunteers
  const initializeBadges = useMutation({
    mutationFn: async (registrations: { volunteerId: string; registrationId: string }[]) => {
      if (!opportunityId) throw new Error('Opportunity ID required');

      const transactions = registrations.map(reg => ({
        volunteer_id: reg.volunteerId,
        opportunity_id: opportunityId,
        registration_id: reg.registrationId,
        checkout_code: generateCode(),
        status: 'pending' as const,
      }));

      const { error } = await supabase
        .from('badge_transactions')
        .upsert(transactions, { onConflict: 'volunteer_id,opportunity_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badge-transactions', opportunityId] });
      toast({ title: 'Success', description: 'Badge codes generated for all volunteers' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Confirm checkout with code
  const confirmCheckout = useMutation({
    mutationFn: async ({ 
      transactionId, 
      code, 
      condition 
    }: { 
      transactionId: string; 
      code: string; 
      condition: 'good' | 'damaged';
    }) => {
      // First verify the code
      const { data: transaction, error: fetchError } = await supabase
        .from('badge_transactions')
        .select('checkout_code, status')
        .eq('id', transactionId)
        .single();

      if (fetchError) throw fetchError;
      if (transaction.checkout_code !== code) {
        throw new Error('Invalid checkout code');
      }
      if (transaction.status !== 'pending') {
        throw new Error('Badge already checked out');
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('badge_transactions')
        .update({
          checkout_time: new Date().toISOString(),
          checkout_condition: condition,
          checkout_confirmed_at: new Date().toISOString(),
          checkout_confirmed_by: user?.id,
          status: 'checked_out',
        })
        .eq('id', transactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badge-transactions', opportunityId] });
      toast({ title: 'Success', description: 'Badge checkout confirmed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Admin confirm checkout without volunteer code
  const adminConfirmCheckout = useMutation({
    mutationFn: async ({ 
      transactionId, 
      condition 
    }: { 
      transactionId: string; 
      condition: 'good' | 'damaged';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('badge_transactions')
        .update({
          checkout_time: new Date().toISOString(),
          checkout_condition: condition,
          checkout_confirmed_at: new Date().toISOString(),
          checkout_confirmed_by: user?.id,
          status: 'checked_out',
        })
        .eq('id', transactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badge-transactions', opportunityId] });
      toast({ title: 'Success', description: 'Badge checkout confirmed by admin' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Confirm return
  const confirmReturn = useMutation({
    mutationFn: async ({ 
      transactionId, 
      condition,
      notes
    }: { 
      transactionId: string; 
      condition: 'good' | 'damaged' | 'lost';
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('badge_transactions')
        .update({
          return_code: generateCode(),
          return_time: new Date().toISOString(),
          return_condition: condition,
          return_confirmed_at: new Date().toISOString(),
          return_confirmed_by: user?.id,
          status: condition === 'lost' ? 'lost' : 'returned',
          notes: notes || null,
        })
        .eq('id', transactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badge-transactions', opportunityId] });
      toast({ title: 'Success', description: 'Badge return confirmed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Get statistics
  const stats = {
    total: transactions?.length || 0,
    pending: transactions?.filter(t => t.status === 'pending').length || 0,
    checkedOut: transactions?.filter(t => t.status === 'checked_out').length || 0,
    returned: transactions?.filter(t => t.status === 'returned').length || 0,
    lost: transactions?.filter(t => t.status === 'lost').length || 0,
  };

  return {
    transactions,
    isLoading,
    stats,
    initializeBadges,
    confirmCheckout,
    adminConfirmCheckout,
    confirmReturn,
  };
}

// Hook for volunteer to check their own badge status
export function useVolunteerBadges(volunteerId?: string) {
  const { data: badges, isLoading } = useQuery({
    queryKey: ['volunteer-badges', volunteerId],
    queryFn: async () => {
      if (!volunteerId) return [];

      const { data, error } = await supabase
        .from('badge_transactions')
        .select(`
          *,
          opportunity:opportunities(
            id,
            title,
            date,
            location
          )
        `)
        .eq('volunteer_id', volunteerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!volunteerId,
  });

  return { badges, isLoading };
}
