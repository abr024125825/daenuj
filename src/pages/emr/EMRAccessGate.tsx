import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

const EMR_SESSION_KEY = 'emr_access_verified';

interface EMRAccessGateProps {
  children: React.ReactNode;
}

export function EMRAccessGate({ children }: EMRAccessGateProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPassword, setHasPassword] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  useEffect(() => {
    const verified = sessionStorage.getItem(EMR_SESSION_KEY);
    if (verified === 'true') {
      setIsVerified(true);
    }
    // Check if user has EMR password set
    checkPassword();
  }, [user]);

  const checkPassword = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('emr_password')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      setHasPassword(!!data?.emr_password);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  // Admins bypass
  if (profile?.role === 'admin') {
    return <>{children}</>;
  }

  const handleVerify = async () => {
    if (!password.trim()) return;
    setIsVerifying(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('emr_password')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;

      if (password === data?.emr_password) {
        sessionStorage.setItem(EMR_SESSION_KEY, 'true');
        setIsVerified(true);
        toast({ title: 'EMR Access Granted' });
      } else {
        toast({ title: 'Access Denied', description: 'Incorrect EMR password', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword.trim() || newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 4) {
      toast({ title: 'Error', description: 'Password must be at least 4 characters', variant: 'destructive' });
      return;
    }
    setIsSettingPassword(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ emr_password: newPassword })
        .eq('user_id', user!.id);
      if (error) throw error;
      setHasPassword(true);
      toast({ title: 'EMR Password Set', description: 'You can now access EMR with this password' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSettingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="EMR Access">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (isVerified) return <>{children}</>;

  // If user hasn't set EMR password yet
  if (!hasPassword) {
    return (
      <DashboardLayout title="EMR Setup">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Set Your EMR Password</CardTitle>
              <CardDescription>
                You must create a separate EMR password to access patient records. This adds an extra layer of security for clinical data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>New EMR Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter EMR password (min 4 chars)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm EMR password"
                  />
                </div>
                <Button onClick={handleSetPassword} disabled={isSettingPassword} className="w-full">
                  {isSettingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                  Set EMR Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Password entry screen
  return (
    <DashboardLayout title="EMR Access">
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>EMR Access Required</CardTitle>
            <CardDescription>
              Enter your EMR password to access patient records. This protects sensitive clinical data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emr-password">EMR Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="emr-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your EMR password"
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isVerifying || !password.trim()}>
                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                Unlock EMR
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
