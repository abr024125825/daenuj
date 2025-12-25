import jsPDF from 'jspdf';
import logoImage from '@/assets/logo.png';

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
}

// Convert image to base64
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

export async function generateReportPDF(data: ReportData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Official colors
  const primaryGreen = [0, 100, 60];
  const accentRed = [180, 40, 40];
  const darkSlate = [30, 41, 59];

  // Header background
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(0, 0, pageWidth, 55, 'F');

  // Try to add logo
  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 15, 8, 25, 25);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('VOLUNTEER PROGRAM', 50, 18);
  doc.setFontSize(22);
  doc.text('ANNUAL REPORT', 50, 28);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Community Service & Development Center', 50, 38);
  doc.text('University of Jordan', 50, 44);

  // Report date on right
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.setFontSize(9);
  doc.text(reportDate, pageWidth - margin, 48, { align: 'right' });

  yPos = 70;

  // Executive Summary Section
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('EXECUTIVE SUMMARY', margin, yPos);
  
  doc.setDrawColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.setLineWidth(2);
  doc.line(margin, yPos + 2, margin + 50, yPos + 2);
  
  yPos += 15;

  // Key Statistics boxes
  const boxWidth = (pageWidth - margin * 2 - 15) / 4;
  const boxHeight = 28;
  const stats = [
    { label: 'Total\nVolunteers', value: data.stats.totalVolunteers.toString(), color: primaryGreen },
    { label: 'Active\nVolunteers', value: data.stats.activeVolunteers.toString(), color: [34, 139, 34] },
    { label: 'Total\nHours', value: data.stats.totalHours.toString(), color: accentRed },
    { label: 'Certificates\nIssued', value: data.stats.totalCertificates.toString(), color: [70, 70, 70] },
  ];

  stats.forEach((stat, index) => {
    const x = margin + (boxWidth + 5) * index;
    
    // Box background
    doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 2, 2, 'F');
    
    // Value
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(stat.value, x + boxWidth / 2, yPos + 12, { align: 'center' });
    
    // Label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const labelLines = stat.label.split('\n');
    labelLines.forEach((line, i) => {
      doc.text(line, x + boxWidth / 2, yPos + 18 + (i * 4), { align: 'center' });
    });
  });

  yPos += boxHeight + 15;

  // Secondary stats row
  const stats2 = [
    { label: 'Total Opportunities', value: data.stats.totalOpportunities.toString() },
    { label: 'Completed', value: data.stats.completedOpportunities.toString() },
    { label: 'Attendance Records', value: data.stats.totalAttendance.toString() },
    { label: 'Engagement Rate', value: `${Math.round((data.stats.activeVolunteers / Math.max(data.stats.totalVolunteers, 1)) * 100)}%` },
  ];

  stats2.forEach((stat, index) => {
    const x = margin + (boxWidth + 5) * index;
    
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(x, yPos, boxWidth, 22, 2, 2, 'F');
    
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(stat.value, x + boxWidth / 2, yPos + 10, { align: 'center' });
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(stat.label, x + boxWidth / 2, yPos + 17, { align: 'center' });
  });

  yPos += 35;

  // Faculty Breakdown Section
  if (data.facultyBreakdown && data.facultyBreakdown.length > 0) {
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('VOLUNTEERS BY FACULTY', margin, yPos);
    
    doc.setDrawColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.setLineWidth(1);
    doc.line(margin, yPos + 2, margin + 45, yPos + 2);
    
    yPos += 10;

    const maxCount = Math.max(...data.facultyBreakdown.map(f => f.count), 1);
    const barMaxWidth = pageWidth - margin * 2 - 70;

    data.facultyBreakdown.slice(0, 5).forEach((faculty, index) => {
      const barWidth = Math.max((faculty.count / maxCount) * barMaxWidth, 2);
      
      // Faculty name
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      const truncatedName = faculty.name.length > 25 ? faculty.name.substring(0, 25) + '...' : faculty.name;
      doc.text(truncatedName, margin, yPos + 4);
      
      // Bar background
      doc.setFillColor(230, 230, 230);
      doc.roundedRect(margin + 50, yPos, barMaxWidth, 6, 1, 1, 'F');
      
      // Bar fill
      doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
      doc.roundedRect(margin + 50, yPos, barWidth, 6, 1, 1, 'F');
      
      // Count
      doc.setTextColor(100, 100, 100);
      doc.text(faculty.count.toString(), pageWidth - margin, yPos + 4, { align: 'right' });
      
      yPos += 10;
    });

    yPos += 8;
  }

  // Top Volunteers Section
  if (data.topVolunteers && data.topVolunteers.length > 0) {
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOP PERFORMING VOLUNTEERS', margin, yPos);
    
    doc.setDrawColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.setLineWidth(1);
    doc.line(margin, yPos + 2, margin + 55, yPos + 2);
    
    yPos += 8;

    // Table header
    doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.rect(margin, yPos, pageWidth - margin * 2, 7, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('#', margin + 5, yPos + 5);
    doc.text('Volunteer Name', margin + 15, yPos + 5);
    doc.text('Hours', pageWidth - margin - 40, yPos + 5);
    doc.text('Opportunities', pageWidth - margin - 5, yPos + 5, { align: 'right' });
    
    yPos += 7;

    // Table rows
    data.topVolunteers.slice(0, 8).forEach((volunteer, index) => {
      const bgColor = index % 2 === 0 ? [250, 250, 250] : [255, 255, 255];
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.rect(margin, yPos, pageWidth - margin * 2, 6, 'F');
      
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      // Rank
      const rankText = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1).toString();
      doc.text(rankText, margin + 5, yPos + 4);
      
      // Name
      const truncatedName = volunteer.name.length > 35 ? volunteer.name.substring(0, 35) + '...' : volunteer.name;
      doc.text(truncatedName, margin + 15, yPos + 4);
      
      // Hours
      doc.setFont('helvetica', 'bold');
      doc.text(volunteer.hours.toString(), pageWidth - margin - 40, yPos + 4);
      
      // Opportunities
      doc.setFont('helvetica', 'normal');
      doc.text(volunteer.opportunities.toString(), pageWidth - margin - 5, yPos + 4, { align: 'right' });
      
      yPos += 6;
    });
  }

  // Footer
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(0, pageHeight - 18, pageWidth, 18, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('Community Service & Development Center - University of Jordan', pageWidth / 2, pageHeight - 11, { align: 'center' });
  doc.setFontSize(7);
  doc.text('This is an official report generated automatically', pageWidth / 2, pageHeight - 6, { align: 'center' });

  // Save the PDF
  doc.save(`volunteer-report-${new Date().toISOString().split('T')[0]}.pdf`);
}
