const cron = require('node-cron');
const https = require('https');
const http = require('http');
const { 
  runExpiryJob, 
  detectInactiveMembers, 
  sendRenewalReminders 
} = require('../services/membershipService');
const { refreshDailyStats } = require('../services/analyticsService');
const logger = require('./logger');

const initCronJobs = () => {
  logger.info('Initializing Automation Workers (Cron)...');

  // 0. Self-Ping: Keeps Render free tier awake (pings /health every 14 min)
  //    Render injects RENDER_EXTERNAL_URL automatically on all services.
  if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
    const pingUrl = `${process.env.RENDER_EXTERNAL_URL}/health`;
    const client = pingUrl.startsWith('https') ? https : http;

    cron.schedule('*/14 * * * *', () => {
      client.get(pingUrl, (res) => {
        logger.info(`[KeepAlive] Pinged ${pingUrl} → ${res.statusCode}`);
      }).on('error', (err) => {
        logger.warn(`[KeepAlive] Ping failed: ${err.message}`);
      });
    });

    logger.info(`[KeepAlive] Self-ping scheduled every 14 min → ${pingUrl}`);
  }



  // 1. Membership Expiry & State Management (Daily at 00:01)
  cron.schedule('1 0 * * *', async () => {
    logger.info('[Worker] Running membership expiry check...');
    await runExpiryJob();
  });

  // 2. Renewal Reminders (Daily at 09:00)
  // Sends events for members expiring in 3 days
  cron.schedule('0 9 * * *', async () => {
    logger.info('[Worker] Running renewal reminder scan...');
    await sendRenewalReminders();
  });

  // 3. Inactive Member Detection (Daily at 10:00)
  // Alerts gym owner about members who haven't visited in 14 days
  cron.schedule('0 10 * * *', async () => {
    logger.info('[Worker] Running inactive member detection...');
    await detectInactiveMembers();
  });

  // 4. Analytics Snapshot (Every 6 hours)
  // Pre-calculates stats for faster dashboards
  cron.schedule('0 */6 * * *', async () => {
    logger.info('[Worker] Refreshing global analytics cache...');
    await refreshDailyStats();
  });

  // 5. Cleanup Job (Weekly on Sunday)
  // Cleans up expired refresh tokens
  cron.schedule('0 0 * * 0', async () => {
    logger.info('[Worker] Running weekly security cleanup...');
    const db = require('../config/db');
    await db.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
  });

  logger.info('All Background Workers Scheduled.');
};

module.exports = initCronJobs;
