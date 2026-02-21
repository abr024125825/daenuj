import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { AuthGuard } from "@/components/AuthGuard";
import { InaugurationGate } from "@/components/InaugurationGate";
import Index from "./pages/Index";
import { RegisterPage } from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import { ApplicationsPage } from "./pages/admin/ApplicationsPage";
import { OpportunitiesRouter } from "./components/routing/OpportunitiesRouter";
import { CertificatesRouter } from "./components/routing/CertificatesRouter";
import { EvaluationsRouter } from "./components/routing/EvaluationsRouter";
import { TrainingRouter } from "./components/routing/TrainingRouter";
import { SettingsPage } from "./pages/admin/SettingsPage";
import { VolunteersPage } from "./pages/admin/VolunteersPage";
import { ReportsPage } from "./pages/admin/ReportsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { CertificateVerificationsPage } from "./pages/admin/CertificateVerificationsPage";
import { BadgeTransactionsPage } from "./pages/admin/BadgeTransactionsPage";
import { SchedulePage } from "./pages/volunteer/SchedulePage";
import { SchedulesPage } from "./pages/admin/SchedulesPage";
import { ProfilePage } from "./pages/volunteer/ProfilePage";
import NotFound from "./pages/NotFound";
import { VerifyCertificate } from "./pages/VerifyCertificate";
import { KioskPage } from "./pages/KioskPage";
import BookAppointmentPage from "./pages/BookAppointmentPage";

// Faculty Coordinator Pages
import { FacultyVolunteersPage } from "./pages/faculty/FacultyVolunteersPage";
import { FacultyApplicationsPage } from "./pages/faculty/FacultyApplicationsPage";
import { FacultySchedulesPage } from "./pages/faculty/FacultySchedulesPage";
import { FacultyReportsPage } from "./pages/faculty/FacultyReportsPage";

// Disability Exams Pages
import { DisabilityExamsPage } from "./pages/admin/DisabilityExamsPage";
import { MyDisabilityAssignmentsPage } from "./pages/volunteer/MyDisabilityAssignmentsPage";
import { DisabilityExamSubmission } from "./pages/DisabilityExamSubmission";

// Psychological Support Pages
import { PsychProfilesPage } from "./pages/psych/PsychProfilesPage";
import { PsychologicalProfilePage } from "./pages/psych/PsychologicalProfilePage";

// EMR Pages
import { PatientListPage } from "./pages/emr/PatientListPage";
import { PatientMasterFile } from "./pages/emr/PatientMasterFile";
import { EncounterDetailPage } from "./pages/emr/EncounterDetailPage";
import { EMRStatsPage } from "./pages/emr/EMRStatsPage";
import { FileOpenRequestsPage } from "./pages/emr/FileOpenRequestsPage";
import { AllPatientsReadOnlyPage } from "./pages/emr/AllPatientsReadOnlyPage";

import ScreeningTestPage from "./pages/ScreeningTestPage";
import InstallPage from "./pages/InstallPage";
import { MessagingPage } from "./pages/admin/MessagingPage";
import { ElectionsPage } from "./pages/admin/ElectionsPage";
import { ElectionDetailPage } from "./pages/admin/ElectionDetailPage";
import { ElectionCheckInPage } from "./pages/admin/ElectionCheckInPage";
import { ElectionResultsPage } from "./pages/admin/ElectionResultsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

// Helper wrapper: requires authentication + maintenance guard
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <MaintenanceGuard>
      <AuthGuard>{children}</AuthGuard>
    </MaintenanceGuard>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <InaugurationGate>
        <BrowserRouter>
          <Routes>
            {/* Public routes always accessible */}
            <Route path="/verify" element={<VerifyCertificate />} />
            <Route path="/kiosk" element={<KioskPage />} />
            <Route path="/disability-exam-submit" element={<DisabilityExamSubmission />} />
            <Route path="/book-appointment" element={<BookAppointmentPage />} />
            <Route path="/screening" element={<ScreeningTestPage />} />
            <Route path="/install" element={<InstallPage />} />
            {/* Settings always accessible (so admin can turn off maintenance) */}
            <Route path="/dashboard/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />

            {/* Public pages with maintenance guard only */}
            <Route path="/" element={<MaintenanceGuard><Index /></MaintenanceGuard>} />
            <Route path="/register" element={<MaintenanceGuard><RegisterPage /></MaintenanceGuard>} />

            {/* All dashboard routes: require auth + maintenance guard */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/applications" element={<ProtectedRoute><ApplicationsPage /></ProtectedRoute>} />
            <Route path="/dashboard/opportunities/*" element={<ProtectedRoute><OpportunitiesRouter /></ProtectedRoute>} />
            <Route path="/dashboard/certificates" element={<ProtectedRoute><CertificatesRouter /></ProtectedRoute>} />
            <Route path="/dashboard/certificate-verifications" element={<ProtectedRoute><CertificateVerificationsPage /></ProtectedRoute>} />
            <Route path="/dashboard/badges" element={<ProtectedRoute><BadgeTransactionsPage /></ProtectedRoute>} />
            <Route path="/dashboard/evaluations" element={<ProtectedRoute><EvaluationsRouter /></ProtectedRoute>} />
            <Route path="/dashboard/training" element={<ProtectedRoute><TrainingRouter /></ProtectedRoute>} />
            <Route path="/dashboard/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
            <Route path="/dashboard/schedules" element={<ProtectedRoute><SchedulesPage /></ProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/dashboard/volunteers" element={<ProtectedRoute><VolunteersPage /></ProtectedRoute>} />
            <Route path="/dashboard/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/dashboard/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/dashboard/messages" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />

            {/* Elections Routes */}
            <Route path="/dashboard/elections" element={<ProtectedRoute><ElectionsPage /></ProtectedRoute>} />
            <Route path="/dashboard/elections/:electionId" element={<ProtectedRoute><ElectionDetailPage /></ProtectedRoute>} />
            <Route path="/dashboard/elections/:electionId/checkin" element={<ProtectedRoute><ElectionCheckInPage /></ProtectedRoute>} />
            <Route path="/dashboard/elections/:electionId/results" element={<ProtectedRoute><ElectionResultsPage /></ProtectedRoute>} />

            {/* Faculty Coordinator Routes */}
            <Route path="/dashboard/faculty-volunteers" element={<ProtectedRoute><FacultyVolunteersPage /></ProtectedRoute>} />
            <Route path="/dashboard/faculty-applications" element={<ProtectedRoute><FacultyApplicationsPage /></ProtectedRoute>} />
            <Route path="/dashboard/faculty-schedules" element={<ProtectedRoute><FacultySchedulesPage /></ProtectedRoute>} />
            <Route path="/dashboard/faculty-reports" element={<ProtectedRoute><FacultyReportsPage /></ProtectedRoute>} />

            {/* Disability Exams Routes */}
            <Route path="/dashboard/disability-exams" element={<ProtectedRoute><DisabilityExamsPage /></ProtectedRoute>} />
            <Route path="/dashboard/my-disability-assignments" element={<ProtectedRoute><MyDisabilityAssignmentsPage /></ProtectedRoute>} />

            {/* Psychological Support Routes */}
            <Route path="/dashboard/psych-profiles" element={<ProtectedRoute><PsychProfilesPage /></ProtectedRoute>} />
            <Route path="/dashboard/psych-profiles/:profileId" element={<ProtectedRoute><PsychologicalProfilePage /></ProtectedRoute>} />

            {/* EMR Routes */}
            <Route path="/dashboard/emr" element={<ProtectedRoute><PatientListPage /></ProtectedRoute>} />
            <Route path="/dashboard/emr/stats" element={<ProtectedRoute><EMRStatsPage /></ProtectedRoute>} />
            <Route path="/dashboard/emr/all" element={<ProtectedRoute><AllPatientsReadOnlyPage /></ProtectedRoute>} />
            <Route path="/dashboard/emr/requests" element={<ProtectedRoute><FileOpenRequestsPage /></ProtectedRoute>} />
            <Route path="/dashboard/emr/patient/:patientId" element={<ProtectedRoute><PatientMasterFile /></ProtectedRoute>} />
            <Route path="/dashboard/emr/encounter/:encounterId" element={<ProtectedRoute><EncounterDetailPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </InaugurationGate>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
