import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Download, Calendar, MapPin, Clock, Loader2 } from 'lucide-react';
import { useMyCertificates } from '@/hooks/useCertificates';
import { format } from 'date-fns';

export function VolunteerCertificatesPage() {
  const { certificates, isLoading } = useMyCertificates();

  const totalHours = certificates?.reduce((sum: number, cert: any) => sum + Number(cert.hours), 0) || 0;

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
            <h2 className="text-2xl font-display font-bold">My Certificates</h2>
            <p className="text-muted-foreground">
              {certificates?.length || 0} certificates earned • {totalHours} total hours
            </p>
          </div>
        </div>

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
                  {certificates?.length ? format(new Date(certificates[0].issued_at), 'MMM yyyy') : '-'}
                </p>
                <p className="text-sm text-primary-foreground/70">Latest</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certificates Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {certificates?.map((cert: any) => (
            <Card key={cert.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Award className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{cert.opportunity?.title}</CardTitle>
                      <p className="text-sm font-mono text-muted-foreground">
                        {cert.certificate_number}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{cert.hours} hrs</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(cert.opportunity?.date), 'EEEE, MMMM dd, yyyy')}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {cert.opportunity?.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Issued on {format(new Date(cert.issued_at), 'MMM dd, yyyy')}
                  </div>
                </div>
                <Button variant="outline" className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Download Certificate
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!certificates || certificates.length === 0) && (
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
      </div>
    </DashboardLayout>
  );
}
