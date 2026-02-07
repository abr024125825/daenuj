import jsPDF from 'jspdf';
import { format } from 'date-fns';
import logoImage from '@/assets/logo-transparent.png';

interface ExamData {
  id: string;
  course_name: string;
  course_code: string | null;
  exam_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  status: string;
  special_needs: string[] | null;
  assignments?: {
    id: string;
    assigned_role: string;
    status: string;
    volunteer?: {
      application?: {
        first_name: string;
        family_name: string;
      };
    };
  }[];
}

interface StudentInfo {
  id: string;
  student_name: string;
  university_id: string;
  disability_type: string | null;
  disability_code: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  special_needs: string[] | null;
  notes: string | null;
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

const SPECIAL_NEEDS_LABELS: Record<string, string> = {
  reader: 'Reader',
  extra_time: 'Extra Time',
  companion: 'Companion',
  scribe: 'Scribe',
  separate_room: 'Separate Room',
  assistive_technology: 'Assistive Technology',
  other: 'Other',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// Convert image to base64 with background color
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

export async function generateStudentReport(
  student: StudentInfo,
  exams: ExamData[],
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
  doc.text('Student Disability Report', pageWidth / 2, 22, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Dean of Student Affairs - University of Jordan', pageWidth / 2, 30, { align: 'center' });
  doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, pageWidth / 2, 38, { align: 'center' });
  
  let yPos = 58;
  
  // Student Info Card
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 45, 3, 3, 'F');
  
  // Card border
  doc.setDrawColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 45, 3, 3, 'S');
  
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Information', margin + 5, yPos + 8);
  
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Left column
  doc.text(`Name: ${student.student_name}`, margin + 5, yPos + 17);
  doc.text(`University ID: ${student.university_id}`, margin + 5, yPos + 25);
  doc.text(`Disability Type: ${student.disability_type || 'N/A'}`, margin + 5, yPos + 33);
  if (student.disability_code) {
    doc.text(`Code: ${student.disability_code}`, margin + 5, yPos + 41);
  }
  
  // Right column
  if (student.contact_phone) {
    doc.text(`Phone: ${student.contact_phone}`, pageWidth / 2, yPos + 17);
  }
  if (student.contact_email) {
    doc.text(`Email: ${student.contact_email}`, pageWidth / 2, yPos + 25);
  }
  
  // Special needs
  if (student.special_needs && student.special_needs.length > 0) {
    const needsStr = student.special_needs.map(n => SPECIAL_NEEDS_LABELS[n] || n).join(', ');
    doc.text(`Default Special Needs: ${needsStr}`, pageWidth / 2, yPos + 33);
  }
  
  yPos += 53;
  
  // Filter exams by date range if provided
  let filteredExams = exams;
  if (dateRange) {
    filteredExams = exams.filter(e => {
      const examDate = new Date(e.exam_date);
      return examDate >= dateRange.start && examDate <= dateRange.end;
    });
  }
  
  // Summary Statistics Card
  const completedExams = filteredExams.filter(e => e.status === 'completed');
  
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 20, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Exam Statistics', margin + 5, yPos + 8);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const statsText = `Total Exams: ${filteredExams.length}  |  Completed: ${completedExams.length}  |  Pending: ${filteredExams.filter(e => e.status === 'pending').length}`;
  doc.text(statsText, margin + 5, yPos + 16);
  
  yPos += 28;
  
  // Exams Table
  if (filteredExams.length > 0) {
    // Table header
    doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 10, 2, 2, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Exam Records', margin + 5, yPos + 7);
    
    yPos += 14;
    
    // Table column headers
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
    
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Date', margin + 2, yPos + 5);
    doc.text('Time', margin + 25, yPos + 5);
    doc.text('Course', margin + 50, yPos + 5);
    doc.text('Location', margin + 95, yPos + 5);
    doc.text('Volunteer', margin + 125, yPos + 5);
    doc.text('Status', margin + 165, yPos + 5);
    
    yPos += 9;
    
    // Exam rows
    doc.setFont('helvetica', 'normal');
    
    filteredExams.forEach((exam, idx) => {
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
      
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.text(format(new Date(exam.exam_date), 'MMM dd, yy'), margin + 2, yPos + 2);
      doc.text(`${exam.start_time}-${exam.end_time}`, margin + 25, yPos + 2);
      
      const truncatedCourse = exam.course_name.length > 20 ? exam.course_name.substring(0, 18) + '..' : exam.course_name;
      doc.text(truncatedCourse, margin + 50, yPos + 2);
      
      doc.text(exam.location || '-', margin + 95, yPos + 2);
      
      // Get volunteer name from assignment
      const assignment = exam.assignments?.[0];
      const volunteerName = assignment?.volunteer?.application 
        ? `${assignment.volunteer.application.first_name} ${assignment.volunteer.application.family_name}`.substring(0, 15)
        : '-';
      doc.text(volunteerName, margin + 125, yPos + 2);
      
      // Status with color
      const status = STATUS_LABELS[exam.status] || exam.status;
      if (exam.status === 'completed') {
        doc.setTextColor(34, 197, 94);
      } else if (exam.status === 'cancelled') {
        doc.setTextColor(239, 68, 68);
      } else if (exam.status === 'assigned' || exam.status === 'confirmed') {
        doc.setTextColor(59, 130, 246);
      } else {
        doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
      }
      doc.text(status, margin + 165, yPos + 2);
      
      yPos += 7;
    });
  } else {
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.setFontSize(10);
    doc.text('No exam records found.', margin, yPos + 10);
  }
  
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
  const fileName = `student_report_${student.university_id}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
