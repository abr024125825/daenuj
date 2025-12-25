import jsPDF from 'jspdf';
import logoImage from '@/assets/logo.png';

interface CertificateData {
  volunteerName: string;
  opportunityTitle: string;
  hours: number;
  certificateNumber: string;
  issuedAt: string;
  opportunityDate: string;
  location: string;
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

export async function generateCertificatePDF(data: CertificateData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Official colors
  const primaryGreen = [0, 100, 60];
  const accentRed = [180, 40, 40];
  const goldAccent = [180, 140, 60];
  const darkSlate = [30, 41, 59];

  // Background - cream/off-white for official look
  doc.setFillColor(253, 251, 245);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer border - thick gold
  doc.setDrawColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.setLineWidth(4);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S');

  // Inner border - thin black
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(1);
  doc.rect(14, 14, pageWidth - 28, pageHeight - 28, 'S');

  // Second inner border - decorative
  doc.setDrawColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.setLineWidth(0.5);
  doc.rect(18, 18, pageWidth - 36, pageHeight - 36, 'S');

  // Try to add logo
  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', pageWidth / 2 - 15, 25, 30, 30);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  // Organization header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.text('COMMUNITY SERVICE & DEVELOPMENT CENTER', pageWidth / 2, 62, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('University of Jordan', pageWidth / 2, 68, { align: 'center' });

  // Main title
  doc.setFont('times', 'bold');
  doc.setFontSize(38);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('CERTIFICATE', pageWidth / 2, 85, { align: 'center' });

  doc.setFontSize(18);
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.text('OF VOLUNTEER SERVICE', pageWidth / 2, 95, { align: 'center' });

  // Decorative line
  doc.setDrawColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 70, 100, pageWidth / 2 + 70, 100);

  // Certification text
  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text('This is to certify that', pageWidth / 2, 115, { align: 'center' });

  // Volunteer name
  doc.setFont('times', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(accentRed[0], accentRed[1], accentRed[2]);
  doc.text(data.volunteerName, pageWidth / 2, 130, { align: 'center' });

  // Underline for name
  const nameWidth = doc.getTextWidth(data.volunteerName);
  doc.setDrawColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - nameWidth / 2 - 5, 134, pageWidth / 2 + nameWidth / 2 + 5, 134);

  // Service description
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text('has successfully completed volunteer service for', pageWidth / 2, 148, { align: 'center' });

  // Opportunity title
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(data.opportunityTitle, pageWidth / 2, 160, { align: 'center' });

  // Hours badge
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.roundedRect(pageWidth / 2 - 30, 166, 60, 12, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`${data.hours} VOLUNTEER HOURS`, pageWidth / 2, 174, { align: 'center' });

  // Date and location
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Date: ${data.opportunityDate}  |  Location: ${data.location}`, pageWidth / 2, 188, { align: 'center' });

  // Signature section
  const sigY = pageHeight - 42;
  
  // Left signature
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.line(50, sigY, 110, sigY);
  doc.setFontSize(9);
  doc.text('Director Signature', 80, sigY + 6, { align: 'center' });

  // Right signature  
  doc.line(pageWidth - 110, sigY, pageWidth - 50, sigY);
  doc.text('Center Stamp', pageWidth - 80, sigY + 6, { align: 'center' });

  // Certificate info footer
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text(`Certificate No: ${data.certificateNumber}`, 25, pageHeight - 20);
  doc.text(`Issued: ${data.issuedAt}`, pageWidth - 25, pageHeight - 20, { align: 'right' });

  // Seal/stamp circle placeholder
  doc.setDrawColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.setLineWidth(1);
  doc.circle(pageWidth - 80, sigY - 8, 12, 'S');
  doc.setFontSize(6);
  doc.setTextColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.text('OFFICIAL', pageWidth - 80, sigY - 8, { align: 'center' });

  // Save the PDF
  doc.save(`certificate-${data.certificateNumber}.pdf`);
}
