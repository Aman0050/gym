const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect } = require('../middlewares/authMiddleware');
const { checkTenantStatus } = require('../middlewares/tenantMiddleware');
const upload = require('../middlewares/fileUploadMiddleware');

// Apply tenant auth guards to all routes
router.use(protect);
router.use(checkTenantStatus);

// Category routes
router.get('/categories', expenseController.getExpenseCategories);

// Expense CRUD routes
router.get('/', expenseController.getExpenses);
router.get('/:id', expenseController.getExpenseById);
router.post('/', upload.single('invoice'), expenseController.createExpense);
router.put('/:id', upload.single('invoice'), expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
