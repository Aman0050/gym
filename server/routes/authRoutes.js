const express = require('express');
const router = express.Router();
const { login, refreshToken, logout } = require('../controllers/authController');

const { body, oneOf } = require('express-validator');
const { validate } = require('../middlewares/validatorMiddleware');

// POST /api/auth/login — accepts { email, password } OR { identifier, password }
router.post('/login', [
  oneOf([
    body('email').isEmail(),
    body('identifier').notEmpty(),
  ], { message: 'A valid email or Gym ID is required' }),
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
