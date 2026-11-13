import mongoose from 'mongoose';

export const ACTIVITY_ACTIONS = [
   'workshop.submitted',
   'workshop.approved',
   'workshop.rejected',
   'workshop.completed',
   'workshop.cancelled',
   'workshop.deleted',
   'user.role_changed',
   'user.activated',
   'user.deactivated',
];

const activitySchema = new mongoose.Schema(
   {
      actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      action: { type: String, enum: ACTIVITY_ACTIONS, required: true },
      entityType: { type: String, enum: ['workshop', 'user'], required: true },
      entityId: { type: mongoose.Schema.Types.ObjectId },
      entityLabel: { type: String, trim: true }, // title / name at the time
      details: { type: String, trim: true }, // e.g. rejection remarks, "student -> faculty"
   },
   { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ createdAt: -1 });
activitySchema.index({ action: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;

// Fire-and-forget: logging must never break the real request
export const logActivity = async ({ actor, action, entityType, entityId, entityLabel, details }) => {
   try {
      await Activity.create({ actor, action, entityType, entityId, entityLabel, details });
   } catch (err) {
      console.error('Activity log failed:', err.message);
   }
};