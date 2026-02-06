import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DisabilityStudentsManager } from '@/components/disability/DisabilityStudentsManager';
import { DisabilityExamsManager } from '@/components/disability/DisabilityExamsManager';
import { DisabilityAssignmentsManager } from '@/components/disability/DisabilityAssignmentsManager';
import { DisabilityExamLogsViewer } from '@/components/disability/DisabilityExamLogsViewer';
import { Users, FileText, UserCheck, History } from 'lucide-react';

export function DisabilityExamsPage() {
  const [activeTab, setActiveTab] = useState('students');

  return (
    <DashboardLayout title="Disability Exams Management">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Disability Exams Management</h1>
          <p className="text-muted-foreground">
            Manage students with disabilities, their exams, and volunteer assignments
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="exams" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Exams
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Activity Logs
            </TabsTrigger>
          </TabsList>

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
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
