import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateInvoicePDF = (payment, member) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('GYM SAAS', 15, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Payment Receipt', 15, 32);

  // Invoice Details
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.text(`Receipt No: REC-${payment.id.substring(0, 8).toUpperCase()}`, 15, 55);
  doc.text(`Date: ${new Date(payment.payment_date).toLocaleDateString()}`, 15, 62);

  // Bill To
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 15, 80);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(member.name, 15, 87);
  doc.text(member.phone, 15, 94);

  // Table
  doc.autoTable({
    startY: 105,
    head: [['Description', 'Duration', 'Amount']],
    body: [
      [
        payment.plan_name || 'Gym Membership',
        `${new Date(payment.valid_from).toLocaleDateString()} to ${new Date(payment.valid_until).toLocaleDateString()}`,
        `INR ${payment.amount}`
      ]
    ],
    headStyles: { fillStyle: [30, 41, 59], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [241, 245, 249] },
  });

  // Total
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Paid: INR ${payment.amount}`, pageWidth - 15, finalY, { align: 'right' });

  // Footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('Thank you for choosing Gym SaaS!', pageWidth / 2, 280, { align: 'center' });

  doc.save(`Invoice_${member.name.replace(/\s/g, '_')}_${Date.now()}.pdf`);
};
