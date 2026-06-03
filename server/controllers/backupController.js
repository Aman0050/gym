'use strict';

const db = require('../config/db');
const { runBackup } = require('../services/backupService');
const logger = require('../utils/logger');

/**
 * Gets the backup health status, including recent logs.
 * Used by the Super Admin Dashboard.
 */
const getBackupStatus = async (req, res) => {
  try {
    // Get the most recent 10 backups
    const recentLogsRes = await db.query(
      `SELECT id, type, status, file_size_bytes, error_message, started_at, completed_at 
       FROM backup_logs 
       ORDER BY started_at DESC 
       LIMIT 10`
    );

    // Get the last successful backups by type
    const lastSuccessfulRes = await db.query(
      `SELECT type, MAX(completed_at) as last_success 
       FROM backup_logs 
       WHERE status = 'SUCCESS' 
       GROUP BY type`
    );

    const lastSuccessful = {};
    lastSuccessfulRes.rows.forEach(r => {
      lastSuccessful[r.type] = r.last_success;
    });

    res.json({
      recentLogs: recentLogsRes.rows,
      lastSuccessful
    });
  } catch (error) {
    logger.error('Error fetching backup status:', error);
    res.status(500).json({ error: 'Failed to fetch backup status' });
  }
};

/**
 * Trigger a manual backup via API.
 */
const triggerManualBackup = async (req, res) => {
  try {
    // Do not await, let it run in the background
    runBackup('MANUAL');
    res.json({ message: 'Manual backup triggered successfully' });
  } catch (error) {
    logger.error('Error triggering manual backup:', error);
    res.status(500).json({ error: 'Failed to trigger backup' });
  }
};

module.exports = {
  getBackupStatus,
  triggerManualBackup
};
