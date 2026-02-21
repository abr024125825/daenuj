import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Smartphone, Wifi, Bell, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Download, title: 'Install on your device', desc: 'Add to home screen like a native app' },
    { icon: Bell, title: 'Push Notifications', desc: 'Get notified about opportunities & deadlines' },
    { icon: Wifi, title: 'Works Offline', desc: 'Access key pages without internet' },
    { icon: Smartphone, title: 'Native Experience', desc: 'Full-screen, fast, app-like navigation' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="text-center space-y-2">
          <img src="/pwa-512x512.png" alt="App Icon" className="w-20 h-20 mx-auto rounded-2xl shadow-lg" />
          <h1 className="text-2xl font-bold text-foreground">Install DSA UJ App</h1>
          <p className="text-muted-foreground text-sm">Get the full app experience on your device</p>
        </div>

        {isInstalled ? (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-6 text-center space-y-2">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <p className="font-semibold text-green-700">App is installed!</p>
              <p className="text-sm text-muted-foreground">You can open it from your home screen.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {deferredPrompt ? (
              <Button onClick={handleInstall} className="w-full h-12 text-base" size="lg">
                <Download className="h-5 w-5 mr-2" /> Install App
              </Button>
            ) : (
              <Card>
                <CardContent className="p-6 space-y-3">
                  <p className="font-medium text-sm">To install:</p>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p><strong>iPhone/iPad:</strong> Tap the Share button → "Add to Home Screen"</p>
                    <p><strong>Android:</strong> Tap the browser menu (⋮) → "Add to Home Screen"</p>
                    <p><strong>Desktop:</strong> Click the install icon in the address bar</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          {features.map((f) => (
            <Card key={f.title}>
              <CardContent className="p-4 text-center space-y-2">
                <f.icon className="h-6 w-6 mx-auto text-primary" />
                <p className="text-xs font-semibold">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
