import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MFAChallengeFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function MFAChallengeForm({ onSuccess, onBack }: MFAChallengeFormProps) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setIsVerifying(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];

      if (!totpFactor) {
        toast({ title: 'Error', description: 'No authenticator found', variant: 'destructive' });
        return;
      }

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code,
      });

      if (verifyError) throw verifyError;

      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Verification failed',
        description: error.message || 'Invalid code. Please try again.',
      });
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-5">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Two-Factor Authentication</h3>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mfa-code">Verification Code</Label>
        <Input
          id="mfa-code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className="h-12 text-center text-2xl tracking-[0.5em] font-mono bg-secondary/50 border-border/50 focus:border-primary"
          autoFocus
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full h-12"
        variant="hero"
        disabled={isVerifying || code.length !== 6}
      >
        {isVerifying ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <ShieldCheck className="h-5 w-5" />
            Verify Code
          </>
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Login
      </Button>
    </form>
  );
}
