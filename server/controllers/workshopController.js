import Workshop, { STATUS_TRANSITIONS } from '../models/workshop.js';
import Registration from '../models/registration.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Fields a user is allowed to set. Never includes status, createdBy, registeredCount, adminRemarks.
const EDITABLE_FIELDS = [
   'title', 'description', 'type', 'department', 'speaker', 'mode',
   'venue', 'meetingLink', 'startDate', 'endDate', 'registrationDeadline',
   'capacity', 'bannerImage',
];

// Statuses that can still be edited or deleted
const EDITABLE_STATUSES = ['draft', 'rejected'];

// Statuses that non-admins are allowed to see when browsing
const PUBLIC_STATUSES = ['approved', 'completed'];

const pickFields = (body) =>
   EDITABLE_FIELDS.reduce((acc, key) => {
      if (body[key] !== undefined) acc[key] = body[key];
      return acc;
   }, {});

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isOwner = (workshop, user) =>
   String(workshop.createdBy._id || workshop.createdBy) === String(user._id);

// POST /api/workshops  (faculty, admin)
export const createWorkshop = asyncHandler(async (req, res) => {
   const workshop = await Workshop.create({
      ...pickFields(req.body),
      createdBy: req.user._id,
      status: 'draft',
   });

   return sendSuccess(res, {
      statusCode: 201,
      message: 'Workshop created as draft',
      data: workshop,
   });
});

// GET /api/workshops  (any logged-in user)
// Query: page, limit, q, type, mode, department, status (admin only), upcoming=true
export const getWorkshops = asyncHandler(async (req, res) => {
   const page = Math.max(parseInt(req.query.page) || 1, 1);
   const limit = Math.min(Math.max(parseInt(req.query.limit) || 9, 1), 50);
   const { q, type, mode, department, status, upcoming } = req.query;

   const filter = {};

   // Visibility: admin sees everything, everyone else only approved/completed
   if (req.user.role === 'admin') {
      if (status) filter.status = status;
   } else {
      filter.status =
         status && PUBLIC_STATUSES.includes(status) ? status : { $in: PUBLIC_STATUSES };
   }

   if (type) filter.type = type;
   if (mode) filter.mode = mode;
   if (department) filter.department = new RegExp(`^${escapeRegex(department)}$`, 'i');
   if (upcoming === 'true') filter.startDate = { $gte: new Date() };

   if (q) {
      const regex = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [{ title: regex }, { speaker: regex }, { description: regex }];
   }

   const [workshops, total] = await Promise.all([
      Workshop.find(filter)
         .populate('createdBy', 'name department')
         .sort({ startDate: 1 })
         .skip((page - 1) * limit)
         .limit(limit),
      Workshop.countDocuments(filter),
   ]);

   return sendSuccess(res, {
      data: workshops,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
   });
});

// GET /api/workshops/my  (faculty, admin): everything I created, any status
export const getMyWorkshops = asyncHandler(async (req, res) => {
   const filter = { createdBy: req.user._id };
   if (req.query.status) filter.status = req.query.status;

   const workshops = await Workshop.find(filter).sort({ createdAt: -1 });

   return sendSuccess(res, { data: workshops });
});

// GET /api/workshops/:id  (any logged-in user)
export const getWorkshop = asyncHandler(async (req, res) => {
   const workshop = await Workshop.findById(req.params.id).populate(
      'createdBy',
      'name email department'
   );

   if (!workshop) {
      return sendError(res, { message: 'Workshop not found', statusCode: 404 });
   }

   const canSeeAnyStatus = req.user.role === 'admin' || isOwner(workshop, req.user);

   // Hide unapproved workshops from others, using 404 so their existence isn't revealed
   if (!canSeeAnyStatus && !PUBLIC_STATUSES.includes(workshop.status)) {
      return sendError(res, { message: 'Workshop not found', statusCode: 404 });
   }

   return sendSuccess(res, { data: workshop });
});

// PUT /api/workshops/:id  (owner or admin, only draft/rejected)
export const updateWorkshop = asyncHandler(async (req, res) => {
   const workshop = await Workshop.findById(req.params.id);

   if (!workshop) {
      return sendError(res, { message: 'Workshop not found', statusCode: 404 });
   }

   if (req.user.role !== 'admin' && !isOwner(workshop, req.user)) {
      return sendError(res, {
         message: 'You can only edit your own workshops',
         statusCode: 403,
      });
   }

   if (!EDITABLE_STATUSES.includes(workshop.status)) {
      return sendError(res, {
         message: `A ${workshop.status} workshop cannot be edited`,
         statusCode: 400,
      });
   }

   // Assign + save (not findByIdAndUpdate) so cross-field validators run
   workshop.set(pickFields(req.body));
   await workshop.save();

   return sendSuccess(res, { message: 'Workshop updated', data: workshop });
});

// DELETE /api/workshops/:id  (owner or admin, only draft/rejected)
export const deleteWorkshop = asyncHandler(async (req, res) => {
   const workshop = await Workshop.findById(req.params.id);

   if (!workshop) {
      return sendError(res, { message: 'Workshop not found', statusCode: 404 });
   }

   if (req.user.role !== 'admin' && !isOwner(workshop, req.user)) {
      return sendError(res, {
         message: 'You can only delete your own workshops',
         statusCode: 403,
      });
   }

   if (!EDITABLE_STATUSES.includes(workshop.status)) {
      return sendError(res, {
         message: `A ${workshop.status} workshop cannot be deleted. Cancel it instead.`,
         statusCode: 400,
      });
   }

   await workshop.deleteOne();

   return sendSuccess(res, { message: 'Workshop deleted' });
});

// ---------- Status workflow ----------

/**
 * Loads the workshop and checks permissions + that the status change is allowed.  
 * If something is wrong it sends the error itself and returns null.
 */
const loadForTransition = async (req, res, newStatus, { ownerAllowed }) => {
   const workshop = await Workshop.findById(req.params.id);

   if (!workshop) {
      sendError(res, { message: 'Workshop not found', statusCode: 404 });
      return null;
   }

   if (ownerAllowed && req.user.role !== 'admin' && !isOwner(workshop, req.user)) {
      sendError(res, {
         message: 'You can only manage your own workshops',
         statusCode: 403,
      });
      return null;
   }

   if (!STATUS_TRANSITIONS[workshop.status].includes(newStatus)) {
      sendError(res, {
         message: `Cannot change status from "${workshop.status}" to "${newStatus}"`,
         statusCode: 400,
      });
      return null;
   }

   return workshop;
};

// PATCH /api/workshops/:id/submit  (owner or admin): draft/rejected -> pending
export const submitWorkshop = asyncHandler(async (req, res) => {
   const workshop = await loadForTransition(req, res, 'pending', { ownerAllowed: true });
   if (!workshop) return;

   if (workshop.startDate <= new Date()) {
      return sendError(res, {
         message: 'Start date is in the past. Edit the workshop before submitting.',
         statusCode: 400,
      });
   }

   workshop.status = 'pending';
   workshop.adminRemarks = undefined; // clear old rejection remarks on resubmit
   await workshop.save();

   return sendSuccess(res, { message: 'Submitted for admin approval', data: workshop });
});

// PATCH /api/workshops/:id/approve  (admin): pending -> approved
export const approveWorkshop = asyncHandler(async (req, res) => {
   const workshop = await loadForTransition(req, res, 'approved', { ownerAllowed: false });
   if (!workshop) return;

   workshop.status = 'approved';
   workshop.adminRemarks = req.body?.remarks || undefined;
   await workshop.save();

   return sendSuccess(res, { message: 'Workshop approved', data: workshop });
});

// PATCH /api/workshops/:id/reject  (admin): pending -> rejected (remarks required)
export const rejectWorkshop = asyncHandler(async (req, res) => {
   const workshop = await loadForTransition(req, res, 'rejected', { ownerAllowed: false });
   if (!workshop) return;

   workshop.status = 'rejected';
   workshop.adminRemarks = req.body.remarks;
   await workshop.save();

   return sendSuccess(res, { message: 'Workshop rejected', data: workshop });
});

// PATCH /api/workshops/:id/complete  (owner or admin): approved -> completed
export const completeWorkshop = asyncHandler(async (req, res) => {
   const workshop = await loadForTransition(req, res, 'completed', { ownerAllowed: true });
   if (!workshop) return;

   workshop.status = 'completed';
   await workshop.save();

   return sendSuccess(res, { message: 'Workshop marked as completed', data: workshop });
});

// PATCH /api/workshops/:id/cancel  (owner or admin): draft/rejected/approved -> cancelled
export const cancelWorkshop = asyncHandler(async (req, res) => {
   const workshop = await loadForTransition(req, res, 'cancelled', { ownerAllowed: true });
   if (!workshop) return;

   workshop.status = 'cancelled';
   await workshop.save();

   // TODO (registration step): notify attendees
   await Registration.updateMany(
      { workshop: workshop._id, status: { $in: ['registered', 'waitlisted'] } },
      { $set: { status: 'cancelled', cancelledAt: new Date() } }
   );

   return sendSuccess(res, { message: 'Workshop cancelled', data: workshop });
});