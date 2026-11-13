import User from '../models/user.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logActivity } from '../models/activity.js';

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/users  (admin)
// Query: page, limit, q (name/email/identifier), role, isActive
export const getUsers = asyncHandler(async (req, res) => {
   const page = Math.max(parseInt(req.query.page) || 1, 1);
   const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
   const { q, role, isActive } = req.query;

   const filter = {};
   if (role) filter.role = role;
   if (isActive === 'true' || isActive === 'false') filter.isActive = isActive === 'true';

   if (q) {
      const regex = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { identifier: regex }];
   }

   const [users, total] = await Promise.all([
      User.find(filter)
         .sort({ createdAt: -1 })
         .skip((page - 1) * limit)
         .limit(limit),
      User.countDocuments(filter),
   ]);

   return sendSuccess(res, {
      data: users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
   });
});

// PATCH /api/users/:id/role  (admin)  body: { role }
export const updateUserRole = asyncHandler(async (req, res) => {
   if (String(req.params.id) === String(req.user._id)) {
      return sendError(res, {
         message: 'You cannot change your own role',
         statusCode: 400,
      });
   }

   const user = await User.findById(req.params.id);

   if (!user) {
      return sendError(res, { message: 'User not found', statusCode: 404 });
   }

   const oldRole = user.role;
   user.role = req.body.role;
   await user.save();

   logActivity({ actor: req.user._id, action: 'user.role_changed', entityType: 'user', entityId: user._id, entityLabel: user.name, details: `${oldRole} → ${user.role}` });

   return sendSuccess(res, { message: `Role changed to ${user.role}`, data: user });
});

// PATCH /api/users/:id/status  (admin)  body: { isActive }
export const updateUserStatus = asyncHandler(async (req, res) => {
   if (String(req.params.id) === String(req.user._id)) {
      return sendError(res, {
         message: 'You cannot deactivate your own account',
         statusCode: 400,
      });
   }

   const user = await User.findById(req.params.id);

   if (!user) {
      return sendError(res, { message: 'User not found', statusCode: 404 });
   }

   user.isActive = req.body.isActive;
   await user.save();

   logActivity({ actor: req.user._id, action: user.isActive ? 'user.activated' : 'user.deactivated', entityType: 'user', entityId: user._id, entityLabel: user.name });

   return sendSuccess(res, {
      message: user.isActive ? 'User activated' : 'User deactivated',
      data: user,
   });
});