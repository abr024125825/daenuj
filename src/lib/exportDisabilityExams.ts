import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import logoImage from '@/assets/logo-transparent.png';
import { DisabilityExam } from '@/hooks/useDisabilityExams';
import { DisabilityExamAssignment } from '@/hooks/useDisabilityExamAssignments';

interface ExportData {
  exams: DisabilityExam[];
  assignments: DisabilityExamAssignment[];
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

const ROLE_LABELS: Record<string, string> = {
  reader: 'Reader',
  extra_time: 'Extra Time',
  companion: 'Companion',
  scribe: 'Scribe',
  separate_room: 'Separate Room',
  assistive_technology: 'Assistive Tech',
  other: 'Other',
};

export function exportDisabilityExamsToExcel(data: ExportData) {
  const workbook = XLSX.utils.book_new();

  // Exams sheet
  const examsData = data.exams.map(exam => ({
    'Student Name': exam.student?.student_name || '',
    'University ID': exam.student?.university_id || '',
    'Disability Type': exam.student?.disability_type || '',
    'Course Name': exam.course_name,
    'Course Code': exam.course_code || '',
    'Exam Date': exam.exam_date,
    'Start Time': exam.start_time,
    'End Time': exam.end_time,
    'Duration (min)': exam.duration_minutes,
    'Extra Time (min)': exam.extra_time_minutes,
    'Location': exam.location || '',
    'Special Needs': exam.special_needs?.join(', ') || '',
    'Status': exam.status,
  }));

  const examsSheet = XLSX.utils.json_to_sheet(examsData);
  XLSX.utils.book_append_sheet(workbook, examsSheet, 'Exams');

  // Assignments sheet
  const assignmentsData = data.assignments.map(assignment => ({
    'Student Name': assignment.exam?.student?.student_name || '',
    'Student ID': assignment.exam?.student?.university_id || '',
    'Disability Type': assignment.exam?.student?.disability_type || '',
    'Course Name': assignment.exam?.course_name || '',
    'Exam Date': assignment.exam?.exam_date || '',
    'Start Time': assignment.exam?.start_time || '',
    'End Time': assignment.exam?.end_time || '',
    'Location': assignment.exam?.location || '',
    'Volunteer Name': assignment.volunteer?.application 
      ? `${assignment.volunteer.application.first_name} ${assignment.volunteer.application.family_name}`
      : '',
    'Volunteer Type': assignment.volunteer?.volunteer_type === 'employment' ? 'Employment' : 'General',
    'Assigned Role': ROLE_LABELS[assignment.assigned_role] || assignment.assigned_role,
    'Status': assignment.status,
    'Assigned At': format(new Date(assignment.assigned_at), 'yyyy-MM-dd HH:mm'),
    'Notes': assignment.notes || '',
  }));

  const assignmentsSheet = XLSX.utils.json_to_sheet(assignmentsData);
  XLSX.utils.book_append_sheet(workbook, assignmentsSheet, 'Assignments');

  // Download
  const fileName = `disability_exams_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export async function exportDisabilityExamsToPDF(data: ExportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  
  // Load logo
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
  doc.text('Disability Exams Report', pageWidth / 2, 22, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Dean of Student Affairs - University of Jordan', pageWidth / 2, 30, { align: 'center' });
  doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, pageWidth / 2, 38, { align: 'center' });

  let yPos = 58;

  // Summary Statistics Card
  const pendingCount = data.exams.filter(e => e.status === 'pending').length;
  const assignedCount = data.exams.filter(e => e.status === 'assigned').length;
  const confirmedCount = data.exams.filter(e => e.status === 'confirmed').length;
  const completedCount = data.exams.filter(e => e.status === 'completed').length;
  
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 28, 3, 3, 'F');
  
  doc.setDrawColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 28, 3, 3, 'S');
  
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', margin + 5, yPos + 8);
  
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Exams: ${data.exams.length}`, margin + 5, yPos + 17);
  doc.text(`Pending: ${pendingCount}`, margin + 5, yPos + 24);
  doc.text(`Assigned: ${assignedCount}`, margin + 45, yPos + 24);
  doc.text(`Confirmed: ${confirmedCount}`, margin + 85, yPos + 24);
  doc.text(`Completed: ${completedCount}`, margin + 130, yPos + 24);

  yPos += 36;

  // Exams Section Header
  doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 10, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Upcoming Exams', margin + 5, yPos + 7);
  doc.text(`${data.exams.length} exams`, pageWidth - margin - 5, yPos + 7, { align: 'right' });
  
  yPos += 14;

  // Table header
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
  
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Student', margin + 2, yPos + 5);
  doc.text('Course', margin + 45, yPos + 5);
  doc.text('Date', margin + 95, yPos + 5);
  doc.text('Time', margin + 125, yPos + 5);
  doc.text('Status', margin + 160, yPos + 5);
  
  yPos += 9;

  // Sort by date
  const sortedExams = [...data.exams].sort((a, b) => 
    new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
  );

  doc.setFont('helvetica', 'normal');
  
  sortedExams.slice(0, 25).forEach((exam, idx) => {
    if (yPos > pageHeight - 30) {
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
    
    const studentName = exam.student?.student_name || '';
    const truncatedStudent = studentName.length > 20 ? studentName.substring(0, 18) + '..' : studentName;
    const truncatedCourse = exam.course_name.length > 22 ? exam.course_name.substring(0, 20) + '..' : exam.course_name;

    doc.text(truncatedStudent, margin + 2, yPos + 2);
    doc.text(truncatedCourse, margin + 45, yPos + 2);
    doc.text(exam.exam_date, margin + 95, yPos + 2);
    doc.text(`${exam.start_time}-${exam.end_time}`, margin + 125, yPos + 2);
    
    // Status with color
    if (exam.status === 'completed') {
      doc.setTextColor(34, 197, 94);
    } else if (exam.status === 'pending') {
      doc.setTextColor(234, 179, 8);
    } else {
      doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    }
    doc.text(exam.status.charAt(0).toUpperCase() + exam.status.slice(1), margin + 160, yPos + 2);

    yPos += 7;
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
  const fileName = `disability_exams_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
