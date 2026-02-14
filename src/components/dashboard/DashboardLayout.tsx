import { useState } from 'react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Award,
  GraduationCap,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  ClipboardList,
  MessageSquare,
  Shield,
  BookOpen,
  IdCard,
  Accessibility,
  HandHeart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
  children?: { label: string; href: string }[];
}

const adminNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: ClipboardList, label: 'Applications', href: '/dashboard/applications', badge: 5 },
  { icon: Users, label: 'Volunteers', href: '/dashboard/volunteers' },
  { icon: BookOpen, label: 'Schedules', href: '/dashboard/schedules' },
  { icon: Calendar, label: 'Opportunities', href: '/dashboard/opportunities' },
  { icon: IdCard, label: 'Badge Tracking', href: '/dashboard/badges' },
  { icon: Award, label: 'Certificates', href: '/dashboard/certificates' },
  { icon: Shield, label: 'Verification Logs', href: '/dashboard/certificate-verifications' },
  { icon: MessageSquare, label: 'Evaluations', href: '/dashboard/evaluations' },
  { icon: GraduationCap, label: 'Training', href: '/dashboard/training' },
  { icon: Accessibility, label: 'Disability Exams', href: '/dashboard/disability-exams' },
  { icon: BarChart3, label: 'Reports', href: '/dashboard/reports' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

// Faculty coordinator has limited access - only their faculty data
const facultyCoordinatorNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Faculty Volunteers', href: '/dashboard/faculty-volunteers' },
  { icon: ClipboardList, label: 'Applications', href: '/dashboard/faculty-applications' },
  { icon: BookOpen, label: 'Schedules', href: '/dashboard/faculty-schedules' },
  { icon: BarChart3, label: 'Faculty Reports', href: '/dashboard/faculty-reports' },
  { icon: Bell, label: 'Notifications', href: '/dashboard/notifications' },
];

// Disability coordinator - focused on disability exam management
const disabilityCoordinatorNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Accessibility, label: 'Disability Exams', href: '/dashboard/disability-exams' },
  { icon: Bell, label: 'Notifications', href: '/dashboard/notifications' },
];

// Psychologist - clinical support
const psychologistNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FileText, label: 'Patient Records (EMR)', href: '/dashboard/emr' },
  { icon: Users, label: 'Student Profiles', href: '/dashboard/psych-profiles' },
  { icon: Bell, label: 'Notifications', href: '/dashboard/notifications' },
];

const volunteerNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'My Profile', href: '/dashboard/profile' },
  { icon: Calendar, label: 'Opportunities', href: '/dashboard/opportunities' },
  { icon: BookOpen, label: 'Schedule', href: '/dashboard/schedule' },
  { icon: Award, label: 'My Certificates', href: '/dashboard/certificates' },
  { icon: GraduationCap, label: 'Training', href: '/dashboard/training' },
  { icon: HandHeart, label: 'Disability Support', href: '/dashboard/my-disability-assignments' },
  { icon: Bell, label: 'Notifications', href: '/dashboard/notifications', badge: 3 },
];

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Determine navigation based on role and faculty assignment
  const isFacultyCoordinator = profile?.role === 'supervisor' && profile?.faculty_id;
  const isDisabilityCoordinator = profile?.role === 'disability_coordinator';
  const isPsychologist = profile?.role === 'psychologist';
  
  let navItems: NavItem[];
  if (profile?.role === 'admin') {
    navItems = adminNavItems;
  } else if (isPsychologist) {
    navItems = psychologistNavItems;
  } else if (isDisabilityCoordinator) {
    navItems = disabilityCoordinatorNavItems;
  } else if (isFacultyCoordinator) {
    navItems = facultyCoordinatorNavItems;
  } else if (profile?.role === 'supervisor') {
    navItems = adminNavItems; // Regular supervisors get admin nav
  } else {
    navItems = volunteerNavItems;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <Link to="/dashboard">
              <Logo size="md" />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      "ml-auto px-2 py-0.5 text-xs font-semibold rounded-full",
                      isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-accent text-accent-foreground"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-display font-semibold text-foreground">{title}</h1>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-lg hover:bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
