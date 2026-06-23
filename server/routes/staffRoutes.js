const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { protect } = require('../middlewares/authMiddleware');
const { checkTenantStatus } = require('../middlewares/tenantMiddleware');
const upload = require('../middlewares/fileUploadMiddleware');

// Apply tenant auth guards to all routes
router.use(protect);
router.use(checkTenantStatus);

// Attendance routes (mount before id parameters to avoid conflicts)
router.get('/attendance', staffController.getStaffAttendance);
router.post('/attendance', staffController.upsertStaffAttendance);

// Payroll routes
router.get('/payroll', staffController.getStaffPayroll);
router.post('/payroll', staffController.upsertStaffPayroll);

// Trainer Performance routes
router.get('/performance', staffController.getTrainerPerformance);
router.post('/performance', staffController.upsertTrainerPerformance);

// Staff Profiles CRUD routes
router.get('/', staffController.getStaffMembers);
router.get('/:id', staffController.getStaffMemberById);
router.post('/', upload.single('photo'), staffController.createStaffMember);
router.put('/:id', upload.single('photo'), staffController.updateStaffMember);
router.delete('/:id', staffController.deleteStaffMember);

module.exports = router;
