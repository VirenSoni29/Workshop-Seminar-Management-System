import { body } from 'express-validator';
import { ROLES } from '../models/user.js';

export const roleRules = [
   body('role')
      .notEmpty().withMessage('Role is required')
      .isIn(ROLES).withMessage('Role must be admin, faculty or student'),
];

export const statusRules = [
   body('isActive')
      .exists().withMessage('isActive is required')
      .isBoolean().withMessage('isActive must be true or false')
      .toBoolean(),
];