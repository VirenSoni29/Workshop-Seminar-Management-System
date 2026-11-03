import { v4 as uuidv4 } from 'uuid';
import Workshop from '../models/workshop.js';
import Registration from '../models/registration.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';

// POST /api/registrations/workshops/:workshopId/register  (student, faculty)
export const registerForWorkshop = asyncHandler(async (req, res) => {
   const workshop = await Workshop.findById(req.params.workshopId);

   if (!workshop || workshop.status !== 'approved') {
      return sendError(res, {
         message: 'Workshop not found or not open for registration',
         statusCode: 404,
      });
   }

   if (String(workshop.createdBy) === String(req.user._id)) {
      return sendError(res, {
         message: 'You cannot register for your own workshop',
         statusCode: 400,
      });
   }

   const now = new Date();

   if (workshop.registrationDeadline < now) {
      return sendError(res, { message: 'Registration deadline has passed', statusCode: 400 });
   }

   const existing = await Registration.findOne({
      workshop: workshop._id,
      user: req.user._id,
   });

   if (existing && existing.status !== 'cancelled') {
      return sendError(res, {
         message: `You are already ${existing.status} for this workshop`,
         statusCode: 409,
      });
   }

   // ATOMIC SEAT GRAB: the condition and the increment happen in one DB operation.
   // If two students hit the last seat together, only one update matches.
   const seat = await Workshop.findOneAndUpdate(
      {
         _id: workshop._id,
         status: 'approved',
         $expr: { $lt: ['$registeredCount', '$capacity'] },
      },
      { $inc: { registeredCount: 1 } }
   );

   const gotSeat = Boolean(seat);
   const status = gotSeat ? 'registered' : 'waitlisted';

   let registration;
   try {
      if (existing) {
         // Re-registering after a cancellation: reuse the row, issue a fresh QR token
         existing.status = status;
         existing.qrToken = uuidv4();
         existing.registeredAt = now;
         existing.waitlistedAt = gotSeat ? undefined : now;
         existing.cancelledAt = undefined;
         existing.checkedInAt = undefined;
         existing.checkedInBy = undefined;
         registration = await existing.save();
      } else {
         registration = await Registration.create({
            workshop: workshop._id,
            user: req.user._id,
            status,
            waitlistedAt: gotSeat ? undefined : now,
         });
      }
   } catch (err) {
      // Saving failed after we took a seat, so give the seat back
      if (gotSeat) {
         await Workshop.updateOne({ _id: workshop._id }, { $inc: { registeredCount: -1 } });
      }
      throw err; // global handler deals with it (e.g. duplicate key -> 409)
   }

   return sendSuccess(res, {
      statusCode: 201,
      message: gotSeat
         ? 'Registered successfully'
         : 'Workshop is full. You have been added to the waitlist.',
      data: registration,
   });
});

// DELETE /api/registrations/:id  (owner of the registration, or admin)
export const cancelRegistration = asyncHandler(async (req, res) => {
   const registration = await Registration.findById(req.params.id).populate('workshop');

   if (!registration) {
      return sendError(res, { message: 'Registration not found', statusCode: 404 });
   }

   if (req.user.role !== 'admin' && String(registration.user) !== String(req.user._id)) {
      return sendError(res, {
         message: 'You can only cancel your own registration',
         statusCode: 403,
      });
   }

   if (registration.status === 'cancelled') {
      return sendError(res, { message: 'Registration is already cancelled', statusCode: 400 });
   }

   if (registration.status === 'attended') {
      return sendError(res, {
         message: 'You have already attended this workshop',
         statusCode: 400,
      });
   }

   const workshop = registration.workshop;

   if (req.user.role !== 'admin' && workshop.registrationDeadline < new Date()) {
      return sendError(res, {
         message: 'Cancellation is closed after the registration deadline',
         statusCode: 400,
      });
   }

   const hadSeat = registration.status === 'registered';

   registration.status = 'cancelled';
   registration.cancelledAt = new Date();
   await registration.save();

   let promoted = null;

   if (hadSeat) {
      // Hand the freed seat to the longest-waiting person (atomic: one winner only).
      // registeredCount stays the same because the seat is simply passed on.
      promoted = await Registration.findOneAndUpdate(
         { workshop: workshop._id, status: 'waitlisted' },
         { $set: { status: 'registered' }, $unset: { waitlistedAt: 1 } },
         { sort: { waitlistedAt: 1 }, new: true }
      );

      // Nobody waiting: the seat really is free now
      if (!promoted) {
         await Workshop.updateOne({ _id: workshop._id }, { $inc: { registeredCount: -1 } });
      }

      // TODO (email step): notify `promoted.user` that they got a seat
   }

   return sendSuccess(res, {
      message: promoted
         ? 'Registration cancelled. The first waitlisted person was promoted.'
         : 'Registration cancelled',
   });
});

// GET /api/registrations/my  (any logged-in user)
export const getMyRegistrations = asyncHandler(async (req, res) => {
   const registrations = await Registration.find({ user: req.user._id })
      .populate(
         'workshop',
         'title type mode venue meetingLink startDate endDate status speaker'
      )
      .sort({ createdAt: -1 });

   return sendSuccess(res, { data: registrations });
});

// GET /api/registrations/workshops/:workshopId  (workshop owner or admin)
export const getWorkshopRegistrations = asyncHandler(async (req, res) => {
   const workshop = await Workshop.findById(req.params.workshopId);

   if (!workshop) {
      return sendError(res, { message: 'Workshop not found', statusCode: 404 });
   }

   if (req.user.role !== 'admin' && String(workshop.createdBy) !== String(req.user._id)) {
      return sendError(res, {
         message: 'You can only view attendees of your own workshops',
         statusCode: 403,
      });
   }

   const filter = { workshop: workshop._id };
   if (req.query.status) filter.status = req.query.status;

   // qrToken is excluded so the organiser can't copy someone else's QR
   const registrations = await Registration.find(filter)
      .select('-qrToken')
      .populate('user', 'name email department identifier')
      .sort({ registeredAt: 1 });

   return sendSuccess(res, {
      data: registrations,
      meta: {
         total: registrations.length,
         capacity: workshop.capacity,
         registeredCount: workshop.registeredCount,
      },
   });
});