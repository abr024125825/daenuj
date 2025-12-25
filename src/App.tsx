import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import { ApplicationsPage } from "./pages/admin/ApplicationsPage";
import { OpportunitiesRouter } from "./components/routing/OpportunitiesRouter";
import { CertificatesRouter } from "./components/routing/CertificatesRouter";
import { SettingsPage } from "./pages/admin/SettingsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import NotFound from "./pages/NotFound";

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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/applications" element={<ApplicationsPage />} />
            <Route path="/dashboard/opportunities" element={<OpportunitiesRouter />} />
            <Route path="/dashboard/certificates" element={<CertificatesRouter />} />
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
