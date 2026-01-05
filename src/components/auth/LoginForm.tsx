import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [showDemoInfo, setShowDemoInfo] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });
      navigate('/dashboard');
    } else {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: result.error || "Invalid credentials",
      });
    }

    setIsLoading(false);
  };

  const handleCreateDemoAccounts = async () => {
    setIsCreatingDemo(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-test-users');
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Demo Accounts Ready",
        description: "Admin: admin@ju.edu.jo / Admin123! | Volunteer: volunteer@ju.edu.jo / Volunteer123!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create demo accounts",
      });
    } finally {
      setIsCreatingDemo(false);
    }
  };

  const fillDemoCredentials = (role: 'admin' | 'volunteer') => {
    if (role === 'admin') {
      setEmail('admin@ju.edu.jo');
      setPassword('Admin123!');
    } else {
      setEmail('volunteer@ju.edu.jo');
      setPassword('Volunteer123!');
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-sm font-medium">
          Email
        </Label>
        <Input
          id="login-email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 bg-secondary/50 border-border/50 focus:border-primary transition-colors"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password" className="text-sm font-medium">
          Password
        </Label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 bg-secondary/50 border-border/50 focus:border-primary transition-colors pr-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12"
        variant="hero"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <LogIn className="h-5 w-5" />
            Sign In
          </>
        )}
      </Button>

      {/* Demo Account Section */}
      <Collapsible open={showDemoInfo} onOpenChange={setShowDemoInfo}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground">
            <Info className="h-4 w-4" />
            Demo Accounts
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 mt-3">
          <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm space-y-2">
            <p className="font-medium text-foreground">Test Credentials:</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Admin:</span>
                <Button 
                  type="button" 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0"
                  onClick={() => fillDemoCredentials('admin')}
                >
                  admin@ju.edu.jo / Admin123!
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Volunteer:</span>
                <Button 
                  type="button" 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0"
                  onClick={() => fillDemoCredentials('volunteer')}
                >
                  volunteer@ju.edu.jo / Volunteer123!
                </Button>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={handleCreateDemoAccounts}
              disabled={isCreatingDemo}
            >
              {isCreatingDemo ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Demo Accounts'
              )}
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </form>
  );
}
