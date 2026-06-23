import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Generates and downloads a beautifully styled PDF report for Operations Hub records.
 * Matches FitXeno premium brand aesthetic.
 */
export const generateReportPDF = (title, headers, data) => {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = [160, 82, 45]; // Earth Clay #a0522d

  const user = useAuthStore.getState().user;
  const branchName = user?.gym_name || 'FITXENO';

  // Header Background Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 42, 'F');
  
  // Brand Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(branchName.toUpperCase(), 15, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`ENTERPRISE OPERATIONS REPORT  ·  ${title.toUpperCase()}`, 15, 29);
  doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}  |  Authorized Access Only`, 15, 35);

  // Table
  autoTable(doc, {
    startY: 50,
    head: [headers],
    body: data,
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 4,
      textColor: [30, 41, 59]
    },
    headStyles: { 
      fillColor: primaryColor, 
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    alternateRowStyles: { 
      fillColor: [248, 250, 252] 
    },
    margin: { left: 15, right: 15 }
  });

  const finalY = doc.lastAutoTable.finalY + 12;
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('This is an enterprise computer-generated document. Confidentiality and compliance audit trailing enforced.', pageWidth / 2, 195, { align: 'center' });

  const safeFilename = `${branchName.toUpperCase().replace(/\s+/g, '_')}_${title.toUpperCase().replace(/\s+/g, '_')}_REPORT_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(safeFilename);
};
