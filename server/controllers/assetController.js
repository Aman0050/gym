const db = require('../config/db');
const logger = require('../utils/logger');
const { logOperation, getDiff } = require('../services/operationsAuditService');

/**
 * Fetch paginated, searchable, sorted, and filtered equipment assets
 */
const getAssets = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    const {
      page = 1,
      limit = 10,
      search = '',
      type = '',
      status = '',
      sortBy = 'asset_name',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT a.*,
        (SELECT COUNT(*) FROM maintenance_logs m WHERE m.asset_id = a.id) as maintenance_count,
        (SELECT COALESCE(SUM(repair_cost), 0) FROM maintenance_logs m WHERE m.asset_id = a.id) as total_maintenance_cost
      FROM equipment_assets a
      WHERE a.tenant_id = $1
    `;
    const params = [tenantId];
    let paramIndex = 2;

    if (search) {
      query += ` AND (a.asset_name ILIKE $${paramIndex} OR a.asset_type ILIKE $${paramIndex} OR a.notes ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (type) {
      query += ` AND a.asset_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Sort validation
    const allowedColumns = ['asset_name', 'asset_type', 'purchase_date', 'purchase_cost', 'warranty_expiry', 'last_service_date', 'next_service_date', 'status'];
    const finalSortBy = allowedColumns.includes(sortBy) ? sortBy : 'asset_name';
    const finalSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    query += ` ORDER BY a.${finalSortBy} ${finalSortOrder}`;

    // Pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    // Count
    let countQuery = 'SELECT COUNT(*) FROM equipment_assets a WHERE a.tenant_id = $1';
    const countParams = [tenantId];
    let countParamIndex = 2;

    if (search) {
      countQuery += ` AND (a.asset_name ILIKE $${countParamIndex} OR a.asset_type ILIKE $${countParamIndex} OR a.notes ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (type) {
      countQuery += ` AND a.asset_type = $${countParamIndex}`;
      countParams.push(type);
      countParamIndex++;
    }

    if (status) {
      countQuery += ` AND a.status = $${countParamIndex}`;
      countParams.push(status);
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
    logger.error('Fetch assets error:', err);
    next(err);
  }
};

/**
 * Creates a new equipment asset
 */
const createAsset = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    const userId = req.user.id;
    const { asset_name, asset_type, purchase_date, purchase_cost, warranty_expiry, last_service_date, next_service_date, status, notes } = req.body;

    if (!asset_name || !asset_type || purchase_cost === undefined || !status) {
      return res.status(400).json({ error: 'Asset Name, Asset Type, Purchase Cost, and Status are required' });
    }

    const result = await db.query(
      `INSERT INTO equipment_assets 
       (tenant_id, asset_name, asset_type, purchase_date, purchase_cost, warranty_expiry, last_service_date, next_service_date, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [tenantId, asset_name, asset_type, purchase_date || new Date(), purchase_cost, warranty_expiry || null, last_service_date || null, next_service_date || null, status, notes || null]
    );

    const newAsset = result.rows[0];

    // Audit Log
    await logOperation({
      tenantId,
      userId,
      recordId: newAsset.id,
      entityType: 'EQUIPMENT_ASSET',
      action: 'CREATE',
      changes: newAsset
    });

    res.status(201).json(newAsset);
  } catch (err) {
    logger.error('Create asset error:', err);
    next(err);
  }
};

/**
 * Updates an asset
 */
const updateAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.gym_id;
    const userId = req.user.id;
    const { asset_name, asset_type, purchase_date, purchase_cost, warranty_expiry, last_service_date, next_service_date, status, notes } = req.body;

    // Fetch old record
    const oldRes = await db.query(
      'SELECT * FROM equipment_assets WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (oldRes.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment asset not found' });
    }

    const oldAsset = oldRes.rows[0];

    const result = await db.query(
      `UPDATE equipment_assets
       SET asset_name = COALESCE($1, asset_name),
           asset_type = COALESCE($2, asset_type),
           purchase_date = COALESCE($3, purchase_date),
           purchase_cost = COALESCE($4, purchase_cost),
           warranty_expiry = COALESCE($5, warranty_expiry),
           last_service_date = COALESCE($6, last_service_date),
           next_service_date = COALESCE($7, next_service_date),
           status = COALESCE($8, status),
           notes = COALESCE($9, notes),
           updated_at = NOW()
       WHERE id = $10 AND tenant_id = $11 RETURNING *`,
      [asset_name, asset_type, purchase_date, purchase_cost, warranty_expiry, last_service_date, next_service_date, status, notes, id, tenantId]
    );

    const updatedAsset = result.rows[0];
    const diff = getDiff(oldAsset, updatedAsset);

    // Audit Log
    await logOperation({
      tenantId,
      userId,
      recordId: id,
      entityType: 'EQUIPMENT_ASSET',
      action: 'UPDATE',
      changes: diff
    });

    res.json(updatedAsset);
  } catch (err) {
    logger.error('Update asset error:', err);
    next(err);
  }
};

/**
 * Deletes an asset
 */
const deleteAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.gym_id;
    const userId = req.user.id;

    // Fetch asset
    const oldRes = await db.query(
      'SELECT * FROM equipment_assets WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (oldRes.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment asset not found' });
    }

    const oldAsset = oldRes.rows[0];

    await db.query('DELETE FROM equipment_assets WHERE id = $1 AND tenant_id = $2', [id, tenantId]);

    // Audit Log
    await logOperation({
      tenantId,
      userId,
      recordId: id,
      entityType: 'EQUIPMENT_ASSET',
      action: 'DELETE',
      changes: { deletedRecord: oldAsset }
    });

    res.json({ success: true, message: 'Asset deleted successfully' });
  } catch (err) {
    logger.error('Delete asset error:', err);
    next(err);
  }
};

module.exports = {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset
};
