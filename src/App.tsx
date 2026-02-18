import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
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

// Screening
import ScreeningTestPage from "./pages/ScreeningTestPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes always accessible */}
            <Route path="/verify" element={<VerifyCertificate />} />
            <Route path="/kiosk" element={<KioskPage />} />
            <Route path="/disability-exam-submit" element={<DisabilityExamSubmission />} />
            <Route path="/book-appointment" element={<BookAppointmentPage />} />
            <Route path="/screening" element={<ScreeningTestPage />} />
            {/* Settings always accessible (so admin can turn off maintenance) */}
            <Route path="/dashboard/settings" element={<SettingsPage />} />

            {/* All other routes wrapped in MaintenanceGuard */}
            <Route path="/" element={<MaintenanceGuard><Index /></MaintenanceGuard>} />
            <Route path="/register" element={<MaintenanceGuard><RegisterPage /></MaintenanceGuard>} />
            <Route path="/dashboard" element={<MaintenanceGuard><Dashboard /></MaintenanceGuard>} />
            <Route path="/dashboard/applications" element={<MaintenanceGuard><ApplicationsPage /></MaintenanceGuard>} />
            <Route path="/dashboard/opportunities/*" element={<MaintenanceGuard><OpportunitiesRouter /></MaintenanceGuard>} />
            <Route path="/dashboard/certificates" element={<MaintenanceGuard><CertificatesRouter /></MaintenanceGuard>} />
            <Route path="/dashboard/certificate-verifications" element={<MaintenanceGuard><CertificateVerificationsPage /></MaintenanceGuard>} />
            <Route path="/dashboard/badges" element={<MaintenanceGuard><BadgeTransactionsPage /></MaintenanceGuard>} />
            <Route path="/dashboard/evaluations" element={<MaintenanceGuard><EvaluationsRouter /></MaintenanceGuard>} />
            <Route path="/dashboard/training" element={<MaintenanceGuard><TrainingRouter /></MaintenanceGuard>} />
            <Route path="/dashboard/schedule" element={<MaintenanceGuard><SchedulePage /></MaintenanceGuard>} />
            <Route path="/dashboard/schedules" element={<MaintenanceGuard><SchedulesPage /></MaintenanceGuard>} />
            <Route path="/dashboard/profile" element={<MaintenanceGuard><ProfilePage /></MaintenanceGuard>} />
            <Route path="/dashboard/volunteers" element={<MaintenanceGuard><VolunteersPage /></MaintenanceGuard>} />
            <Route path="/dashboard/reports" element={<MaintenanceGuard><ReportsPage /></MaintenanceGuard>} />
            <Route path="/dashboard/notifications" element={<MaintenanceGuard><NotificationsPage /></MaintenanceGuard>} />

            {/* Faculty Coordinator Routes */}
            <Route path="/dashboard/faculty-volunteers" element={<MaintenanceGuard><FacultyVolunteersPage /></MaintenanceGuard>} />
            <Route path="/dashboard/faculty-applications" element={<MaintenanceGuard><FacultyApplicationsPage /></MaintenanceGuard>} />
            <Route path="/dashboard/faculty-schedules" element={<MaintenanceGuard><FacultySchedulesPage /></MaintenanceGuard>} />
            <Route path="/dashboard/faculty-reports" element={<MaintenanceGuard><FacultyReportsPage /></MaintenanceGuard>} />

            {/* Disability Exams Routes */}
            <Route path="/dashboard/disability-exams" element={<MaintenanceGuard><DisabilityExamsPage /></MaintenanceGuard>} />
            <Route path="/dashboard/my-disability-assignments" element={<MaintenanceGuard><MyDisabilityAssignmentsPage /></MaintenanceGuard>} />

            {/* Psychological Support Routes */}
            <Route path="/dashboard/psych-profiles" element={<MaintenanceGuard><PsychProfilesPage /></MaintenanceGuard>} />
            <Route path="/dashboard/psych-profiles/:profileId" element={<MaintenanceGuard><PsychologicalProfilePage /></MaintenanceGuard>} />

            {/* EMR Routes */}
            <Route path="/dashboard/emr" element={<MaintenanceGuard><PatientListPage /></MaintenanceGuard>} />
            <Route path="/dashboard/emr/stats" element={<MaintenanceGuard><EMRStatsPage /></MaintenanceGuard>} />
            <Route path="/dashboard/emr/all" element={<MaintenanceGuard><AllPatientsReadOnlyPage /></MaintenanceGuard>} />
            <Route path="/dashboard/emr/requests" element={<MaintenanceGuard><FileOpenRequestsPage /></MaintenanceGuard>} />
            <Route path="/dashboard/emr/patient/:patientId" element={<MaintenanceGuard><PatientMasterFile /></MaintenanceGuard>} />
            <Route path="/dashboard/emr/encounter/:encounterId" element={<MaintenanceGuard><EncounterDetailPage /></MaintenanceGuard>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
