import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/user.js';

const ADMIN = {
   name: 'System Admin',
   email: 'admin@college.edu',
   password: 'admin1234', // demo password: mention it in your README
   role: 'admin',
   department: 'Administration',
};

const run = async () => {
   await connectDB();

   const existing = await User.findOne({ email: ADMIN.email });

   if (existing) {
      console.log(`Admin already exists: ${ADMIN.email}`);
   } else {
      await User.create(ADMIN);
      console.log(`Admin created: ${ADMIN.email} / ${ADMIN.password}`);
   }

   await mongoose.disconnect();
};

run();