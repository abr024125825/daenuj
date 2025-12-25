import { Logo } from '@/components/Logo';
import { RegistrationWizard } from '@/components/registration/RegistrationWizard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              Complete the form below to apply as a volunteer
            </p>
          </div>
          
          <div className="bg-card rounded-2xl shadow-lg border border-border p-6 md:p-8">
            <RegistrationWizard onClose={() => navigate('/')} />
          </div>
        </div>
      </main>
    </div>
  );
}
