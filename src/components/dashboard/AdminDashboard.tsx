import { useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Calendar,
  ClipboardList,
  Award,
  TrendingUp,
  Clock,
  ArrowRight,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { useVolunteerApplications } from '@/hooks/useApplications';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useVolunteers } from '@/hooks/useVolunteers';
import { useCertificates } from '@/hooks/useCertificates';
import { AvailabilityStatisticsWidget } from '@/components/admin/AvailabilityStatisticsWidget';
import { ScheduleSubmissionsWidget } from '@/components/admin/ScheduleSubmissionsWidget';
import { MessagingWidget } from '@/components/admin/MessagingWidget';
import { format } from 'date-fns';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { data: applications, isLoading: applicationsLoading } = useVolunteerApplications();
  const { opportunities, isLoading: opportunitiesLoading } = useOpportunities();
  const { volunteers, isLoading: volunteersLoading } = useVolunteers();
  const { certificates, isLoading: certificatesLoading } = useCertificates();

  const isLoading = applicationsLoading || opportunitiesLoading || volunteersLoading || certificatesLoading;

  const pendingApplications = applications?.filter((a: any) => a.status === 'pending') || [];
  const totalVolunteers = volunteers?.length || 0;
  const activeOpportunities = opportunities?.filter((o: any) => o.status === 'published') || [];
  const totalCertificates = certificates?.length || 0;

  const stats = [
    { 
      title: 'Total Volunteers', 
      value: totalVolunteers.toString(), 
      change: 'Active', 
      icon: Users, 
      color: 'text-primary',
      href: '/dashboard/volunteers'
    },
    { 
      title: 'Pending Applications', 
      value: pendingApplications.length.toString(), 
      change: 'New', 
      icon: ClipboardList, 
      color: 'text-accent',
      href: '/dashboard/applications'
    },
    { 
      title: 'Active Opportunities', 
      value: activeOpportunities.length.toString(), 
      change: 'Published', 
      icon: Calendar, 
      color: 'text-info',
      href: '/dashboard/opportunities'
    },
    { 
      title: 'Certificates Issued', 
      value: totalCertificates.toString(), 
      change: 'Total', 
      icon: Award, 
      color: 'text-warning',
      href: '/dashboard/certificates'
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.title} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(stat.href)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-display font-bold mt-2">{stat.value}</p>
                      <Badge variant="secondary" className="mt-2">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {stat.change}
                      </Badge>
                    </div>
                    <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Applications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-accent" />
                Pending Applications
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1" asChild>
                <Link to="/dashboard/applications">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApplications.length > 0 ? (
                  pendingApplications.slice(0, 3).map((app: any) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserPlus className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{app.first_name} {app.family_name}</p>
                          <p className="text-sm text-muted-foreground">{app.faculty?.name}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/dashboard/applications')}
                      >
                        Review
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No pending applications</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Opportunities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Opportunities
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1" asChild>
                <Link to="/dashboard/opportunities">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeOpportunities.length > 0 ? (
                  activeOpportunities.slice(0, 3).map((opp: any) => (
                    <div
                      key={opp.id}
                      className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{opp.title}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(opp.date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Badge variant={(opp.registrations?.[0]?.count || 0) >= opp.required_volunteers ? 'default' : 'secondary'}>
                          {opp.registrations?.[0]?.count || 0}/{opp.required_volunteers} volunteers
                        </Badge>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(((opp.registrations?.[0]?.count || 0) / opp.required_volunteers) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No active opportunities</p>
                    <Button variant="link" size="sm" asChild>
                      <Link to="/dashboard/opportunities">Create one</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messaging & Announcements Widget */}
        <MessagingWidget />

        {/* Availability Statistics Widget */}
        <AvailabilityStatisticsWidget />

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/dashboard/volunteers')}
              >
                <UserPlus className="h-6 w-6 text-primary" />
                <span>View Volunteers</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/dashboard/opportunities')}
              >
                <Calendar className="h-6 w-6 text-primary" />
                <span>Create Opportunity</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/dashboard/certificates')}
              >
                <Award className="h-6 w-6 text-primary" />
                <span>Issue Certificate</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/dashboard/reports')}
              >
                <ClipboardList className="h-6 w-6 text-primary" />
                <span>View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Submissions Widget */}
        <ScheduleSubmissionsWidget />
      </div>
    </DashboardLayout>
  );
}
