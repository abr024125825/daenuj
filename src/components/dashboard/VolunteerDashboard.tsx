import { DashboardLayout } from './DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Award,
  Clock,
  ArrowRight,
  CheckCircle,
  BookOpen,
  QrCode,
  Trophy,
  Target,
} from 'lucide-react';

// Mock data
const volunteerStats = {
  totalHours: 45,
  opportunitiesCompleted: 8,
  certificatesEarned: 6,
  trainingsCompleted: 2,
  trainingsTotal: 3,
};

const upcomingOpportunities = [
  { id: 1, title: 'Blood Donation Campaign', date: 'Jan 20, 2024', time: '9:00 AM', location: 'Main Campus', status: 'registered' },
  { id: 2, title: 'Campus Clean-up Day', date: 'Jan 22, 2024', time: '8:00 AM', location: 'University Gardens', status: 'pending' },
];

const recentCertificates = [
  { id: 1, title: 'Environmental Awareness Workshop', hours: 4, date: 'Jan 10, 2024' },
  { id: 2, title: 'First Aid Training', hours: 8, date: 'Dec 15, 2023' },
];

export function VolunteerDashboard() {
  return (
    <DashboardLayout title="My Dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <Card className="gradient-primary text-primary-foreground overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-8 relative">
            <h2 className="text-2xl font-display font-bold mb-2">Welcome back, Volunteer!</h2>
            <p className="text-primary-foreground/80 mb-6">
              You're making a difference. Keep up the great work!
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-3xl font-bold">{volunteerStats.totalHours}</p>
                <p className="text-sm text-primary-foreground/70">Total Hours</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{volunteerStats.opportunitiesCompleted}</p>
                <p className="text-sm text-primary-foreground/70">Opportunities</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{volunteerStats.certificatesEarned}</p>
                <p className="text-sm text-primary-foreground/70">Certificates</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{volunteerStats.trainingsCompleted}/{volunteerStats.trainingsTotal}</p>
                <p className="text-sm text-primary-foreground/70">Trainings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Required Training Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Required Training
            </CardTitle>
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {volunteerStats.trainingsCompleted} of {volunteerStats.trainingsTotal} courses completed
                </span>
                <span className="text-sm font-medium">
                  {Math.round((volunteerStats.trainingsCompleted / volunteerStats.trainingsTotal) * 100)}%
                </span>
              </div>
              <Progress value={(volunteerStats.trainingsCompleted / volunteerStats.trainingsTotal) * 100} />
              {volunteerStats.trainingsCompleted < volunteerStats.trainingsTotal && (
                <p className="text-sm text-muted-foreground">
                  Complete all required training courses to participate in volunteering opportunities.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upcoming Opportunities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                My Upcoming Activities
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1">
                Browse All <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingOpportunities.map((opp) => (
                  <div
                    key={opp.id}
                    className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{opp.title}</h4>
                      <Badge variant={opp.status === 'registered' ? 'default' : 'secondary'}>
                        {opp.status === 'registered' ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Registered</>
                        ) : (
                          'Pending Approval'
                        )}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {opp.date} at {opp.time}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{opp.location}</p>
                    {opp.status === 'registered' && (
                      <Button variant="outline" size="sm" className="mt-3 gap-2">
                        <QrCode className="h-4 w-4" />
                        Check-in
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Certificates */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-warning" />
                My Certificates
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                        <Trophy className="h-6 w-6 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium">{cert.title}</p>
                        <p className="text-sm text-muted-foreground">{cert.hours} hours • {cert.date}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Browse Opportunities CTA */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-display font-semibold">Find Your Next Opportunity</h3>
                <p className="text-muted-foreground">
                  Browse available volunteering opportunities and make a difference.
                </p>
              </div>
            </div>
            <Button variant="hero" size="lg" className="gap-2">
              <Calendar className="h-5 w-5" />
              Browse Opportunities
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
