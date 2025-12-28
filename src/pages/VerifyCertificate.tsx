import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Award, Search, CheckCircle, XCircle, Loader2, ArrowLeft, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { Logo } from '@/components/Logo';

interface CertificateVerification {
  certificate_number: string;
  volunteer_name: string;
  opportunity_title: string;
  hours: number;
  issued_at: string;
  opportunity_date: string;
  location: string;
}

export function VerifyCertificate() {
  const [searchParams] = useSearchParams();
  const [certificateNumber, setCertificateNumber] = useState(searchParams.get('cert') || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<CertificateVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const certFromUrl = searchParams.get('cert');
    if (certFromUrl) {
      setCertificateNumber(certFromUrl);
      verifyCertificate(certFromUrl);
    }
  }, [searchParams]);

  const verifyCertificate = async (certNumber?: string) => {
    const numberToVerify = certNumber || certificateNumber;
    if (!numberToVerify.trim()) {
      setError('Please enter a certificate number');
      return;
    }

    setIsVerifying(true);
    setError(null);
    setVerificationResult(null);
    setHasSearched(true);

    try {
      // Fetch certificate with related data
      const { data: certificate, error: fetchError } = await supabase
        .from('certificates')
        .select(`
          *,
          volunteer:volunteers(
            id,
            application:volunteer_applications(first_name, father_name, family_name)
          ),
          opportunity:opportunities(title, date, location)
        `)
        .eq('certificate_number', numberToVerify.trim().toUpperCase())
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (certificate) {
        // Log the verification
        await supabase.from('certificate_verifications').insert({
          certificate_id: certificate.id,
          ip_address: null, // We don't collect IP for privacy
          user_agent: navigator.userAgent.substring(0, 255),
        });

        const volunteerApp = certificate.volunteer?.application;
        const volunteerName = volunteerApp 
          ? `${volunteerApp.first_name} ${volunteerApp.father_name || ''} ${volunteerApp.family_name}`.trim()
          : 'Unknown';

        setVerificationResult({
          certificate_number: certificate.certificate_number,
          volunteer_name: volunteerName,
          opportunity_title: certificate.opportunity?.title || 'Volunteer Service',
          hours: certificate.hours,
          issued_at: certificate.issued_at,
          opportunity_date: certificate.opportunity?.date || '',
          location: certificate.opportunity?.location || '',
        });
      } else {
        setError('Certificate not found. Please check the number and try again.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('An error occurred while verifying. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Logo size="sm" showText={false} />
            <span className="font-display font-bold text-lg">Volunteer Hub</span>
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold">Certificate Verification</h1>
            <p className="text-muted-foreground">
              Enter a certificate number or scan the QR code to verify its authenticity
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Verify Certificate
              </CardTitle>
              <CardDescription>
                Enter the certificate number found on the certificate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="e.g., CSDC-2025-000001"
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && verifyCertificate()}
                  className="font-mono"
                />
                <Button onClick={() => verifyCertificate()} disabled={isVerifying}>
                  {isVerifying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </div>

              {hasSearched && (
                <div className="pt-4">
                  {verificationResult ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-6 space-y-4">
                      <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                        <CheckCircle className="h-8 w-8" />
                        <div>
                          <h3 className="font-semibold text-lg">Certificate Verified</h3>
                          <p className="text-sm opacity-80">This certificate is authentic and valid</p>
                        </div>
                      </div>
                      
                      <div className="grid gap-4 mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Certificate Number</p>
                            <p className="font-mono font-semibold">{verificationResult.certificate_number}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Hours Completed</p>
                            <Badge variant="secondary" className="mt-1">{verificationResult.hours} hours</Badge>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Volunteer Name</p>
                          <p className="font-semibold text-lg">{verificationResult.volunteer_name}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Activity</p>
                          <p className="font-medium">{verificationResult.opportunity_title}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Activity Date</p>
                            <p>{verificationResult.opportunity_date ? format(new Date(verificationResult.opportunity_date), 'MMMM dd, yyyy') : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Issued On</p>
                            <p>{verificationResult.issued_at ? format(new Date(verificationResult.issued_at), 'MMMM dd, yyyy') : 'N/A'}</p>
                          </div>
                        </div>
                        
                        {verificationResult.location && (
                          <div>
                            <p className="text-sm text-muted-foreground">Location</p>
                            <p>{verificationResult.location}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : error ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-6">
                      <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                        <XCircle className="h-8 w-8" />
                        <div>
                          <h3 className="font-semibold text-lg">Verification Failed</h3>
                          <p className="text-sm opacity-80">{error}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              This verification service is provided by the Community Service & Development Center
              at the University of Jordan.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
