import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RegistrationData } from '../RegistrationWizard';
import { Faculty, Major } from '@/hooks/useFaculties';
import { GraduationCap } from 'lucide-react';

const ACADEMIC_YEARS = [
  'First Year',
  'Second Year',
  'Third Year',
  'Fourth Year',
  'Fifth Year',
  'Graduate Student',
];

interface AcademicInfoStepProps {
  data: RegistrationData;
  onChange: (data: Partial<RegistrationData>) => void;
  faculties: Faculty[];
  majors: Major[];
}

export function AcademicInfoStep({ data, onChange, faculties, majors }: AcademicInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground">Academic Information</h2>
        <p className="text-muted-foreground mt-2">Your university details</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="universityId">University ID *</Label>
        <Input
          id="universityId"
          value={data.universityId}
          onChange={(e) => onChange({ universityId: e.target.value })}
          placeholder="e.g., 2021123456"
          className="h-11"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="faculty">Faculty *</Label>
        <Select
          value={data.facultyId}
          onValueChange={(value) => onChange({ facultyId: value, majorId: '' })}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select your faculty" />
          </SelectTrigger>
          <SelectContent>
            {faculties.map((faculty) => (
              <SelectItem key={faculty.id} value={faculty.id}>
                {faculty.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="major">Major *</Label>
        <Select
          value={data.majorId}
          onValueChange={(value) => onChange({ majorId: value })}
          disabled={!data.facultyId}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder={data.facultyId ? "Select your major" : "Select faculty first"} />
          </SelectTrigger>
          <SelectContent>
            {majors.map((major) => (
              <SelectItem key={major.id} value={major.id}>
                {major.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="academicYear">Academic Year *</Label>
        <Select
          value={data.academicYear}
          onValueChange={(value) => onChange({ academicYear: value })}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select your academic year" />
          </SelectTrigger>
          <SelectContent>
            {ACADEMIC_YEARS.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
