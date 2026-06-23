const db = require('../config/db');
const logger = require('../utils/logger');
const { logOperation, checkUserExists } = require('../services/operationsAuditService');

/**
 * Fetch paginated, searchable, sorted maintenance logs
 */
const getMaintenanceLogs = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    const {
      page = 1,
      limit = 10,
      search = '',
      asset_id = '',
      sortBy = 'service_date',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT m.*, a.asset_name, a.asset_type, u.email as creator_email
      FROM maintenance_logs m
      JOIN equipment_assets a ON m.asset_id = a.id
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.tenant_id = $1
    `;
    const params = [tenantId];
    let paramIndex = 2;

    if (search) {
      query += ` AND (m.description ILIKE $${paramIndex} OR a.asset_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (asset_id) {
      query += ` AND m.asset_id = $${paramIndex}`;
      params.push(asset_id);
      paramIndex++;
    }

    // Sort validation
    const allowedColumns = ['service_date', 'repair_cost', 'asset_name', 'created_at'];
    const finalSortBy = allowedColumns.includes(sortBy) ? sortBy : 'service_date';
    const finalSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    if (finalSortBy === 'asset_name') {
      query += ` ORDER BY a.asset_name ${finalSortOrder}`;
    } else {
      query += ` ORDER BY m.${finalSortBy} ${finalSortOrder}`;
    }

    // Pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    // Count
    let countQuery = `
      SELECT COUNT(*)
      FROM maintenance_logs m
      JOIN equipment_assets a ON m.asset_id = a.id
      WHERE m.tenant_id = $1
    `;
    const countParams = [tenantId];
    let countParamIndex = 2;

    if (search) {
      countQuery += ` AND (m.description ILIKE $${countParamIndex} OR a.asset_name ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (asset_id) {
      countQuery += ` AND m.asset_id = $${countParamIndex}`;
      countParams.push(asset_id);
      countParamIndex++;
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    logger.error('Fetch maintenance logs error:', err);
    next(err);
  }
};

/**
 * Creates a new maintenance log & updates the last_service_date of the equipment asset
 */
const createMaintenanceLog = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    const userId = req.user.id;
    const { asset_id, description, repair_cost = 0, service_date, asset_status } = req.body;

    if (!asset_id || !description || repair_cost === undefined) {
      return res.status(400).json({ error: 'Asset ID, Description, and Repair Cost are required' });
    }

    // Check if user exists in the users table to avoid foreign key violations for branch sessions
    const userExists = await checkUserExists(userId);
    const creatorId = userExists ? userId : null;

    // Handle invoice upload
    const invoice_url = req.file ? `/uploads/${req.file.filename}` : null;
    const sDate = service_date || new Date();

    await db.query('BEGIN');

    // Insert maintenance log
    const result = await db.query(
      `INSERT INTO maintenance_logs
       (tenant_id, asset_id, description, repair_cost, service_date, invoice_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tenantId, asset_id, description, repair_cost, sDate, invoice_url, creatorId]
    );

    const log = result.rows[0];

    // Update the equipment asset's service dates and status
    // If status is passed (e.g. Active/Retired/Maintenance), update it too.
    let updateAssetQuery = `
      UPDATE equipment_assets
      SET last_service_date = $1,
          next_service_date = $1::date + INTERVAL '90 days',
          updated_at = NOW()
    `;
    const updateAssetParams = [sDate];

    if (asset_status) {
      updateAssetQuery += `, status = $2`;
      updateAssetParams.push(asset_status);
    }
    
    updateAssetQuery += ` WHERE id = $${updateAssetParams.length + 1} AND tenant_id = $${updateAssetParams.length + 2}`;
    updateAssetParams.push(asset_id, tenantId);

    await db.query(updateAssetQuery, updateAssetParams);

    await db.query('COMMIT');

    // Audit Log
    await logOperation({
      tenantId,
      userId,
      recordId: log.id,
      entityType: 'MAINTENANCE_LOG',
      action: 'CREATE',
      changes: {
        log,
        assetUpdated: {
          asset_id,
          last_service_date: sDate,
          status: asset_status || 'unchanged'
        }
      }
    });

    res.status(201).json(log);
  } catch (err) {
    await db.query('ROLLBACK');
    logger.error('Create maintenance log error:', err);
    next(err);
  }
};

module.exports = {
  getMaintenanceLogs,
  createMaintenanceLog
};
