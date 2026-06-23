const db = require('../config/db');
const logger = require('../utils/logger');
const ExcelJS = require('exceljs');

/**
 * Utility to write solid color fills in ExcelJS
 */
const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

const COLORS = {
  headerBg: 'FF1C1C1C',
  headerFg: 'FFFAFAFA',
  metaBg: 'FF111111',
  metaFg: 'FFE5E5E5',
  metaLabelFg: 'FF9CA3AF',
  accentBg: 'FF8B4513',
  altRowBg: 'FFF7F7F7',
  whiteBg: 'FFFFFFFF',
  borderColor: 'FFE5E7EB'
};

/**
 * Profit analytics calculation endpoint
 */
const getProfitAnalytics = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;

    // 1. Fetch Monthly Trends (Last 6 Months)
    const trendQuery = `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
          date_trunc('month', CURRENT_DATE),
          '1 month'::interval
        )::date AS m
      )
      SELECT 
        TO_CHAR(months.m, 'Mon YYYY') as month_label,
        months.m as month_date,
        (
          SELECT COALESCE(SUM(p.amount), 0)::numeric
          FROM payments p 
          WHERE p.gym_id = $1 
            AND p.payment_date >= months.m 
            AND p.payment_date < months.m + interval '1 month'
            AND (p.payment_status IS NULL OR p.payment_status = 'PAID')
        ) as revenue,
        (
          SELECT COALESCE(SUM(e.amount), 0)::numeric
          FROM expenses e 
          WHERE e.tenant_id = $1 
            AND e.expense_date >= months.m 
            AND e.expense_date < months.m + interval '1 month'
            AND e.status = 'Paid'
        ) as expenses
      FROM months
      ORDER BY months.m ASC
    `;
    const trendRes = await db.query(trendQuery, [tenantId]);
    const trends = trendRes.rows.map(row => {
      const rev = parseFloat(row.revenue);
      const exp = parseFloat(row.expenses);
      return {
        month: row.month_label,
        revenue: rev,
        expenses: exp,
        profit: rev - exp
      };
    });

    // 2. Fetch Category Breakdown (This Month)
    const breakdownQuery = `
      SELECT 
        c.name as category_name, 
        COALESCE(SUM(e.amount), 0)::numeric as total_amount
      FROM expense_categories c
      LEFT JOIN expenses e ON e.category_id = c.id 
        AND e.tenant_id = $1 
        AND e.status = 'Paid'
        AND e.expense_date >= date_trunc('month', CURRENT_DATE)
        AND e.expense_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
      WHERE c.tenant_id = $1
      GROUP BY c.id, c.name
      ORDER BY total_amount DESC
    `;
    const breakdownRes = await db.query(breakdownQuery, [tenantId]);
    const categoryBreakdown = breakdownRes.rows.map(r => ({
      category: r.category_name,
      amount: parseFloat(r.total_amount)
    }));

    // 3. Fetch KPI Summaries
    const kpisQuery = `
      SELECT
        -- Revenue (This Month)
        (
          SELECT COALESCE(SUM(amount), 0)::numeric 
          FROM payments 
          WHERE gym_id = $1 
            AND payment_date >= date_trunc('month', CURRENT_DATE)
            AND payment_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
            AND (payment_status IS NULL OR payment_status = 'PAID')
        ) as current_month_revenue,
        -- Expenses (This Month)
        (
          SELECT COALESCE(SUM(amount), 0)::numeric 
          FROM expenses 
          WHERE tenant_id = $1 
            AND expense_date >= date_trunc('month', CURRENT_DATE)
            AND expense_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
            AND status = 'Paid'
        ) as current_month_expenses,
        -- Pending Expenses
        (
          SELECT COALESCE(SUM(amount), 0)::numeric 
          FROM expenses 
          WHERE tenant_id = $1 AND status = 'Pending'
        ) as pending_expenses,
        -- Total Expenses All Time
        (
          SELECT COALESCE(SUM(amount), 0)::numeric 
          FROM expenses 
          WHERE tenant_id = $1 AND status = 'Paid'
        ) as total_expenses_all_time
    `;
    const kpisRes = await db.query(kpisQuery, [tenantId]);
    const kpisRaw = kpisRes.rows[0];

    const currentRevenue = parseFloat(kpisRaw.current_month_revenue);
    const currentExpenses = parseFloat(kpisRaw.current_month_expenses);

    // Get top category
    const topCategory = categoryBreakdown.length > 0 && categoryBreakdown[0].amount > 0 
      ? categoryBreakdown[0].category 
      : 'None';

    res.json({
      kpis: {
        totalExpensesAllTime: parseFloat(kpisRaw.total_expenses_all_time),
        currentMonthRevenue: currentRevenue,
        currentMonthExpenses: currentExpenses,
        currentMonthProfit: currentRevenue - currentExpenses,
        pendingExpenses: parseFloat(kpisRaw.pending_expenses),
        topCategory
      },
      trends,
      categoryBreakdown
    });
  } catch (err) {
    logger.error('Profit analytics dashboard error:', err);
    next(err);
  }
};

/**
 * Fetch Operations Hub Audit Logs
 */
const getOperationsAuditLogs = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    const { entity_type, action, limit = 50 } = req.query;

    let query = `
      SELECT o.*, u.email as creator_email
      FROM operations_audit_logs o
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.tenant_id = $1
    `;
    const params = [tenantId];
    let paramIndex = 2;

    if (entity_type) {
      query += ` AND o.entity_type = $${paramIndex}`;
      params.push(entity_type);
      paramIndex++;
    }

    if (action) {
      query += ` AND o.action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    logger.error('Fetch operations audit error:', err);
    next(err);
  }
};

/**
 * Export Operations Hub Data to Excel or CSV
 */
const exportOperationsData = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    const { section, format = 'csv' } = req.query; // section: expenses, inventory, assets, maintenance

    if (!['expenses', 'inventory', 'assets', 'maintenance', 'staff', 'payroll'].includes(section)) {
      return res.status(400).json({ error: 'Invalid section name for export' });
    }

    // 1. Fetch Gym details for metadata header
    const gymRes = await db.query('SELECT name FROM gyms WHERE id = $1', [tenantId]);
    const gymName = gymRes.rows[0]?.name || 'FitXeno';

    // 2. Fetch specific records
    let rows = [];
    let headers = [];
    let sheetName = '';

    if (section === 'expenses') {
      const result = await db.query(
        `SELECT e.expense_number, e.title, c.name as category, e.amount, e.expense_date, e.payment_method, e.status
         FROM expenses e
         JOIN expense_categories c ON e.category_id = c.id
         WHERE e.tenant_id = $1 ORDER BY e.expense_date DESC`,
        [tenantId]
      );
      rows = result.rows;
      headers = ['Expense No', 'Title', 'Category', 'Amount', 'Date', 'Payment Method', 'Status'];
      sheetName = 'Expenses Report';
    } else if (section === 'inventory') {
      const result = await db.query(
        `SELECT item_name, sku, category, quantity, unit_cost, selling_price, minimum_stock, status
         FROM inventory_items
         WHERE tenant_id = $1 ORDER BY item_name ASC`,
        [tenantId]
      );
      rows = result.rows;
      headers = ['Item Name', 'SKU', 'Category', 'Quantity', 'Unit Cost', 'Selling Price', 'Min Stock', 'Status'];
      sheetName = 'Inventory Report';
    } else if (section === 'assets') {
      const result = await db.query(
        `SELECT asset_name, asset_type, purchase_date, purchase_cost, warranty_expiry, last_service_date, next_service_date, status
         FROM equipment_assets
         WHERE tenant_id = $1 ORDER BY asset_name ASC`,
        [tenantId]
      );
      rows = result.rows;
      headers = ['Asset Name', 'Asset Type', 'Purchase Date', 'Purchase Cost', 'Warranty Expiry', 'Last Service Date', 'Next Service Date', 'Status'];
      sheetName = 'Assets Report';
    } else if (section === 'maintenance') {
      const result = await db.query(
        `SELECT a.asset_name, m.description, m.repair_cost, m.service_date, m.created_at
         FROM maintenance_logs m
         JOIN equipment_assets a ON m.asset_id = a.id
         WHERE m.tenant_id = $1 ORDER BY m.service_date DESC`,
        [tenantId]
      );
      rows = result.rows;
      headers = ['Asset Name', 'Description', 'Repair Cost', 'Service Date', 'Logged At'];
      sheetName = 'Maintenance Report';
    } else if (section === 'staff') {
      const result = await db.query(
        `SELECT name, employee_id, role, phone, email, joining_date, status, emergency_contact
         FROM staff_members
         WHERE tenant_id = $1 ORDER BY name ASC`,
        [tenantId]
      );
      rows = result.rows;
      headers = ['Name', 'Employee ID', 'Role', 'Phone', 'Email', 'Joining Date', 'Status', 'Emergency Contact'];
      sheetName = 'Staff Directory Report';
    } else if (section === 'payroll') {
      const result = await db.query(
        `SELECT s.name as staff_name, s.employee_id, sp.month, sp.base_salary, sp.bonus, sp.incentives, sp.deductions, sp.advance_salary, sp.net_pay, sp.status
         FROM staff_payroll sp
         JOIN staff_members s ON sp.staff_id = s.id
         WHERE sp.tenant_id = $1 ORDER BY sp.month DESC, s.name ASC`,
        [tenantId]
      );
      rows = result.rows;
      headers = ['Staff Name', 'Employee ID', 'Month', 'Base Salary', 'Bonus', 'Incentives', 'Deductions', 'Advance Salary', 'Net Pay', 'Status'];
      sheetName = 'Staff Payroll Report';
    }

    const filename = `${gymName.replace(/\s+/g, '_')}_${section}_${new Date().toISOString().split('T')[0]}.${format}`;

    // 3. Output Format Builder
    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'FitXeno OS';
      workbook.company = gymName;
      workbook.created = new Date();

      const sheet = workbook.addWorksheet(sheetName, {
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true }
      });

      // Title Banner
      sheet.addRow([`${gymName.toUpperCase()}  ·  ${sheetName.toUpperCase()}`]);
      sheet.mergeCells(1, 1, 1, headers.length);
      const titleCell = sheet.getCell('A1');
      titleCell.fill = fill(COLORS.titleBg || 'FF0A0A0A');
      titleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(1).height = 36;

      // Metadata Rows
      const metadata = [
        ['Generated On', new Date().toLocaleString('en-IN')],
        ['Total Records', String(rows.length)]
      ];

      metadata.forEach(([label, val]) => {
        const r = sheet.addRow([label, val]);
        r.height = 20;
        r.getCell(1).font = { bold: true, size: 10, color: { argb: COLORS.metaLabelFg }, name: 'Calibri' };
        r.getCell(1).fill = fill(COLORS.metaBg);
        r.getCell(2).font = { bold: true, size: 10, color: { argb: COLORS.metaFg }, name: 'Calibri' };
        r.getCell(2).fill = fill(COLORS.metaBg);

        for (let c = 3; c <= headers.length; c++) {
          r.getCell(c).fill = fill(COLORS.metaBg);
        }
      });

      // Accent Spacer
      const spacer = sheet.addRow([]);
      spacer.height = 8;
      for (let c = 1; c <= headers.length; c++) {
        sheet.getCell(spacer.number, c).fill = fill(COLORS.accentBg);
      }

      // Column Headers
      const headerRow = sheet.addRow(headers);
      headerRow.height = 28;
      headerRow.eachCell((cell) => {
        cell.fill = fill(COLORS.headerBg);
        cell.font = { bold: true, size: 10, color: { argb: COLORS.headerFg }, name: 'Calibri' };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { bottom: { style: 'medium', color: { argb: COLORS.accentBg } } };
      });

      // Data Rows
      rows.forEach((row, idx) => {
        const dataValues = Object.values(row);
        const r = sheet.addRow(dataValues);
        r.height = 22;
        const isAlt = idx % 2 === 1;

        r.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = fill(isAlt ? COLORS.altRowBg : COLORS.whiteBg);
          cell.font = { size: 10, name: 'Calibri', color: { argb: 'FF1F2937' } };
          cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
          cell.border = { bottom: { style: 'hair', color: { argb: COLORS.borderColor } } };
        });
      });

      // Auto-fit Columns width
      sheet.columns.forEach((col, colIdx) => {
        let maxLen = headers[colIdx] ? headers[colIdx].length : 10;
        col.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
          if (rowNumber >= 5) {
            const len = cell.value ? String(cell.value).length : 0;
            if (len > maxLen) maxLen = len;
          }
        });
        col.width = Math.min(Math.max(maxLen + 4, 14), 45);
      });

      sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }];

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      // CSV Format
      const lines = [];
      lines.push(`# ============================================================`);
      lines.push(`# ${gymName} — ${sheetName}`);
      lines.push(`# Generated On: ${new Date().toLocaleString('en-IN')}`);
      lines.push(`# Total Records: ${rows.length}`);
      lines.push(`# ============================================================`);
      lines.push('');

      // Header row
      lines.push(headers.map(h => `"${h}"`).join(','));

      // Data rows
      rows.forEach(row => {
        const values = Object.values(row).map(val => {
          const escaped = String(val === null || val === undefined ? '' : val).replace(/"/g, '""');
          return `"${escaped}"`;
        });
        lines.push(values.join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(lines.join('\r\n'));
    }
  } catch (err) {
    logger.error('Export operations data error:', err);
    next(err);
  }
};

/**
 * Operations Hub Dashboard Overview Aggregator
 */
const getOperationsOverview = async (req, res, next) => {
  try {
    const tenantId = req.user.gym_id;
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // 1. FINANCIALS
    const currentMonthRevenueRes = await db.query(
      `SELECT COALESCE(SUM(amount), 0)::numeric as val 
       FROM payments 
       WHERE gym_id = $1 
         AND (payment_status IS NULL OR payment_status = 'PAID') 
         AND payment_date >= date_trunc('month', CURRENT_DATE) 
         AND payment_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'`,
      [tenantId]
    );
    const currentMonthExpensesRes = await db.query(
      `SELECT COALESCE(SUM(amount), 0)::numeric as val 
       FROM expenses 
       WHERE tenant_id = $1 
         AND status = 'Paid' 
         AND expense_date >= date_trunc('month', CURRENT_DATE) 
         AND expense_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'`,
      [tenantId]
    );
    const lastMonthExpensesRes = await db.query(
      `SELECT COALESCE(SUM(amount), 0)::numeric as val 
       FROM expenses 
       WHERE tenant_id = $1 
         AND status = 'Paid' 
         AND expense_date >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' 
         AND expense_date < date_trunc('month', CURRENT_DATE)`,
      [tenantId]
    );

    const revenue = parseFloat(currentMonthRevenueRes.rows[0].val);
    const expenses = parseFloat(currentMonthExpensesRes.rows[0].val);
    const profit = revenue - expenses;
    const lastExpenses = parseFloat(lastMonthExpensesRes.rows[0].val);

    let expenseGrowthRate = 0;
    if (lastExpenses > 0) {
      expenseGrowthRate = ((expenses - lastExpenses) / lastExpenses) * 100;
    } else if (expenses > 0) {
      expenseGrowthRate = 100;
    }

    // 2. REVENUES & COLLECTIONS
    const colRatioRes = await db.query(
      `SELECT 
         COALESCE(SUM(amount), 0)::numeric as total, 
         COALESCE(SUM(CASE WHEN payment_status = 'PAID' OR payment_status IS NULL THEN amount ELSE 0 END), 0)::numeric as paid 
       FROM payments 
       WHERE gym_id = $1 
         AND payment_date >= date_trunc('month', CURRENT_DATE) 
         AND payment_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'`,
      [tenantId]
    );
    const totalPaymentsMonth = parseFloat(colRatioRes.rows[0].total);
    const paidPaymentsMonth = parseFloat(colRatioRes.rows[0].paid);
    const collectionRatio = totalPaymentsMonth > 0 ? (paidPaymentsMonth / totalPaymentsMonth) * 100 : 100;

    const pendingPaymentsRes = await db.query(
      `SELECT COUNT(*)::integer as count, COALESCE(SUM(amount), 0)::numeric as amount 
       FROM payments 
       WHERE gym_id = $1 AND payment_status = 'PENDING'`,
      [tenantId]
    );
    const pendingPaymentsCount = parseInt(pendingPaymentsRes.rows[0].count);
    const pendingPaymentsAmount = parseFloat(pendingPaymentsRes.rows[0].amount);

    // 3. INVENTORY
    const invValueRes = await db.query(
      `SELECT COALESCE(SUM(quantity * unit_cost), 0)::numeric as val 
       FROM inventory_items 
       WHERE tenant_id = $1`,
      [tenantId]
    );
    const lowStockRes = await db.query(
      `SELECT COUNT(*)::integer as count 
       FROM inventory_items 
       WHERE tenant_id = $1 AND quantity <= minimum_stock AND quantity > 0`,
      [tenantId]
    );
    const outStockRes = await db.query(
      `SELECT COUNT(*)::integer as count 
       FROM inventory_items 
       WHERE tenant_id = $1 AND quantity = 0`,
      [tenantId]
    );
    const totalInventoryValue = parseFloat(invValueRes.rows[0].val);
    const lowStockCount = parseInt(lowStockRes.rows[0].count);
    const outOfStockCount = parseInt(outStockRes.rows[0].count);

    // 4. EQUIPMENT & ASSETS
    const equipValueRes = await db.query(
      `SELECT COALESCE(SUM(purchase_cost), 0)::numeric as val 
       FROM equipment_assets 
       WHERE tenant_id = $1`,
      [tenantId]
    );
    const equipStatusRes = await db.query(
      `SELECT 
         COUNT(CASE WHEN status = 'Active' THEN 1 END)::integer as active,
         COUNT(CASE WHEN status = 'Maintenance' THEN 1 END)::integer as maintenance,
         COUNT(CASE WHEN status = 'Retired' THEN 1 END)::integer as retired,
         COUNT(CASE WHEN next_service_date <= CURRENT_DATE OR status = 'Maintenance' THEN 1 END)::integer as servicing_due
       FROM equipment_assets 
       WHERE tenant_id = $1`,
      [tenantId]
    );
    const totalEquipmentValue = parseFloat(equipValueRes.rows[0].val);
    const activeEquipmentCount = parseInt(equipStatusRes.rows[0].active || 0);
    const maintenanceEquipmentCount = parseInt(equipStatusRes.rows[0].maintenance || 0);
    const retiredEquipmentCount = parseInt(equipStatusRes.rows[0].retired || 0);
    const servicingDueEquipmentCount = parseInt(equipStatusRes.rows[0].servicing_due || 0);

    // 5. STAFF & PAYROLL
    const staffCountRes = await db.query(
      `SELECT COUNT(*)::integer as count 
       FROM staff_members 
       WHERE tenant_id = $1 AND status = 'Active'`,
      [tenantId]
    );
    const staffAttendanceRes = await db.query(
      `SELECT COUNT(*)::integer as count 
       FROM staff_attendance 
       WHERE tenant_id = $1 AND date = CURRENT_DATE AND status = 'Present'`,
      [tenantId]
    );
    const staffSalaryRes = await db.query(
      `SELECT COALESCE(SUM(net_pay), 0)::numeric as val 
       FROM staff_payroll 
       WHERE tenant_id = $1 AND month = $2 AND status = 'Paid'`,
      [tenantId, currentMonth]
    );
    const totalStaffCount = parseInt(staffCountRes.rows[0].count);
    const dailyHeadcountPresence = parseInt(staffAttendanceRes.rows[0].count);
    const monthlyPaidSalary = parseFloat(staffSalaryRes.rows[0].val);

    // 6. CHARTS AND TRENDS (Last 6 Months Profit trend)
    const trendQuery = `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
          date_trunc('month', CURRENT_DATE),
          '1 month'::interval
        )::date AS m
      )
      SELECT 
        TO_CHAR(months.m, 'Mon YYYY') as month_label,
        months.m as month_date,
        (
          SELECT COALESCE(SUM(p.amount), 0)::numeric
          FROM payments p 
          WHERE p.gym_id = $1 
            AND p.payment_date >= months.m 
            AND p.payment_date < months.m + interval '1 month'
            AND (p.payment_status IS NULL OR p.payment_status = 'PAID')
        ) as revenue,
        (
          SELECT COALESCE(SUM(e.amount), 0)::numeric
          FROM expenses e 
          WHERE e.tenant_id = $1 
            AND e.expense_date >= months.m 
            AND e.expense_date < months.m + interval '1 month'
            AND e.status = 'Paid'
        ) as expenses
      FROM months
      ORDER BY months.m ASC
    `;
    const trendRes = await db.query(trendQuery, [tenantId]);
    const trends = trendRes.rows.map(row => {
      const rev = parseFloat(row.revenue);
      const exp = parseFloat(row.expenses);
      return {
        month: row.month_label,
        revenue: rev,
        expenses: exp,
        profit: rev - exp
      };
    });

    // Category Breakdown (This Month)
    const breakdownQuery = `
      SELECT 
        c.name as category_name, 
        COALESCE(SUM(e.amount), 0)::numeric as total_amount
      FROM expense_categories c
      LEFT JOIN expenses e ON e.category_id = c.id 
        AND e.tenant_id = $1 
        AND e.status = 'Paid'
        AND e.expense_date >= date_trunc('month', CURRENT_DATE)
        AND e.expense_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
      WHERE c.tenant_id = $1
      GROUP BY c.id, c.name
      ORDER BY total_amount DESC
    `;
    const breakdownRes = await db.query(breakdownQuery, [tenantId]);
    const expenseCategories = breakdownRes.rows.map(r => ({
      category: r.category_name,
      amount: parseFloat(r.total_amount)
    }));

    // Inventory Category breakdown
    const invBreakdownRes = await db.query(
      `SELECT category, SUM(quantity) as items_count, COALESCE(SUM(quantity * unit_cost), 0)::numeric as total_value 
       FROM inventory_items 
       WHERE tenant_id = $1 
       GROUP BY category 
       ORDER BY total_value DESC`,
      [tenantId]
    );
    const inventoryDistribution = invBreakdownRes.rows.map(r => ({
      category: r.category,
      count: parseInt(r.items_count),
      value: parseFloat(r.total_value)
    }));

    // 7. REAL-TIME ACTIVITY FEED
    const auditQuery = `
      SELECT o.*, u.email as creator_email
      FROM operations_audit_logs o
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.tenant_id = $1
      ORDER BY o.created_at DESC
      LIMIT 15
    `;
    const auditRes = await db.query(auditQuery, [tenantId]);

    res.json({
      kpis: {
        financials: {
          currentMonthRevenue: revenue,
          currentMonthExpenses: expenses,
          currentMonthProfit: profit,
          expenseGrowthRate
        },
        revenues: {
          collectionRatio,
          pendingPaymentsCount,
          pendingPaymentsAmount
        },
        inventory: {
          totalValue: totalInventoryValue,
          lowStockCount,
          outOfStockCount
        },
        equipment: {
          totalValue: totalEquipmentValue,
          activeCount: activeEquipmentCount,
          maintenanceCount: maintenanceEquipmentCount,
          retiredCount: retiredEquipmentCount,
          servicingDueCount: servicingDueEquipmentCount
        },
        staff: {
          totalCount: totalStaffCount,
          dailyHeadcountPresence,
          monthlyPaidSalary
        }
      },
      charts: {
        trends,
        expenseCategories,
        inventoryDistribution
      },
      activityFeed: auditRes.rows
    });
  } catch (err) {
    logger.error('Fetch operations overview error:', err);
    next(err);
  }
};

module.exports = {
  getProfitAnalytics,
  getOperationsAuditLogs,
  exportOperationsData,
  getOperationsOverview
};
