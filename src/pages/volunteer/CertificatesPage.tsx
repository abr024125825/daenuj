import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Download, Calendar, MapPin, Clock, Loader2, ChevronDown, FileText, Lock, AlertCircle, Heart } from 'lucide-react';
import { useMyCertificates } from '@/hooks/useCertificates';
import { useMyFeedback } from '@/hooks/useEvaluations';
import { format } from 'date-fns';
import { generateCertificatePDF, generateModernCertificatePDF } from '@/lib/generateCertificatePDF';
import { generateDisabilityCertificatePDF } from '@/lib/generateDisabilityCertificatePDF';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AchievementBadgesDisplay } from '@/components/volunteer/AchievementBadgesDisplay';

export function VolunteerCertificatesPage() {
  const { certificates, isLoading } = useMyCertificates();
  const { feedback } = useMyFeedback();
  const { user } = useAuth();

  // Get volunteer application data for name
  const { data: volunteerData } = useQuery({
    queryKey: ['my-volunteer-application', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('volunteer_applications')
        .select('first_name, father_name, family_name')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Check which opportunities have been evaluated
  const evaluatedOpportunityIds = new Set(feedback?.map((f: any) => f.opportunity_id) || []);

  // Separate opportunity and disability certificates
  const opportunityCertificates = certificates?.filter((c: any) => c.certificate_type === 'opportunity' || !c.certificate_type) || [];
  const disabilityCertificates = certificates?.filter((c: any) => c.certificate_type === 'disability') || [];

  const totalHours = certificates?.reduce((sum: number, cert: any) => sum + Number(cert.hours), 0) || 0;
  
  // Count locked certificates (not yet evaluated) - only for opportunity certificates
  const lockedCount = opportunityCertificates.filter((cert: any) => !evaluatedOpportunityIds.has(cert.opportunity_id)).length || 0;

  const handleDownload = async (cert: any, isModern: boolean = false) => {
    // Check if opportunity is evaluated (only for opportunity certificates)
    if (cert.certificate_type !== 'disability' && !evaluatedOpportunityIds.has(cert.opportunity_id)) {
      return; // Don't allow download
    }

    const volunteerName = volunteerData 
      ? `${volunteerData.first_name} ${volunteerData.father_name} ${volunteerData.family_name}`
      : 'Volunteer';

    const certData = {
      volunteerName,
      opportunityTitle: cert.opportunity?.title || 'Volunteering Activity',
      hours: cert.hours,
      certificateNumber: cert.certificate_number,
      issuedAt: cert.issued_at ? format(new Date(cert.issued_at), 'MMMM dd, yyyy') : 'N/A',
      opportunityDate: cert.opportunity?.date ? format(new Date(cert.opportunity.date), 'MMMM dd, yyyy') : 'N/A',
      location: cert.opportunity?.location || '',
    };

    if (isModern) {
      await generateModernCertificatePDF(certData);
    } else {
      await generateCertificatePDF(certData);
    }
  };

  const handleDownloadDisabilityCert = async (cert: any) => {
    const volunteerName = volunteerData 
      ? `${volunteerData.first_name} ${volunteerData.father_name} ${volunteerData.family_name}`
      : 'Volunteer';

    await generateDisabilityCertificatePDF({
      volunteerName,
      totalHours: Number(cert.disability_hours || cert.hours),
      certificateNumber: cert.certificate_number,
      issuedAt: cert.issued_at ? format(new Date(cert.issued_at), 'MMMM dd, yyyy') : 'N/A',
      assignmentsCount: cert.disability_assignments_count || 0,
      studentsHelped: cert.disability_students_helped || 0,
      dateRange: cert.date_range_start && cert.date_range_end ? {
        start: format(new Date(cert.date_range_start), 'MMM dd, yyyy'),
        end: format(new Date(cert.date_range_end), 'MMM dd, yyyy'),
      } : undefined,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="My Certificates">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Certificates">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold">My Certificates & Achievements</h2>
            <p className="text-muted-foreground">
              {certificates?.length || 0} certificates earned • {totalHours} total hours
            </p>
          </div>
        </div>

        <Tabs defaultValue="certificates" className="space-y-6">
          <TabsList>
            <TabsTrigger value="certificates">Opportunity Certificates</TabsTrigger>
            <TabsTrigger value="disability">
              Disability Service
              {disabilityCertificates.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">{disabilityCertificates.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="achievements">Achievement Badges</TabsTrigger>
          </TabsList>

          <TabsContent value="certificates" className="space-y-6">
            {/* Info Alert if there are locked certificates */}
            {lockedCount > 0 && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  You have {lockedCount} certificate(s) pending. Please{' '}
                  <Link to="/dashboard/evaluations" className="font-medium underline">
                    submit your feedback
                  </Link>{' '}
                  for the opportunity to unlock your certificate.
                </AlertDescription>
              </Alert>
            )}

            {/* Stats Card */}
            <Card className="gradient-primary text-primary-foreground">
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-3xl font-bold">{certificates?.length || 0}</p>
                    <p className="text-sm text-primary-foreground/70">Certificates</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{totalHours}</p>
                    <p className="text-sm text-primary-foreground/70">Total Hours</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">
                      {certificates?.length && certificates[0]?.issued_at 
                        ? format(new Date(certificates[0].issued_at), 'MMM yyyy') 
                        : '-'}
                    </p>
                    <p className="text-sm text-primary-foreground/70">Latest</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certificates Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {opportunityCertificates.map((cert: any) => {
                const isLocked = !evaluatedOpportunityIds.has(cert.opportunity_id);
                
                return (
                  <Card key={cert.id} className={`hover:shadow-lg transition-shadow ${isLocked ? 'opacity-75' : ''}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isLocked ? 'bg-muted' : 'bg-warning/10'}`}>
                            {isLocked ? (
                              <Lock className="h-6 w-6 text-muted-foreground" />
                            ) : (
                              <Award className="h-6 w-6 text-warning" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{cert.opportunity?.title}</CardTitle>
                            <p className="text-sm font-mono text-muted-foreground">
                              {cert.certificate_number}
                            </p>
                          </div>
                        </div>
                        <Badge variant={isLocked ? "secondary" : "default"}>{cert.hours} hrs</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {cert.opportunity?.date 
                            ? format(new Date(cert.opportunity.date), 'EEEE, MMMM dd, yyyy')
                            : 'Date not available'}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {cert.opportunity?.location || 'Location not available'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Issued on {cert.issued_at 
                            ? format(new Date(cert.issued_at), 'MMM dd, yyyy')
                            : 'N/A'}
                        </div>
                      </div>
                      
                      {isLocked ? (
                        <Button variant="outline" className="w-full gap-2" asChild>
                          <Link to="/dashboard/evaluations">
                            <Lock className="h-4 w-4" />
                            Submit Feedback to Unlock
                          </Link>
                        </Button>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full gap-2">
                              <Download className="h-4 w-4" />
                              Download Certificate
                              <ChevronDown className="h-4 w-4 ml-auto" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-full">
                            <DropdownMenuItem onClick={() => handleDownload(cert, false)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Classic Design
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(cert, true)}>
                              <Award className="h-4 w-4 mr-2" />
                              Modern Design
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {(!opportunityCertificates || opportunityCertificates.length === 0) && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No certificates yet</h3>
                  <p className="text-muted-foreground">
                    Complete volunteering opportunities to earn certificates.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Disability Service Certificates Tab */}
          <TabsContent value="disability" className="space-y-6">
            {disabilityCertificates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No disability service certificates yet</h3>
                  <p className="text-muted-foreground">
                    Certificates will appear here when issued for your disability exam support service.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {disabilityCertificates.map((cert: any) => (
                  <Card key={cert.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Heart className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Disability Support Service</CardTitle>
                            <p className="text-sm font-mono text-muted-foreground">
                              {cert.certificate_number}
                            </p>
                          </div>
                        </div>
                        <Badge variant="default">{Number(cert.hours).toFixed(1)} hrs</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-3 text-center p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-lg font-bold text-primary">{Number(cert.disability_hours || cert.hours).toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">Hours</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-primary">{cert.disability_assignments_count || 0}</p>
                          <p className="text-xs text-muted-foreground">Exams</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-primary">{cert.disability_students_helped || 0}</p>
                          <p className="text-xs text-muted-foreground">Students</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        {cert.date_range_start && cert.date_range_end && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(cert.date_range_start), 'MMM dd, yyyy')} — {format(new Date(cert.date_range_end), 'MMM dd, yyyy')}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Issued on {cert.issued_at 
                            ? format(new Date(cert.issued_at), 'MMM dd, yyyy')
                            : 'N/A'}
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full gap-2"
                        onClick={() => handleDownloadDisabilityCert(cert)}
                      >
                        <Download className="h-4 w-4" />
                        Download Certificate
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementBadgesDisplay />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
