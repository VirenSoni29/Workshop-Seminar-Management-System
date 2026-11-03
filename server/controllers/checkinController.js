import Registration from '../models/registration.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';

const populateForCheckIn = (query) =>
   query
      .populate('workshop', 'title status createdBy')
      .populate('user', 'name email department identifier');

// Shared rules for scan + manual check-in.
// Returns { error: { message, statusCode } } or { registration }.
const attemptCheckIn = async (registration, scanner) => {
   const workshop = registration.workshop;

   // Only the workshop's organiser (or an admin) can check people in
   if (scanner.role !== 'admin' && String(workshop.createdBy) !== String(scanner._id)) {
      return {
         error: {
            message: 'You can only check in attendees of your own workshops',
            statusCode: 403,
         },
      };
   }

   if (workshop.status !== 'approved') {
      return {
         error: {
            message: `Check-in is closed: workshop is ${workshop.status}`,
            statusCode: 400,
         },
      };
   }

   if (registration.status === 'attended') {
      const when = registration.checkedInAt.toLocaleString('en-IN', {
         timeZone: 'Asia/Kolkata',
         dateStyle: 'medium',
         timeStyle: 'short',
      });
      return {
         error: { message: `Already checked in on ${when} IST`, statusCode: 409 },
      };
   }

   if (registration.status !== 'registered') {
      return {
         error: {
            message: `Cannot check in a ${registration.status} registration`,
            statusCode: 400,
         },
      };
   }

   // ATOMIC: only succeeds if the status is still "registered".
   // Two simultaneous scans -> one wins, the other gets null.
   const updated = await Registration.findOneAndUpdate(
      { _id: registration._id, status: 'registered' },
      {
         $set: {
            status: 'attended',
            checkedInAt: new Date(),
            checkedInBy: scanner._id,
         },
      },
      { new: true }
   );

   if (!updated) {
      return { error: { message: 'Already checked in', statusCode: 409 } };
   }

   return { registration: updated };
};

const buildResponse = (updated, original) => ({
   registrationId: updated._id,
   status: updated.status,
   checkedInAt: updated.checkedInAt,
   user: original.user,
   workshop: { _id: original.workshop._id, title: original.workshop.title },
});

// POST /api/checkin/scan  (faculty, admin)  body: { qrToken }
export const scanCheckIn = asyncHandler(async (req, res) => {
   const registration = await populateForCheckIn(
      Registration.findOne({ qrToken: req.body.qrToken })
   );

   if (!registration) {
      return sendError(res, { message: 'Invalid QR code', statusCode: 404 });
   }

   const result = await attemptCheckIn(registration, req.user);
   if (result.error) return sendError(res, result.error);

   return sendSuccess(res, {
      message: `${registration.user.name} checked in`,
      data: buildResponse(result.registration, registration),
   });
});

// PATCH /api/checkin/manual/:registrationId  (faculty, admin)
export const manualCheckIn = asyncHandler(async (req, res) => {
   const registration = await populateForCheckIn(
      Registration.findById(req.params.registrationId)
   );

   if (!registration) {
      return sendError(res, { message: 'Registration not found', statusCode: 404 });
   }

   const result = await attemptCheckIn(registration, req.user);
   if (result.error) return sendError(res, result.error);

   return sendSuccess(res, {
      message: `${registration.user.name} checked in manually`,
      data: buildResponse(result.registration, registration),
   });
});