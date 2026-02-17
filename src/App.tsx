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
          <MaintenanceGuard>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/verify" element={<VerifyCertificate />} />
              <Route path="/kiosk" element={<KioskPage />} />
              <Route path="/disability-exam-submit" element={<DisabilityExamSubmission />} />
              <Route path="/book-appointment" element={<BookAppointmentPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/applications" element={<ApplicationsPage />} />
              <Route path="/dashboard/opportunities/*" element={<OpportunitiesRouter />} />
              <Route path="/dashboard/certificates" element={<CertificatesRouter />} />
              <Route path="/dashboard/certificate-verifications" element={<CertificateVerificationsPage />} />
              <Route path="/dashboard/badges" element={<BadgeTransactionsPage />} />
              <Route path="/dashboard/evaluations" element={<EvaluationsRouter />} />
              <Route path="/dashboard/training" element={<TrainingRouter />} />
              <Route path="/dashboard/schedule" element={<SchedulePage />} />
              <Route path="/dashboard/schedules" element={<SchedulesPage />} />
              <Route path="/dashboard/profile" element={<ProfilePage />} />
              <Route path="/dashboard/volunteers" element={<VolunteersPage />} />
              <Route path="/dashboard/reports" element={<ReportsPage />} />
              <Route path="/dashboard/settings" element={<SettingsPage />} />
              <Route path="/dashboard/notifications" element={<NotificationsPage />} />
              
              {/* Faculty Coordinator Routes */}
              <Route path="/dashboard/faculty-volunteers" element={<FacultyVolunteersPage />} />
              <Route path="/dashboard/faculty-applications" element={<FacultyApplicationsPage />} />
              <Route path="/dashboard/faculty-schedules" element={<FacultySchedulesPage />} />
              <Route path="/dashboard/faculty-reports" element={<FacultyReportsPage />} />
              
              {/* Disability Exams Routes */}
              <Route path="/dashboard/disability-exams" element={<DisabilityExamsPage />} />
              <Route path="/dashboard/my-disability-assignments" element={<MyDisabilityAssignmentsPage />} />
              
              {/* Psychological Support Routes */}
              <Route path="/dashboard/psych-profiles" element={<PsychProfilesPage />} />
              <Route path="/dashboard/psych-profiles/:profileId" element={<PsychologicalProfilePage />} />
              
              {/* EMR Routes */}
              <Route path="/dashboard/emr" element={<PatientListPage />} />
              <Route path="/dashboard/emr/stats" element={<EMRStatsPage />} />
              <Route path="/dashboard/emr/patient/:patientId" element={<PatientMasterFile />} />
              <Route path="/dashboard/emr/encounter/:encounterId" element={<EncounterDetailPage />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MaintenanceGuard>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
