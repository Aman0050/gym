'use strict';

/**
 * FitNexo OS — Enterprise Export Service
 * Isolated report-building engine for XLSX and CSV exports.
 * All sanitization, formatting, and styling logic lives here.
 */

const ExcelJS = require('exceljs');

// ─── Palette ─────────────────────────────────────────────────────────────────
const COLORS = {
  headerBg:       'FF1C1C1C', // near-black header
  headerFg:       'FFFAFAFA', // off-white text
  metaBg:         'FF111111', // darker meta rows
  metaFg:         'FFE5E5E5',
  metaLabelFg:    'FF9CA3AF', // slate-400
  titleBg:        'FF0A0A0A',
  titleFg:        'FFFFFFFF',
  accentBg:       'FF8B4513', // earth-clay brand
  accentFg:       'FFFFFFFF',
  altRowBg:       'FFF7F7F7', // very subtle stripe
  whiteBg:        'FFFFFFFF',
  borderColor:    'FFE5E7EB',
  // Status
  activeGreenBg:  'FFD1FAE5',
  activeGreenFg:  'FF065F46',
  frozenAmberBg:  'FFFEF3C7',
  frozenAmberFg:  'FF92400E',
  expiredRedBg:   'FFFEE2E2',
  expiredRedFg:   'FF991B1B',
  neutralBg:      'FFF3F4F6',
  neutralFg:      'FF374151',
};

// ─── Formatters ───────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/**
 * Formats a date value into DD MMM YYYY (e.g. "20 May 2026")
 * Does NOT rely on server locale.
 */
const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  const day   = String(d.getDate()).padStart(2, '0');
  const month = MONTHS[d.getMonth()];
  const year  = d.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * Sanitizes any field: trims whitespace, collapses duplicates, replaces
 * null / undefined / NaN / "null" / "undefined" / "" with a fallback.
 */
const sanitize = (value, fallback = '—') => {
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim().replace(/\s+/g, ' ');
  if (!str || String(str).toLowerCase() === 'null' || String(str).toLowerCase() === 'undefined' || str === 'NaN') {
    return fallback;
  }
  return str;
};

/**
 * Formats a number as Indian currency: ₹1,500
 */
const formatCurrency = (value) => {
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return `₹${num.toLocaleString('en-IN')}`;
};

/**
 * Formats a phone number to +91 XXXXX XXXXX
 */
const formatPhone = (phone) => {
  if (!phone) return '—';
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length === 10) return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  if (cleaned.length === 12 && cleaned.startsWith('91'))
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  return sanitize(phone);
};

// ─── Data Builder ─────────────────────────────────────────────────────────────

/**
 * Maps raw DB rows into clean, standardized report rows.
 * @param {Array} rawMembers - rows from the DB query
 * @returns {Array} cleanMembers
 */
const buildMemberReportData = (rawMembers) => {
  return rawMembers.map((m) => ({
    'Member Name':          sanitize(m['Full Name'], 'Not Available'),
    'Member ID':            sanitize(m['Member ID']),
    'Contact Number':       formatPhone(m['Phone Number']),
    'Membership Status':    sanitize(m['Status']),
    'Membership Start Date':formatDate(m['Join Date']),
    'Membership Expiry Date':formatDate(m['Expiry Date']),
    'Active Plan':          sanitize(m['Membership Plan']),
    'Last Payment Amount':  formatCurrency(m['Last Payment']),
  }));
};

const buildPaymentReportData = (rawPayments) => {
  return rawPayments.map((p) => ({
    'Transaction ID':       p.id,
    'Branch Name':          sanitize(p.gym_name),
    'Member Name':          sanitize(p.member_name),
    'Plan Name':            sanitize(p.plan_name),
    'Amount':               formatCurrency(p.amount),
    'Status':               sanitize(p.payment_status, 'PAID'),
    'Method':               sanitize(p.payment_mode, 'CASH'),
    'Date':                 formatDate(p.payment_date),
  }));
};

const buildAttendanceReportData = (rawAttendance) => {
  return rawAttendance.map((a) => ({
    'Branch Name':          sanitize(a.gym_name),
    'Member Name':          sanitize(a.member_name),
    'Member Phone':         formatPhone(a.member_phone),
    'Check-in Time':        formatDate(a.check_in_time) + ' ' + new Date(a.check_in_time).toLocaleTimeString('en-IN'),
  }));
};

const buildSubscriptionReportData = (rawPlans) => {
  return rawPlans.map((p) => ({
    'Plan Name':            sanitize(p.name),
    'Duration (Days)':      p.duration_days || 30,
    'Price':                formatCurrency(p.price),
  }));
};

// ─── XLSX Builder ─────────────────────────────────────────────────────────────

/**
 * Applies a solid fill to a cell.
 */
const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

/**
 * Builds a fully styled ExcelJS workbook from clean report data.
 * @param {Array}  cleanMembers - output of buildMemberReportData()
 * @param {Object} meta         - { gymName, adminName, totalCount, generatedOn }
 * @returns {ExcelJS.Workbook}
 */
const buildXLSXWorkbook = (cleanMembers, meta) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator     = 'FitNexo OS';
  workbook.company     = meta.gymName;
  workbook.lastModifiedBy = meta.adminName;
  workbook.created     = new Date();
  workbook.modified    = new Date();

  const sheet = workbook.addWorksheet('Members Report', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true }
  });

  // ── Row 1: Report Title ────────────────────────────────────────────────────
  const titleRow = sheet.addRow([`${meta.gymName}  ·  Enterprise Membership Report`]);
  sheet.mergeCells('A1:H1');
  const titleCell = sheet.getCell('A1');
  titleCell.fill      = fill(COLORS.titleBg);
  titleCell.font      = { size: 15, bold: true, color: { argb: COLORS.titleFg }, name: 'Calibri' };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleRow.height     = 36;

  // ── Rows 2–6: Metadata Block ───────────────────────────────────────────────
  const metaRows = [
    ['Generated On',  meta.generatedOn],
    ['Branch',        meta.gymName],
    ['Exported By',   meta.adminName],
    ['Total Members', String(meta.totalCount)],
    ['Report Scope',  meta.scope || 'All Members'],
  ];

  metaRows.forEach(([label, value]) => {
    const row = sheet.addRow([label, value]);
    row.height = 22;

    // Label cell (col A)
    const labelCell = row.getCell(1);
    labelCell.fill      = fill(COLORS.metaBg);
    labelCell.font      = { bold: true, size: 10, color: { argb: COLORS.metaLabelFg }, name: 'Calibri' };
    labelCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    // Value cell (col B)
    const valueCell = row.getCell(2);
    valueCell.fill      = fill(COLORS.metaBg);
    valueCell.font      = { bold: true, size: 10, color: { argb: COLORS.metaFg }, name: 'Calibri' };
    valueCell.alignment = { vertical: 'middle', horizontal: 'left' };

    // Fill remaining meta columns with dark bg for visual cohesion
    for (let c = 3; c <= 8; c++) {
      const cell = row.getCell(c);
      cell.fill = fill(COLORS.metaBg);
    }
  });

  // ── Row 7: Spacer ──────────────────────────────────────────────────────────
  const spacerRow = sheet.addRow([]);
  spacerRow.height = 8;
  for (let c = 1; c <= 8; c++) {
    sheet.getCell(spacerRow.number, c).fill = fill(COLORS.accentBg);
  }

  // ── Row 8: Column Headers ──────────────────────────────────────────────────
  const headers = Object.keys(cleanMembers[0] || {
    'Member Name': '', 'Member ID': '', 'Contact Number': '',
    'Membership Status': '', 'Membership Start Date': '',
    'Membership Expiry Date': '', 'Active Plan': '', 'Last Payment Amount': ''
  });

  const headerRow = sheet.addRow(headers);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill      = fill(COLORS.headerBg);
    cell.font      = { bold: true, size: 10, color: { argb: COLORS.headerFg }, name: 'Calibri' };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    cell.border    = {
      bottom: { style: 'medium', color: { argb: COLORS.accentBg } },
    };
  });

  // ── Data Rows ──────────────────────────────────────────────────────────────
  cleanMembers.forEach((m, idx) => {
    const row = sheet.addRow(Object.values(m));
    row.height = 22;

    const isAlt = idx % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      // Alternating row stripe
      cell.fill      = fill(isAlt ? COLORS.altRowBg : COLORS.whiteBg);
      cell.font      = { size: 10, name: 'Calibri', color: { argb: 'FF1F2937' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      cell.border    = {
        bottom: { style: 'hair', color: { argb: COLORS.borderColor } },
      };
    });

    // ── Status Cell (col 4) conditional formatting ──
    const statusCell = row.getCell(4);
    const status = m['Membership Status'];
    if (status === 'ACTIVE') {
      statusCell.fill = fill(COLORS.activeGreenBg);
      statusCell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: COLORS.activeGreenFg } };
    } else if (status === 'FROZEN') {
      statusCell.fill = fill(COLORS.frozenAmberBg);
      statusCell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: COLORS.frozenAmberFg } };
    } else if (status && status !== '—') {
      // EXPIRED or SUSPENDED
      statusCell.fill = fill(COLORS.expiredRedBg);
      statusCell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: COLORS.expiredRedFg } };
    } else {
      statusCell.fill = fill(COLORS.neutralBg);
      statusCell.font = { size: 10, name: 'Calibri', color: { argb: COLORS.neutralFg } };
    }
    statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // ── Dynamic Column Widths ──────────────────────────────────────────────────
  const DATA_START_ROW = 8; // header is at row 8

  sheet.columns.forEach((col, colIndex) => {
    let maxLen = headers[colIndex] ? headers[colIndex].length : 10;

    col.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber >= DATA_START_ROW) {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = len;
      }
    });

    // Minimum 14, maximum 45, +4 padding
    col.width = Math.min(Math.max(maxLen + 4, 14), 45);
  });

  // ── Freeze Panes (keep headers visible on scroll) ─────────────────────────
  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 8 }];

  // ── Auto Filter on header row ─────────────────────────────────────────────
  sheet.autoFilter = {
    from: { row: 8, column: 1 },
    to:   { row: 8, column: headers.length },
  };

  return workbook;
};

// ─── CSV Builder ──────────────────────────────────────────────────────────────

/**
 * Builds a metadata-prefixed CSV string from clean report data.
 * @param {Array}  cleanMembers - output of buildMemberReportData()
 * @param {Object} meta         - { gymName, adminName, totalCount, generatedOn, scope }
 * @returns {string} csv
 */
const buildCSVReport = (cleanMembers, meta) => {
  const lines = [];

  // Metadata block (using # comments — compatible with Excel, Google Sheets, etc.)
  lines.push('# ============================================================');
  lines.push(`# ${meta.gymName} — Enterprise Membership Report`);
  lines.push('# ============================================================');
  lines.push(`# Generated On:    ${meta.generatedOn}`);
  lines.push(`# Branch:          ${meta.gymName}`);
  lines.push(`# Exported By:     ${meta.adminName}`);
  lines.push(`# Total Members:   ${meta.totalCount}`);
  lines.push(`# Report Scope:    ${meta.scope || 'All Members'}`);
  lines.push('# ============================================================');
  lines.push('');

  if (cleanMembers.length === 0) {
    lines.push('# No records matched the selected filters.');
    return lines.join('\r\n');
  }

  // Column headers
  const headers = Object.keys(cleanMembers[0]);
  lines.push(headers.map(h => `"${h}"`).join(','));

  // Data rows — escape double-quotes inside values
  cleanMembers.forEach((row) => {
    const values = Object.values(row).map(val => {
      const escaped = String(val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    lines.push(values.join(','));
  });

  return lines.join('\r\n');
};

// ─── Filename Builder ─────────────────────────────────────────────────────────

/**
 * Returns a professional report filename.
 * e.g. FitNexo_Members_Report_2026-05-20
 */
const buildFilename = (format, gymName = 'FitXeno') => {
  const date = new Date().toISOString().split('T')[0];
  const safeName = String(gymName).replace(/\s+/g, '_');
  return `${safeName}_Members_Report_${date}.${format}`;
};

// ─── Meta Builder ─────────────────────────────────────────────────────────────

/**
 * Builds the report metadata object.
 */
const buildMeta = ({ gymName, adminName, totalCount, filters }) => {
  const now = new Date();
  const generatedOn = `${formatDate(now)}  ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;

  // Build a human-readable scope description from active filters
  const scopeParts = [];
  if (filters?.status && filters.status !== 'ALL') scopeParts.push(`Status: ${filters.status}`);
  if (filters?.startDate) scopeParts.push(`From: ${formatDate(filters.startDate)}`);
  if (filters?.endDate)   scopeParts.push(`To: ${formatDate(filters.endDate)}`);
  if (filters?.planId)    scopeParts.push(`Plan Filter Applied`);

  return {
    gymName:     gymName  || 'FitNexo Gym',
    adminName:   adminName || 'Administrator',
    totalCount:  totalCount || 0,
    generatedOn,
    scope: scopeParts.length > 0 ? scopeParts.join('  |  ') : 'All Members — No Filters Applied',
  };
};

module.exports = {
  buildMemberReportData,
  buildPaymentReportData,
  buildAttendanceReportData,
  buildSubscriptionReportData,
  buildXLSXWorkbook,
  buildCSVReport,
  buildFilename,
  buildMeta,
};
