import jsPDF from 'jspdf';
import logoImage from '@/assets/logo.png';
import { QRCodeCanvas } from 'qrcode.react';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';

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

// Generate QR code as base64
async function generateQRCodeBase64(certificateNumber: string): Promise<string> {
  return new Promise((resolve) => {
    const verifyUrl = `${window.location.origin}/verify?cert=${encodeURIComponent(certificateNumber)}`;
    
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);
    
    const root = createRoot(container);
    root.render(createElement(QRCodeCanvas, {
      value: verifyUrl,
      size: 200,
      level: 'H',
      includeMargin: true,
    }));
    
    setTimeout(() => {
      const canvas = container.querySelector('canvas');
      if (canvas) {
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve('');
      }
      root.unmount();
      document.body.removeChild(container);
    }, 100);
  });
}

// Classic formal certificate design
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
  doc.text('This is to certify that', pageWidth / 2, 112, { align: 'center' });

  // Volunteer name
  doc.setFont('times', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(accentRed[0], accentRed[1], accentRed[2]);
  doc.text(data.volunteerName, pageWidth / 2, 125, { align: 'center' });

  // Underline for name
  const nameWidth = doc.getTextWidth(data.volunteerName);
  doc.setDrawColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - nameWidth / 2 - 5, 128, pageWidth / 2 + nameWidth / 2 + 5, 128);

  // Service description
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text('has successfully completed volunteer service for', pageWidth / 2, 140, { align: 'center' });

  // Opportunity title
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(data.opportunityTitle, pageWidth / 2, 150, { align: 'center' });

  // Hours badge
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.roundedRect(pageWidth / 2 - 28, 155, 56, 10, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`${data.hours} VOLUNTEER HOURS`, pageWidth / 2, 162, { align: 'center' });

  // Date and location
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Date: ${data.opportunityDate}  |  Location: ${data.location}`, pageWidth / 2, 173, { align: 'center' });

  // Signature section
  const sigY = pageHeight - 35;
  
  // Left signature
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.line(35, sigY, 95, sigY);
  doc.setFontSize(8);
  doc.text('Director Signature', 65, sigY + 5, { align: 'center' });

  // Right signature  
  doc.line(pageWidth - 95, sigY, pageWidth - 35, sigY);
  doc.text('Center Stamp', pageWidth - 65, sigY + 5, { align: 'center' });

  // QR Code for verification
  try {
    const qrBase64 = await generateQRCodeBase64(data.certificateNumber);
    if (qrBase64) {
      doc.addImage(qrBase64, 'PNG', pageWidth / 2 - 12, sigY - 20, 24, 24);
      doc.setFontSize(5);
      doc.setTextColor(100, 100, 100);
      doc.text('Scan to verify', pageWidth / 2, sigY + 8, { align: 'center' });
    }
  } catch (error) {
    console.error('Could not generate QR code:', error);
  }

  // Certificate info footer - moved outside main frame
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(`Certificate No: ${data.certificateNumber}`, 15, pageHeight - 5);
  doc.text(`Issued: ${data.issuedAt}`, pageWidth - 15, pageHeight - 5, { align: 'right' });
  doc.text('Verify at: ' + window.location.origin + '/verify', pageWidth / 2, pageHeight - 5, { align: 'center' });

  // Save the PDF
  doc.save(`certificate-${data.certificateNumber}.pdf`);
}

// Modern professional certificate design with visual effects
export async function generateModernCertificatePDF(data: CertificateData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Modern color palette
  const deepGreen = [16, 78, 58];
  const brightGreen = [34, 197, 94];
  const gold = [234, 179, 8];
  const slate = [51, 65, 85];
  const white = [255, 255, 255];

  // Gradient background effect - dark to light green
  for (let i = 0; i < pageHeight; i += 2) {
    const ratio = i / pageHeight;
    const r = Math.floor(deepGreen[0] + (255 - deepGreen[0]) * ratio * 0.3);
    const g = Math.floor(deepGreen[1] + (255 - deepGreen[1]) * ratio * 0.3);
    const b = Math.floor(deepGreen[2] + (255 - deepGreen[2]) * ratio * 0.3);
    doc.setFillColor(r, g, b);
    doc.rect(0, i, pageWidth, 2, 'F');
  }

  // Main certificate card
  const cardMargin = 20;
  const cardWidth = pageWidth - cardMargin * 2;
  const cardHeight = pageHeight - cardMargin * 2 - 14; // Leave space for footer
  
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(cardMargin, cardMargin, cardWidth, cardHeight, 8, 8, 'F');

  // Gold accent border
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(2);
  doc.roundedRect(cardMargin + 5, cardMargin + 5, cardWidth - 10, cardHeight - 10, 6, 6, 'S');

  // Decorative corner elements
  const cornerSize = 20;
  const corners = [
    { x: cardMargin + 10, y: cardMargin + 10 },
    { x: pageWidth - cardMargin - 10, y: cardMargin + 10 },
    { x: cardMargin + 10, y: cardMargin + cardHeight - 10 },
    { x: pageWidth - cardMargin - 10, y: cardMargin + cardHeight - 10 },
  ];

  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(1.5);
  
  // Top-left corner
  doc.line(corners[0].x, corners[0].y, corners[0].x + cornerSize, corners[0].y);
  doc.line(corners[0].x, corners[0].y, corners[0].x, corners[0].y + cornerSize);
  
  // Top-right corner
  doc.line(corners[1].x, corners[1].y, corners[1].x - cornerSize, corners[1].y);
  doc.line(corners[1].x, corners[1].y, corners[1].x, corners[1].y + cornerSize);
  
  // Bottom-left corner
  doc.line(corners[2].x, corners[2].y, corners[2].x + cornerSize, corners[2].y);
  doc.line(corners[2].x, corners[2].y, corners[2].x, corners[2].y - cornerSize);
  
  // Bottom-right corner
  doc.line(corners[3].x, corners[3].y, corners[3].x - cornerSize, corners[3].y);
  doc.line(corners[3].x, corners[3].y, corners[3].x, corners[3].y - cornerSize);

  // Try to add logo
  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', pageWidth / 2 - 14, 27, 28, 28);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  // Organization name with modern styling
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(deepGreen[0], deepGreen[1], deepGreen[2]);
  doc.text('COMMUNITY SERVICE & DEVELOPMENT CENTER', pageWidth / 2, 62, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text('University of Jordan', pageWidth / 2, 68, { align: 'center' });

  // Certificate badge/ribbon effect
  doc.setFillColor(deepGreen[0], deepGreen[1], deepGreen[2]);
  doc.roundedRect(pageWidth / 2 - 65, 74, 130, 18, 3, 3, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(white[0], white[1], white[2]);
  doc.text('CERTIFICATE OF APPRECIATION', pageWidth / 2, 86, { align: 'center' });

  // Decorative line under title
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - 70, 96, pageWidth / 2 + 70, 96);
  
  // Small diamond decorations
  doc.setFillColor(gold[0], gold[1], gold[2]);
  [pageWidth / 2 - 70, pageWidth / 2, pageWidth / 2 + 70].forEach(x => {
    doc.circle(x, 96, 1.5, 'F');
  });

  // Certification text
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text('This certificate is proudly presented to', pageWidth / 2, 106, { align: 'center' });

  // Volunteer name with underline effect
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(deepGreen[0], deepGreen[1], deepGreen[2]);
  doc.text(data.volunteerName, pageWidth / 2, 118, { align: 'center' });
  
  // Decorative underline for name
  const nameWidth = doc.getTextWidth(data.volunteerName);
  doc.setDrawColor(brightGreen[0], brightGreen[1], brightGreen[2]);
  doc.setLineWidth(1.2);
  doc.line(pageWidth / 2 - nameWidth / 2, 121, pageWidth / 2 + nameWidth / 2, 121);

  // Service description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text('for outstanding dedication and exceptional volunteer service in', pageWidth / 2, 130, { align: 'center' });

  // Opportunity title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(deepGreen[0], deepGreen[1], deepGreen[2]);
  doc.text(data.opportunityTitle, pageWidth / 2, 140, { align: 'center' });

  // Hours badge with modern design
  doc.setFillColor(brightGreen[0], brightGreen[1], brightGreen[2]);
  doc.roundedRect(pageWidth / 2 - 28, 145, 56, 10, 5, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(white[0], white[1], white[2]);
  doc.text(`${data.hours} VOLUNTEER HOURS`, pageWidth / 2, 152, { align: 'center' });

  // Info section
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(`Date: ${data.opportunityDate}  |  Location: ${data.location}`, pageWidth / 2, 162, { align: 'center' });

  // Signature section
  const sigY = cardMargin + cardHeight - 22;
  
  // Left signature
  doc.setDrawColor(slate[0], slate[1], slate[2]);
  doc.setLineWidth(0.5);
  doc.line(40, sigY, 100, sigY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text('Director Signature', 70, sigY + 4, { align: 'center' });

  // Right signature
  doc.line(pageWidth - 100, sigY, pageWidth - 40, sigY);
  doc.text('Official Stamp', pageWidth - 70, sigY + 4, { align: 'center' });

  // QR Code for verification - center position
  try {
    const qrBase64 = await generateQRCodeBase64(data.certificateNumber);
    if (qrBase64) {
      doc.addImage(qrBase64, 'PNG', pageWidth / 2 - 10, sigY - 16, 20, 20);
      doc.setFontSize(5);
      doc.setTextColor(slate[0], slate[1], slate[2]);
      doc.text('Scan to verify', pageWidth / 2, sigY + 7, { align: 'center' });
    }
  } catch (error) {
    console.error('Could not generate QR code:', error);
  }

  // Certificate info footer - outside main card
  doc.setFillColor(deepGreen[0], deepGreen[1], deepGreen[2]);
  doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(white[0], white[1], white[2]);
  doc.text(`Certificate No: ${data.certificateNumber}`, 15, pageHeight - 5);
  doc.text(`Issued: ${data.issuedAt}`, pageWidth - 15, pageHeight - 5, { align: 'right' });
  doc.text('This certificate validates genuine volunteer service  •  Verify at: ' + window.location.origin + '/verify', pageWidth / 2, pageHeight - 5, { align: 'center' });

  // Save the PDF
  doc.save(`certificate-modern-${data.certificateNumber}.pdf`);
}
