import { Logo } from '@/components/Logo';
import { LoginForm } from '@/components/auth/LoginForm';
import { Button } from '@/components/ui/button';
import { UserPlus, Heart, Users, Award, ArrowRight, Accessibility, Calendar, Brain, ChevronDown, Sparkles, Shield, Clock, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';

/* ─── Animated Counter ─── */
function AnimatedCounter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Scroll-reveal hook ─── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

/* ─── Floating Particles ─── */
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary/10"
          style={{
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 8 + 4}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${Math.random() * 6 + 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Feature Card ─── */
function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode; title: string; description: string; delay: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`group p-6 rounded-2xl bg-background border border-border transition-all duration-700 hover:shadow-xl hover:-translate-y-2 hover:border-primary/30 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-display font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ value, suffix, label, delay }: { value: number; suffix: string; label: string; delay: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`text-center transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <p className="text-3xl lg:text-4xl font-display font-bold text-primary">
        <AnimatedCounter end={value} suffix={suffix} />
      </p>
      <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
    </div>
  );
}

/* ─── Main Page ─── */
const Index = () => {
  const navigate = useNavigate();
  const [headerSolid, setHeaderSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setHeaderSolid(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* ━━━ Header ━━━ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        headerSolid ? 'bg-background/95 backdrop-blur-xl shadow-md border-b border-border' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <nav className="hidden md:flex items-center gap-5">
            <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">About</a>
            <a href="#impact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Impact</a>
            <a href="#services" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Services</a>
            <Button variant="outline" size="sm" onClick={() => navigate('/verify')}>Verify Certificate</Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/book-appointment')} className="gap-1">
              <Calendar className="h-4 w-4" /> Appointment
            </Button>
            <Button variant="default" size="sm" onClick={() => navigate('/screening')} className="gap-1">
              <Brain className="h-4 w-4" /> Self-Screening
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* ━━━ Hero ━━━ */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl translate-y-1/2 -translate-x-1/4" />
          <FloatingParticles />

           <div className="container mx-auto px-4 relative z-10 pt-20">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              {/* Left — Text */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 backdrop-blur-sm rounded-full text-primary text-xs font-medium mb-5 animate-fade-in">
                  <Sparkles className="h-4 w-4" />
                  Dean of Student Affairs · University of Jordan
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground leading-tight mb-5 animate-slide-up">
                  Make a{' '}
                  <span className="relative inline-block">
                    <span className="text-primary">Difference</span>
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary/30 rounded-full" />
                  </span>
                  <br />in Your Community
                </h1>

                <p className="text-base lg:text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed animate-slide-up" style={{ animationDelay: '0.15s' }}>
                  Join a vibrant community of 2,500+ students volunteering, growing, and earning recognition at the University of Jordan.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                  <Button
                    variant="hero"
                    size="xl"
                    onClick={() => navigate('/register')}
                    className="gap-2 group shadow-glow"
                  >
                    <UserPlus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    Become a Volunteer
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button variant="outline" size="xl" className="gap-2 group" onClick={() => {
                    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    Learn More
                    <ChevronDown className="h-4 w-4 group-hover:translate-y-1 transition-transform" />
                  </Button>
                </div>

                {/* 🎉 Inauguration Button */}
                <div className="animate-slide-up mt-4" style={{ animationDelay: '0.45s' }}>
                  <InaugurationButton />
                </div>
              </div>

              {/* Right — Login */}
              <div className="lg:pl-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-xl" />
                  <div className="relative bg-card rounded-2xl shadow-2xl border border-border/50 p-6 max-w-sm mx-auto backdrop-blur-sm">
                     <div className="text-center mb-6">
                       <Logo size="md" showText={false} />
                       <h2 className="text-xl font-display font-bold text-foreground mt-3">Welcome Back</h2>
                       <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
                    </div>
                    <LoginForm />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="h-6 w-6 text-muted-foreground" />
          </div>
        </section>

        {/* ━━━ Stats ━━━ */}
        <section id="impact" className="py-14 border-t border-border bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
              <StatCard value={2500} suffix="+" label="Active Volunteers" delay={0} />
              <StatCard value={150} suffix="+" label="Opportunities / Year" delay={100} />
              <StatCard value={50000} suffix="+" label="Hours Contributed" delay={200} />
              <StatCard value={98} suffix="%" label="Satisfaction Rate" delay={300} />
            </div>
          </div>
        </section>

        {/* ━━━ Features ━━━ */}
        <section id="about" className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <SectionHeader label="Why Us" title="Why Volunteer With Us?" subtitle="Join a vibrant community of students making real impact in Jordan and beyond." />
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Users className="h-8 w-8" />}
                title="Build Connections"
                description="Meet like-minded individuals, network with professionals, and create lasting friendships through shared experiences."
                delay={0}
              />
              <FeatureCard
                icon={<Award className="h-8 w-8" />}
                title="Earn Recognition"
                description="Receive official certificates for your volunteering hours and build a professional portfolio that stands out."
                delay={150}
              />
              <FeatureCard
                icon={<Heart className="h-8 w-8" />}
                title="Create Impact"
                description="Contribute to meaningful projects that address real community needs and leave a lasting positive change."
                delay={300}
              />
            </div>
          </div>
        </section>

        {/* ━━━ Services ━━━ */}
        <section id="services" className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <SectionHeader label="Services" title="Student Support Services" subtitle="Access mental health support, disability services, and more — all in one place." />
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <ServiceCard
                icon={<Brain className="h-7 w-7" />}
                title="Psychological Screening"
                description="Take a confidential, AI-powered adaptive screening test to understand your mental health. Results are private."
                buttonText="Start Screening"
                onClick={() => navigate('/screening')}
                gradient="from-primary/10 to-primary/5"
                delay={0}
              />
              <ServiceCard
                icon={<Accessibility className="h-7 w-7" />}
                title="Disability Exam Support"
                description="Students with disabilities can submit exam schedules for volunteer assistance and support."
                buttonText="Submit Schedule"
                onClick={() => navigate('/disability-exam-submit')}
                gradient="from-accent/10 to-accent/5"
                delay={150}
              />
              <ServiceCard
                icon={<Calendar className="h-7 w-7" />}
                title="Book an Appointment"
                description="Schedule a meeting with our counselors for academic, personal, or professional guidance."
                buttonText="Book Now"
                onClick={() => navigate('/book-appointment')}
                gradient="from-primary/10 to-accent/5"
                delay={300}
              />
              <ServiceCard
                icon={<Shield className="h-7 w-7" />}
                title="Certificate Verification"
                description="Verify the authenticity of volunteer certificates issued by the Dean of Student Affairs."
                buttonText="Verify"
                onClick={() => navigate('/verify')}
                gradient="from-accent/10 to-primary/5"
                delay={450}
              />
            </div>
          </div>
        </section>

        {/* ━━━ CTA ━━━ */}
        <section id="join" className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 gradient-primary" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(0_0%_100%/0.1)_0%,_transparent_70%)]" />

          <div className="container mx-auto px-4 text-center relative z-10">
            <CTAContent navigate={navigate} />
          </div>
        </section>

        {/* ━━━ Footer ━━━ */}
        <footer className="bg-card border-t border-border py-10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <Logo size="sm" />
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <a href="#about" className="hover:text-foreground transition-colors">About</a>
                <a href="#services" className="hover:text-foreground transition-colors">Services</a>
                <a href="#join" className="hover:text-foreground transition-colors">Join</a>
              </div>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Dean of Student Affairs · University of Jordan
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

/* ─── Section Header ─── */
function SectionHeader({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-xs font-semibold uppercase tracking-wider mb-4">
        {label}
      </div>
      <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-3">{title}</h2>
      <p className="text-muted-foreground text-base">{subtitle}</p>
    </div>
  );
}

/* ─── Service Card ─── */
function ServiceCard({ icon, title, description, buttonText, onClick, gradient, delay }: {
  icon: React.ReactNode; title: string; description: string; buttonText: string; onClick: () => void; gradient: string; delay: number;
}) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`group relative p-6 rounded-2xl border border-border bg-gradient-to-br ${gradient} transition-all duration-700 hover:shadow-lg hover:border-primary/20 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-11 h-11 rounded-lg bg-background flex items-center justify-center text-primary mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-base font-display font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed mb-4">{description}</p>
      <Button variant="outline" size="sm" onClick={onClick} className="gap-1 group/btn">
        {buttonText}
        <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
      </Button>
    </div>
  );
}

/* ─── CTA Content ─── */
function CTAContent({ navigate }: { navigate: (path: string) => void }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      <h2 className="text-2xl lg:text-4xl font-display font-bold mb-4 text-primary-foreground">
        Ready to Start Your Journey?
      </h2>
      <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto text-base">
        Apply now and join thousands of students making a positive impact in our community.
      </p>
      <Button
        variant="secondary"
        size="xl"
        onClick={() => navigate('/register')}
        className="gap-2 group shadow-xl hover:shadow-2xl transition-shadow"
      >
        <UserPlus className="h-5 w-5 group-hover:scale-110 transition-transform" />
        Apply as Volunteer
        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  );
}

/* ─── Inauguration Button ─── */
function InaugurationButton() {
  const [playing, setPlaying] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleClick = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/inauguration-song.m4a');
      audioRef.current.addEventListener('ended', () => {
        setPlaying(false);
        setShowConfetti(false);
      });
    }

    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
      setShowConfetti(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
      setShowConfetti(true);
    }
  };

  return (
    <div className="relative">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 2 + 2}s`,
                width: `${Math.random() * 10 + 6}px`,
                height: `${Math.random() * 10 + 6}px`,
                backgroundColor: ['hsl(var(--primary))', 'hsl(var(--accent))', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'][Math.floor(Math.random() * 6)],
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      )}
      <Button
        variant={playing ? 'destructive' : 'accent'}
        size="xl"
        onClick={handleClick}
        className={`gap-2 group relative overflow-hidden ${playing ? 'animate-pulse' : 'shadow-glow'}`}
      >
        <PartyPopper className={`h-5 w-5 transition-transform ${playing ? 'animate-bounce' : 'group-hover:scale-110'}`} />
        {playing ? '⏹ إيقاف' : '🎉 تدشين الموقع!'}
      </Button>
    </div>
  );
}

export default Index;
