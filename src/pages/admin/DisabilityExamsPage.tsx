import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DisabilityStudentsManager } from '@/components/disability/DisabilityStudentsManager';
import { DisabilityExamsManager } from '@/components/disability/DisabilityExamsManager';
import { DisabilityAssignmentsManager } from '@/components/disability/DisabilityAssignmentsManager';
import { DisabilityExamLogsViewer } from '@/components/disability/DisabilityExamLogsViewer';
import { DisabilityStatsOverview } from '@/components/disability/DisabilityStatsOverview';
import { DisabilityExamCalendar } from '@/components/disability/DisabilityExamCalendar';
import { DisabilityCoordinatorManagement } from '@/components/disability/DisabilityCoordinatorManagement';
import { useDisabilityExams } from '@/hooks/useDisabilityExams';
import { useDisabilityExamAssignments } from '@/hooks/useDisabilityExamAssignments';
import { useAcademicSemesters } from '@/hooks/useAcademicSemesters';
import { useAuth } from '@/contexts/AuthContext';
import { exportDisabilityExamsToExcel, exportDisabilityExamsToPDF } from '@/lib/exportDisabilityExams';
import { 
  Users, 
  FileText, 
  UserCheck, 
  History, 
  BarChart3, 
  Calendar, 
  UserCog,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function DisabilityExamsPage() {
  const { profile } = useAuth();
  const { activeSemester } = useAcademicSemesters();
  const { exams } = useDisabilityExams(activeSemester?.id);
  const { assignments } = useDisabilityExamAssignments();
  const [activeTab, setActiveTab] = useState('overview');

  const isAdmin = profile?.role === 'admin';

  const handleExportExcel = () => {
    if (exams && assignments) {
      exportDisabilityExamsToExcel({ exams, assignments });
    }
  };

  const handleExportPDF = () => {
    if (exams && assignments) {
      exportDisabilityExamsToPDF({ exams, assignments });
    }
  };

  return (
    <DashboardLayout title="Disability Exams Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Disability Exams Management</h1>
            <p className="text-muted-foreground">
              Manage students with disabilities, their exams, and volunteer assignments
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export to Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Export to PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-7' : 'grid-cols-6'}`}>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Students</span>
            </TabsTrigger>
            <TabsTrigger value="exams" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Exams</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="coordinators" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                <span className="hidden sm:inline">Coordinators</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <DisabilityStatsOverview />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <DisabilityExamCalendar />
          </TabsContent>

          <TabsContent value="students" className="mt-6">
            <DisabilityStudentsManager />
          </TabsContent>

          <TabsContent value="exams" className="mt-6">
            <DisabilityExamsManager />
          </TabsContent>

          <TabsContent value="assignments" className="mt-6">
            <DisabilityAssignmentsManager />
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <DisabilityExamLogsViewer />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="coordinators" className="mt-6">
              <DisabilityCoordinatorManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
