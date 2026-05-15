const express = require('express');
const router = express.Router();
const { 
  getMembers, 
  createMember, 
  freezeMembership, 
  unfreezeMembership, 
  getMemberProfile 
} = require('../controllers/memberController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(adminOnly);

// GET /api/members (with search, filter, pagination)
router.get('/', getMembers);

// POST /api/members
router.post('/', createMember);

// GET /api/members/profile/:id
router.get('/profile/:id', getMemberProfile);

// POST /api/members/:id/freeze
router.post('/:id/freeze', freezeMembership);

// POST /api/members/:id/unfreeze
router.post('/:id/unfreeze', unfreezeMembership);

module.exports = router;
