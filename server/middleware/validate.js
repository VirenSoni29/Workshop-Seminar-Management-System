import { validationResult } from 'express-validator';
import { sendError } from '../utils/response.js';

const validate = (req, res, next) => {
   const result = validationResult(req);

   if (result.isEmpty()) return next();

   const seen = new Set();
   const errors = [];

   result.array().forEach((e) => {
      if (!seen.has(e.path)) {
         seen.add(e.path);
         errors.push({ field: e.path, message: e.msg });
      }
   });

   return sendError(res, {
      message: 'Validation failed',
      statusCode: 400,
      errors,
   });
};

export default validate;