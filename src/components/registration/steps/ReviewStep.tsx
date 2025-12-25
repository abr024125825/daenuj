import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RegistrationData } from '../RegistrationWizard';
import { ClipboardCheck, User, GraduationCap, Sparkles, Calendar, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface ReviewStepProps {
  data: RegistrationData;
  onChange: (data: Partial<RegistrationData>) => void;
}

export function ReviewStep({ data, onChange }: ReviewStepProps) {
  const [showPassword, setShowPassword] = useState(false);

  const InfoSection = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <div className="p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <div className="text-sm text-muted-foreground space-y-1">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <ClipboardCheck className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground">Review Your Application</h2>
        <p className="text-muted-foreground mt-2">Please review your information before submitting</p>
      </div>

      <div className="space-y-4">
        <InfoSection icon={User} title="Personal Information">
          <p><span className="font-medium text-foreground">Full Name:</span> {data.firstName} {data.fatherName} {data.grandfatherName} {data.familyName}</p>
          <p><span className="font-medium text-foreground">Email:</span> {data.universityEmail}</p>
          <p><span className="font-medium text-foreground">Phone:</span> {data.phoneNumber}</p>
          <p><span className="font-medium text-foreground">Emergency Contact:</span> {data.emergencyContactName} ({data.emergencyContactPhone})</p>
        </InfoSection>

        <InfoSection icon={GraduationCap} title="Academic Information">
          <p><span className="font-medium text-foreground">University ID:</span> {data.universityId}</p>
          <p><span className="font-medium text-foreground">Faculty:</span> {data.faculty}</p>
          <p><span className="font-medium text-foreground">Major:</span> {data.major}</p>
          <p><span className="font-medium text-foreground">Academic Year:</span> {data.academicYear}</p>
        </InfoSection>

        <InfoSection icon={Sparkles} title="Skills & Interests">
          <p><span className="font-medium text-foreground">Skills:</span> {data.skills.join(', ') || 'None selected'}</p>
          <p><span className="font-medium text-foreground">Interests:</span> {data.interests.join(', ') || 'None selected'}</p>
          {data.previousExperience && (
            <p><span className="font-medium text-foreground">Previous Experience:</span> {data.previousExperience}</p>
          )}
          <p><span className="font-medium text-foreground">Motivation:</span> {data.motivation}</p>
        </InfoSection>

        <InfoSection icon={Calendar} title="Availability">
          {data.availability.length > 0 ? (
            data.availability.map((avail) => (
              <p key={avail.day}>
                <span className="font-medium text-foreground">{avail.day}:</span> {avail.timeSlots.join(', ')}
              </p>
            ))
          ) : (
            <p>No availability selected</p>
          )}
        </InfoSection>
      </div>

      {/* Password Setup */}
      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Set Your Password</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Create a password for your volunteer account. Your username will be your university email.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={data.password}
                onChange={(e) => onChange({ password: e.target.value })}
                placeholder="Min. 8 characters"
                className="h-11 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={data.confirmPassword}
              onChange={(e) => onChange({ confirmPassword: e.target.value })}
              placeholder="Re-enter password"
              className="h-11"
              required
            />
          </div>
        </div>
        {data.password && data.confirmPassword && data.password !== data.confirmPassword && (
          <p className="text-sm text-destructive mt-2">Passwords do not match</p>
        )}
      </div>

      {/* Code of Conduct */}
      <div className="p-4 bg-muted/30 rounded-lg border border-border">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={data.acceptCodeOfConduct}
            onCheckedChange={(checked) => onChange({ acceptCodeOfConduct: checked as boolean })}
            className="mt-1"
          />
          <div>
            <span className="font-medium text-foreground">
              I accept the Code of Conduct *
            </span>
            <p className="text-sm text-muted-foreground mt-1">
              I have read and agree to abide by the University of Jordan's and the Community Service Center's 
              code of conduct, ethics guidelines, and volunteer policies. I understand that any violation may 
              result in removal from the volunteer program.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
