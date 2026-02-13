import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

const SESSION_KEY = 'psych_access_verified';

interface PsychAccessGateProps {
  children: React.ReactNode;
}

export function PsychAccessGate({ children }: PsychAccessGateProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check session storage
    const verified = sessionStorage.getItem(SESSION_KEY);
    if (verified === 'true') {
      setIsVerified(true);
    }
    setIsLoading(false);
  }, []);

  // Admins bypass the gate
  if (profile?.role === 'admin') {
    return <>{children}</>;
  }

  const handleVerify = async () => {
    if (!password.trim()) return;
    setIsVerifying(true);

    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'psych_access_password')
        .maybeSingle();

      if (error) throw error;

      const storedPassword = (data?.setting_value as any)?.password;

      if (!storedPassword) {
        toast({
          title: 'Not Configured',
          description: 'Clinical access password has not been set by admin. Contact your administrator.',
          variant: 'destructive',
        });
        return;
      }

      if (password === storedPassword) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        setIsVerified(true);
        toast({ title: 'Access Granted', description: 'Clinical module unlocked for this session' });
      } else {
        toast({ title: 'Access Denied', description: 'Incorrect password', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Clinical Access">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isVerified) {
    return (
      <DashboardLayout title="Clinical Access">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Clinical Data Protection</CardTitle>
              <CardDescription>
                Enter the clinical access password to view psychological support data.
                This protects sensitive patient information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerify();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="psych-password">Access Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="psych-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter clinical access password"
                      className="pl-9"
                      autoFocus
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isVerifying || !password.trim()}>
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Unlock Clinical Access
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return <>{children}</>;
}
