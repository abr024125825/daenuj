import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, ShieldOff, QrCode, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function MFASetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      const verifiedFactor = data?.totp?.find(f => f.status === 'verified');
      setIsEnrolled(!!verifiedFactor);
      if (verifiedFactor) {
        setFactorId(verifiedFactor.id);
      }
    } catch (error) {
      console.error('Error checking MFA status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      // Remove any existing unverified factors to avoid name conflict
      const { data: existing } = await supabase.auth.mfa.listFactors();
      if (existing?.totp) {
        for (const factor of existing.totp) {
          if ((factor.status as string) === 'unverified') {
            await supabase.auth.mfa.unenroll({ factorId: factor.id });
          }
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleVerifyEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || verifyCode.length !== 6) return;

    setIsVerifying(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (verifyError) throw verifyError;

      setIsEnrolled(true);
      setQrCode(null);
      setSecret(null);
      setVerifyCode('');
      toast({ title: 'Success', description: 'Two-factor authentication enabled successfully!' });
    } catch (error: any) {
      toast({ title: 'Verification Failed', description: error.message, variant: 'destructive' });
      setVerifyCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUnenroll = async () => {
    if (!factorId) return;
    setIsUnenrolling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;

      setIsEnrolled(false);
      setFactorId(null);
      toast({ title: 'Success', description: 'Two-factor authentication has been disabled.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsUnenrolling(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
              <CardDescription>
                Secure your account with an authenticator app
              </CardDescription>
            </div>
          </div>
          <Badge variant={isEnrolled ? 'default' : 'secondary'}>
            {isEnrolled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEnrolled && !qrCode ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your account is protected with two-factor authentication. You'll need your authenticator app to sign in.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleUnenroll}
              disabled={isUnenrolling}
            >
              {isUnenrolling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ShieldOff className="h-4 w-4 mr-2" />
              )}
              Disable 2FA
            </Button>
          </div>
        ) : qrCode ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">1. Scan this QR code with your authenticator app</p>
              <p className="text-xs text-muted-foreground">
                Use Google Authenticator, Authy, or any TOTP-compatible app
              </p>
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Or enter this secret key manually:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono break-all">
                  {secret}
                </code>
                <Button variant="outline" size="icon" onClick={copySecret}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <form onSubmit={handleVerifyEnrollment} className="space-y-3">
              <div className="space-y-2">
                <Label>2. Enter the 6-digit code to verify</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-xl tracking-[0.5em] font-mono"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setQrCode(null);
                    setSecret(null);
                    setVerifyCode('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isVerifying || verifyCode.length !== 6}
                >
                  {isVerifying ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Enable 2FA
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account. When enabled, you'll need to enter a code from your authenticator app each time you sign in.
            </p>
            <Button onClick={handleEnroll} disabled={isEnrolling}>
              {isEnrolling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <QrCode className="h-4 w-4 mr-2" />
              )}
              Set Up 2FA
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
