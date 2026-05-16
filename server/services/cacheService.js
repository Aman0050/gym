const redis = require('../config/redis');
const logger = require('../utils/logger');

const CACHE_TTL = {
  SHORT: 300,    // 5 mins
  MEDIUM: 3600,  // 1 hour
  LONG: 86400    // 1 day
};

const cacheDashboard = async (gymId, data) => {
  try {
    if (redis.status !== 'ready') return;
    const key = `dashboard:${gymId}`;
    await redis.set(key, JSON.stringify(data), 'EX', CACHE_TTL.SHORT);
  } catch (err) {
    logger.error('Redis cache error:', err);
  }
};

const getCachedDashboard = async (gymId) => {
  try {
    if (redis.status !== 'ready') return null;
    const key = `dashboard:${gymId}`;
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    logger.error('Redis read error:', err);
    return null;
  }
};

const invalidateDashboard = async (gymId) => {
  try {
    if (redis.status !== 'ready') return;
    const key = `dashboard:${gymId}`;
    await redis.del(key);
  } catch (err) {
    logger.error('Redis delete error:', err);
  }
};

/**
 * Generic multi-tenant cache GET
 */
const get = async (gymId, namespace) => {
  try {
    if (redis.status !== 'ready') return null;
    const key = `cache:${gymId}:${namespace}`;
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    logger.error('Generic cache read error:', err);
    return null;
  }
};

/**
 * Generic multi-tenant cache SET
 */
const set = async (gymId, namespace, data, ttl = CACHE_TTL.MEDIUM) => {
  try {
    if (redis.status !== 'ready') return;
    const key = `cache:${gymId}:${namespace}`;
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (err) {
    logger.error('Generic cache write error:', err);
  }
};

module.exports = {
  CACHE_TTL,
  cacheDashboard,
  getCachedDashboard,
  invalidateDashboard,
  get,
  set
};
