import jsPDF from 'jspdf';
import logoImage from '@/assets/logo.png';

interface VolunteerData {
  volunteer: {
    id: string;
    first_name: string;
    father_name: string;
    grandfather_name: string;
    family_name: string;
    university_email: string;
    phone_number: string;
    university_id: string;
    academic_year: string;
    faculty_name: string;
    major_name: string;
    skills: string[];
    interests: string[];
    motivation: string;
    previous_experience?: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    total_hours: number;
    opportunities_completed: number;
    rating?: number;
    is_active: boolean;
    created_at: string;
  };
  attendance?: Array<{
    opportunity_title: string;
    date: string;
    check_in_time: string;
  }>;
  certificates?: Array<{
    certificate_number: string;
    opportunity_title: string;
    hours: number;
    issued_at: string;
  }>;
}

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

export async function generateVolunteerPDF(data: VolunteerData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  const primaryGreen = [0, 100, 60];
  const darkSlate = [30, 41, 59];

  // Header
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(0, 0, pageWidth, 50, 'F');

  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 15, 8, 22, 22);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('VOLUNTEER PROFILE', 45, 18);
  doc.setFontSize(20);
  const fullName = `${data.volunteer.first_name} ${data.volunteer.father_name} ${data.volunteer.family_name}`;
  doc.text(fullName, 45, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`ID: ${data.volunteer.university_id}`, 45, 38);
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth - margin, 42, { align: 'right' });

  yPos = 60;

  // Personal Information
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PERSONAL INFORMATION', margin, yPos);
  doc.setDrawColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.setLineWidth(1);
  doc.line(margin, yPos + 2, margin + 50, yPos + 2);
  yPos += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const personalInfo = [
    ['Full Name:', `${data.volunteer.first_name} ${data.volunteer.father_name} ${data.volunteer.grandfather_name} ${data.volunteer.family_name}`],
    ['University Email:', data.volunteer.university_email],
    ['Phone Number:', data.volunteer.phone_number],
    ['University ID:', data.volunteer.university_id],
    ['Academic Year:', data.volunteer.academic_year],
    ['Faculty:', data.volunteer.faculty_name],
    ['Major:', data.volunteer.major_name],
    ['Status:', data.volunteer.is_active ? 'Active' : 'Inactive'],
    ['Joined:', new Date(data.volunteer.created_at).toLocaleDateString()],
  ];

  personalInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value || 'N/A', margin + 45, yPos);
    yPos += 6;
  });

  yPos += 5;

  // Statistics
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('VOLUNTEER STATISTICS', margin, yPos);
  doc.line(margin, yPos + 2, margin + 45, yPos + 2);
  yPos += 12;

  const statsBoxWidth = (pageWidth - margin * 2 - 10) / 3;
  const stats = [
    { label: 'Total Hours', value: data.volunteer.total_hours?.toString() || '0' },
    { label: 'Opportunities', value: data.volunteer.opportunities_completed?.toString() || '0' },
    { label: 'Rating', value: data.volunteer.rating ? `${data.volunteer.rating.toFixed(1)}/5` : 'N/A' },
  ];

  stats.forEach((stat, index) => {
    const x = margin + (statsBoxWidth + 5) * index;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(x, yPos, statsBoxWidth, 20, 2, 2, 'F');
    doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(stat.value, x + statsBoxWidth / 2, yPos + 10, { align: 'center' });
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text(stat.label, x + statsBoxWidth / 2, yPos + 16, { align: 'center' });
  });

  yPos += 30;

  // Skills & Interests
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('SKILLS & INTERESTS', margin, yPos);
  doc.line(margin, yPos + 2, margin + 40, yPos + 2);
  yPos += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Skills: ' + (data.volunteer.skills?.join(', ') || 'None specified'), margin, yPos);
  yPos += 6;
  doc.text('Interests: ' + (data.volunteer.interests?.join(', ') || 'None specified'), margin, yPos);
  yPos += 10;

  // Emergency Contact
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('EMERGENCY CONTACT', margin, yPos);
  doc.line(margin, yPos + 2, margin + 42, yPos + 2);
  yPos += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Name: ${data.volunteer.emergency_contact_name}`, margin, yPos);
  yPos += 6;
  doc.text(`Phone: ${data.volunteer.emergency_contact_phone}`, margin, yPos);
  yPos += 10;

  // Attendance History
  if (data.attendance && data.attendance.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ATTENDANCE HISTORY', margin, yPos);
    doc.line(margin, yPos + 2, margin + 45, yPos + 2);
    yPos += 8;

    doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.rect(margin, yPos, pageWidth - margin * 2, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('Opportunity', margin + 3, yPos + 4);
    doc.text('Date', pageWidth - margin - 50, yPos + 4);
    doc.text('Check-in', pageWidth - margin - 5, yPos + 4, { align: 'right' });
    yPos += 6;

    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    data.attendance.slice(0, 8).forEach((att, index) => {
      if (yPos > pageHeight - 40) return;
      const bg = index % 2 === 0 ? [250, 250, 250] : [255, 255, 255];
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(margin, yPos, pageWidth - margin * 2, 5, 'F');
      doc.setFontSize(8);
      const truncated = att.opportunity_title.length > 40 ? att.opportunity_title.substring(0, 40) + '...' : att.opportunity_title;
      doc.text(truncated, margin + 3, yPos + 4);
      doc.text(att.date, pageWidth - margin - 50, yPos + 4);
      doc.text(new Date(att.check_in_time).toLocaleTimeString(), pageWidth - margin - 5, yPos + 4, { align: 'right' });
      yPos += 5;
    });
    yPos += 5;
  }

  // Certificates
  if (data.certificates && data.certificates.length > 0 && yPos < pageHeight - 50) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text('CERTIFICATES ISSUED', margin, yPos);
    doc.setDrawColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.line(margin, yPos + 2, margin + 45, yPos + 2);
    yPos += 8;

    doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.rect(margin, yPos, pageWidth - margin * 2, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('Certificate #', margin + 3, yPos + 4);
    doc.text('Opportunity', margin + 45, yPos + 4);
    doc.text('Hours', pageWidth - margin - 25, yPos + 4);
    doc.text('Issued', pageWidth - margin - 5, yPos + 4, { align: 'right' });
    yPos += 6;

    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    data.certificates.slice(0, 5).forEach((cert, index) => {
      if (yPos > pageHeight - 30) return;
      const bg = index % 2 === 0 ? [250, 250, 250] : [255, 255, 255];
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(margin, yPos, pageWidth - margin * 2, 5, 'F');
      doc.setFontSize(7);
      doc.text(cert.certificate_number, margin + 3, yPos + 4);
      const truncated = cert.opportunity_title.length > 30 ? cert.opportunity_title.substring(0, 30) + '...' : cert.opportunity_title;
      doc.text(truncated, margin + 45, yPos + 4);
      doc.text(`${cert.hours} hrs`, pageWidth - margin - 25, yPos + 4);
      doc.text(new Date(cert.issued_at).toLocaleDateString(), pageWidth - margin - 5, yPos + 4, { align: 'right' });
      yPos += 5;
    });
  }

  // Footer
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('Community Service & Development Center - University of Jordan', pageWidth / 2, pageHeight - 8, { align: 'center' });

  doc.save(`volunteer-${data.volunteer.university_id}-${new Date().toISOString().split('T')[0]}.pdf`);
}

export async function generateAttendanceReportPDF(data: {
  opportunity: {
    title: string;
    date: string;
    location: string;
    start_time: string;
    end_time: string;
  };
  attendees: Array<{
    name: string;
    university_id: string;
    check_in_time: string;
  }>;
  registered: number;
  attended: number;
}): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  const primaryGreen = [0, 100, 60];
  const darkSlate = [30, 41, 59];

  // Header
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');

  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 15, 8, 20, 20);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ATTENDANCE REPORT', 42, 16);
  doc.setFontSize(18);
  const truncatedTitle = data.opportunity.title.length > 40 ? data.opportunity.title.substring(0, 40) + '...' : data.opportunity.title;
  doc.text(truncatedTitle, 42, 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${data.opportunity.date} | ${data.opportunity.location}`, 42, 36);

  yPos = 55;

  // Summary Stats
  const boxWidth = (pageWidth - margin * 2 - 10) / 3;
  const summaryStats = [
    { label: 'Registered', value: data.registered.toString() },
    { label: 'Attended', value: data.attended.toString() },
    { label: 'Attendance Rate', value: `${Math.round((data.attended / Math.max(data.registered, 1)) * 100)}%` },
  ];

  summaryStats.forEach((stat, index) => {
    const x = margin + (boxWidth + 5) * index;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(x, yPos, boxWidth, 20, 2, 2, 'F');
    doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(stat.value, x + boxWidth / 2, yPos + 10, { align: 'center' });
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text(stat.label, x + boxWidth / 2, yPos + 16, { align: 'center' });
  });

  yPos += 30;

  // Attendees Table
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('ATTENDEES LIST', margin, yPos);
  doc.setDrawColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.setLineWidth(1);
  doc.line(margin, yPos + 2, margin + 35, yPos + 2);
  yPos += 8;

  // Table Header
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(margin, yPos, pageWidth - margin * 2, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('#', margin + 5, yPos + 5);
  doc.text('Volunteer Name', margin + 15, yPos + 5);
  doc.text('University ID', pageWidth / 2 + 10, yPos + 5);
  doc.text('Check-in Time', pageWidth - margin - 5, yPos + 5, { align: 'right' });
  yPos += 7;

  // Table Rows
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  data.attendees.forEach((attendee, index) => {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = margin;
    }

    const bg = index % 2 === 0 ? [250, 250, 250] : [255, 255, 255];
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.rect(margin, yPos, pageWidth - margin * 2, 6, 'F');

    doc.setFontSize(9);
    doc.text((index + 1).toString(), margin + 5, yPos + 4);
    doc.text(attendee.name, margin + 15, yPos + 4);
    doc.text(attendee.university_id, pageWidth / 2 + 10, yPos + 4);
    doc.text(new Date(attendee.check_in_time).toLocaleTimeString(), pageWidth - margin - 5, yPos + 4, { align: 'right' });
    yPos += 6;
  });

  // Footer
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('Community Service & Development Center - University of Jordan', pageWidth / 2, pageHeight - 8, { align: 'center' });

  doc.save(`attendance-${data.opportunity.title.replace(/\s+/g, '-').substring(0, 20)}-${data.opportunity.date}.pdf`);
}

export async function generateAllVolunteersPDF(volunteers: Array<{
  name: string;
  university_id: string;
  faculty: string;
  total_hours: number;
  opportunities_completed: number;
  is_active: boolean;
}>): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  const primaryGreen = [0, 100, 60];
  const darkSlate = [30, 41, 59];

  // Header
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(0, 0, pageWidth, 35, 'F');

  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 12, 6, 18, 18);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ALL VOLUNTEERS REPORT', 38, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Total: ${volunteers.length} volunteers | Generated: ${new Date().toLocaleDateString()}`, 38, 26);

  yPos = 45;

  // Table Header
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('#', margin + 5, yPos + 5.5);
  doc.text('Volunteer Name', margin + 15, yPos + 5.5);
  doc.text('University ID', margin + 85, yPos + 5.5);
  doc.text('Faculty', margin + 120, yPos + 5.5);
  doc.text('Hours', pageWidth - margin - 55, yPos + 5.5);
  doc.text('Opportunities', pageWidth - margin - 30, yPos + 5.5);
  doc.text('Status', pageWidth - margin - 5, yPos + 5.5, { align: 'right' });
  yPos += 8;

  // Table Rows
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  volunteers.forEach((vol, index) => {
    if (yPos > pageHeight - 25) {
      doc.addPage();
      yPos = margin;
      
      // Repeat header on new page
      doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
      doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('#', margin + 5, yPos + 5.5);
      doc.text('Volunteer Name', margin + 15, yPos + 5.5);
      doc.text('University ID', margin + 85, yPos + 5.5);
      doc.text('Faculty', margin + 120, yPos + 5.5);
      doc.text('Hours', pageWidth - margin - 55, yPos + 5.5);
      doc.text('Opportunities', pageWidth - margin - 30, yPos + 5.5);
      doc.text('Status', pageWidth - margin - 5, yPos + 5.5, { align: 'right' });
      yPos += 8;
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    }

    const bg = index % 2 === 0 ? [250, 250, 250] : [255, 255, 255];
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.rect(margin, yPos, pageWidth - margin * 2, 6, 'F');

    doc.setFontSize(8);
    doc.text((index + 1).toString(), margin + 5, yPos + 4);
    doc.text(vol.name.substring(0, 35), margin + 15, yPos + 4);
    doc.text(vol.university_id, margin + 85, yPos + 4);
    doc.text((vol.faculty || 'N/A').substring(0, 25), margin + 120, yPos + 4);
    doc.text(vol.total_hours.toString(), pageWidth - margin - 55, yPos + 4);
    doc.text(vol.opportunities_completed.toString(), pageWidth - margin - 30, yPos + 4);
    doc.setTextColor(vol.is_active ? 34 : 150, vol.is_active ? 139 : 100, vol.is_active ? 34 : 100);
    doc.text(vol.is_active ? 'Active' : 'Inactive', pageWidth - margin - 5, yPos + 4, { align: 'right' });
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    yPos += 6;
  });

  // Footer on last page
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('Community Service & Development Center - University of Jordan', pageWidth / 2, pageHeight - 5, { align: 'center' });

  doc.save(`all-volunteers-${new Date().toISOString().split('T')[0]}.pdf`);
}
