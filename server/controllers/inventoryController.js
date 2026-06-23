const db = require('../config/db');
const logger = require('../utils/logger');
const { logOperation, getDiff, checkUserExists } = require('../services/operationsAuditService');

/**
 * Utility to calculate status based on quantity and minimum stock
 */
const getItemStatus = (quantity, minStock) => {
  const qty = parseInt(quantity || 0);
  const min = parseInt(minStock || 0);
  if (qty === 0) return 'Out of Stock';
  if (qty <= min) return 'Low Stock';
  return 'In Stock';
};

/**
 * Fetch paginated, searchable, and filtered inventory items
 */
const getInventory = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      status = '',
      sortBy = 'item_name',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT i.*,
        (SELECT COUNT(*) FROM inventory_transactions t WHERE t.item_id = i.id) as transaction_count
      FROM inventory_items i
      WHERE i.tenant_id = $1
    `;
    const params = [tenantId];
    let paramIndex = 2;

    if (search) {
      query += ` AND (i.item_name ILIKE $${paramIndex} OR i.sku ILIKE $${paramIndex} OR i.category ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      query += ` AND i.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (status) {
      query += ` AND i.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Sort verification
    const allowedColumns = ['item_name', 'sku', 'category', 'quantity', 'unit_cost', 'selling_price', 'status'];
    const finalSortBy = allowedColumns.includes(sortBy) ? sortBy : 'item_name';
    const finalSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    query += ` ORDER BY i.${finalSortBy} ${finalSortOrder}`;

    // Pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    // Count
    let countQuery = 'SELECT COUNT(*) FROM inventory_items i WHERE i.tenant_id = $1';
    const countParams = [tenantId];
    let countParamIndex = 2;

    if (search) {
      countQuery += ` AND (i.item_name ILIKE $${countParamIndex} OR i.sku ILIKE $${countParamIndex} OR i.category ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (category) {
      countQuery += ` AND i.category = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }

    if (status) {
      countQuery += ` AND i.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Calculate overall KPIs
    const kpisResult = await db.query(`
      SELECT 
        COUNT(*) as total_items,
        COALESCE(SUM(CASE WHEN status = 'Low Stock' THEN 1 ELSE 0 END), 0) as low_stock,
        COALESCE(SUM(CASE WHEN status = 'Out of Stock' THEN 1 ELSE 0 END), 0) as out_of_stock,
        COALESCE(SUM(quantity * unit_cost), 0) as inventory_value
      FROM inventory_items
      WHERE tenant_id = $1
    `, [tenantId]);

    res.json({
      data: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      dashboard: kpisResult.rows[0]
    });
  } catch (err) {
    logger.error('Fetch inventory error:', err);
    next(err);
  }
};

/**
 * Creates a new inventory item
 */
const createInventoryItem = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    const userId = req.user.id;
    const { item_name, sku, category, quantity = 0, unit_cost = 0, selling_price = 0, minimum_stock = 0 } = req.body;

    if (!item_name || !category) {
      return res.status(400).json({ error: 'Item Name and Category are required' });
    }

    // Check if user exists in the users table to avoid foreign key violations for branch sessions
    const userExists = await checkUserExists(userId);
    const creatorId = userExists ? userId : null;

    const status = getItemStatus(quantity, minimum_stock);

    await db.query('BEGIN');

    const result = await db.query(
      `INSERT INTO inventory_items 
       (tenant_id, item_name, sku, category, quantity, unit_cost, selling_price, minimum_stock, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [tenantId, item_name, sku || null, category, quantity, unit_cost, selling_price, minimum_stock, status]
    );

    const newItem = result.rows[0];

    // Seed transaction for initial stock if quantity > 0
    if (parseInt(quantity) > 0) {
      await db.query(
        `INSERT INTO inventory_transactions (tenant_id, item_id, type, quantity, notes, created_by)
         VALUES ($1, $2, 'IN', $3, 'Initial stock entry', $4)`,
        [tenantId, newItem.id, quantity, creatorId]
      );
    }

    await db.query('COMMIT');

    // Audit Log
    await logOperation({
      tenantId,
      userId,
      recordId: newItem.id,
      entityType: 'INVENTORY_ITEM',
      action: 'CREATE',
      changes: newItem
    });

    res.status(201).json(newItem);
  } catch (err) {
    await db.query('ROLLBACK');
    logger.error('Create inventory item error:', err);
    next(err);
  }
};

/**
 * Updates an inventory item
 */
const updateInventoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.gym_id;
    const userId = req.user.id;
    const { item_name, sku, category, unit_cost, selling_price, minimum_stock } = req.body;

    await db.query('BEGIN');

    // Fetch old state
    const oldRes = await db.query(
      'SELECT * FROM inventory_items WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (oldRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const oldItem = oldRes.rows[0];

    // Recompute status in case minimum_stock changed
    const newMinStock = minimum_stock !== undefined ? minimum_stock : oldItem.minimum_stock;
    const status = getItemStatus(oldItem.quantity, newMinStock);

    const result = await db.query(
      `UPDATE inventory_items
       SET item_name = COALESCE($1, item_name),
           sku = COALESCE($2, sku),
           category = COALESCE($3, category),
           unit_cost = COALESCE($4, unit_cost),
           selling_price = COALESCE($5, selling_price),
           minimum_stock = COALESCE($6, minimum_stock),
           status = $7,
           updated_at = NOW()
       WHERE id = $8 AND tenant_id = $9 RETURNING *`,
      [item_name, sku, category, unit_cost, selling_price, minimum_stock, status, id, tenantId]
    );

    const updatedItem = result.rows[0];
    const diff = getDiff(oldItem, updatedItem);

    await db.query('COMMIT');

    // Audit Log
    await logOperation({
      tenantId,
      userId,
      recordId: id,
      entityType: 'INVENTORY_ITEM',
      action: 'UPDATE',
      changes: diff
    });

    res.json(updatedItem);
  } catch (err) {
    await db.query('ROLLBACK');
    logger.error('Update inventory item error:', err);
    next(err);
  }
};

/**
 * Deletes an inventory item
 */
const deleteInventoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.gym_id;
    const userId = req.user.id;

    // Fetch item
    const oldRes = await db.query(
      'SELECT * FROM inventory_items WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (oldRes.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const oldItem = oldRes.rows[0];

    await db.query('DELETE FROM inventory_items WHERE id = $1 AND tenant_id = $2', [id, tenantId]);

    // Audit Log
    await logOperation({
      tenantId,
      userId,
      recordId: id,
      entityType: 'INVENTORY_ITEM',
      action: 'DELETE',
      changes: { deletedRecord: oldItem }
    });

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    logger.error('Delete inventory item error:', err);
    next(err);
  }
};

/**
 * Performs stock adjustment transaction (IN, OUT, ADJUSTMENT)
 */
const adjustStock = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    const userId = req.user.id;
    const { item_id, type, quantity, notes } = req.body; // type: IN, OUT, ADJUSTMENT

    if (!item_id || !type || quantity === undefined) {
      return res.status(400).json({ error: 'item_id, type, and quantity are required' });
    }

    if (!['IN', 'OUT', 'ADJUSTMENT'].includes(type)) {
      return res.status(400).json({ error: 'Invalid transaction type. Must be IN, OUT, or ADJUSTMENT' });
    }

    // Check if user exists in the users table to avoid foreign key violations for branch sessions
    const userExists = await checkUserExists(userId);
    const creatorId = userExists ? userId : null;

    await db.query('BEGIN');

    // Fetch item
    const itemRes = await db.query(
      'SELECT * FROM inventory_items WHERE id = $1 AND tenant_id = $2 FOR UPDATE',
      [item_id, tenantId]
    );

    if (itemRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const item = itemRes.rows[0];

    // Compute new quantity
    let newQuantity = parseInt(item.quantity);
    const adjQty = parseInt(quantity);

    if (type === 'IN') {
      newQuantity += adjQty;
    } else if (type === 'OUT') {
      if (newQuantity < adjQty) {
        await db.query('ROLLBACK');
        return res.status(400).json({ error: `Insufficient stock. Current: ${newQuantity}, Requested: ${adjQty}` });
      }
      newQuantity -= adjQty;
    } else if (type === 'ADJUSTMENT') {
      newQuantity = adjQty;
    }

    if (newQuantity < 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'Stock quantity cannot be negative' });
    }

    const newStatus = getItemStatus(newQuantity, item.minimum_stock);

    // Update item
    await db.query(
      'UPDATE inventory_items SET quantity = $1, status = $2, updated_at = NOW() WHERE id = $3',
      [newQuantity, newStatus, item_id]
    );

    // Record transaction
    const transResult = await db.query(
      `INSERT INTO inventory_transactions (tenant_id, item_id, type, quantity, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tenantId, item_id, type, quantity, notes || null, creatorId]
    );

    await db.query('COMMIT');

    // Audit Log
    await logOperation({
      tenantId,
      userId,
      recordId: item_id,
      entityType: 'INVENTORY_ITEM',
      action: 'STOCK_ADJUSTMENT',
      changes: {
        transaction: transResult.rows[0],
        quantity: { old: item.quantity, new: newQuantity },
        status: { old: item.status, new: newStatus }
      }
    });

    res.status(201).json({
      success: true,
      transaction: transResult.rows[0],
      updatedQuantity: newQuantity,
      updatedStatus: newStatus
    });
  } catch (err) {
    await db.query('ROLLBACK');
    logger.error('Stock adjustment error:', err);
    next(err);
  }
};

/**
 * Fetch transaction history for a specific inventory item or overall
 */
const getInventoryHistory = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    const { item_id, limit = 50 } = req.query;

    let query = `
      SELECT t.*, i.item_name, i.sku, u.email as creator_email
      FROM inventory_transactions t
      JOIN inventory_items i ON t.item_id = i.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.tenant_id = $1
    `;
    const params = [tenantId];

    if (item_id) {
      query += ' AND t.item_id = $2';
      params.push(item_id);
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    logger.error('Fetch inventory history error:', err);
    next(err);
  }
};

module.exports = {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustStock,
  getInventoryHistory
};
