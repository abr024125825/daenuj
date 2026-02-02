import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Keyboard,
  Maximize2,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QRCodeScanner } from '@/components/QRCodeScanner';
import { Logo } from '@/components/Logo';

type CheckInStatus = 'idle' | 'processing' | 'success' | 'error';

interface CheckInResult {
  volunteerName: string;
  opportunityTitle: string;
  checkInTime: string;
}

export function KioskPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const opportunityId = searchParams.get('opportunity');
  
  const [status, setStatus] = useState<CheckInStatus>('idle');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string>('');
  const [manualMode, setManualMode] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [opportunity, setOpportunity] = useState<any>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckInResult[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch opportunity details
  useEffect(() => {
    if (opportunityId) {
      supabase
        .from('opportunities')
        .select('id, title, date, location, qr_code_token, qr_code_active')
        .eq('id', opportunityId)
        .single()
        .then(({ data }) => {
          setOpportunity(data);
        });
    }
  }, [opportunityId]);

  // Auto-reset after success/error
  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => {
        setStatus('idle');
        setResult(null);
        setError('');
        setManualToken('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const processCheckIn = async (token: string) => {
    if (status === 'processing') return;
    
    setStatus('processing');
    setError('');
    setResult(null);

    try {
      // Find opportunity by QR token
      const { data: opp, error: oppError } = await supabase
        .from('opportunities')
        .select('id, title, qr_code_active')
        .eq('qr_code_token', token)
        .single();

      if (oppError || !opp) {
        throw new Error('Invalid QR code');
      }

      if (!opp.qr_code_active) {
        throw new Error('Check-in is closed for this opportunity');
      }

      // This is a kiosk mode - we need the volunteer to be logged in
      // Or we can use the manual entry with university ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Please log in to check in');
      }

      // Get volunteer record
      const { data: volunteer, error: volError } = await supabase
        .from('volunteers')
        .select(`
          id,
          application:volunteer_applications(first_name, father_name, family_name)
        `)
        .eq('user_id', user.id)
        .single();

      if (volError || !volunteer) {
        throw new Error('Volunteer record not found');
      }

      // Check if registered and approved
      const { data: registration, error: regError } = await supabase
        .from('opportunity_registrations')
        .select('id, status')
        .eq('opportunity_id', opp.id)
        .eq('volunteer_id', volunteer.id)
        .single();

      if (regError || !registration) {
        throw new Error('You are not registered for this opportunity');
      }

      if (registration.status !== 'approved') {
        throw new Error('Your registration is not approved yet');
      }

      // Check if already checked in
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('opportunity_id', opp.id)
        .eq('volunteer_id', volunteer.id)
        .single();

      if (existing) {
        throw new Error('You have already checked in');
      }

      // Record attendance
      const checkInTime = new Date().toISOString();
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          opportunity_id: opp.id,
          volunteer_id: volunteer.id,
          registration_id: registration.id,
          check_in_time: checkInTime,
          check_in_method: 'kiosk',
        });

      if (attendanceError) throw attendanceError;

      const app = volunteer.application;
      const volunteerName = `${app?.first_name} ${app?.father_name} ${app?.family_name}`;
      
      const checkInResult: CheckInResult = {
        volunteerName,
        opportunityTitle: opp.title,
        checkInTime: new Date(checkInTime).toLocaleTimeString(),
      };

      setResult(checkInResult);
      setRecentCheckIns(prev => [checkInResult, ...prev].slice(0, 5));
      setStatus('success');

    } catch (err: any) {
      setError(err.message || 'Check-in failed');
      setStatus('error');
    }
  };

  const handleQRScan = (scannedToken: string) => {
    processCheckIn(scannedToken);
  };

  const handleManualSubmit = () => {
    if (manualToken.trim()) {
      processCheckIn(manualToken.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Logo size="sm" />
          <div>
            <h1 className="font-bold text-lg">Kiosk Check-In</h1>
            {opportunity && (
              <p className="text-sm text-muted-foreground">{opportunity.title}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Status Display */}
          {status === 'success' && result && (
            <Card className="border-green-500 bg-green-50 dark:bg-green-950/20 animate-in zoom-in-95">
              <CardContent className="py-12 text-center">
                <div className="w-24 h-24 rounded-full bg-green-500 mx-auto mb-6 flex items-center justify-center animate-bounce">
                  <CheckCircle className="h-14 w-14 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-green-700 dark:text-green-400 mb-2">
                  Welcome!
                </h2>
                <p className="text-2xl font-semibold mb-4">{result.volunteerName}</p>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Checked in at {result.checkInTime}
                </Badge>
              </CardContent>
            </Card>
          )}

          {status === 'error' && (
            <Card className="border-destructive bg-destructive/10 animate-in shake">
              <CardContent className="py-12 text-center">
                <div className="w-24 h-24 rounded-full bg-destructive mx-auto mb-6 flex items-center justify-center">
                  <XCircle className="h-14 w-14 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-destructive mb-4">
                  Check-In Failed
                </h2>
                <p className="text-xl text-muted-foreground">{error}</p>
              </CardContent>
            </Card>
          )}

          {status === 'processing' && (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="h-24 w-24 mx-auto mb-6 animate-spin text-primary" />
                <h2 className="text-2xl font-bold">Processing...</h2>
              </CardContent>
            </Card>
          )}

          {status === 'idle' && (
            <div className="space-y-6">
              {/* Scanner/Manual Toggle */}
              <div className="flex justify-center gap-4">
                <Button
                  variant={!manualMode ? 'default' : 'outline'}
                  onClick={() => setManualMode(false)}
                  size="lg"
                  className="gap-2"
                >
                  <QrCode className="h-5 w-5" />
                  Scan QR Code
                </Button>
                <Button
                  variant={manualMode ? 'default' : 'outline'}
                  onClick={() => setManualMode(true)}
                  size="lg"
                  className="gap-2"
                >
                  <Keyboard className="h-5 w-5" />
                  Enter Token
                </Button>
              </div>

              {/* Scanner or Manual Input */}
              <Card>
                <CardContent className="py-8">
                  {!manualMode ? (
                    <div className="text-center">
                      <div className="max-w-md mx-auto">
                        <QRCodeScanner onScan={handleQRScan} />
                      </div>
                      <p className="mt-4 text-muted-foreground">
                        Position the QR code within the frame
                      </p>
                    </div>
                  ) : (
                    <div className="max-w-md mx-auto space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Enter QR Code Token
                        </label>
                        <Input
                          value={manualToken}
                          onChange={(e) => setManualToken(e.target.value)}
                          placeholder="Enter the token shown on screen..."
                          className="text-lg h-14 text-center"
                          onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                        />
                      </div>
                      <Button 
                        onClick={handleManualSubmit} 
                        className="w-full h-14 text-lg"
                        disabled={!manualToken.trim()}
                      >
                        Check In
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Check-ins */}
          {recentCheckIns.length > 0 && status === 'idle' && (
            <Card className="mt-6">
              <CardContent className="py-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Recent Check-ins
                </h3>
                <div className="space-y-2">
                  {recentCheckIns.map((checkIn, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{checkIn.volunteerName}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {checkIn.checkInTime}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t text-center text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset Kiosk
        </Button>
      </div>
    </div>
  );
}
