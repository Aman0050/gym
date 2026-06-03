'use strict';

const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const logger = require('../utils/logger');

// Store backups in a local directory (in a real enterprise app, this would stream to S3)
const BACKUP_DIR = path.join(__dirname, '../../backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Executes a logical backup using pg_dump
 * @param {string} type - 'DAILY', 'WEEKLY', 'MONTHLY', 'MANUAL'
 */
const runBackup = async (type = 'DAILY') => {
  logger.info(`Starting ${type} database backup...`);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `fitxeno_backup_${type.toLowerCase()}_${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  // 1. Log the attempt
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

  // 2. Execute pg_dump
  // Note: pg_dump must be installed on the server hosting this Node app.
  // If we are on Vercel/serverless, this will fail, but we'll log the failure gracefully,
  // falling back to Supabase's built-in managed backups.
  const dbUrl = process.env.DATABASE_URL;
  
  // Mask password for logging
  const maskedUrl = dbUrl ? dbUrl.replace(/:[^:@]+@/, ':***@') : '';
  logger.info(`Running pg_dump on ${maskedUrl}`);

  const command = `pg_dump "${dbUrl}" -F c -f "${filepath}"`;

  exec(command, async (error, stdout, stderr) => {
    if (error) {
      logger.error(`Backup failed: ${error.message}`);
      await db.query(
        `UPDATE backup_logs SET status = 'FAILED', error_message = $1, completed_at = NOW() WHERE id = $2`,
        [error.message.substring(0, 500), logId]
      );
      return;
    }

    // Success
    try {
      const stats = fs.statSync(filepath);
      await db.query(
        `UPDATE backup_logs SET status = 'SUCCESS', file_size_bytes = $1, completed_at = NOW() WHERE id = $2`,
        [stats.size, logId]
      );
      logger.info(`Backup ${type} completed successfully. Size: ${stats.size} bytes`);
    } catch (statErr) {
      await db.query(
        `UPDATE backup_logs SET status = 'FAILED', error_message = $1, completed_at = NOW() WHERE id = $2`,
        ['File created but could not read size', logId]
      );
    }
  });
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
