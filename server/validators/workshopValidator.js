import { body } from 'express-validator';
import { WORKSHOP_TYPES, WORKSHOP_MODES } from '../models/workshop.js';

/**
 * Rules shared by create and update.
 * 
 * @params **(boolean)** `required` is true for create, false for update.
 */
const baseRules = (required) => {
   const field = (name) => {
      const chain = body(name);
      return required ? chain.exists({ checkFalsy: true }).withMessage(`${name} is required`).bail() : chain.optional();
   };

   return [
      field('title').trim().isLength({ min: 5, max: 120 }).withMessage('Title must be 5-120 characters'),

      field('description').trim().isLength({ max: 3000 }).withMessage('Description cannot exceed 3000 characters'),

      body('type').optional().isIn(WORKSHOP_TYPES).withMessage('Type must be Workshop, Seminar or FDP'),

      body('mode').optional().isIn(WORKSHOP_MODES).withMessage('Mode must be online or offline'),

      body('venue').optional({ values: 'falsy' }).trim().isLength({ max: 150 }).withMessage('Venue is too long'),

      body('meetingLink').optional({ values: 'falsy' }).trim().isURL().withMessage('Meeting link must be a valid URL'),

      body('department').optional().trim().isLength({ max: 80 }).withMessage('Department is too long'),

      body('speaker').optional().trim().isLength({ max: 100 }).withMessage('Speaker name is too long'),

      field('startDate').isISO8601().withMessage('Start date must be a valid date').toDate(),

      field('endDate')
         .isISO8601().withMessage('End date must be a valid date')
         .toDate()
         .custom((value, { req }) => {
            if (req.body.startDate && value < new Date(req.body.startDate)) {
               throw new Error('End date cannot be before start date');
            }
            return true;
         }),

      field('registrationDeadline')
         .isISO8601().withMessage('Registration deadline must be a valid date')
         .toDate()
         .custom((value, { req }) => {
            if (req.body.startDate && value > new Date(req.body.startDate)) {
               throw new Error('Registration deadline must be on or before the start date');
            }
            return true;
         }),

      field('capacity').isInt({ min: 1, max: 5000 }).withMessage('Capacity must be a whole number between 1 and 5000').toInt(),
   ];
};

export const createWorkshopRules = baseRules(true);
export const updateWorkshopRules = baseRules(false);

export const rejectRules = [
   body('remarks')
      .trim()
      .notEmpty().withMessage('Remarks are required when rejecting a workshop')
      .isLength({ max: 500 }).withMessage('Remarks cannot exceed 500 characters'),
];