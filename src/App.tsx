import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import MessagingPage from "./pages/admin/MessagingPage";
import { VolunteerMessagesPage } from "./pages/volunteer/MessagesPage";
import { ProfilePage } from "./pages/volunteer/ProfilePage";
import { CalendarPage } from "./pages/volunteer/CalendarPage";
import NotFound from "./pages/NotFound";
import { VerifyCertificate } from "./pages/VerifyCertificate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/verify" element={<VerifyCertificate />} />
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
            <Route path="/dashboard/messaging" element={<MessagingPage />} />
            <Route path="/dashboard/messages" element={<VolunteerMessagesPage />} />
            <Route path="/dashboard/profile" element={<ProfilePage />} />
            <Route path="/dashboard/calendar" element={<CalendarPage />} />
            <Route path="/dashboard/volunteers" element={<VolunteersPage />} />
            <Route path="/dashboard/reports" element={<ReportsPage />} />
            <Route path="/dashboard/settings" element={<SettingsPage />} />
            <Route path="/dashboard/notifications" element={<NotificationsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
