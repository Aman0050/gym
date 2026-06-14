'use strict';

const db = require('../config/db');
const exportService = require('../services/exportService');
const logger = require('../utils/logger');

// Generic helper to send file
const sendFileResponse = (res, format, filename, data, meta) => {
  if (format === 'xlsx') {
    const workbook = exportService.buildXLSXWorkbook(data, meta);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return workbook.xlsx.write(res).then(() => res.end());
  } else {
    const csv = exportService.buildCSVReport(data, meta);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  }
};

const exportPayments = async (req, res) => {
  try {
    const format = req.query.format === 'xlsx' ? 'xlsx' : 'csv';
    const result = await db.query(`
      SELECT p.id, p.amount, p.payment_status, p.payment_mode, p.payment_date,
             m.name as member_name, pl.name as plan_name, g.name as gym_name
      FROM payments p
      JOIN members m ON p.member_id = m.id
      JOIN plans pl ON p.plan_id = pl.id
      JOIN gyms g ON p.gym_id = g.id
      ORDER BY p.payment_date DESC LIMIT 50000
    `);

    const cleanData = exportService.buildPaymentReportData(result.rows);
    const meta = exportService.buildMeta({ gymName: 'Global Platform', adminName: 'Super Admin', totalCount: result.rows.length, filters: {} });
    const filename = exportService.buildFilename(format, 'Global_Payments');

    await sendFileResponse(res, format, filename, cleanData, meta);
  } catch (err) {
    logger.error('Export payments error:', err);
    res.status(500).json({ error: 'Failed to export payments' });
  }
};

const exportAttendance = async (req, res) => {
  try {
    const format = req.query.format === 'xlsx' ? 'xlsx' : 'csv';
    const result = await db.query(`
      SELECT a.check_in_time, m.name as member_name, m.phone as member_phone, g.name as gym_name
      FROM attendance a
      JOIN members m ON a.member_id = m.id
      JOIN gyms g ON a.gym_id = g.id
      ORDER BY a.check_in_time DESC LIMIT 50000
    `);

    const cleanData = exportService.buildAttendanceReportData(result.rows);
    const meta = exportService.buildMeta({ gymName: 'Global Platform', adminName: 'Super Admin', totalCount: result.rows.length, filters: {} });
    const filename = exportService.buildFilename(format, 'Global_Attendance');

    await sendFileResponse(res, format, filename, cleanData, meta);
  } catch (err) {
    logger.error('Export attendance error:', err);
    res.status(500).json({ error: 'Failed to export attendance' });
  }
};

const exportSubscriptions = async (req, res) => {
  try {
    const format = req.query.format === 'xlsx' ? 'xlsx' : 'csv';
    const result = await db.query(`
      SELECT name, duration_days, price, gym_id
      FROM plans
      ORDER BY price DESC
    `);

    const cleanData = exportService.buildSubscriptionReportData(result.rows);
    const meta = exportService.buildMeta({ gymName: 'Global Platform', adminName: 'Super Admin', totalCount: result.rows.length, filters: {} });
    const filename = exportService.buildFilename(format, 'Global_Subscriptions');

    await sendFileResponse(res, format, filename, cleanData, meta);
  } catch (err) {
    logger.error('Export subscriptions error:', err);
    res.status(500).json({ error: 'Failed to export subscriptions' });
  }
};

module.exports = {
  exportPayments,
  exportAttendance,
  exportSubscriptions
};
