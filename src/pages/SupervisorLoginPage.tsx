import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Loader2, Shield, UserPlus, Heart, Users, Award, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function SupervisorLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
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

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/register" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Become a Volunteer
            </Link>
          </nav>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="container mx-auto px-4 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="animate-slide-up">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                  <Shield className="h-4 w-4" />
                  Supervisor Portal
                </div>
                <h1 className="text-4xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6">
                  Manage Your <span className="text-primary">Opportunities</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                  Access your supervisor dashboard to manage volunteer attendance, 
                  track participation, and oversee your assigned opportunities.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    size="xl"
                    onClick={() => navigate('/')}
                    className="gap-2"
                  >
                    <ArrowRight className="h-5 w-5" />
                    Back to Main Login
                  </Button>
                </div>

                {/* Features */}
                <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Manage Volunteers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-accent" />
                    <span className="text-sm text-muted-foreground">Track Attendance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-foreground" />
                    <span className="text-sm text-muted-foreground">View Reports</span>
                  </div>
                </div>
              </div>

              {/* Right Content - Login Card */}
              <div className="lg:pl-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="bg-card rounded-2xl shadow-xl border border-border p-8 max-w-md mx-auto">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-foreground">Supervisor Login</h2>
                    <p className="text-muted-foreground mt-2">Sign in to your supervisor account</p>
                  </div>

                  {/* Login Form */}
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="supervisor-email" className="text-sm font-medium">
                        Email
                      </Label>
                      <Input
                        id="supervisor-email"
                        type="email"
                        placeholder="supervisor@university.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 bg-secondary/50 border-border/50 focus:border-primary transition-colors"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supervisor-password" className="text-sm font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="supervisor-password"
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

                  {/* Footer */}
                  <div className="mt-6 pt-4 border-t border-border text-center">
                    <p className="text-sm text-muted-foreground">
                      This portal is for authorized supervisors only.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-card border-t border-border py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <Logo size="sm" />
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Community Service & Development Center. University of Jordan.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
