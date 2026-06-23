import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuthStore } from '../store/useAuthStore';

export const generatePayslipPDF = (payroll, staff) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = [160, 82, 45]; // Earth Clay

  const user = useAuthStore.getState().user;
  const branchName = user?.gym_name || 'FITNEXO';

  // Header Background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Brand Header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text(branchName.toUpperCase(), 15, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('FITXENO ENTERPRISE OPERATIONAL SYSTEMS', 15, 34);
  doc.text('Monthly Employee Payslip', 15, 39);

  // Payslip Meta
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYSLIP DETAILS', 15, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`Payslip ID: PAY-${payroll.id.substring(0, 8).toUpperCase()}`, 15, 63);
  doc.text(`Salary Period: ${payroll.month}`, 15, 70);
  doc.text(`Status: ${payroll.status.toUpperCase()}`, 15, 77);

  // Employee Information Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('EMPLOYEE PROFILE:', 15, 92);
  
  doc.setFontSize(14);
  doc.text(staff.name.toUpperCase(), 15, 102);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Employee ID: ${staff.employee_id.toUpperCase()}`, 15, 109);
  doc.text(`Designated Role: ${staff.role}`, 15, 116);
  doc.text(`Email: ${staff.email}`, 15, 123);
  doc.text(`Phone: ${staff.phone}`, 15, 130);

  // Table structure of Earnings and Deductions
  const earningsDeductionsTable = [
    ['Basic Base Salary', `INR ${parseFloat(payroll.base_salary || 0).toLocaleString('en-IN')}`],
    ['Performance Bonus', `INR ${parseFloat(payroll.bonus || 0).toLocaleString('en-IN')}`],
    ['Sales Incentives', `INR ${parseFloat(payroll.incentives || 0).toLocaleString('en-IN')}`],
    ['Monthly Deductions (Tax/Loss)', `- INR ${parseFloat(payroll.deductions || 0).toLocaleString('en-IN')}`],
    ['Advance Salary Deduction', `- INR ${parseFloat(payroll.advance_salary || 0).toLocaleString('en-IN')}`]
  ];

  autoTable(doc, {
    startY: 140,
    head: [['SALARY COMPONENT', 'AMOUNT (INR)']],
    body: earningsDeductionsTable,
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
    columnStyles: {
      1: { halign: 'right' }
    },
    margin: { left: 15, right: 15 }
  });

  // Net Pay Summary
  const finalY = doc.lastAutoTable.finalY + 15;
  
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 90, finalY - 5, pageWidth - 15, finalY - 5);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`NET PAYOUT: INR ${parseFloat(payroll.net_pay || 0).toLocaleString('en-IN')}`, pageWidth - 15, finalY, { align: 'right' });

  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('This payslip is a confidential computer-generated record. No signature required.', pageWidth / 2, 275, { align: 'center' });
  doc.text(`FitXeno Operations Hub  ·  ${branchName}`, pageWidth / 2, 282, { align: 'center' });

  doc.save(`${branchName.toUpperCase().replace(/\s/g, '_')}_PAYSLIP_${staff.name.replace(/\s/g, '_')}_${payroll.month}.pdf`);
};
