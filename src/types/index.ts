export type UserRole = 'admin' | 'supervisor' | 'volunteer';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export type OpportunityStatus = 'draft' | 'published' | 'completed';

export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday';

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
}

export interface VolunteerApplication {
  id: string;
  firstName: string;
  fatherName: string;
  grandfatherName: string;
  familyName: string;
  universityEmail: string;
  phoneNumber: string;
  universityId: string;
  faculty: string;
  major: string;
  academicYear: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  skills: string[];
  interests: string[];
  previousExperience: string;
  motivation: string;
  availability: VolunteerAvailability[];
  status: ApplicationStatus;
  rejectionReason?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export interface VolunteerAvailability {
  day: DayOfWeek;
  timeSlots: TimeSlot[];
}

export interface Volunteer extends VolunteerApplication {
  userId: string;
  totalHours: number;
  opportunitiesCompleted: number;
  certificates: Certificate[];
  trainingsCompleted: string[];
  rating?: number;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  requiredVolunteers: number;
  registeredVolunteers: string[];
  approvedVolunteers: string[];
  attendedVolunteers: string[];
  facultyRestriction?: string;
  status: OpportunityStatus;
  qrCodeActive: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface Certificate {
  id: string;
  volunteerId: string;
  opportunityId: string;
  opportunityTitle: string;
  hours: number;
  issuedAt: Date;
  templateId: string;
}

export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  content: TrainingContent[];
  isRequired: boolean;
  createdAt: Date;
}

export interface TrainingContent {
  id: string;
  type: 'text' | 'video' | 'quiz';
  title: string;
  content: string;
  order: number;
}

export interface Evaluation {
  id: string;
  volunteerId: string;
  opportunityId: string;
  volunteerFeedback: EvaluationItem[];
  supervisorRating?: EvaluationItem[];
  submittedAt: Date;
}

export interface EvaluationItem {
  criterion: string;
  rating: number;
  comment?: string;
}

export interface Faculty {
  id: string;
  name: string;
  majors: string[];
}

export const FACULTIES: Faculty[] = [
  { id: '1', name: 'Faculty of Engineering', majors: ['Computer Engineering', 'Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Chemical Engineering', 'Architecture'] },
  { id: '2', name: 'Faculty of Medicine', majors: ['Medicine', 'Nursing', 'Medical Laboratory Sciences'] },
  { id: '3', name: 'Faculty of Science', majors: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Geology'] },
  { id: '4', name: 'Faculty of Business', majors: ['Business Administration', 'Accounting', 'Finance', 'Marketing', 'Management Information Systems'] },
  { id: '5', name: 'Faculty of Law', majors: ['Law'] },
  { id: '6', name: 'Faculty of Arts', majors: ['Arabic Language', 'English Language', 'History', 'Geography', 'Philosophy'] },
  { id: '7', name: 'Faculty of Educational Sciences', majors: ['Counseling', 'Curriculum and Instruction', 'Educational Administration'] },
  { id: '8', name: 'Faculty of Pharmacy', majors: ['Pharmacy'] },
  { id: '9', name: 'Faculty of Dentistry', majors: ['Dentistry'] },
  { id: '10', name: 'Faculty of Information Technology', majors: ['Computer Science', 'Software Engineering', 'Cybersecurity', 'Data Science'] },
];

export const SKILLS = [
  'Communication',
  'Leadership',
  'Teamwork',
  'Problem Solving',
  'Time Management',
  'Public Speaking',
  'First Aid',
  'Event Planning',
  'Photography',
  'Graphic Design',
  'Video Editing',
  'Social Media Management',
  'Teaching',
  'Mentoring',
  'Translation',
  'Data Entry',
  'Customer Service',
  'Project Management',
];

export const INTERESTS = [
  'Education & Teaching',
  'Healthcare & Medical',
  'Environment & Sustainability',
  'Community Development',
  'Youth Empowerment',
  'Sports & Recreation',
  'Arts & Culture',
  'Technology & Innovation',
  'Social Services',
  'Elderly Care',
  'Children & Youth',
  'Disability Support',
  'Emergency Response',
  'Event Management',
  'Fundraising',
  'Advocacy & Awareness',
];

export const ACADEMIC_YEARS = [
  'First Year',
  'Second Year',
  'Third Year',
  'Fourth Year',
  'Fifth Year',
  'Graduate Student',
];
