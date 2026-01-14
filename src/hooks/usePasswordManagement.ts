import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function usePasswordManagement() {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateOwnPassword = async (newPassword: string) => {
    if (newPassword.length < 6) {
      toast({ 
        title: 'Error', 
        description: 'Password must be at least 6 characters', 
        variant: 'destructive' 
      });
      return false;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Password updated successfully' });
      return true;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const resetUserPassword = async (userEmail: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;

      toast({ 
        title: 'Success', 
        description: `Password reset email sent to ${userEmail}` 
      });
      return true;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateOwnPassword,
    resetUserPassword,
    isUpdating
  };
}
