const db = require('../config/db');
const logger = require('../utils/logger');
const { logOperation, getDiff } = require('../services/operationsAuditService');

/**
 * Fetch all staff members for the tenant with pagination, search, and filters.
 */
const getStaffMembers = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    const { search = '', role = '', status = '', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM staff_members
      WHERE tenant_id = $1
    `;
    const params = [tenantId];
    let paramIndex = 2;

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR employee_id ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    // Total Count query
    let countQuery = `SELECT COUNT(*) FROM staff_members WHERE tenant_id = $1`;
    const countParams = [tenantId];
    let countParamIndex = 2;

    if (search) {
      countQuery += ` AND (name ILIKE $${countParamIndex} OR employee_id ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex} OR phone ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (role) {
      countQuery += ` AND role = $${countParamIndex}`;
      countParams.push(role);
      countParamIndex++;
    }

    if (status) {
      countQuery += ` AND status = $${countParamIndex}`;
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
    logger.error('Fetch staff members error:', err);
    next(err);
  }
};

/**
 * Fetch a single staff member by ID
 */
const getStaffMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.gym_id;

    const result = await db.query(
      'SELECT * FROM staff_members WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Fetch staff member error:', err);
    next(err);
  }
};

/**
 * Create a new staff member
 */
const createStaffMember = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    const userId = req.user.id;
    const { name, employee_id, role, phone, email, address, joining_date, status, emergency_contact } = req.body;

    if (!name || !employee_id || !role || !phone || !email || !status) {
      return res.status(400).json({ error: 'Name, Employee ID, Role, Phone, Email, and Status are required' });
    }

    // Check unique employee ID for the tenant
    const existing = await db.query(
      'SELECT id FROM staff_members WHERE tenant_id = $1 AND employee_id = $2',
      [tenantId, employee_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: `Employee ID "${employee_id}" already exists in this gym` });
    }

    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await db.query(
      `INSERT INTO staff_members 
       (tenant_id, photo_url, name, employee_id, role, phone, email, address, joining_date, status, emergency_contact)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [tenantId, photo_url, name, employee_id, role, phone, email, address || null, joining_date || new Date(), status, emergency_contact || null]
    );

    const newStaff = result.rows[0];

    // Log operation
    await logOperation({
      tenantId,
      userId,
      recordId: newStaff.id,
      entityType: 'STAFF',
      action: 'CREATE',
      changes: newStaff
    });

    res.status(201).json(newStaff);
  } catch (err) {
    logger.error('Create staff member error:', err);
    next(err);
  }
};

/**
 * Update an existing staff member
 */
const updateStaffMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.gym_id;
    const userId = req.user.id;
    const { name, employee_id, role, phone, email, address, joining_date, status, emergency_contact } = req.body;

    const oldRes = await db.query(
      'SELECT * FROM staff_members WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (oldRes.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const oldStaff = oldRes.rows[0];

    // If employee ID is changing, check uniqueness
    if (employee_id && employee_id !== oldStaff.employee_id) {
      const existing = await db.query(
        'SELECT id FROM staff_members WHERE tenant_id = $1 AND employee_id = $2',
        [tenantId, employee_id]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: `Employee ID "${employee_id}" is already assigned to another staff member` });
      }
    }

    let photo_url = oldStaff.photo_url;
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    const result = await db.query(
      `UPDATE staff_members 
       SET name = COALESCE($1, name),
           employee_id = COALESCE($2, employee_id),
           role = COALESCE($3, role),
           phone = COALESCE($4, phone),
           email = COALESCE($5, email),
           address = COALESCE($6, address),
           joining_date = COALESCE($7, joining_date),
           status = COALESCE($8, status),
           emergency_contact = COALESCE($9, emergency_contact),
           photo_url = COALESCE($10, photo_url),
           updated_at = NOW()
       WHERE id = $11 AND tenant_id = $12 RETURNING *`,
      [name, employee_id, role, phone, email, address, joining_date, status, emergency_contact, photo_url, id, tenantId]
    );

    const updatedStaff = result.rows[0];
    const diff = getDiff(oldStaff, updatedStaff);

    await logOperation({
      tenantId,
      userId,
      recordId: id,
      entityType: 'STAFF',
      action: 'UPDATE',
      changes: diff
    });

    res.json(updatedStaff);
  } catch (err) {
    logger.error('Update staff member error:', err);
    next(err);
  }
};

/**
 * Delete a staff member
 */
const deleteStaffMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.gym_id;
    const userId = req.user.id;

    const oldRes = await db.query(
      'SELECT * FROM staff_members WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (oldRes.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const oldStaff = oldRes.rows[0];

    await db.query('DELETE FROM staff_members WHERE id = $1 AND tenant_id = $2', [id, tenantId]);

    await logOperation({
      tenantId,
      userId,
      recordId: id,
      entityType: 'STAFF',
      action: 'DELETE',
      changes: { deletedRecord: oldStaff }
    });

    res.json({ success: true, message: 'Staff member deleted successfully' });
  } catch (err) {
    logger.error('Delete staff member error:', err);
    next(err);
  }
};

/**
 * Fetch staff attendance logs by filter scope (daily or monthly)
 */
const getStaffAttendance = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    const { date, month } = req.query; // date format: YYYY-MM-DD, month format: YYYY-MM

    let query = `
      SELECT sa.*, s.name as staff_name, s.employee_id, s.role, s.photo_url
      FROM staff_attendance sa
      JOIN staff_members s ON sa.staff_id = s.id
      WHERE sa.tenant_id = $1
    `;
    const params = [tenantId];
    let paramIndex = 2;

    if (date) {
      query += ` AND sa.date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    } else if (month) {
      query += ` AND TO_CHAR(sa.date, 'YYYY-MM') = $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }

    query += ` ORDER BY sa.date DESC, s.name ASC`;
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    logger.error('Fetch staff attendance error:', err);
    next(err);
  }
};

/**
 * Bulk or single upsert of staff attendance logs
 */
const upsertStaffAttendance = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    const userId = req.user.id;
    const { date, records } = req.body; // records: Array of { staff_id, status }

    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Date and an array of staff records are required' });
    }

    const savedRecords = [];

    // Perform upserts in a transaction or sequential queries
    for (const record of records) {
      const { staff_id, status } = record;
      if (!staff_id || !status) continue;

      const result = await db.query(
        `INSERT INTO staff_attendance (tenant_id, staff_id, date, status)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (tenant_id, staff_id, date) 
         DO UPDATE SET status = EXCLUDED.status
         RETURNING *`,
        [tenantId, staff_id, date, status]
      );
      savedRecords.push(result.rows[0]);
    }

    await logOperation({
      tenantId,
      userId,
      recordId: tenantId, // Using tenantId since this is bulk operation
      entityType: 'STAFF_ATTENDANCE',
      action: 'UPDATE',
      changes: { date, count: savedRecords.length }
    });

    res.json({ success: true, count: savedRecords.length, data: savedRecords });
  } catch (err) {
    logger.error('Upsert attendance error:', err);
    next(err);
  }
};

/**
 * Fetch staff payroll sheets for a month
 */
const getStaffPayroll = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    const { month } = req.query; // format: YYYY-MM

    let query = `
      SELECT sp.*, s.name as staff_name, s.employee_id, s.role, s.photo_url
      FROM staff_payroll sp
      JOIN staff_members s ON sp.staff_id = s.id
      WHERE sp.tenant_id = $1
    `;
    const params = [tenantId];

    if (month) {
      query += ` AND sp.month = $2`;
      params.push(month);
    }

    query += ` ORDER BY s.name ASC`;
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    logger.error('Fetch staff payroll error:', err);
    next(err);
  }
};

/**
 * Calculate and record/upsert salary details
 */
const upsertStaffPayroll = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    const userId = req.user.id;
    const { staff_id, month, base_salary, bonus, incentives, deductions, advance_salary, status, payslip_url } = req.body;

    if (!staff_id || !month || base_salary === undefined || !status) {
      return res.status(400).json({ error: 'Staff ID, Month, Base Salary, and Status are required' });
    }

    const net_pay = Math.max(0, 
      parseFloat(base_salary || 0) + 
      parseFloat(bonus || 0) + 
      parseFloat(incentives || 0) - 
      parseFloat(deductions || 0) - 
      parseFloat(advance_salary || 0)
    );

    const result = await db.query(
      `INSERT INTO staff_payroll 
       (tenant_id, staff_id, month, base_salary, bonus, incentives, deductions, advance_salary, net_pay, status, payslip_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (tenant_id, staff_id, month) 
       DO UPDATE SET 
         base_salary = EXCLUDED.base_salary,
         bonus = EXCLUDED.bonus,
         incentives = EXCLUDED.incentives,
         deductions = EXCLUDED.deductions,
         advance_salary = EXCLUDED.advance_salary,
         net_pay = EXCLUDED.net_pay,
         status = EXCLUDED.status,
         payslip_url = COALESCE(EXCLUDED.payslip_url, staff_payroll.payslip_url),
         updated_at = NOW()
       RETURNING *`,
      [tenantId, staff_id, month, base_salary, bonus || 0, incentives || 0, deductions || 0, advance_salary || 0, net_pay, status, payslip_url || null]
    );

    const savedPayroll = result.rows[0];

    await logOperation({
      tenantId,
      userId,
      recordId: savedPayroll.id,
      entityType: 'STAFF_PAYROLL',
      action: 'UPDATE',
      changes: savedPayroll
    });

    res.json(savedPayroll);
  } catch (err) {
    logger.error('Upsert payroll error:', err);
    next(err);
  }
};

/**
 * Fetch trainer performance stats (self-healing: left joins to list all trainers)
 */
const getTrainerPerformance = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;

    const query = `
      SELECT 
        s.id as trainer_id, 
        s.name as trainer_name, 
        s.employee_id, 
        s.photo_url, 
        s.status as staff_status,
        COALESCE(tp.assigned_members_count, 0) as assigned_members_count, 
        COALESCE(tp.retention_rate, 0.0) as retention_rate, 
        COALESCE(tp.renewals_count, 0) as renewals_count, 
        COALESCE(tp.revenue_influenced, 0.0) as revenue_influenced, 
        COALESCE(tp.attendance_percentage, 0.0) as attendance_percentage
      FROM staff_members s
      LEFT JOIN trainer_performance tp ON s.id = tp.trainer_id
      WHERE s.tenant_id = $1 AND s.role = 'Trainer'
      ORDER BY s.name ASC
    `;

    const result = await db.query(query, [tenantId]);
    res.json(result.rows);
  } catch (err) {
    logger.error('Fetch trainer performance error:', err);
    next(err);
  }
};

/**
 * Upsert performance metrics for a trainer
 */
const upsertTrainerPerformance = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    const userId = req.user.id;
    const { trainer_id, assigned_members_count, retention_rate, renewals_count, revenue_influenced, attendance_percentage } = req.body;

    if (!trainer_id) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const result = await db.query(
      `INSERT INTO trainer_performance 
       (tenant_id, trainer_id, assigned_members_count, retention_rate, renewals_count, revenue_influenced, attendance_percentage)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (tenant_id, trainer_id) 
       DO UPDATE SET 
         assigned_members_count = EXCLUDED.assigned_members_count, 
         retention_rate = EXCLUDED.retention_rate, 
         renewals_count = EXCLUDED.renewals_count, 
         revenue_influenced = EXCLUDED.revenue_influenced, 
         attendance_percentage = EXCLUDED.attendance_percentage,
         updated_at = NOW()
       RETURNING *`,
      [tenantId, trainer_id, assigned_members_count || 0, retention_rate || 0, renewals_count || 0, revenue_influenced || 0, attendance_percentage || 0]
    );

    const savedPerformance = result.rows[0];

    await logOperation({
      tenantId,
      userId,
      recordId: savedPerformance.id,
      entityType: 'TRAINER_PERFORMANCE',
      action: 'UPDATE',
      changes: savedPerformance
    });

    res.json(savedPerformance);
  } catch (err) {
    logger.error('Upsert trainer performance error:', err);
    next(err);
  }
};

module.exports = {
  getStaffMembers,
  getStaffMemberById,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
  getStaffAttendance,
  upsertStaffAttendance,
  getStaffPayroll,
  upsertStaffPayroll,
  getTrainerPerformance,
  upsertTrainerPerformance
};
