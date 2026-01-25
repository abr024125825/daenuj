import jsPDF from 'jspdf';
import logoImage from '@/assets/logo.png';
import { format } from 'date-fns';

// Professional color palette - consistent with other reports
const colors = {
  primary: [16, 78, 58],
  secondary: [34, 197, 94],
  accent: [234, 179, 8],
  dark: [30, 41, 59],
  muted: [100, 116, 139],
  light: [248, 250, 252],
  white: [255, 255, 255],
  info: [59, 130, 246],
};

async function getLogoBase64(): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
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

// Helper function to truncate text with ellipsis
function truncateText(doc: jsPDF, text: string, maxWidth: number): string {
  if (!text) return '';
  if (doc.getTextWidth(text) <= maxWidth) return text;
  
  let truncated = text;
  while (doc.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

interface CourseData {
  course_code: string;
  course_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  location?: string | null;
}

interface ExamData {
  course_code: string;
  course_name: string;
  exam_type: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  location?: string | null;
}

interface VolunteerScheduleData {
  volunteerName: string;
  universityId: string;
  faculty: string;
  major: string;
  submittedAt: string | null;
  courses: CourseData[];
  exams?: ExamData[];
}

const DAYS_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

const DAY_ABBREVIATIONS: Record<string, string> = {
  'Sunday': 'Sun',
  'Monday': 'Mon',
  'Tuesday': 'Tue',
  'Wednesday': 'Wed',
  'Thursday': 'Thu',
};

// Merge courses with same code/time to combine days
function mergeCoursesByDays(courses: CourseData[]): Array<CourseData & { days: string }> {
  const courseMap = new Map<string, { course: CourseData; days: string[] }>();
  
  courses.forEach(course => {
    const key = `${course.course_code}-${course.start_time}-${course.end_time}`;
    if (courseMap.has(key)) {
      const existing = courseMap.get(key)!;
      if (!existing.days.includes(course.day_of_week)) {
        existing.days.push(course.day_of_week);
      }
    } else {
      courseMap.set(key, { course, days: [course.day_of_week] });
    }
  });
  
  return Array.from(courseMap.values()).map(({ course, days }) => ({
    ...course,
    days: days
      .sort((a, b) => DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b))
      .map(d => DAY_ABBREVIATIONS[d] || d)
      .join(' '),
  }));
}

// Generate individual volunteer schedule PDF
export async function generateVolunteerSchedulePDF(data: {
  volunteer: {
    name: string;
    universityId: string;
    faculty: string;
    major: string;
    email?: string;
  };
  semester: {
    name: string;
    academicYear: string;
  };
  courses: CourseData[];
  exams?: ExamData[];
}): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Header
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.rect(0, 45, pageWidth, 3, 'F');

  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 15, 10, 22, 22);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('VOLUNTEER COURSE SCHEDULE', 45, 18);
  
  doc.setFontSize(11);
  doc.text(`${data.semester.name} - ${data.semester.academicYear}`, 45, 28);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 45, 37);

  yPos = 55;

  // Volunteer Info Card
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 3, 3, 'F');
  
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(data.volunteer.name, margin + 8, yPos + 12);
  
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`University ID: ${data.volunteer.universityId}`, margin + 8, yPos + 20);
  doc.text(`Faculty: ${data.volunteer.faculty}`, margin + 8, yPos + 28);
  doc.text(`Major: ${truncateText(doc, data.volunteer.major, 80)}`, pageWidth / 2, yPos + 28);
  
  yPos += 45;

  // Merge courses by days
  const mergedCourses = mergeCoursesByDays(data.courses);

  // Courses summary
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Course Schedule (${mergedCourses.length} courses)`, margin, yPos);
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos + 3, margin + 60, yPos + 3);
  
  yPos += 12;

  if (mergedCourses.length > 0) {
    // Table header
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(margin, yPos, pageWidth - margin * 2, 10, 'F');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    
    const colX = {
      days: margin + 5,
      code: margin + 35,
      name: margin + 65,
      time: margin + 125,
      location: margin + 155,
    };
    
    doc.text('Days', colX.days, yPos + 7);
    doc.text('Code', colX.code, yPos + 7);
    doc.text('Course Name', colX.name, yPos + 7);
    doc.text('Time', colX.time, yPos + 7);
    doc.text('Location', colX.location, yPos + 7);
    
    yPos += 10;

    // Table rows
    mergedCourses.forEach((course, index) => {
      const bg = index % 2 === 0 ? colors.white : colors.light;
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      
      doc.text((course as any).days, colX.days, yPos + 5.5);
      doc.text(truncateText(doc, course.course_code, 25), colX.code, yPos + 5.5);
      doc.text(truncateText(doc, course.course_name, 55), colX.name, yPos + 5.5);
      doc.text(`${course.start_time} - ${course.end_time}`, colX.time, yPos + 5.5);
      doc.text(truncateText(doc, course.location || '-', 25), colX.location, yPos + 5.5);
      
      yPos += 8;
    });
  } else {
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('No courses registered for this semester.', margin, yPos + 10);
    yPos += 18;
  }

  // Exam Schedule Section
  if (data.exams && data.exams.length > 0) {
    yPos += 10;
    
    // Check if we need a new page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Exam Schedule (${data.exams.length} exams)`, margin, yPos);
    doc.setDrawColor(colors.info[0], colors.info[1], colors.info[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, yPos + 3, margin + 55, yPos + 3);
    
    yPos += 12;

    // Exam table header
    doc.setFillColor(colors.info[0], colors.info[1], colors.info[2]);
    doc.rect(margin, yPos, pageWidth - margin * 2, 10, 'F');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    
    const examColX = {
      type: margin + 5,
      date: margin + 30,
      code: margin + 60,
      name: margin + 90,
      time: margin + 140,
      location: margin + 165,
    };
    
    doc.text('Type', examColX.type, yPos + 7);
    doc.text('Date', examColX.date, yPos + 7);
    doc.text('Code', examColX.code, yPos + 7);
    doc.text('Course', examColX.name, yPos + 7);
    doc.text('Time', examColX.time, yPos + 7);
    doc.text('Location', examColX.location, yPos + 7);
    
    yPos += 10;

    // Exam rows
    const sortedExams = [...data.exams].sort((a, b) => 
      new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
    );

    sortedExams.forEach((exam, index) => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = margin;
        
        // Repeat header on new page
        doc.setFillColor(colors.info[0], colors.info[1], colors.info[2]);
        doc.rect(margin, yPos, pageWidth - margin * 2, 10, 'F');
        doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Type', examColX.type, yPos + 7);
        doc.text('Date', examColX.date, yPos + 7);
        doc.text('Code', examColX.code, yPos + 7);
        doc.text('Course', examColX.name, yPos + 7);
        doc.text('Time', examColX.time, yPos + 7);
        doc.text('Location', examColX.location, yPos + 7);
        yPos += 10;
      }

      const bg = index % 2 === 0 ? colors.white : colors.light;
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      
      const typeLabel = exam.exam_type.charAt(0).toUpperCase() + exam.exam_type.slice(1);
      doc.text(typeLabel, examColX.type, yPos + 5.5);
      doc.text(format(new Date(exam.exam_date), 'MMM dd'), examColX.date, yPos + 5.5);
      doc.text(truncateText(doc, exam.course_code, 25), examColX.code, yPos + 5.5);
      doc.text(truncateText(doc, exam.course_name, 45), examColX.name, yPos + 5.5);
      doc.text(`${exam.start_time} - ${exam.end_time}`, examColX.time, yPos + 5.5);
      doc.text(truncateText(doc, exam.location || '-', 20), examColX.location, yPos + 5.5);
      
      yPos += 8;
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(8);
    doc.text('Community Service & Development Center - University of Jordan', margin, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}  |  ${format(new Date(), 'MMM dd, yyyy')}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  doc.save(`schedule-${data.volunteer.universityId}-${data.semester.name.replace(/\s+/g, '-')}.pdf`);
}

export async function generateAllSchedulesPDF(data: {
  semester: {
    name: string;
    academicYear: string;
  };
  volunteers: VolunteerScheduleData[];
  stats: {
    total: number;
    submitted: number;
    pending: number;
    totalCourses: number;
  };
}): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Header
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.rect(0, 40, pageWidth, 3, 'F');

  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 12, 8, 20, 20);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('VOLUNTEER SCHEDULES REPORT', 38, 15);
  
  doc.setFontSize(11);
  doc.text(`${data.semester.name} - ${data.semester.academicYear}`, 38, 24);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 38, 32);

  yPos = 50;

  // Stats row
  const statsData = [
    { label: 'Total Volunteers', value: data.stats.total, color: colors.primary },
    { label: 'Submitted', value: data.stats.submitted, color: colors.secondary },
    { label: 'Pending', value: data.stats.pending, color: colors.accent },
    { label: 'Total Courses', value: data.stats.totalCourses, color: colors.info },
  ];

  const statWidth = (pageWidth - margin * 2) / statsData.length - 5;
  statsData.forEach((stat, index) => {
    const x = margin + (statWidth + 5) * index;
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.roundedRect(x, yPos, statWidth, 20, 2, 2, 'F');
    
    doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(stat.value.toString(), x + statWidth / 2, yPos + 10, { align: 'center' });
    
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(stat.label, x + statWidth / 2, yPos + 16, { align: 'center' });
  });

  yPos += 28;

  // Volunteers schedules
  const submittedVolunteers = data.volunteers.filter(v => v.courses.length > 0);
  
  for (let vIndex = 0; vIndex < submittedVolunteers.length; vIndex++) {
    const volunteer = submittedVolunteers[vIndex];
    
    // Check if we need a new page
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = margin;
    }

    // Volunteer header
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 2, 2, 'F');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    const volName = truncateText(doc, volunteer.volunteerName, 80);
    doc.text(`${vIndex + 1}. ${volName}`, margin + 5, yPos + 7);
    doc.text(`ID: ${volunteer.universityId}`, margin + 100, yPos + 7);
    doc.text(truncateText(doc, volunteer.faculty, 50), margin + 150, yPos + 7);
    doc.text(`Courses: ${volunteer.courses.length}`, pageWidth - margin - 30, yPos + 7);
    
    yPos += 12;

    // Courses table header
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.rect(margin + 5, yPos, pageWidth - margin * 2 - 10, 7, 'F');
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    
    const colPositions = {
      day: margin + 8,
      code: margin + 40,
      name: margin + 75,
      time: margin + 170,
      location: margin + 210,
    };
    
    doc.text('Day', colPositions.day, yPos + 5);
    doc.text('Code', colPositions.code, yPos + 5);
    doc.text('Course Name', colPositions.name, yPos + 5);
    doc.text('Time', colPositions.time, yPos + 5);
    doc.text('Location', colPositions.location, yPos + 5);
    
    yPos += 7;

    // Merge courses by days and sort
    const mergedCourses = mergeCoursesByDays(volunteer.courses);

    // Course rows
    mergedCourses.forEach((course, cIndex) => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = margin;
        
        // Repeat volunteer name on new page
        doc.setFillColor(colors.muted[0], colors.muted[1], colors.muted[2]);
        doc.roundedRect(margin, yPos, pageWidth - margin * 2, 7, 1, 1, 'F');
        doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
        doc.setFontSize(8);
        doc.text(`Continued: ${volunteer.volunteerName}`, margin + 5, yPos + 5);
        yPos += 9;
      }

      const bg = cIndex % 2 === 0 ? colors.white : colors.light;
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(margin + 5, yPos, pageWidth - margin * 2 - 10, 6, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      
      doc.text((course as any).days, colPositions.day, yPos + 4);
      doc.text(truncateText(doc, course.course_code, 30), colPositions.code, yPos + 4);
      doc.text(truncateText(doc, course.course_name, 90), colPositions.name, yPos + 4);
      doc.text(`${course.start_time} - ${course.end_time}`, colPositions.time, yPos + 4);
      doc.text(truncateText(doc, course.location || '-', 40), colPositions.location, yPos + 4);
      
      yPos += 6;
    });

    yPos += 8;
  }

  // Add summary for volunteers with no courses
  const noCoursesVolunteers = data.volunteers.filter(v => v.courses.length === 0);
  if (noCoursesVolunteers.length > 0) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('PENDING SUBMISSIONS', margin, yPos);
    doc.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, yPos + 2, margin + 45, yPos + 2);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    
    noCoursesVolunteers.slice(0, 20).forEach((v, i) => {
      if (yPos > pageHeight - 20) return;
      doc.text(`${i + 1}. ${truncateText(doc, v.volunteerName, 60)} (${v.universityId})`, margin, yPos);
      yPos += 5;
    });

    if (noCoursesVolunteers.length > 20) {
      doc.text(`... and ${noCoursesVolunteers.length - 20} more pending`, margin, yPos);
    }
  }

  // Footer
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(7);
    doc.text('Community Service & Development Center - University of Jordan', margin, pageHeight - 5);
    doc.text(`Page ${pageNum} of ${totalPages}  |  Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  };

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  doc.save(`volunteer-schedules-${data.semester.name.replace(/\s+/g, '-')}-${data.semester.academicYear}.pdf`);
}
