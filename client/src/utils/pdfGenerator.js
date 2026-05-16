import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoicePDF = (payment, member) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = [160, 82, 45]; // Earth Clay

  // Header Background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Brand Header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('FITVIBE', 15, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('PREMIUM GYM MANAGEMENT', 15, 34);
  doc.text('Official Payment Receipt', 15, 39);

  // Invoice Meta
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT DETAILS', 15, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`No: REC-${payment.id.substring(0, 8).toUpperCase()}`, 15, 63);
  doc.text(`Date: ${new Date(payment.payment_date).toLocaleDateString('en-IN')}`, 15, 70);

  // Bill To Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('BILL TO:', 15, 85);
  
  doc.setFontSize(14);
  doc.text(member.name.toUpperCase(), 15, 95);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Phone: ${member.phone}`, 15, 102);
  doc.text(`Member ID: ${member.id.substring(0, 8).toUpperCase()}`, 15, 109);

  // Table
  autoTable(doc, {
    startY: 120,
    head: [['PLAN DESCRIPTION', 'VALIDITY PERIOD', 'AMOUNT']],
    body: [
      [
        (payment.plan_name || 'Gym Membership').toUpperCase(),
        `${new Date(payment.valid_from).toLocaleDateString('en-IN')} - ${new Date(payment.valid_until).toLocaleDateString('en-IN')}`,
        `INR ${Number(payment.amount).toLocaleString('en-IN')}`
      ]
    ],
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 6,
    },
    headStyles: { 
      fillColor: primaryColor, 
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: { 
      fillColor: [250, 250, 250] 
    },
    margin: { left: 15, right: 15 }
  });

  // Financial Summary
  const finalY = (doc).lastAutoTable.finalY + 15;
  
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 80, finalY - 5, pageWidth - 15, finalY - 5);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL PAID: INR ${Number(payment.amount).toLocaleString('en-IN')}`, pageWidth - 15, finalY, { align: 'right' });

  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer-generated receipt. No signature required.', pageWidth / 2, 275, { align: 'center' });
  doc.text('Thank you for being part of the FitVibe community!', pageWidth / 2, 282, { align: 'center' });

  doc.save(`FITVIBE_INVOICE_${member.name.replace(/\s/g, '_')}.pdf`);
};
