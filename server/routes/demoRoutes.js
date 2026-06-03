const express = require('express');
const router = express.Router();
const { submitDemoRequest } = require('../controllers/demoController');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validatorMiddleware');

router.post('/request', [
  body('name').notEmpty().withMessage('Name is required'),
  body('gymName').notEmpty().withMessage('Gym Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  validate
], submitDemoRequest);

module.exports = router;
