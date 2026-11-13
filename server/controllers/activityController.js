import Activity from '../models/activity.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

// GET /api/activity?page&limit&action&entityType  (admin)
export const getActivity = asyncHandler(async (req, res) => {
   const page = Math.max(1, Number(req.query.page) || 1);
   const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 15));

   const filter = {};
   if (req.query.action) filter.action = req.query.action;
   if (req.query.entityType) filter.entityType = req.query.entityType;

   const [rows, total] = await Promise.all([
      Activity.find(filter)
         .sort({ createdAt: -1 })
         .skip((page - 1) * limit)
         .limit(limit)
         .populate('actor', 'name role'),
      Activity.countDocuments(filter),
   ]);

   return sendSuccess(res, {
      data: rows,
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
   });
});