import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { PartyPopper, Lock, Sparkles } from 'lucide-react';

const LAUNCH_KEY = 'site_inaugurated';
const LAUNCH_PASSWORD = 'Ghscomputereng@25';

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
              'hsl(var(--primary))',
              'hsl(var(--accent))',
              '#FFD700',
              '#FF6B6B',
              '#4ECDC4',
              '#45B7D1',
              '#FF9FF3',
              '#54A0FF',
            ][Math.floor(Math.random() * 8)],
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function FireworkBurst({ x, y }: { x: number; y: number }) {
  return (
    <div className="fixed pointer-events-none z-[99]" style={{ left: x, top: y }}>
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * 360;
        const distance = 60 + Math.random() * 80;
        return (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: ['#FFD700', '#FF6B6B', 'hsl(var(--primary))', '#4ECDC4', '#FF9FF3'][i % 5],
              animation: `firework-particle 1s ease-out forwards`,
              animationDelay: `${Math.random() * 0.2}s`,
              '--tx': `${Math.cos((angle * Math.PI) / 180) * distance}px`,
              '--ty': `${Math.sin((angle * Math.PI) / 180) * distance}px`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}

export function InaugurationGate({ children }: { children: React.ReactNode }) {
  const [launched, setLaunched] = useState(() => {
    return localStorage.getItem(LAUNCH_KEY) === 'true';
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [celebrating, setCelebrating] = useState(false);
  const [fireworks, setFireworks] = useState<{ id: number; x: number; y: number }[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fwCounter = useRef(0);

  useEffect(() => {
    if (!celebrating) return;
    // Spawn fireworks periodically
    const interval = setInterval(() => {
      const id = fwCounter.current++;
      setFireworks((prev) => [
        ...prev.slice(-10),
        {
          id,
          x: Math.random() * window.innerWidth,
          y: Math.random() * (window.innerHeight * 0.6),
        },
      ]);
    }, 400);

    // After celebration, unlock
    const timeout = setTimeout(() => {
      setCelebrating(false);
      setLaunched(true);
      localStorage.setItem(LAUNCH_KEY, 'true');
    }, 6000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [celebrating]);

  if (launched && !celebrating) return <>{children}</>;

  const handleLaunch = () => {
    if (password !== LAUNCH_PASSWORD) {
      setError('Incorrect password');
      return;
    }
    setError('');
    setCelebrating(true);

    if (!audioRef.current) {
      audioRef.current = new Audio('/inauguration-song.m4a');
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  };

  if (celebrating) {
    return (
      <div className="fixed inset-0 z-[90] bg-background flex items-center justify-center overflow-hidden">
        <ConfettiOverlay />
        {fireworks.map((fw) => (
          <FireworkBurst key={fw.id} x={fw.x} y={fw.y} />
        ))}

        <div className="relative z-[101] text-center animate-scale-in">
          <div className="mb-6 flex justify-center">
            <Logo size="lg" />
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-primary mb-4 animate-pulse">
            🎉 Website Launched! 🎉
          </h1>
          <p className="text-xl text-muted-foreground animate-fade-in">
            Welcome to the Dean of Student Affairs Platform
          </p>
          <div className="mt-6 flex justify-center gap-2">
            {['🎊', '🎆', '🎇', '✨', '🎈', '🎉'].map((emoji, i) => (
              <span
                key={i}
                className="text-3xl animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      {/* Background decorations */}
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
