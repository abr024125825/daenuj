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
  CheckCircle,
  AlertCircle,
  UserPlus,
} from 'lucide-react';

// Mock data
const stats = [
  { title: 'Total Volunteers', value: '248', change: '+12%', icon: Users, color: 'text-primary' },
  { title: 'Pending Applications', value: '5', change: 'New', icon: ClipboardList, color: 'text-accent' },
  { title: 'Active Opportunities', value: '8', change: '+3', icon: Calendar, color: 'text-info' },
  { title: 'Certificates Issued', value: '1,234', change: '+45', icon: Award, color: 'text-warning' },
];

const pendingApplications = [
  { id: 1, name: 'Ahmad Hassan', faculty: 'Engineering', date: '2024-01-15' },
  { id: 2, name: 'Sara Ali', faculty: 'Medicine', date: '2024-01-14' },
  { id: 3, name: 'Mohammed Khaled', faculty: 'Business', date: '2024-01-14' },
];

const upcomingOpportunities = [
  { id: 1, title: 'Blood Donation Campaign', date: 'Jan 20, 2024', volunteers: 15, needed: 20 },
  { id: 2, title: 'Campus Clean-up Day', date: 'Jan 22, 2024', volunteers: 8, needed: 10 },
  { id: 3, title: 'Student Mentorship Program', date: 'Jan 25, 2024', volunteers: 5, needed: 8 },
];

export function AdminDashboard() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-lg transition-shadow">
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
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{app.name}</p>
                        <p className="text-sm text-muted-foreground">{app.faculty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
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
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingOpportunities.map((opp) => (
                  <div
                    key={opp.id}
                    className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{opp.title}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-4 w-4" />
                          {opp.date}
                        </p>
                      </div>
                      <Badge variant={opp.volunteers >= opp.needed ? 'default' : 'secondary'}>
                        {opp.volunteers}/{opp.needed} volunteers
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${(opp.volunteers / opp.needed) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <UserPlus className="h-6 w-6 text-primary" />
                <span>Add Volunteer</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                <span>Create Opportunity</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Award className="h-6 w-6 text-primary" />
                <span>Issue Certificate</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <ClipboardList className="h-6 w-6 text-primary" />
                <span>Generate Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
