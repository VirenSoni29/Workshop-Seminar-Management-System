import User, { ROLES } from '../models/user.js';
import Workshop, { WORKSHOP_STATUSES } from '../models/workshop.js';
import Registration, { REGISTRATION_STATUSES } from '../models/registration.js';
import Certificate from '../models/certificate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

// [{ _id: 'approved', count: 3 }] -> { approved: 3, ...zeros for the missing keys }
const toCountMap = (rows, keys) => {
   const map = Object.fromEntries(keys.map((k) => [k, 0]));
   rows.forEach((row) => {
      map[row._id] = row.count;
   });
   return map;
};

const countBy = (Model, field) =>
   Model.aggregate([{ $group: { _id: `$${field}`, count: { $sum: 1 } } }]);

// GET /api/stats  (admin)
export const getStats = asyncHandler(async (req, res) => {
   const sixMonthsAgo = new Date();
   sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
   sixMonthsAgo.setDate(1);
   sixMonthsAgo.setHours(0, 0, 0, 0);

   const [
      usersByRole,
      workshopsByStatus,
      registrationsByStatus,
      certificatesIssued,
      topWorkshops,
      monthlyRows,
      upcoming,
   ] = await Promise.all([
      countBy(User, 'role'),
      countBy(Workshop, 'status'),
      countBy(Registration, 'status'),
      Certificate.countDocuments(),
      Workshop.find({ status: { $in: ['approved', 'completed'] } })
         .sort({ registeredCount: -1 })
         .limit(5)
         .select('title status registeredCount capacity'),
      Registration.aggregate([
         { $match: { registeredAt: { $gte: sixMonthsAgo } } },
         {
            $group: {
               _id: {
                  $dateToString: {
                     format: '%Y-%m',
                     date: '$registeredAt',
                     timezone: 'Asia/Kolkata',
                  },
               },
               count: { $sum: 1 },
            },
         },
         { $sort: { _id: 1 } },
      ]),
      Workshop.find({ status: 'approved', startDate: { $gte: new Date() } })
         .sort({ startDate: 1 })
         .limit(5)
         .select('title startDate registeredCount capacity'),
   ]);

   const users = toCountMap(usersByRole, ROLES);
   const workshops = toCountMap(workshopsByStatus, WORKSHOP_STATUSES);
   const registrations = toCountMap(registrationsByStatus, REGISTRATION_STATUSES);

   // Of everyone who held a seat, how many actually showed up
   const seated = registrations.registered + registrations.attended;
   const attendanceRate = seated === 0 ? 0 : Math.round((registrations.attended / seated) * 100);

   return sendSuccess(res, {
      data: {
         totals: {
            users: Object.values(users).reduce((a, b) => a + b, 0),
            workshops: Object.values(workshops).reduce((a, b) => a + b, 0),
            registrations: Object.values(registrations).reduce((a, b) => a + b, 0),
            certificatesIssued,
            pendingApprovals: workshops.pending,
            attendanceRate, // percent
         },
         users,
         workshops,
         registrations,
         monthlyRegistrations: monthlyRows.map((r) => ({ month: r._id, count: r.count })),
         topWorkshops,
         upcoming,
      },
   });
});