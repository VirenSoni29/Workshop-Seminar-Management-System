import mongoose from 'mongoose';
import config from '../config/config.js';
import connectDB from '../config/db.js';
import User from '../models/user.js';
import Workshop from '../models/workshop.js';
import Registration from '../models/registration.js';
import Certificate from '../models/certificate.js';

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

// Dates are relative to "now", so upcoming workshops stay upcoming every time you re-seed
const at = (days, hour = 10) => {
   const d = new Date();
   d.setDate(d.getDate() + days);
   d.setHours(hour, 0, 0, 0);
   return d;
};

const PASSWORDS = {
   admin: 'admin123',
   faculty: 'faculty123',
   student: 'pass1234',
};

const STUDENT_NAMES = [
   'Aarav Sharma', 'Diya Verma', 'Rohan Gupta', 'Ananya Singh', 'Kabir Mehta',
   'Isha Joshi', 'Vihaan Rathore', 'Meera Agarwal', 'Arjun Choudhary', 'Priya Khandelwal',
];

const seed = async () => {
   if (config.nodeEnv === 'production') {
      throw new Error('Refusing to seed in production: this script deletes all data.');
   }

   await connectDB();

   // ---------- Wipe ----------
   await Promise.all([
      Certificate.deleteMany({}),
      Registration.deleteMany({}),
      Workshop.deleteMany({}),
      User.deleteMany({}),
   ]);
   console.log('Old data cleared');

   // ---------- Users (create(), not insertMany, so passwords get hashed) ----------
   const admin = await User.create({
      name: 'System Admin',
      email: 'admin@college.edu',
      password: PASSWORDS.admin,
      role: 'admin',
      department: 'Administration',
   });

   const [faculty1, faculty2] = await User.create([
      {
         name: 'Dr. Rajesh Kumar',
         email: 'faculty1@college.edu',
         password: PASSWORDS.faculty,
         role: 'faculty',
         department: 'CSE',
         identifier: 'EMP001',
      },
      {
         name: 'Dr. Sunita Rao',
         email: 'faculty2@college.edu',
         password: PASSWORDS.faculty,
         role: 'faculty',
         department: 'ECE',
         identifier: 'EMP002',
      },
   ]);

   const students = await User.create(
      STUDENT_NAMES.map((name, i) => ({
         name,
         email: `student${i + 1}@college.edu`,
         password: PASSWORDS.student,
         role: 'student',
         department: i % 2 === 0 ? 'CSE' : 'ECE',
         identifier: `21CS${String(i + 1).padStart(3, '0')}`,
      }))
   );

   console.log('Users created');

   // ---------- Workshops ----------
   const [draft, pending, rejected, mern, aiSeminar, cyber, dataSci, paperWriting, blockchain] =
      await Workshop.create([
         {
            title: 'Intro to Docker for Developers',
            description: 'Containers, images and Docker Compose from scratch.',
            type: 'Workshop', department: 'CSE', speaker: 'Mr. Amit Jain',
            mode: 'offline', venue: 'Lab 3, CSE Block',
            startDate: at(30), endDate: at(30, 16), registrationDeadline: at(28),
            capacity: 40, createdBy: faculty1._id, status: 'draft',
         },
         {
            title: 'Research Methodology FDP',
            description: 'Five day online faculty development programme on research methods.',
            type: 'FDP', department: 'ECE', speaker: 'Prof. Neha Kapoor',
            mode: 'online', meetingLink: 'https://meet.google.com/abc-defg-hij',
            startDate: at(25), endDate: at(29, 16), registrationDeadline: at(22),
            capacity: 100, createdBy: faculty2._id, status: 'pending',
         },
         {
            title: 'Cloud Computing Bootcamp',
            description: 'Intro to cloud platforms and deployment.',
            type: 'Workshop', department: 'CSE', speaker: 'Mr. Vikram Singh',
            mode: 'offline', venue: 'Seminar Hall B',
            startDate: at(20), endDate: at(21, 16), registrationDeadline: at(18),
            capacity: 60, createdBy: faculty1._id, status: 'rejected',
            adminRemarks: 'Please add a detailed day-wise agenda and resubmit.',
         },
         {
            title: 'Full Stack Development with MERN',
            description: 'Build and deploy a complete MERN application in two days.',
            type: 'Workshop', department: 'CSE', speaker: 'Dr. Rajesh Kumar',
            mode: 'offline', venue: 'Seminar Hall A',
            startDate: at(10), endDate: at(11, 16), registrationDeadline: at(8, 18),
            capacity: 30, createdBy: faculty1._id, status: 'approved',
            adminRemarks: 'Approved.',
         },
         {
            title: 'AI & Prompt Engineering Seminar',
            description: 'How large language models work and how to use them well.',
            type: 'Seminar', department: 'ECE', speaker: 'Ms. Pooja Malhotra',
            mode: 'offline', venue: 'Auditorium',
            startDate: at(7), endDate: at(7, 13), registrationDeadline: at(6, 18),
            capacity: 3, createdBy: faculty2._id, status: 'approved',
         },
         {
            title: 'Cybersecurity Essentials Workshop',
            description: 'Hands-on introduction to ethical hacking and secure coding.',
            type: 'Workshop', department: 'CSE', speaker: 'Mr. Karan Bhatia',
            mode: 'offline', venue: 'Lab 1, CSE Block',
            startDate: at(1, 10), endDate: at(1, 16), registrationDeadline: at(1, 8),
            capacity: 25, createdBy: faculty1._id, status: 'approved',
         },
         {
            title: 'Data Science with Python',
            description: 'Pandas, NumPy and basic machine learning in one day.',
            type: 'Workshop', department: 'CSE', speaker: 'Dr. Anita Desai',
            mode: 'offline', venue: 'Seminar Hall A',
            startDate: at(-14), endDate: at(-14, 16), registrationDeadline: at(-17),
            capacity: 20, createdBy: faculty1._id, status: 'completed',
         },
         {
            title: 'Technical Paper Writing Seminar',
            description: 'How to structure, write and publish a research paper.',
            type: 'Seminar', department: 'ECE', speaker: 'Prof. Mahesh Iyer',
            mode: 'offline', venue: 'Conference Room',
            startDate: at(-30), endDate: at(-30, 13), registrationDeadline: at(-33),
            capacity: 15, createdBy: faculty2._id, status: 'completed',
         },
         {
            title: 'Blockchain Fundamentals',
            description: 'Cancelled because the speaker became unavailable.',
            type: 'Seminar', department: 'CSE', speaker: 'Mr. Sanjay Mishra',
            mode: 'offline', venue: 'Seminar Hall B',
            startDate: at(15), endDate: at(15, 16), registrationDeadline: at(13),
            capacity: 50, createdBy: faculty2._id, status: 'cancelled',
         },
      ]);

   console.log('Workshops created');

   // ---------- Registrations ----------
   const regs = [];
   const counters = {};

   const addReg = (workshop, user, status) => {
      const key = String(workshop._id);
      const n = (counters[key] = (counters[key] || 0) + 1);

      // Registered a few days before the event (or "just now" for far-future events)
      const registeredAt = new Date(
         Math.min(Date.now(), workshop.startDate.getTime() - 3 * DAY) - (30 - n) * HOUR
      );

      const reg = { workshop: workshop._id, user: user._id, status, registeredAt };

      if (status === 'waitlisted') reg.waitlistedAt = registeredAt;
      if (status === 'cancelled') reg.cancelledAt = new Date(registeredAt.getTime() + 30 * 60 * 1000);
      if (status === 'attended') {
         reg.checkedInAt = new Date(workshop.startDate.getTime() + HOUR);
         reg.checkedInBy = workshop.createdBy;
      }

      regs.push(reg);
   };

   const s = students; // short alias

   // MERN (open, 7 of 30 seats): 6 students + faculty2, one cancellation
   [s[0], s[1], s[2], s[3], s[4], s[5], faculty2].forEach((u) => addReg(mern, u, 'registered'));
   addReg(mern, s[6], 'cancelled');

   // AI Seminar (FULL: 3 of 3 seats, 2 waitlisted, 1 cancelled)
   [s[0], s[1], s[2]].forEach((u) => addReg(aiSeminar, u, 'registered'));
   [s[3], s[4]].forEach((u) => addReg(aiSeminar, u, 'waitlisted'));
   addReg(aiSeminar, s[5], 'cancelled');

   // Cybersecurity (check-in demo: 5 registered, nobody scanned yet)
   [s[2], s[3], s[4], s[5], s[6]].forEach((u) => addReg(cyber, u, 'registered'));

   // Data Science (completed: 8 attended, 1 no-show)
   s.slice(0, 8).forEach((u) => addReg(dataSci, u, 'attended'));
   addReg(dataSci, s[8], 'registered');

   // Paper Writing (completed: 6 attended, certificates NOT issued yet)
   s.slice(2, 8).forEach((u) => addReg(paperWriting, u, 'attended'));

   // Blockchain (cancelled workshop: all registrations cancelled)
   [s[0], s[1]].forEach((u) => addReg(blockchain, u, 'cancelled'));

   const insertedRegs = await Registration.insertMany(regs);

   // registeredCount = confirmed seats = registered + attended (same rule as the API)
   const seatsByWorkshop = {};
   regs.forEach((r) => {
      if (r.status === 'registered' || r.status === 'attended') {
         const key = String(r.workshop);
         seatsByWorkshop[key] = (seatsByWorkshop[key] || 0) + 1;
      }
   });

   await Promise.all(
      Object.entries(seatsByWorkshop).map(([id, count]) =>
         Workshop.updateOne({ _id: id }, { $set: { registeredCount: count } })
      )
   );

   console.log(`${insertedRegs.length} registrations created`);

   // ---------- Certificates (only for Data Science; Paper Writing is left for the live demo) ----------
   const certDocs = insertedRegs
      .filter((r) => r.status === 'attended' && String(r.workshop) === String(dataSci._id))
      .map((r) => ({ registration: r._id, workshop: r.workshop, user: r.user }));

   await Certificate.insertMany(certDocs);
   console.log(`${certDocs.length} certificates created`);

   // ---------- Summary ----------
   console.log('\nSeed complete. Demo logins:');
   console.log(`  Admin    admin@college.edu                    / ${PASSWORDS.admin}`);
   console.log(`  Faculty  faculty1@college.edu, faculty2@...   / ${PASSWORDS.faculty}`);
   console.log(`  Student  student1@college.edu ... student10@  / ${PASSWORDS.student}`);
};

seed()
   .catch((err) => {
      console.error(`Seed failed: ${err.message}`);
      process.exitCode = 1;
   })
   .finally(() => mongoose.disconnect());