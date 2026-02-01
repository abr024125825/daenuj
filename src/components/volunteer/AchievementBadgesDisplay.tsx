import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Trophy, 
  Clock, 
  Award, 
  Star, 
  Zap, 
  Download, 
  Loader2,
  Medal
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';

const BADGE_CONFIG = {
  semester_target: {
    icon: Target,
    label: 'Semester Achiever',
    description: 'Completed semester volunteer hours target',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
  },
  cumulative_target: {
    icon: Trophy,
    label: 'Cumulative Achiever',
    description: 'Reached cumulative hours target',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
  },
  first_opportunity: {
    icon: Star,
    label: 'First Step',
    description: 'Completed your first volunteer opportunity',
    color: 'text-info',
    bgColor: 'bg-info/10',
    borderColor: 'border-info/30',
  },
  ten_opportunities: {
    icon: Zap,
    label: 'Dedicated Volunteer',
    description: 'Completed 10 volunteer opportunities',
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
  },
  fifty_hours: {
    icon: Clock,
    label: '50 Hours Champion',
    description: 'Accumulated 50 volunteer hours',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    borderColor: 'border-accent/30',
  },
  hundred_hours: {
    icon: Award,
    label: '100 Hours Legend',
    description: 'Accumulated 100 volunteer hours',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
  },
};

export function AchievementBadgesDisplay() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Get volunteer record
  const { data: volunteer } = useQuery({
    queryKey: ['my-volunteer', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('volunteers')
        .select(`
          id,
          application:volunteer_applications(
            first_name,
            father_name,
            family_name,
            university_id
          )
        `)
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Get earned badges
  const { data: badges, isLoading: badgesLoading } = useQuery({
    queryKey: ['my-achievement-badges-display', volunteer?.id],
    queryFn: async () => {
      if (!volunteer?.id) return [];
      const { data } = await supabase
        .from('achievement_badges')
        .select(`
          *,
          semester:academic_semesters(name)
        `)
        .eq('volunteer_id', volunteer.id)
        .order('earned_at', { ascending: false });
      return data || [];
    },
    enabled: !!volunteer?.id,
  });

  // Get achievement certificates
  const { data: certificates, isLoading: certificatesLoading } = useQuery({
    queryKey: ['my-achievement-certificates', volunteer?.id],
    queryFn: async () => {
      if (!volunteer?.id) return [];
      const { data } = await supabase
        .from('achievement_certificates')
        .select(`
          *,
          badge:achievement_badges(
            badge_type,
            semester:academic_semesters(name)
          )
        `)
        .eq('volunteer_id', volunteer.id)
        .order('issued_at', { ascending: false });
      return data || [];
    },
    enabled: !!volunteer?.id,
  });

  const generateAchievementCertificatePDF = (certificate: any) => {
    const doc = new jsPDF('landscape');
    const config = BADGE_CONFIG[certificate.badge?.badge_type as keyof typeof BADGE_CONFIG];
    
    const app = volunteer?.application;
    const volunteerName = app 
      ? `${app.first_name} ${app.father_name} ${app.family_name}`
      : 'Volunteer';

    // Background gradient effect
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 297, 30, 'F');
    doc.rect(0, 180, 297, 30, 'F');

    // Border
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(3);
    doc.rect(10, 10, 277, 190, 'S');

    // Inner border
    doc.setLineWidth(1);
    doc.setDrawColor(200, 200, 200);
    doc.rect(15, 15, 267, 180, 'S');

    // Title
    doc.setTextColor(79, 70, 229);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATE OF ACHIEVEMENT', 148.5, 50, { align: 'center' });

    // Subtitle
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('This is to certify that', 148.5, 70, { align: 'center' });

    // Name
    doc.setFontSize(28);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(volunteerName, 148.5, 90, { align: 'center' });

    // Achievement text
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('has earned the achievement badge', 148.5, 105, { align: 'center' });

    // Badge name
    doc.setFontSize(24);
    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.text(config?.label || certificate.achievement_type, 148.5, 125, { align: 'center' });

    // Description
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(config?.description || '', 148.5, 140, { align: 'center' });

    // Hours achieved
    doc.setFontSize(14);
    doc.text(`Total Hours: ${certificate.hours_achieved}`, 148.5, 155, { align: 'center' });

    // Date
    doc.setFontSize(11);
    doc.text(`Issued on: ${format(new Date(certificate.issued_at), 'MMMM dd, yyyy')}`, 148.5, 170, { align: 'center' });

    // Certificate number
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Certificate No: ${certificate.certificate_number}`, 148.5, 185, { align: 'center' });

    doc.save(`achievement-certificate-${certificate.certificate_number}.pdf`);
    toast({ title: 'Success', description: 'Certificate downloaded successfully' });
  };

  const isLoading = badgesLoading || certificatesLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Earned Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-primary" />
            My Achievement Badges
          </CardTitle>
          <CardDescription>
            Badges earned for your volunteer contributions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {badges && badges.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge: any) => {
                const config = BADGE_CONFIG[badge.badge_type as keyof typeof BADGE_CONFIG];
                if (!config) return null;
                const Icon = config.icon;
                
                return (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-lg border-2 ${config.bgColor} ${config.borderColor} transition-all hover:scale-105`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-full ${config.bgColor}`}>
                        <Icon className={`h-6 w-6 ${config.color}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${config.color}`}>{config.label}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(badge.earned_at), 'MMM dd, yyyy')}
                        </div>
                        {badge.semester && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {badge.semester.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Medal className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No badges earned yet</p>
              <p className="text-sm mt-1">Complete volunteer hours to earn achievement badges!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievement Certificates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-warning" />
            Achievement Certificates
          </CardTitle>
          <CardDescription>
            Download certificates for your earned achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {certificates && certificates.length > 0 ? (
            <div className="space-y-3">
              {certificates.map((cert: any) => {
                const config = BADGE_CONFIG[cert.badge?.badge_type as keyof typeof BADGE_CONFIG];
                const Icon = config?.icon || Award;

                return (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${config?.bgColor || 'bg-primary/10'}`}>
                        <Icon className={`h-5 w-5 ${config?.color || 'text-primary'}`} />
                      </div>
                      <div>
                        <p className="font-medium">{config?.label || cert.achievement_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {cert.hours_achieved} hours • {format(new Date(cert.issued_at), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {cert.certificate_number}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generateAchievementCertificatePDF(cert)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No achievement certificates yet</p>
              <p className="text-sm mt-1">Earn badges to receive achievement certificates!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
