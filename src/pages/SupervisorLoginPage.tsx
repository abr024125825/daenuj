import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Loader2, Shield, ArrowLeft } from 'lucide-react';
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
        title: "مرحباً بك!",
        description: "تم تسجيل الدخول بنجاح.",
      });
      navigate('/dashboard');
    } else {
      toast({
        variant: "destructive",
        title: "فشل تسجيل الدخول",
        description: result.error || "بيانات الاعتماد غير صحيحة",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          العودة للرئيسية
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-card rounded-2xl shadow-2xl border border-border p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-blue-600/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-10 w-10 text-blue-400" />
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                بوابة المشرفين
              </h1>
              <p className="text-muted-foreground mt-2">
                تسجيل الدخول لإدارة الفرص التطوعية
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="supervisor-email" className="text-sm font-medium">
                  البريد الإلكتروني
                </Label>
                <Input
                  id="supervisor-email"
                  type="email"
                  placeholder="supervisor@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-secondary/50 border-border/50 focus:border-blue-500 transition-colors"
                  required
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisor-password" className="text-sm font-medium">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    id="supervisor-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-secondary/50 border-border/50 focus:border-blue-500 transition-colors pr-12"
                    required
                    dir="ltr"
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
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin ml-2" />
                    جارٍ تسجيل الدخول...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 ml-2" />
                    تسجيل الدخول
                  </>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground">
                هذه البوابة مخصصة للمشرفين المعتمدين فقط.
                <br />
                إذا كنت متطوعاً، يرجى استخدام{' '}
                <Link to="/" className="text-blue-500 hover:underline">
                  صفحة تسجيل الدخول الرئيسية
                </Link>
              </p>
            </div>
          </div>

          {/* Logo */}
          <div className="mt-8 text-center">
            <Logo size="sm" />
          </div>
        </div>
      </main>
    </div>
  );
}
