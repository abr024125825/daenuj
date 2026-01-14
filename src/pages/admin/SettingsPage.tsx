import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Users, Shield, Settings, Search, Loader2, Calendar, Key } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { SemesterManagement } from '@/components/admin/SemesterManagement';

// System configuration stored in localStorage (could be moved to database)
interface SystemConfig {
  autoApproveRegistrations: boolean;
  emailNotifications: boolean;
}

const DEFAULT_CONFIG: SystemConfig = {
  autoApproveRegistrations: false,
  emailNotifications: true,
};

function useSystemConfig() {
  const [config, setConfig] = useState<SystemConfig>(() => {
    const saved = localStorage.getItem('system-config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const updateConfig = (key: keyof SystemConfig, value: boolean) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    localStorage.setItem('system-config', JSON.stringify(newConfig));
  };

  return { config, updateConfig };
}

export function SettingsPage() {
  const { users, isLoading, updateUserRole, toggleUserActive } = useUsers();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { config, updateConfig } = useSystemConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [seederDialogOpen, setSeederDialogOpen] = useState(false);
  const [seederEmail, setSeederEmail] = useState('');
  const [seederPassword, setSeederPassword] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  
  // Password reset state
  const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<any>(null);
  const [newPasswordForUser, setNewPasswordForUser] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const filteredUsers = users?.filter(
    (u: any) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.last_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateAdmin = async () => {
    if (!seederEmail || !seederPassword) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setIsCreatingAdmin(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: seederEmail,
        password: seederPassword,
        options: {
          data: {
            first_name: 'Admin',
            last_name: 'User',
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', authData.user.id);

        if (roleError) throw roleError;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('user_id', authData.user.id);

        if (profileError) throw profileError;

        toast({ title: 'Success', description: 'Admin user created successfully' });
        setSeederDialogOpen(false);
        setSeederEmail('');
        setSeederPassword('');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPasswordForUser || newPasswordForUser.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setIsResettingPassword(true);
    try {
      // Note: This requires admin API access. For now, we'll use a workaround
      // In production, this should be done via an edge function with service role
      const { error } = await supabase.auth.admin.updateUserById(
        selectedUserForReset.user_id,
        { password: newPasswordForUser }
      );

      if (error) throw error;

      toast({ title: 'Success', description: `Password reset for ${selectedUserForReset.first_name} ${selectedUserForReset.last_name}` });
      setPasswordResetDialogOpen(false);
      setSelectedUserForReset(null);
      setNewPasswordForUser('');
    } catch (error: any) {
      // Fallback message if admin API is not available
      toast({ 
        title: 'Note', 
        description: 'Password reset requires server-side admin privileges. Please use the password reset email flow instead.',
        variant: 'destructive'
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const openPasswordReset = (user: any) => {
    setSelectedUserForReset(user);
    setNewPasswordForUser('');
    setPasswordResetDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'supervisor': return 'default';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Settings">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold">System Settings</h2>
            <p className="text-muted-foreground">Manage users, roles, and system configuration</p>
          </div>
          <Button onClick={() => setSeederDialogOpen(true)}>
            <Shield className="h-4 w-4 mr-2" />
            Create Admin User
          </Button>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="semesters" className="gap-2">
              <Calendar className="h-4 w-4" />
              Academic Semesters
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>Manage user roles, access, and passwords</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.map((u: any) => {
                      const userRole = u.role || 'volunteer';
                      const isCurrentUser = u.user_id === currentUser?.id;

                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">
                                  {u.first_name?.[0]}{u.last_name?.[0]}
                                </span>
                              </div>
                              <span className="font-medium">
                                {u.first_name} {u.last_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(userRole)}>
                              {userRole}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.is_active ? 'outline' : 'secondary'}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(u.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Select
                                value={userRole}
                                onValueChange={(value) => 
                                  updateUserRole.mutate({ 
                                    userId: u.user_id, 
                                    role: value as any 
                                  })
                                }
                                disabled={isCurrentUser}
                              >
                                <SelectTrigger className="w-28">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="volunteer">Volunteer</SelectItem>
                                  <SelectItem value="supervisor">Supervisor</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <Switch
                                checked={u.is_active}
                                onCheckedChange={(checked) =>
                                  toggleUserActive.mutate({ userId: u.user_id, isActive: checked })
                                }
                                disabled={isCurrentUser}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openPasswordReset(u)}
                                disabled={isCurrentUser}
                                title="Reset Password"
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="semesters" className="space-y-4">
            <SemesterManagement />
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Configure system-wide settings for the volunteer management system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <Label className="text-base font-medium">Auto-approve volunteer registrations</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Automatically approve opportunity registrations without admin review
                      </p>
                    </div>
                    <Switch
                      checked={config.autoApproveRegistrations}
                      onCheckedChange={(checked) => {
                        updateConfig('autoApproveRegistrations', checked);
                        toast({ 
                          title: 'Setting updated', 
                          description: `Auto-approve registrations ${checked ? 'enabled' : 'disabled'}` 
                        });
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <Label className="text-base font-medium">Email notifications</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Send email notifications for important events like approvals and new opportunities
                      </p>
                    </div>
                    <Switch
                      checked={config.emailNotifications}
                      onCheckedChange={(checked) => {
                        updateConfig('emailNotifications', checked);
                        toast({ 
                          title: 'Setting updated', 
                          description: `Email notifications ${checked ? 'enabled' : 'disabled'}` 
                        });
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Admin Seeder Dialog */}
        <Dialog open={seederDialogOpen} onOpenChange={setSeederDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Admin User</DialogTitle>
              <DialogDescription>
                Create a new admin user with full system access
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={seederEmail}
                  onChange={(e) => setSeederEmail(e.target.value)}
                  placeholder="admin@university.edu"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={seederPassword}
                  onChange={(e) => setSeederPassword(e.target.value)}
                  placeholder="Secure password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSeederDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAdmin} disabled={isCreatingAdmin}>
                {isCreatingAdmin && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Admin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Password Reset Dialog */}
        <Dialog open={passwordResetDialogOpen} onOpenChange={setPasswordResetDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset User Password</DialogTitle>
              <DialogDescription>
                Set a new password for {selectedUserForReset?.first_name} {selectedUserForReset?.last_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="new-user-password">New Password</Label>
                <Input
                  id="new-user-password"
                  type="password"
                  value={newPasswordForUser}
                  onChange={(e) => setNewPasswordForUser(e.target.value)}
                  placeholder="Enter new password"
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters long
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPasswordResetDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handlePasswordReset} 
                disabled={isResettingPassword || newPasswordForUser.length < 6}
              >
                {isResettingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Reset Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}