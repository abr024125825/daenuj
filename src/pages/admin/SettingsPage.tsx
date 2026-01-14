import { useState } from 'react';
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
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Users, Shield, Settings, Search, Loader2, UserCog, Calendar, Key, Mail } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { SemesterManagement } from '@/components/admin/SemesterManagement';
import { usePasswordManagement } from '@/hooks/usePasswordManagement';

export function SettingsPage() {
  const { users, isLoading, updateUserRole, toggleUserActive } = useUsers();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [seederDialogOpen, setSeederDialogOpen] = useState(false);
  const [seederEmail, setSeederEmail] = useState('');
  const [seederPassword, setSeederPassword] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

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
      // Create the user
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
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update the user's role to admin
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
                    <CardDescription>Manage user roles and access</CardDescription>
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
                                <SelectTrigger className="w-32">
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
                <CardDescription>Configure system-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-approve volunteer registrations</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically approve opportunity registrations
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send email notifications for important events
                      </p>
                    </div>
                    <Switch defaultChecked />
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
              <Button
                className="w-full"
                onClick={handleCreateAdmin}
                disabled={isCreatingAdmin}
              >
                {isCreatingAdmin && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Admin
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
