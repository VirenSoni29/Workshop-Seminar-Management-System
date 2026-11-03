import mongoose from 'mongoose';

export const WORKSHOP_TYPES = ['Workshop', 'Seminar', 'FDP'];
export const WORKSHOP_MODES = ['online', 'offline'];
export const WORKSHOP_STATUSES = [
   'draft',
   'pending',
   'approved',
   'rejected',
   'completed',
   'cancelled',
];

// Which status can move to which (controllers will check this later)
export const STATUS_TRANSITIONS = {
   draft: ['pending', 'cancelled'],
   pending: ['approved', 'rejected'],
   rejected: ['pending', 'cancelled'], // faculty can fix and resubmit
   approved: ['completed', 'cancelled'],
   completed: [],
   cancelled: [],
};

const workshopSchema = new mongoose.Schema(
   {
      title: {
         type: String,
         required: [true, 'Title is required'],
         trim: true,
         minlength: [5, 'Title must be at least 5 characters'],
         maxlength: [120, 'Title cannot exceed 120 characters'],
      },
      description: {
         type: String,
         required: [true, 'Description is required'],
         trim: true,
         maxlength: [3000, 'Description cannot exceed 3000 characters'],
      },
      type: {
         type: String,
         enum: { values: WORKSHOP_TYPES, message: 'Type must be Workshop, Seminar or FDP' },
         default: 'Workshop',
      },
      department: {
         type: String,
         trim: true,
      },
      speaker: {
         type: String,
         trim: true,
         maxlength: [100, 'Speaker name is too long'],
      },
      mode: {
         type: String,
         enum: { values: WORKSHOP_MODES, message: 'Mode must be online or offline' },
         default: 'offline',
      },
      venue: {
         type: String,
         trim: true,
         required: [
            function () {
               return this.mode === 'offline';
            },
            'Venue is required for offline events',
         ],
      },
      meetingLink: {
         type: String,
         trim: true,
         required: [
            function () {
               return this.mode === 'online';
            },
            'Meeting link is required for online events',
         ],
      },
      startDate: {
         type: Date,
         required: [true, 'Start date is required'],
      },
      endDate: {
         type: Date,
         required: [true, 'End date is required'],
         validate: {
            validator: function (value) {
               return !this.startDate || value >= this.startDate;
            },
            message: 'End date cannot be before start date',
         },
      },
      registrationDeadline: {
         type: Date,
         required: [true, 'Registration deadline is required'],
         validate: {
            validator: function (value) {
               return !this.startDate || value <= this.startDate;
            },
            message: 'Registration deadline must be on or before the start date',
         },
      },
      capacity: {
         type: Number,
         required: [true, 'Capacity is required'],
         min: [1, 'Capacity must be at least 1'],
         max: [5000, 'Capacity cannot exceed 5000'],
      },
      // Number of confirmed (non-waitlisted) seats taken. Updated atomically in the registration logic.
      registeredCount: {
         type: Number,
         default: 0,
         min: 0,
      },
      createdBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: true,
      },
      status: {
         type: String,
         enum: WORKSHOP_STATUSES,
         default: 'draft',
      },
      adminRemarks: {
         type: String,
         trim: true,
         maxlength: [500, 'Remarks cannot exceed 500 characters'],
      },
      bannerImage: {
         type: String,
         trim: true,
      },
   },
   { timestamps: true }
);

// Faster listing, filtering and search
workshopSchema.index({ status: 1, startDate: 1 });
workshopSchema.index({ createdBy: 1 });
workshopSchema.index({ title: 'text', description: 'text', speaker: 'text' });

// Handy virtual: seats left
workshopSchema.virtual('seatsLeft').get(function () {
   return Math.max(this.capacity - this.registeredCount, 0);
});

workshopSchema.set('toJSON', {
   virtuals: true,
   transform: (doc, ret) => {
      delete ret.__v;
      delete ret.id;
      return ret;
   },
});

const Workshop = mongoose.model('Workshop', workshopSchema);

export default Workshop;