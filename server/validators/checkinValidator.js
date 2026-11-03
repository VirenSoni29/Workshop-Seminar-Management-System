import { body } from 'express-validator';

export const scanRules = [
   body('qrToken')
      .trim()
      .notEmpty().withMessage('QR token is required')
      .isUUID().withMessage('This is not a valid workshop QR code'),
];