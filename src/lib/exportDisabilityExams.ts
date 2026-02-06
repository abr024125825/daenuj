import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { DisabilityExam } from '@/hooks/useDisabilityExams';
import { DisabilityExamAssignment } from '@/hooks/useDisabilityExamAssignments';

interface ExportData {
  exams: DisabilityExam[];
  assignments: DisabilityExamAssignment[];
}

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
    'Course Name': assignment.exam?.course_name || '',
    'Exam Date': assignment.exam?.exam_date || '',
    'Start Time': assignment.exam?.start_time || '',
    'Location': assignment.exam?.location || '',
    'Volunteer Name': assignment.volunteer?.application 
      ? `${assignment.volunteer.application.first_name} ${assignment.volunteer.application.family_name}`
      : '',
    'Assigned Role': assignment.assigned_role,
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

export function exportDisabilityExamsToPDF(data: ExportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(18);
  doc.text('Disability Exams Report', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, pageWidth / 2, 28, { align: 'center' });

  // Summary
  doc.setFontSize(14);
  doc.text('Summary', 14, 45);
  
  doc.setFontSize(10);
  const pendingCount = data.exams.filter(e => e.status === 'pending').length;
  const assignedCount = data.exams.filter(e => e.status === 'assigned').length;
  const confirmedCount = data.exams.filter(e => e.status === 'confirmed').length;
  const completedCount = data.exams.filter(e => e.status === 'completed').length;
  
  doc.text(`Total Exams: ${data.exams.length}`, 14, 55);
  doc.text(`Pending: ${pendingCount}`, 14, 62);
  doc.text(`Assigned: ${assignedCount}`, 60, 62);
  doc.text(`Confirmed: ${confirmedCount}`, 106, 62);
  doc.text(`Completed: ${completedCount}`, 152, 62);
  doc.text(`Total Assignments: ${data.assignments.length}`, 14, 69);

  // Exams List
  doc.setFontSize(14);
  doc.text('Upcoming Exams', 14, 85);

  let yPos = 95;
  doc.setFontSize(9);

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(14, yPos - 5, pageWidth - 28, 8, 'F');
  doc.text('Student', 16, yPos);
  doc.text('Course', 56, yPos);
  doc.text('Date', 106, yPos);
  doc.text('Time', 136, yPos);
  doc.text('Status', 166, yPos);
  
  yPos += 8;

  // Sort by date
  const sortedExams = [...data.exams].sort((a, b) => 
    new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
  );

  for (const exam of sortedExams.slice(0, 20)) {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    const studentName = exam.student?.student_name || '';
    const truncatedStudent = studentName.length > 20 ? studentName.substring(0, 18) + '...' : studentName;
    const truncatedCourse = exam.course_name.length > 25 ? exam.course_name.substring(0, 23) + '...' : exam.course_name;

    doc.text(truncatedStudent, 16, yPos);
    doc.text(truncatedCourse, 56, yPos);
    doc.text(exam.exam_date, 106, yPos);
    doc.text(`${exam.start_time}-${exam.end_time}`, 136, yPos);
    doc.text(exam.status, 166, yPos);

    yPos += 6;
  }

  // Save
  const fileName = `disability_exams_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
