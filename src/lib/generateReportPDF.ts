import jsPDF from 'jspdf';

interface ReportData {
  stats: {
    totalVolunteers: number;
    activeVolunteers: number;
    totalHours: number;
    totalOpportunities: number;
    completedOpportunities: number;
    totalCertificates: number;
    totalAttendance: number;
  };
  monthlyData: { month: string; volunteers: number; hours: number; certificates: number }[];
  facultyBreakdown: { name: string; count: number }[];
  topVolunteers: { name: string; hours: number; opportunities: number }[];
  logoBase64?: string;
}

export function generateReportPDF(data: ReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Colors
  const primaryColor = [51, 102, 204]; // Blue
  const accentColor = [34, 139, 34]; // Green
  const textColor = [30, 41, 59]; // Slate

  // Header background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('Volunteer Program Report', pageWidth / 2, 25, { align: 'center' });

  // Subtitle with date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Generated on ${reportDate}`, pageWidth / 2, 38, { align: 'center' });

  yPos = 65;

  // Key Statistics Section
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Key Statistics', margin, yPos);
  yPos += 10;

  // Statistics boxes
  const boxWidth = (pageWidth - margin * 2 - 15) / 4;
  const boxHeight = 30;
  const stats = [
    { label: 'Total Volunteers', value: data.stats.totalVolunteers.toString(), color: primaryColor },
    { label: 'Active Volunteers', value: data.stats.activeVolunteers.toString(), color: accentColor },
    { label: 'Total Hours', value: data.stats.totalHours.toString(), color: [255, 152, 0] },
    { label: 'Certificates', value: data.stats.totalCertificates.toString(), color: [156, 39, 176] },
  ];

  stats.forEach((stat, index) => {
    const x = margin + (boxWidth + 5) * index;
    
    // Box background
    doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 3, 3, 'F');
    
    // Value
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(stat.value, x + boxWidth / 2, yPos + 12, { align: 'center' });
    
    // Label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(stat.label, x + boxWidth / 2, yPos + 22, { align: 'center' });
  });

  yPos += boxHeight + 15;

  // Second row of statistics
  const stats2 = [
    { label: 'Total Opportunities', value: data.stats.totalOpportunities.toString() },
    { label: 'Completed', value: data.stats.completedOpportunities.toString() },
    { label: 'Attendance Records', value: data.stats.totalAttendance.toString() },
    { label: 'Engagement Rate', value: `${Math.round((data.stats.activeVolunteers / data.stats.totalVolunteers) * 100) || 0}%` },
  ];

  stats2.forEach((stat, index) => {
    const x = margin + (boxWidth + 5) * index;
    
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 3, 3, 'F');
    
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(stat.value, x + boxWidth / 2, yPos + 12, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(stat.label, x + boxWidth / 2, yPos + 22, { align: 'center' });
  });

  yPos += boxHeight + 20;

  // Faculty Breakdown Section
  if (data.facultyBreakdown && data.facultyBreakdown.length > 0) {
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Volunteers by Faculty', margin, yPos);
    yPos += 8;

    const maxCount = Math.max(...data.facultyBreakdown.map(f => f.count));
    const barMaxWidth = pageWidth - margin * 2 - 80;

    data.facultyBreakdown.slice(0, 6).forEach((faculty, index) => {
      const barWidth = (faculty.count / maxCount) * barMaxWidth;
      
      // Faculty name
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      const truncatedName = faculty.name.length > 20 ? faculty.name.substring(0, 20) + '...' : faculty.name;
      doc.text(truncatedName, margin, yPos + 5);
      
      // Bar background
      doc.setFillColor(230, 230, 230);
      doc.roundedRect(margin + 55, yPos, barMaxWidth, 7, 2, 2, 'F');
      
      // Bar fill
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      if (barWidth > 0) {
        doc.roundedRect(margin + 55, yPos, barWidth, 7, 2, 2, 'F');
      }
      
      // Count
      doc.setTextColor(100, 100, 100);
      doc.text(faculty.count.toString(), pageWidth - margin, yPos + 5, { align: 'right' });
      
      yPos += 12;
    });

    yPos += 10;
  }

  // Top Volunteers Section
  if (data.topVolunteers && data.topVolunteers.length > 0) {
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Top Volunteers', margin, yPos);
    yPos += 10;

    // Table header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('Rank', margin + 5, yPos + 5.5);
    doc.text('Name', margin + 25, yPos + 5.5);
    doc.text('Hours', pageWidth - margin - 45, yPos + 5.5);
    doc.text('Opportunities', pageWidth - margin - 10, yPos + 5.5, { align: 'right' });
    
    yPos += 8;

    // Table rows
    data.topVolunteers.slice(0, 10).forEach((volunteer, index) => {
      const bgColor = index % 2 === 0 ? [250, 250, 250] : [255, 255, 255];
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.rect(margin, yPos, pageWidth - margin * 2, 7, 'F');
      
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      // Rank with medal for top 3
      const rankText = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1).toString();
      doc.text(rankText, margin + 8, yPos + 5);
      
      // Name
      const truncatedName = volunteer.name.length > 30 ? volunteer.name.substring(0, 30) + '...' : volunteer.name;
      doc.text(truncatedName, margin + 25, yPos + 5);
      
      // Hours
      doc.text(volunteer.hours.toString(), pageWidth - margin - 45, yPos + 5);
      
      // Opportunities
      doc.text(volunteer.opportunities.toString(), pageWidth - margin - 10, yPos + 5, { align: 'right' });
      
      yPos += 7;
    });
  }

  // Footer
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('Volunteer Management System', pageWidth / 2, pageHeight - 12, { align: 'center' });
  doc.setFontSize(8);
  doc.text('This report was automatically generated', pageWidth / 2, pageHeight - 6, { align: 'center' });

  // Save the PDF
  doc.save(`volunteer-report-${new Date().toISOString().split('T')[0]}.pdf`);
}
