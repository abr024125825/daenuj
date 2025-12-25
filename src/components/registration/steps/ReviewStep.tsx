import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RegistrationData } from '../RegistrationWizard';
import { Faculty, Major } from '@/hooks/useFaculties';
import { ClipboardCheck, User, GraduationCap, Sparkles, Calendar } from 'lucide-react';

interface ReviewStepProps {
  data: RegistrationData;
  onChange: (data: Partial<RegistrationData>) => void;
  faculties: Faculty[];
  majors: Major[];
}

export function ReviewStep({ data, onChange, faculties, majors }: ReviewStepProps) {
  const facultyName = faculties.find(f => f.id === data.facultyId)?.name || 'Not selected';
  const majorName = majors.find(m => m.id === data.majorId)?.name || 'Not selected';

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
          <p><span className="font-medium text-foreground">Faculty:</span> {facultyName}</p>
          <p><span className="font-medium text-foreground">Major:</span> {majorName}</p>
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
