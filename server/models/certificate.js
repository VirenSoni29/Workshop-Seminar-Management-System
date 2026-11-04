import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const certificateSchema = new mongoose.Schema(
   {
      registration: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Registration',
         required: true,
         unique: true, // one certificate per registration
      },
      workshop: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      // Public ID printed on the PDF and used on the verification page
      certificateId: {
         type: String,
         unique: true,
         default: () => `CERT-${uuidv4().replace(/-/g, '').slice(0, 10).toUpperCase()}`,
      },
      issuedAt: { type: Date, default: Date.now },
   },
   { timestamps: true }
);

certificateSchema.index({ user: 1 });
certificateSchema.index({ workshop: 1 });

certificateSchema.set('toJSON', {
   transform: (doc, ret) => {
      delete ret.__v;
      return ret;
   },
});

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;