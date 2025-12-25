import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  const { login, signup } = useAuth();
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters",
      });
      setIsLoading(false);
      return;
    }

    const result = await signup(email, password, {
      first_name: firstName,
      last_name: lastName,
    });

    if (result.success) {
      toast({
        title: "Account created!",
        description: "You can now complete your volunteer application.",
      });
      navigate('/dashboard');
    } else {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: result.error || "Could not create account",
      });
    }

    setIsLoading(false);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="login">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>

      <TabsContent value="login">
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="login-email"
              type="email"
              placeholder="your.name@ju.edu.jo"
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
        </form>
      </TabsContent>

      <TabsContent value="signup">
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">
                First Name
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Mohammed"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-11 bg-secondary/50 border-border/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium">
                Last Name
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Ahmad"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-11 bg-secondary/50 border-border/50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email" className="text-sm font-medium">
              University Email
            </Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="your.name@ju.edu.jo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-secondary/50 border-border/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-secondary/50 border-border/50 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Create Account
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By signing up, you agree to our terms of service and code of conduct.
          </p>
        </form>
      </TabsContent>
    </Tabs>
  );
}
