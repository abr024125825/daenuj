import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Settings, Mail, UserCheck, GraduationCap, Shield, PartyPopper } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';

export function SystemConfigurationPanel() {
  const { settings, isLoading, updateSetting } = useSystemSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const configItems = [
    {
      key: 'auto_approve_registrations',
      label: 'Auto-Approve Opportunity Registrations',
      description: 'Automatically approve volunteer registrations for opportunities without admin review',
      icon: UserCheck,
      enabled: settings?.auto_approve_registrations ?? false,
      badgeText: 'Workflow',
      badgeColor: 'bg-blue-500',
    },
    {
      key: 'email_notifications',
      label: 'Email Notifications',
      description: 'Send email notifications for important events like approvals, new opportunities, and reminders',
      icon: Mail,
      enabled: settings?.email_notifications ?? true,
      badgeText: 'Communication',
      badgeColor: 'bg-green-500',
    },
    {
      key: 'exam_schedule_enabled',
      label: 'Exam Schedule Input',
      description: 'Allow volunteers to input their exam schedules (First, Second, Midterm, Final) to help determine availability',
      icon: GraduationCap,
      enabled: settings?.exam_schedule_enabled ?? false,
      badgeText: 'Schedule',
      badgeColor: 'bg-purple-500',
    },
    {
      key: 'inauguration_enabled',
      label: 'Website Inauguration Gate',
      description: 'When enabled, the entire website is locked behind an inauguration screen requiring a password to launch. Disable to remove the gate.',
      icon: PartyPopper,
      enabled: settings?.inauguration_enabled ?? false,
      badgeText: 'Launch',
      badgeColor: 'bg-amber-500',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>System Configuration</CardTitle>
        </div>
        <CardDescription>
          Configure system-wide settings for the volunteer management platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {configItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium cursor-pointer">
                      {item.label}
                    </Label>
                    <Badge 
                      variant="secondary" 
                      className={`${item.badgeColor} text-white text-xs`}
                    >
                      {item.badgeText}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {item.description}
                  </p>
                </div>
              </div>
              <Switch
                checked={item.enabled}
                onCheckedChange={(checked) => {
                  updateSetting.mutate({ key: item.key, enabled: checked });
                }}
              />
            </div>
          );
        })}

        {/* Security Notice */}
        <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Security Notice
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Changes to these settings take effect immediately for all users. 
              Review your choices carefully before enabling automatic workflows.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
