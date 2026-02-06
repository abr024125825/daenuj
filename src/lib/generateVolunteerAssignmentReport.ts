import jsPDF from 'jspdf';
import { format } from 'date-fns';
import logoImage from '@/assets/logo-transparent.png';

interface AssignmentData {
  id: string;
  assigned_role: string;
  status: string;
  assigned_at: string;
  completed_at: string | null;
  notes: string | null;
  exam?: {
    course_name: string;
    course_code: string | null;
    exam_date: string;
    start_time: string;
    end_time: string;
    location: string | null;
    student?: {
      student_name: string;
      university_id: string;
      disability_type: string | null;
    };
  };
}

interface VolunteerInfo {
  id: string;
  volunteer_type: 'general' | 'employment';
  full_name: string;
  university_id?: string;
  faculty?: string;
  total_hours: number;
}

// Dean of Student Affairs Theme Colors
const colors = {
  primary: [25, 130, 160] as const,
  secondary: [59, 160, 190] as const,
  accent: [234, 179, 8] as const,
  dark: [30, 41, 59] as const,
  muted: [100, 116, 139] as const,
  light: [248, 250, 252] as const,
  white: [255, 255, 255] as const,
};

const ROLE_LABELS: Record<string, string> = {
  reader: 'Reader',
  extra_time: 'Extra Time Supervisor',
  companion: 'Companion',
  scribe: 'Scribe',
  separate_room: 'Separate Room Supervisor',
  assistive_technology: 'Assistive Technology Support',
  other: 'Other',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// Convert image to base64 with background color for PDF compatibility
async function getLogoBase64(bgColor?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (bgColor) {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = logoImage;
  });
}

function calculateDurationHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return Math.max(0, (endMinutes - startMinutes) / 60);
}

export async function generateVolunteerAssignmentReport(
  volunteer: VolunteerInfo,
  assignments: AssignmentData[],
  dateRange?: { start: Date; end: Date }
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  
  // Load logo with matching background
  let logoBase64: string | null = null;
  try {
    logoBase64 = await getLogoBase64('#1982A0');
  } catch (e) {
    console.warn('Failed to load logo:', e);
  }
  
  // Header background
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Gold accent line
  doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  doc.rect(0, 45, pageWidth, 3, 'F');
  
  // Logo
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', margin, 8, 30, 30);
  }
  
  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Volunteer Activity Report', pageWidth / 2, 22, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Dean of Student Affairs - University of Jordan', pageWidth / 2, 30, { align: 'center' });
  doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, pageWidth / 2, 38, { align: 'center' });
  
  let yPos = 58;
  
  // Volunteer Info Card
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 32, 3, 3, 'F');
  
  // Card border
  doc.setDrawColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 32, 3, 3, 'S');
  
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Volunteer Information', margin + 5, yPos + 8);
  
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Left column
  doc.text(`Name: ${volunteer.full_name}`, margin + 5, yPos + 17);
  doc.text(`Type: ${volunteer.volunteer_type === 'employment' ? 'Employment Program' : 'General Volunteer'}`, margin + 5, yPos + 25);
  
  // Right column
  if (volunteer.university_id) {
    doc.text(`University ID: ${volunteer.university_id}`, pageWidth / 2, yPos + 17);
  }
  if (volunteer.faculty) {
    doc.text(`Faculty: ${volunteer.faculty}`, pageWidth / 2, yPos + 25);
  }
  
  yPos += 40;
  
  // Filter assignments by date range if provided
  let filteredAssignments = assignments;
  if (dateRange) {
    filteredAssignments = assignments.filter(a => {
      const examDate = a.exam?.exam_date ? new Date(a.exam.exam_date) : null;
      return examDate && examDate >= dateRange.start && examDate <= dateRange.end;
    });
  }
  
  // Calculate statistics
  const completedAssignments = filteredAssignments.filter(a => a.status === 'completed');
  const totalHours = completedAssignments.reduce((sum, a) => {
    if (a.exam) {
      return sum + calculateDurationHours(a.exam.start_time, a.exam.end_time);
    }
    return sum;
  }, 0);
  
  // Summary Statistics Card
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 20, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', margin + 5, yPos + 8);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const statsText = `Total Assignments: ${filteredAssignments.length}  |  Completed: ${completedAssignments.length}  |  Total Hours: ${totalHours.toFixed(1)}`;
  doc.text(statsText, margin + 5, yPos + 16);
  
  yPos += 28;
  
  // Group by month
  const months = new Map<string, AssignmentData[]>();
  filteredAssignments.forEach(assignment => {
    if (assignment.exam?.exam_date) {
      const monthKey = format(new Date(assignment.exam.exam_date), 'yyyy-MM');
      if (!months.has(monthKey)) {
        months.set(monthKey, []);
      }
      months.get(monthKey)!.push(assignment);
    }
  });
  
  // Sort months (newest first)
  const sortedMonths = Array.from(months.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  
  // Monthly breakdown
  sortedMonths.forEach(([monthKey, monthAssignments]) => {
    const monthDate = new Date(monthKey + '-01');
    const monthHours = monthAssignments.reduce((sum, a) => {
      if (a.exam) {
        return sum + calculateDurationHours(a.exam.start_time, a.exam.end_time);
      }
      return sum;
    }, 0);
    
    // Check for page break
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = margin;
    }
    
    // Month header
    doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 10, 2, 2, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(format(monthDate, 'MMMM yyyy'), margin + 5, yPos + 7);
    doc.text(`${monthAssignments.length} assignments | ${monthHours.toFixed(1)} hours`, pageWidth - margin - 5, yPos + 7, { align: 'right' });
    
    yPos += 14;
    
    // Table header
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
    
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Date', margin + 2, yPos + 5);
    doc.text('Time', margin + 22, yPos + 5);
    doc.text('Student', margin + 42, yPos + 5);
    doc.text('Disability', margin + 82, yPos + 5);
    doc.text('Course', margin + 110, yPos + 5);
    doc.text('Role', margin + 148, yPos + 5);
    doc.text('Status', margin + 175, yPos + 5);
    
    yPos += 9;
    
    // Assignment rows
    doc.setFont('helvetica', 'normal');
    
    monthAssignments.forEach((assignment, idx) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }
      
      // Alternate row colors
      if (idx % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
      }
      doc.rect(margin, yPos - 3, pageWidth - 2 * margin, 7, 'F');
      
      const exam = assignment.exam;
      if (exam) {
        doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
        doc.text(format(new Date(exam.exam_date), 'MMM dd'), margin + 2, yPos + 2);
        doc.text(`${exam.start_time}-${exam.end_time}`, margin + 22, yPos + 2);
        
        // Student info (truncated)
        const studentName = exam.student?.student_name || '-';
        const truncatedStudent = studentName.length > 18 ? studentName.substring(0, 16) + '..' : studentName;
        doc.text(truncatedStudent, margin + 42, yPos + 2);
        
        // Disability type
        const disabilityType = exam.student?.disability_type || '-';
        const truncatedDisability = disabilityType.length > 12 ? disabilityType.substring(0, 10) + '..' : disabilityType;
        doc.text(truncatedDisability, margin + 82, yPos + 2);
        
        // Course (truncated)
        const truncatedCourse = exam.course_name.length > 18 ? exam.course_name.substring(0, 16) + '..' : exam.course_name;
        doc.text(truncatedCourse, margin + 110, yPos + 2);
        
        // Role
        const roleLabel = ROLE_LABELS[assignment.assigned_role] || assignment.assigned_role;
        const truncatedRole = roleLabel.length > 12 ? roleLabel.substring(0, 10) + '..' : roleLabel;
        doc.text(truncatedRole, margin + 148, yPos + 2);
        
        // Status with color
        const status = STATUS_LABELS[assignment.status] || assignment.status;
        if (assignment.status === 'completed') {
          doc.setTextColor(34, 197, 94);
        } else if (assignment.status === 'cancelled') {
          doc.setTextColor(239, 68, 68);
        } else {
          doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
        }
        doc.text(status, margin + 175, yPos + 2);
        
        yPos += 7;
      }
    });
    
    yPos += 5;
  });
  
  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.setLineWidth(1);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    doc.setFontSize(8);
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.text('Dean of Student Affairs - University of Jordan', margin, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }
  
  // Save
  const fileName = `volunteer_report_${volunteer.full_name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
