const db = require('../config/db');
const logger = require('../utils/logger');
const { logOperation, getDiff, checkUserExists } = require('../services/operationsAuditService');

// Default expense categories
const DEFAULT_CATEGORIES = [
  { name: 'Utilities', description: 'Electricity, water, internet, and other bills' },
  { name: 'Salary', description: 'Staff and trainer salaries' },
  { name: 'Equipment', description: 'Purchases of fitness machinery and tools' },
  { name: 'Inventory', description: 'Retail products, supplements, proteins, bottles' },
  { name: 'Maintenance', description: 'Repairs, cleaning supplies, servicing costs' },
  { name: 'Marketing', description: 'Advertisements, flyers, digital campaigns' },
  { name: 'Rent', description: 'Monthly venue lease/rental payments' },
  { name: 'Other', description: 'Miscellaneous operational expenses' }
];

/**
 * Self-healing categories loader. If the gym has 0 categories, seeds defaults.
 */
const getExpenseCategories = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    
    // Fetch categories
    let result = await db.query(
      'SELECT * FROM expense_categories WHERE tenant_id = $1 ORDER BY name ASC',
      [tenantId]
    );

    // Seed defaults if empty
    if (result.rows.length === 0) {
      logger.info(`Seeding default expense categories for tenant: ${tenantId}`);
      
      const insertPromises = DEFAULT_CATEGORIES.map(cat => 
        db.query(
          'INSERT INTO expense_categories (tenant_id, name, description) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [tenantId, cat.name, cat.description]
        )
      );
      await Promise.all(insertPromises);

      // Re-fetch
      result = await db.query(
        'SELECT * FROM expense_categories WHERE tenant_id = $1 ORDER BY name ASC',
        [tenantId]
      );
    }

    res.json(result.rows);
  } catch (err) {
    logger.error('Fetch categories error:', err);
    next(err);
  }
};

/**
 * Fetches paginated, searchable, sorted, and filtered expenses
 */
const getExpenses = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      status = '',
      payment_method = '',
      startDate = '',
      endDate = '',
      sortBy = 'expense_date',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT e.*, c.name as category_name, u.email as creator_email
      FROM expenses e
      JOIN expense_categories c ON e.category_id = c.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.tenant_id = $1
    `;
    const params = [tenantId];
    let paramIndex = 2;

    if (search) {
      query += ` AND (e.title ILIKE $${paramIndex} OR e.expense_number ILIKE $${paramIndex} OR e.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      query += ` AND e.category_id = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (status) {
      query += ` AND e.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (payment_method) {
      query += ` AND e.payment_method = $${paramIndex}`;
      params.push(payment_method);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND e.expense_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND e.expense_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    // Sort column validation to protect against SQL Injection
    const allowedColumns = ['expense_date', 'amount', 'title', 'status', 'expense_number'];
    const finalSortBy = allowedColumns.includes(sortBy) ? sortBy : 'expense_date';
    const finalSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY e.${finalSortBy} ${finalSortOrder}`;

    // Pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    // Count query
    let countQuery = `
      SELECT COUNT(*) 
      FROM expenses e
      WHERE e.tenant_id = $1
    `;
    const countParams = [tenantId];
    let countParamIndex = 2;

    if (search) {
      countQuery += ` AND (e.title ILIKE $${countParamIndex} OR e.expense_number ILIKE $${countParamIndex} OR e.description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (category) {
      countQuery += ` AND e.category_id = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }

    if (status) {
      countQuery += ` AND e.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (payment_method) {
      countQuery += ` AND e.payment_method = $${countParamIndex}`;
      countParams.push(payment_method);
      countParamIndex++;
    }

    if (startDate) {
      countQuery += ` AND e.expense_date >= $${countParamIndex}`;
      countParams.push(startDate);
      countParamIndex++;
    }

    if (endDate) {
      countQuery += ` AND e.expense_date <= $${countParamIndex}`;
      countParams.push(endDate);
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
    logger.error('Fetch expenses error:', err);
    next(err);
  }
};

/**
 * Fetches a single expense
 */
const getExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.gym_id;

    const result = await db.query(
      `SELECT e.*, c.name as category_name, u.email as creator_email
       FROM expenses e
       JOIN expense_categories c ON e.category_id = c.id
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = $1 AND e.tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Fetch expense error:', err);
    next(err);
  }
};

/**
 * Creates a new expense
 */
const createExpense = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    const userId = req.user.id;
    const { title, description, category_id, amount, expense_date, payment_method, status } = req.body;

    if (!title || !category_id || amount === undefined || !payment_method || !status) {
      return res.status(400).json({ error: 'Title, Category, Amount, Payment Method, and Status are required' });
    }

    // Check if user exists in the users table to avoid foreign key violations for branch sessions
    const userExists = await checkUserExists(userId);
    const creatorId = userExists ? userId : null;

    // Auto-generate expense_number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const expense_number = `EXP-${dateStr}-${randomSuffix}`;

    // Handle invoice file path
    const invoice_url = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await db.query(
      `INSERT INTO expenses 
       (tenant_id, expense_number, title, description, category_id, amount, expense_date, payment_method, invoice_url, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [tenantId, expense_number, title, description || null, category_id, amount, expense_date || new Date(), payment_method, invoice_url, status, creatorId]
    );

    const newExpense = result.rows[0];

    // Log operational audit
    await logOperation({
      tenantId,
      userId,
      recordId: newExpense.id,
      entityType: 'EXPENSE',
      action: 'CREATE',
      changes: newExpense
    });

    res.status(201).json(newExpense);
  } catch (err) {
    logger.error('Create expense error:', err);
    next(err);
  }
};

/**
 * Updates an expense
 */
const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.gym_id;
    const userId = req.user.id;
    const { title, description, category_id, amount, expense_date, payment_method, status } = req.body;

    // Fetch old record
    const oldRes = await db.query(
      'SELECT * FROM expenses WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (oldRes.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const oldExpense = oldRes.rows[0];

    // Invoice file handler
    let invoice_url = oldExpense.invoice_url;
    if (req.file) {
      invoice_url = `/uploads/${req.file.filename}`;
    }

    const result = await db.query(
      `UPDATE expenses 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           category_id = COALESCE($3, category_id),
           amount = COALESCE($4, amount),
           expense_date = COALESCE($5, expense_date),
           payment_method = COALESCE($6, payment_method),
           invoice_url = COALESCE($7, invoice_url),
           status = COALESCE($8, status),
           updated_at = NOW()
       WHERE id = $9 AND tenant_id = $10 RETURNING *`,
      [title, description, category_id, amount, expense_date, payment_method, invoice_url, status, id, tenantId]
    );

    const updatedExpense = result.rows[0];
    const diff = getDiff(oldExpense, updatedExpense);

    // Log operational audit
    await logOperation({
      tenantId,
      userId,
      recordId: id,
      entityType: 'EXPENSE',
      action: 'UPDATE',
      changes: diff
    });

    res.json(updatedExpense);
  } catch (err) {
    logger.error('Update expense error:', err);
    next(err);
  }
};

/**
 * Deletes an expense
 */
const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.gym_id;
    const userId = req.user.id;

    // Fetch old record
    const oldRes = await db.query(
      'SELECT * FROM expenses WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (oldRes.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const oldExpense = oldRes.rows[0];

    await db.query('DELETE FROM expenses WHERE id = $1 AND tenant_id = $2', [id, tenantId]);

    // Log operational audit
    await logOperation({
      tenantId,
      userId,
      recordId: id,
      entityType: 'EXPENSE',
      action: 'DELETE',
      changes: { deletedRecord: oldExpense }
    });

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    logger.error('Delete expense error:', err);
    next(err);
  }
};

module.exports = {
  getExpenseCategories,
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
};
