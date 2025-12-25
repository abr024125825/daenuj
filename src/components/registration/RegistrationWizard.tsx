import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { AcademicInfoStep } from './steps/AcademicInfoStep';
import { SkillsInterestsStep } from './steps/SkillsInterestsStep';
import { AvailabilityStep } from './steps/AvailabilityStep';
import { ReviewStep } from './steps/ReviewStep';
import { useSubmitApplication } from '@/hooks/useApplications';
import { useFaculties, useMajors } from '@/hooks/useFaculties';

export interface RegistrationData {
  firstName: string;
  fatherName: string;
  grandfatherName: string;
  familyName: string;
  universityEmail: string;
  phoneNumber: string;
  universityId: string;
  facultyId: string;
  majorId: string;
  academicYear: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  skills: string[];
  interests: string[];
  previousExperience: string;
  motivation: string;
  availability: { day: string; timeSlots: string[] }[];
  acceptCodeOfConduct: boolean;
}

const STEPS = [
  { id: 1, title: 'Personal Info', description: 'Basic details' },
  { id: 2, title: 'Academic Info', description: 'University details' },
  { id: 3, title: 'Skills & Interests', description: 'Your expertise' },
  { id: 4, title: 'Availability', description: 'When you can volunteer' },
  { id: 5, title: 'Review & Submit', description: 'Confirm details' },
];

export function RegistrationWizard({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const submitMutation = useSubmitApplication();
  const { data: faculties } = useFaculties();

  const [formData, setFormData] = useState<RegistrationData>({
    firstName: '',
    fatherName: '',
    grandfatherName: '',
    familyName: '',
    universityEmail: '',
    phoneNumber: '',
    universityId: '',
    facultyId: '',
    majorId: '',
    academicYear: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    skills: [],
    interests: [],
    previousExperience: '',
    motivation: '',
    availability: [],
    acceptCodeOfConduct: false,
  });

  const { data: majors } = useMajors(formData.facultyId);

  const updateFormData = (data: Partial<RegistrationData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    await submitMutation.mutateAsync({
      first_name: formData.firstName,
      father_name: formData.fatherName,
      grandfather_name: formData.grandfatherName,
      family_name: formData.familyName,
      university_email: formData.universityEmail,
      phone_number: formData.phoneNumber,
      university_id: formData.universityId,
      faculty_id: formData.facultyId,
      major_id: formData.majorId,
      academic_year: formData.academicYear,
      emergency_contact_name: formData.emergencyContactName,
      emergency_contact_phone: formData.emergencyContactPhone,
      skills: formData.skills,
      interests: formData.interests,
      previous_experience: formData.previousExperience || null,
      motivation: formData.motivation,
      availability: formData.availability,
    });
    onClose();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep data={formData} onChange={updateFormData} />;
      case 2:
        return (
          <AcademicInfoStep 
            data={formData} 
            onChange={updateFormData} 
            faculties={faculties || []}
            majors={majors || []}
          />
        );
      case 3:
        return <SkillsInterestsStep data={formData} onChange={updateFormData} />;
      case 4:
        return <AvailabilityStep data={formData} onChange={updateFormData} />;
      case 5:
        return (
          <ReviewStep 
            data={formData} 
            onChange={updateFormData}
            faculties={faculties || []}
            majors={majors || []}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Progress Steps */}
      <div className="px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                    currentStep > step.id
                      ? 'bg-primary text-primary-foreground'
                      : currentStep === step.id
                      ? 'bg-primary text-primary-foreground shadow-glow'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="hidden md:block mt-2 text-center">
                  <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.title}
                  </p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-12 lg:w-20 h-1 mx-2 rounded transition-colors ${
                    currentStep > step.id ? 'bg-primary' : 'bg-secondary'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto animate-fade-in">
          {renderStep()}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 py-4 border-t border-border bg-card">
        <div className="flex justify-between max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep === STEPS.length ? (
            <Button
              variant="hero"
              onClick={handleSubmit}
              disabled={submitMutation.isPending || !formData.acceptCodeOfConduct}
              className="gap-2"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Submit Application
                </>
              )}
            </Button>
          ) : (
            <Button variant="hero" onClick={handleNext} className="gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
