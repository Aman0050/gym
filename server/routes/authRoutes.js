const express = require('express');
const router = express.Router();
const { login, refreshToken, logout } = require('../controllers/authController');

const { body } = require('express-validator');
const { validate } = require('../middlewares/validatorMiddleware');

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], login);

// POST /api/auth/refresh
router.post('/refresh', [
  body('token').notEmpty().withMessage('Token is required'),
  validate
], refreshToken);

// POST /api/auth/logout
router.post('/logout', logout);

module.exports = router;
