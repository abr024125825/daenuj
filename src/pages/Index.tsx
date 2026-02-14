import { Logo } from '@/components/Logo';
import { LoginForm } from '@/components/auth/LoginForm';
import { Button } from '@/components/ui/button';
import { UserPlus, Heart, Users, Award, ArrowRight, Accessibility } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <nav className="hidden md:flex items-center gap-6">
            <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
            <a href="#impact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Our Impact
            </a>
            <a href="#join" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Join Us
            </a>
            <Button variant="outline" size="sm" onClick={() => navigate('/verify')}>
              Verify Certificate
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/disability-exam-submit')} className="gap-1">
              <Accessibility className="h-4 w-4" />
              Disability Exams
            </Button>
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
                  <Heart className="h-4 w-4" />
                  University of Jordan
                </div>
                <h1 className="text-4xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6">
                  Make a <span className="text-primary">Difference</span> in Your Community
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                  Join the Dean of Student Affairs volunteer program and be part of a movement 
                  that transforms lives through volunteering. Your time and skills matter.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="hero"
                    size="xl"
                    onClick={() => navigate('/register')}
                    className="gap-2"
                  >
                    <UserPlus className="h-5 w-5" />
                    Become a Volunteer
                  </Button>
                  <Button variant="outline" size="xl" className="gap-2">
                    Learn More
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-border">
                  <div>
                    <p className="text-3xl font-display font-bold text-primary">2,500+</p>
                    <p className="text-sm text-muted-foreground">Active Volunteers</p>
                  </div>
                  <div>
                    <p className="text-3xl font-display font-bold text-accent">150+</p>
                    <p className="text-sm text-muted-foreground">Opportunities/Year</p>
                  </div>
                  <div>
                    <p className="text-3xl font-display font-bold text-foreground">50,000+</p>
                    <p className="text-sm text-muted-foreground">Hours Contributed</p>
                  </div>
                </div>
              </div>

              {/* Right Content - Login Card */}
              <div className="lg:pl-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="bg-card rounded-2xl shadow-xl border border-border p-8 max-w-md mx-auto">
                  <div className="text-center mb-8">
                    <Logo size="lg" showText={false} />
                    <h2 className="text-2xl font-display font-bold text-foreground mt-4">Welcome Back</h2>
                    <p className="text-muted-foreground mt-2">Sign in to your account</p>
                  </div>
                  <LoginForm />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="about" className="py-20 bg-card border-t border-border">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
                Why Volunteer With Us?
              </h2>
              <p className="text-muted-foreground">
                Join a vibrant community of students making real impact in Jordan and beyond.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Users className="h-8 w-8" />}
                title="Build Connections"
                description="Meet like-minded individuals, network with professionals, and create lasting friendships."
              />
              <FeatureCard
                icon={<Award className="h-8 w-8" />}
                title="Earn Recognition"
                description="Receive official certificates for your volunteering hours and build your professional portfolio."
              />
              <FeatureCard
                icon={<Heart className="h-8 w-8" />}
                title="Create Impact"
                description="Contribute to meaningful projects that address real community needs and make a difference."
              />
            </div>
          </div>
        </section>

        {/* Disability Exam Access Section */}
        <section className="py-12 bg-muted/50 border-t border-border">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full text-accent text-sm font-medium mb-4">
                <Accessibility className="h-4 w-4" />
                Disability Support Services
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                Disability Exam Submissions
              </h2>
              <p className="text-muted-foreground mb-6">
                Students with disabilities can submit their exam schedules for volunteer support assistance.
              </p>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/disability-exam-submit')}
                className="gap-2"
              >
                <Accessibility className="h-5 w-5" />
                Submit Exam Schedule
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="join" className="py-20 gradient-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-display font-bold mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
              Apply now and join thousands of students making a positive impact in our community.
            </p>
            <Button
              variant="secondary"
              size="xl"
              onClick={() => navigate('/register')}
              className="gap-2"
            >
              <UserPlus className="h-5 w-5" />
              Apply as Volunteer
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-card border-t border-border py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <Logo size="sm" />
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Dean of Student Affairs. University of Jordan.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-background border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-display font-semibold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

export default Index;
