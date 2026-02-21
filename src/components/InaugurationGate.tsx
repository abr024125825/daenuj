import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { PartyPopper, Lock, Sparkles, ChevronLeft, ChevronRight, Users, Award, Heart, Brain, Accessibility, Calendar, Shield, BarChart3, MessageSquare, BookOpen, ClipboardCheck, GraduationCap } from 'lucide-react';

const LAUNCH_KEY = 'site_inaugurated';
const LAUNCH_PASSWORD = 'Ghscomputereng@25';

/* ─── Presentation Slides ─── */
const slides = [
  {
    icon: Users,
    title: 'Volunteer Management',
    description: 'Register, track, and manage 2,500+ student volunteers across faculties with full lifecycle support.',
    gradient: 'from-blue-500 to-cyan-500',
    features: ['Registration & Onboarding', 'Faculty Assignment', 'Hours Tracking', 'Achievement Badges'],
  },
  {
    icon: Calendar,
    title: 'Opportunity Scheduling',
    description: 'Create and manage volunteer opportunities with automated scheduling, registration, and attendance tracking.',
    gradient: 'from-emerald-500 to-teal-500',
    features: ['Event Creation', 'QR Check-in', 'Attendance Reports', 'Capacity Management'],
  },
  {
    icon: Award,
    title: 'Certificates & Recognition',
    description: 'Issue verifiable digital certificates and achievement badges to recognize outstanding volunteer contributions.',
    gradient: 'from-amber-500 to-orange-500',
    features: ['Auto-generation', 'QR Verification', 'Badge System', 'Leaderboard'],
  },
  {
    icon: Brain,
    title: 'Psychological Screening',
    description: 'AI-powered adaptive mental health screening with 270+ validated instruments and automatic clinical recommendations.',
    gradient: 'from-purple-500 to-pink-500',
    features: ['Adaptive Testing', 'ICD-10 Codes', 'Risk Assessment', 'File Open Requests'],
  },
  {
    icon: Accessibility,
    title: 'Disability Exam Support',
    description: 'Coordinate volunteer assistance for students with disabilities during exams with smart matching and scheduling.',
    gradient: 'from-rose-500 to-red-500',
    features: ['Student Registry', 'Exam Scheduling', 'Volunteer Assignment', 'Role Matching'],
  },
  {
    icon: ClipboardCheck,
    title: 'Electronic Medical Records',
    description: 'Comprehensive EMR system for psychological counseling with encounters, treatment plans, and therapy tracking.',
    gradient: 'from-indigo-500 to-blue-500',
    features: ['Patient Files', 'SOAP Notes', 'Treatment Plans', 'Audit Trail'],
  },
  {
    icon: BookOpen,
    title: 'Training & Quizzes',
    description: 'Create training modules and quizzes to prepare volunteers with knowledge and skills before deployment.',
    gradient: 'from-teal-500 to-green-500',
    features: ['Course Modules', 'Quiz Builder', 'Progress Tracking', 'Certificates'],
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Generate comprehensive reports on volunteer hours, performance metrics, and program impact across all faculties.',
    gradient: 'from-cyan-500 to-blue-500',
    features: ['PDF Reports', 'Faculty Analytics', 'Heatmaps', 'Export to Excel'],
  },
  {
    icon: MessageSquare,
    title: 'Communication Hub',
    description: 'Built-in messaging, announcements, and notification system to keep all stakeholders informed and connected.',
    gradient: 'from-pink-500 to-rose-500',
    features: ['Direct Messaging', 'Announcements', 'Push Notifications', 'Email Alerts'],
  },
  {
    icon: GraduationCap,
    title: 'Faculty Coordination',
    description: 'Empower faculty coordinators with dedicated dashboards for managing their faculty\'s volunteers and schedules.',
    gradient: 'from-violet-500 to-purple-500',
    features: ['Faculty Dashboard', 'Schedule Review', 'Volunteer Lists', 'Faculty Reports'],
  },
];

/* ─── Confetti ─── */
function ConfettiOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {Array.from({ length: 80 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-5%',
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${Math.random() * 2.5 + 2}s`,
            width: `${Math.random() * 12 + 6}px`,
            height: `${Math.random() * 12 + 6}px`,
            backgroundColor: [
              'hsl(var(--primary))', 'hsl(var(--accent))', '#FFD700',
              '#FF6B6B', '#4ECDC4', '#45B7D1', '#FF9FF3', '#54A0FF',
            ][Math.floor(Math.random() * 8)],
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Presentation Slide Component ─── */
function PresentationSlide({ slide, active }: { slide: typeof slides[0]; active: boolean }) {
  const Icon = slide.icon;
  return (
    <div className={`absolute inset-0 flex items-center justify-center p-8 transition-all duration-700 ${
      active ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
    }`}>
      <div className="max-w-2xl w-full text-center">
        <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center shadow-xl`}>
          <Icon className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
          {slide.title}
        </h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
          {slide.description}
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {slide.features.map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm font-medium text-foreground"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Gate ─── */
export function InaugurationGate({ children }: { children: React.ReactNode }) {
  const [localLaunched, setLocalLaunched] = useState(() => {
    return localStorage.getItem(LAUNCH_KEY) === 'true';
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'gate' | 'presenting' | 'done'>('gate');
  const [currentSlide, setCurrentSlide] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const slideTimerRef = useRef<ReturnType<typeof setInterval>>();

  // Check DB setting
  const { data: inaugurationEnabled, isLoading } = useQuery({
    queryKey: ['inauguration-setting'],
    queryFn: async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'inauguration_enabled')
        .maybeSingle();
      const val = data?.setting_value as { enabled?: boolean } | null;
      return val?.enabled ?? false;
    },
    staleTime: 30000,
  });

  // If inauguration is disabled in DB, skip the gate entirely
  const shouldShowGate = inaugurationEnabled === true && !localLaunched;

  useEffect(() => {
    if (phase !== 'presenting') return;

    // Auto-advance slides
    slideTimerRef.current = setInterval(() => {
      setCurrentSlide(prev => {
        if (prev >= slides.length - 1) {
          // Presentation done
          clearInterval(slideTimerRef.current);
          setTimeout(() => {
            setPhase('done');
            setLocalLaunched(true);
            localStorage.setItem(LAUNCH_KEY, 'true');
          }, 2000);
          return prev;
        }
        return prev + 1;
      });
    }, 5000);

    return () => clearInterval(slideTimerRef.current);
  }, [phase]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[90] bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Logo size="lg" />
          <div className="h-1 w-32 bg-primary/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!shouldShowGate && phase !== 'presenting' && phase !== 'done') return <>{children}</>;

  /* ─── Done Phase (Celebratory) ─── */
  if (phase === 'done') {
    return (
      <div className="fixed inset-0 z-[90] bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <ConfettiOverlay />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-accent/5 blur-3xl" />

        <div className="relative w-full max-w-md text-center">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-xl" />
          <div className="relative bg-card rounded-2xl shadow-2xl border border-border/50 p-8 backdrop-blur-sm">
            <div className="mb-6 flex justify-center">
              <Logo size="lg" />
            </div>

            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <PartyPopper className="h-10 w-10 text-primary animate-bounce" />
            </div>

            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              🎉 Website Launched!
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              Welcome to the Dean of Student Affairs Platform
            </p>

            <Button
              variant="hero"
              size="xl"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.pause();
                  audioRef.current.currentTime = 0;
                }
                setPhase('gate');
                setLocalLaunched(true);
                localStorage.setItem(LAUNCH_KEY, 'true');
              }}
              className="w-full gap-2 group shadow-glow"
            >
              <Sparkles className="h-5 w-5 group-hover:scale-110 transition-transform" />
              Enter the Platform
            </Button>

            <p className="text-xs text-muted-foreground mt-6">
              Dean of Student Affairs · University of Jordan
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleLaunch = () => {
    if (password !== LAUNCH_PASSWORD) {
      setError('Incorrect password');
      return;
    }
    setError('');
    setPhase('presenting');
    setCurrentSlide(0);

    if (!audioRef.current) {
      audioRef.current = new Audio('/inauguration-song.m4a');
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  };

  const goToSlide = (dir: 'prev' | 'next') => {
    clearInterval(slideTimerRef.current);
    setCurrentSlide(prev => dir === 'next'
      ? Math.min(prev + 1, slides.length - 1)
      : Math.max(prev - 1, 0)
    );
  };

  const skipPresentation = () => {
    clearInterval(slideTimerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPhase('done');
    setLocalLaunched(true);
    localStorage.setItem(LAUNCH_KEY, 'true');
  };

  /* ─── Presentation Phase ─── */
  if (phase === 'presenting') {
    return (
      <div className="fixed inset-0 z-[90] bg-background flex flex-col overflow-hidden">
        <ConfettiOverlay />

        {/* Top bar */}
        <div className="relative z-[101] flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-sm">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {currentSlide + 1} / {slides.length}
            </span>
            <Button variant="outline" size="sm" onClick={skipPresentation}>
              Skip & Launch →
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          />
        </div>

        {/* Slides */}
        <div className="flex-1 relative">
          {slides.map((slide, i) => (
            <PresentationSlide key={i} slide={slide} active={i === currentSlide} />
          ))}
        </div>

        {/* Navigation */}
        <div className="relative z-[101] flex items-center justify-between px-6 py-4 border-t border-border bg-background/80 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToSlide('prev')}
            disabled={currentSlide === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>

          {/* Dots */}
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  clearInterval(slideTimerRef.current);
                  setCurrentSlide(i);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === currentSlide ? 'bg-primary w-6' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (currentSlide === slides.length - 1) {
                skipPresentation();
              } else {
                goToSlide('next');
              }
            }}
            className="gap-1"
          >
            {currentSlide === slides.length - 1 ? 'Launch 🎉' : 'Next'} <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  /* ─── Gate Phase ─── */
  return (
    <div className="fixed inset-0 z-[90] bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-xl" />
        <div className="relative bg-card rounded-2xl shadow-2xl border border-border/50 p-8 backdrop-blur-sm text-center">
          <div className="mb-6 flex justify-center">
            <Logo size="lg" />
          </div>

          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>

          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Website Inauguration
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Enter the password to officially launch the website
          </p>

          <div className="space-y-4">
            <div className="relative">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleLaunch()}
                className="text-center text-lg h-12 pr-10"
                dir="ltr"
              />
              <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>

            {error && (
              <p className="text-destructive text-sm font-medium animate-shake">{error}</p>
            )}

            <Button
              variant="hero"
              size="xl"
              onClick={handleLaunch}
              className="w-full gap-2 group shadow-glow"
            >
              <PartyPopper className="h-5 w-5 group-hover:scale-110 transition-transform" />
              🎉 Launch Website
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Dean of Student Affairs · University of Jordan
          </p>
        </div>
      </div>
    </div>
  );
}
