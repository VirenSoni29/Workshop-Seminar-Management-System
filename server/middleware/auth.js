import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import config from '../config/config.js';
import { sendError } from '../utils/response.js';

export const protect = async (req, res, next) => {
   try {
      const header = req.headers.authorization;

      if (!header || !header.startsWith('Bearer ')) {
         return sendError(res, {
            message: 'Not logged in. Please log in to continue.',
            statusCode: 401,
         });
      }

      const token = header.split(' ')[1];

      const decoded = jwt.verify(token, config.jwtSecret);

      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
         return sendError(res, {
            message: 'This account no longer exists or is deactivated.',
            statusCode: 401,
         });
      }

      req.user = user;
      next();
   } catch (err) {
      next(err);
   }
};

export const authorize = (...roles) => (req, res, next) => {
   if (!roles.includes(req.user.role)) {
      return sendError(res, {
         message: 'You do not have permission to perform this action.',
         statusCode: 403,
      });
   }
   next();
};