import Certificate from '../models/certificate.js';
import Registration from '../models/registration.js';
import Workshop from '../models/workshop.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { generateCertificatePDF } from '../services/certificateService.js';

// POST /api/certificates/workshops/:workshopId/generate  (workshop owner or admin)
// Safe to call repeatedly: only attendees without a certificate get a new one.
export const generateCertificates = asyncHandler(async (req, res) => {
   const workshop = await Workshop.findById(req.params.workshopId);

   if (!workshop) {
      return sendError(res, { message: 'Workshop not found', statusCode: 404 });
   }

   if (req.user.role !== 'admin' && String(workshop.createdBy) !== String(req.user._id)) {
      return sendError(res, {
         message: 'You can only issue certificates for your own workshops',
         statusCode: 403,
      });
   }

   if (workshop.status !== 'completed') {
      return sendError(res, {
         message: 'Mark the workshop as completed before issuing certificates',
         statusCode: 400,
      });
   }

   const attended = await Registration.find({
      workshop: workshop._id,
      status: 'attended',
   }).select('_id user');

   if (attended.length === 0) {
      return sendError(res, {
         message: 'No checked-in attendees to issue certificates to',
         statusCode: 400,
      });
   }

   const existing = await Certificate.find({ workshop: workshop._id }).select('registration');
   const alreadyIssued = new Set(existing.map((c) => String(c.registration)));

   const toCreate = attended
      .filter((r) => !alreadyIssued.has(String(r._id)))
      .map((r) => ({ registration: r._id, workshop: workshop._id, user: r.user }));

   if (toCreate.length > 0) {
      await Certificate.insertMany(toCreate);
   }

   return sendSuccess(res, {
      statusCode: toCreate.length > 0 ? 201 : 200,
      message:
         toCreate.length > 0
            ? `${toCreate.length} certificate(s) issued`
            : 'All attendees already have certificates',
      data: { newlyIssued: toCreate.length, totalAttendees: attended.length },
   });
});

// GET /api/certificates/my  (any logged-in user)
export const getMyCertificates = asyncHandler(async (req, res) => {
   const certificates = await Certificate.find({ user: req.user._id })
      .populate('workshop', 'title type startDate endDate')
      .sort({ issuedAt: -1 });

   return sendSuccess(res, { data: certificates });
});

// GET /api/certificates/:id/download  (certificate holder, workshop owner, or admin)
export const downloadCertificate = asyncHandler(async (req, res) => {
   const certificate = await Certificate.findById(req.params.id)
      .populate('user', 'name')
      .populate('workshop', 'title type startDate endDate createdBy');

   if (!certificate) {
      return sendError(res, { message: 'Certificate not found', statusCode: 404 });
   }

   const isHolder = String(certificate.user._id) === String(req.user._id);
   const isOrganiser = String(certificate.workshop.createdBy) === String(req.user._id);

   if (!isHolder && !isOrganiser && req.user.role !== 'admin') {
      return sendError(res, {
         message: 'You do not have access to this certificate',
         statusCode: 403,
      });
   }

   const pdf = await generateCertificatePDF(certificate);

   res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${certificate.certificateId}.pdf"`,
      'Content-Length': pdf.length,
   });

   return res.send(pdf);
});

// GET /api/certificates/verify/:certificateId  (PUBLIC, no login)
export const verifyCertificate = asyncHandler(async (req, res) => {
   const certificate = await Certificate.findOne({
      certificateId: req.params.certificateId.toUpperCase(),
   })
      .populate('user', 'name')
      .populate('workshop', 'title type startDate endDate');

   if (!certificate) {
      return sendError(res, {
         message: 'No certificate found with this ID. It may be invalid.',
         statusCode: 404,
      });
   }

   // Public endpoint: expose only what is printed on the certificate (no email, no IDs)
   return sendSuccess(res, {
      message: 'Certificate is valid',
      data: {
         valid: true,
         certificateId: certificate.certificateId,
         name: certificate.user.name,
         workshop: {
            title: certificate.workshop.title,
            type: certificate.workshop.type,
            startDate: certificate.workshop.startDate,
            endDate: certificate.workshop.endDate,
         },
         issuedAt: certificate.issuedAt,
      },
   });
});