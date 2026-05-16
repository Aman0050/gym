const express = require('express');
const router = express.Router();
const { 
  getMembers, 
  createMember, 
  freezeMembership, 
  unfreezeMembership, 
  getMemberProfile,
  exportMembers,
  bulkAction
} = require('../controllers/memberController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { checkTenantStatus } = require('../middlewares/tenantMiddleware');

router.use(protect);
router.use(checkTenantStatus);
router.use(adminOnly);

// GET /api/members (with search, filter, pagination)
router.get('/', getMembers);

// GET /api/members/export
router.get('/export', exportMembers);

// POST /api/members/bulk-action
router.post('/bulk-action', bulkAction);

// POST /api/members
router.post('/', createMember);

// GET /api/members/profile/:id
router.get('/profile/:id', getMemberProfile);

// POST /api/members/:id/freeze
router.post('/:id/freeze', freezeMembership);

// POST /api/members/:id/unfreeze
router.post('/:id/unfreeze', unfreezeMembership);

module.exports = router;
