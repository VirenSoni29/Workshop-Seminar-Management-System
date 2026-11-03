import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export const REGISTRATION_STATUSES = ['registered', 'waitlisted', 'cancelled', 'attended'];

const registrationSchema = new mongoose.Schema(
   {
      workshop: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Workshop',
         required: true,
      },
      user: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: true,
      },
      status: {
         type: String,
         enum: REGISTRATION_STATUSES,
         default: 'registered',
      },
      // The QR code will encode this value, never raw user data
      qrToken: {
         type: String,
         unique: true,
         default: uuidv4,
      },
      registeredAt: { type: Date, default: Date.now },
      waitlistedAt: Date, // decides who gets promoted first
      cancelledAt: Date,
      checkedInAt: Date,
      checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
   },
   { timestamps: true }
);

// One registration per user per workshop (also the backstop for double-click races)
registrationSchema.index({ workshop: 1, user: 1 }, { unique: true });
registrationSchema.index({ workshop: 1, status: 1 });

registrationSchema.set('toJSON', {
   transform: (doc, ret) => {
      delete ret.__v;
      return ret;
   },
});

const Registration = mongoose.model('Registration', registrationSchema);

export default Registration;