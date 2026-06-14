'use strict';

const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const logger = require('../utils/logger');
const ExcelJS = require('exceljs');

// Store backups in a local directory
const BACKUP_DIR = path.join(__dirname, '../../backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Tables to back up
const BACKUP_TABLES = [
  'gyms',
  'plans',
  'members',
  'payments',
  'attendance',
  'backup_logs',
];

// ─── Palette (Premium Theme) ─────────────────────────────────────────────────
const COLORS = {
  headerBg:       'FF1C1C1C', // near-black header
  headerFg:       'FFFAFAFA', // off-white text
  metaBg:         'FF111111', // darker meta rows
  metaFg:         'FFE5E5E5',
  metaLabelFg:    'FF9CA3AF', // slate-400
  titleBg:        'FF0A0A0A',
  titleFg:        'FFFFFFFF',
  accentBg:       'FF8B4513', // earth-clay brand
  altRowBg:       'FFF7F7F7', // very subtle stripe
  whiteBg:        'FFFFFFFF',
  borderColor:    'FFE5E7EB',
};

const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
};

/**
 * Executes a full database backup as a fully styled Excel (.xlsx) file
 * @param {string} type - 'DAILY', 'WEEKLY', 'MONTHLY', 'MANUAL'
 */
const runBackup = async (type = 'DAILY') => {
  logger.info(`Starting ${type} database backup (Premium Excel format)...`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `fitxeno_backup_${type.toLowerCase()}_${timestamp}.xlsx`;
  const filepath = path.join(BACKUP_DIR, filename);
  const nowStr = formatDate(new Date());

  // 1. Log the attempt to DB
  let logId;
  try {
    const res = await db.query(
      `INSERT INTO backup_logs (type, status, file_path) VALUES ($1, 'IN_PROGRESS', $2) RETURNING id`,
      [type, filepath]
    );
    logId = res.rows[0].id;
  } catch (err) {
    logger.error('Failed to initialize backup log:', err);
    return;
  }

  // 2. Build the Excel workbook
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FitXeno System';
    workbook.created = new Date();

    for (const table of BACKUP_TABLES) {
      const sheet = workbook.addWorksheet(table, {
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true }
      });
      
      const result = await db.query(`SELECT * FROM ${table}`);
      const rowCount = result.rows.length;
      const columns = rowCount > 0 ? Object.keys(result.rows[0]) : ['Message'];
      const totalCols = Math.max(columns.length, 6);

      // ── Row 1: Report Title ──
      const titleRow = sheet.addRow([`FitXeno Database Backup  ·  Table: ${table.toUpperCase()}`]);
      sheet.mergeCells(1, 1, 1, totalCols);
      const titleCell = sheet.getCell('A1');
      titleCell.fill      = fill(COLORS.titleBg);
      titleCell.font      = { size: 15, bold: true, color: { argb: COLORS.titleFg }, name: 'Calibri' };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      titleRow.height     = 36;

      // ── Rows 2-5: Metadata Block ──
      const metaRows = [
        ['Generated On',  nowStr],
        ['Backup Type',   type],
        ['Table Name',    table],
        ['Total Records', String(rowCount)],
      ];

      metaRows.forEach(([label, value], i) => {
        const row = sheet.addRow([label, value]);
        row.height = 22;

        const labelCell = row.getCell(1);
        labelCell.fill      = fill(COLORS.metaBg);
        labelCell.font      = { bold: true, size: 10, color: { argb: COLORS.metaLabelFg }, name: 'Calibri' };
        labelCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

        const valueCell = row.getCell(2);
        valueCell.fill      = fill(COLORS.metaBg);
        valueCell.font      = { bold: true, size: 10, color: { argb: COLORS.metaFg }, name: 'Calibri' };
        valueCell.alignment = { vertical: 'middle', horizontal: 'left' };

        for (let c = 3; c <= totalCols; c++) {
          row.getCell(c).fill = fill(COLORS.metaBg);
        }
      });

      // ── Row 6: Spacer ──
      const spacerRow = sheet.addRow([]);
      spacerRow.height = 8;
      for (let c = 1; c <= totalCols; c++) {
        sheet.getCell(spacerRow.number, c).fill = fill(COLORS.accentBg);
      }

      if (rowCount === 0) {
        const emptyRow = sheet.addRow(['No Data Available in this table']);
        emptyRow.height = 30;
        continue;
      }

      // ── Row 7: Headers ──
      const headerRow = sheet.addRow(columns);
      headerRow.height = 30;
      headerRow.eachCell((cell) => {
        cell.fill      = fill(COLORS.headerBg);
        cell.font      = { bold: true, size: 10, color: { argb: COLORS.headerFg }, name: 'Calibri' };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
        cell.border    = { bottom: { style: 'medium', color: { argb: COLORS.accentBg } } };
      });

      // ── Data Rows ──
      result.rows.forEach((row, idx) => {
        const dataValues = columns.map(col => {
            const val = row[col];
            if (val === null || val === undefined) return '—';
            if (val instanceof Date) return formatDate(val);
            return String(val);
        });
        const dataRow = sheet.addRow(dataValues);
        dataRow.height = 22;

        const isAlt = idx % 2 === 1;
        dataRow.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill      = fill(isAlt ? COLORS.altRowBg : COLORS.whiteBg);
          cell.font      = { size: 10, name: 'Calibri', color: { argb: 'FF1F2937' } };
          cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
          cell.border    = { bottom: { style: 'hair', color: { argb: COLORS.borderColor } } };
        });
      });

      // ── Auto-fit & Freeze ──
      const DATA_START_ROW = 7;
      sheet.columns.forEach((col, colIndex) => {
        let maxLen = columns[colIndex] ? columns[colIndex].length : 10;
        col.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
          if (rowNumber >= DATA_START_ROW) {
            const len = cell.value ? String(cell.value).length : 0;
            if (len > maxLen) maxLen = len;
          }
        });
        col.width = Math.min(Math.max(maxLen + 4, 14), 45);
      });

      sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 7 }];
      sheet.autoFilter = {
        from: { row: 7, column: 1 },
        to:   { row: 7, column: columns.length },
      };
    }

    // 3. Write to file
    await workbook.xlsx.writeFile(filepath);

    const stats = fs.statSync(filepath);
    const sizeKB = (stats.size / 1024).toFixed(2);

    await db.query(
      `UPDATE backup_logs SET status = 'SUCCESS', file_size_bytes = $1, completed_at = NOW() WHERE id = $2`,
      [stats.size, logId]
    );

    logger.info(`✅ Backup ${type} completed. File: ${filename} (${sizeKB} KB)`);
  } catch (err) {
    logger.error(`Backup ${type} FAILED:`, err);
    try {
      await db.query(
        `UPDATE backup_logs SET status = 'FAILED', error_message = $1, completed_at = NOW() WHERE id = $2`,
        [String(err).substring(0, 500), logId]
      );
    } catch (_) {}
  }
};

// ─── CRON SCHEDULES ──────────────────────────────────────────────────────────

// Daily Backup: Every day at 02:00 AM
cron.schedule('0 2 * * *', () => {
  runBackup('DAILY');
});

// Weekly Backup: Every Sunday at 03:00 AM
cron.schedule('0 3 * * 0', () => {
  runBackup('WEEKLY');
});

// Monthly Backup: 1st of every month at 04:00 AM
cron.schedule('0 4 1 * *', () => {
  runBackup('MONTHLY');
});

module.exports = {
  runBackup
};
