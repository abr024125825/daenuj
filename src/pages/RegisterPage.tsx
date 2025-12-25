import { useState } from 'react';
import { Logo } from '@/components/Logo';
import { RegistrationWizard } from '@/components/registration/RegistrationWizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Loader2, UserPlus, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, signup, login, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [isSignup, setIsSignup] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (isSignup) {
      const result = await signup(email, password, { first_name: firstName, last_name: lastName });
      if (result.success) {
        toast({ title: 'Account created!', description: 'You can now fill out your volunteer application.' });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    } else {
      const result = await login(email, password);
      if (result.success) {
        toast({ title: 'Welcome back!', description: 'Continue with your application.' });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    }
    setIsSubmitting(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo size="sm" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Volunteer Registration
            </h1>
            <p className="text-muted-foreground">
              {isAuthenticated ? 'Complete the form below to apply as a volunteer' : 'Create an account first, then fill out your application'}
            </p>
          </div>
          
          {!isAuthenticated ? (
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>{isSignup ? 'Create Account' : 'Sign In'}</CardTitle>
                <CardDescription>
                  {isSignup ? 'Create an account to submit your volunteer application' : 'Sign in to continue your application'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAuth} className="space-y-4">
                  {isSignup && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : isSignup ? <UserPlus className="h-4 w-4 mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                    {isSignup ? 'Create Account' : 'Sign In'}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button type="button" className="text-primary hover:underline" onClick={() => setIsSignup(!isSignup)}>
                      {isSignup ? 'Sign in' : 'Sign up'}
                    </button>
                  </p>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-card rounded-2xl shadow-lg border border-border p-6 md:p-8">
              <RegistrationWizard onClose={() => navigate('/')} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
