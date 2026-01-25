import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Key, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { usePasswordManagement } from '@/hooks/usePasswordManagement';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PasswordManagementPanelProps {
  isCurrentUser?: boolean;
}

export function PasswordManagementPanel({ isCurrentUser = true }: PasswordManagementPanelProps) {
  const { updateOwnPassword, isUpdating } = usePasswordManagement();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      return;
    }

    const result = await updateOwnPassword(newPassword);
    if (result) {
      setSuccess(true);
      setTimeout(() => {
        setDialogOpen(false);
        setSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    }
  };

  const isValid = newPassword.length >= 6 && newPassword === confirmPassword;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>Password Management</CardTitle>
          </div>
          <CardDescription>
            Change your account password for security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label className="text-base font-medium">Change Password</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Update your password to keep your account secure
                </p>
              </div>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              Change Password
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <Label className="text-base font-medium">Password Reset Email</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Forgot your password? Request a reset link via email
                </p>
                <Badge variant="secondary" className="mt-2">
                  Self-Service
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Enter your new password. Password must be at least 6 characters.
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="py-8 flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <p className="text-lg font-medium text-green-600">Password Changed Successfully!</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  {newPassword && newPassword.length < 6 && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Password must be at least 6 characters
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Passwords do not match
                    </p>
                  )}
                </div>

                {isValid && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      Password is valid and ready to be changed
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleChangePassword}
                  disabled={!isValid || isUpdating}
                >
                  {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Change Password
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
