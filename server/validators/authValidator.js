import { body } from 'express-validator';

export const registerRules = [
   body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),

   body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email'),

   body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),

   // Public signup can never create an admin
   body('role')
      .optional()
      .isIn(['student', 'faculty']).withMessage('Role must be student or faculty'),

   body('department')
      .optional()
      .trim()
      .isLength({ max: 80 }).withMessage('Department is too long'),

   body('identifier')
      .optional()
      .trim()
      .isLength({ max: 40 }).withMessage('Roll number / employee ID is too long'),
];

export const loginRules = [
   body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email'),

   body('password').notEmpty().withMessage('Password is required'),
];