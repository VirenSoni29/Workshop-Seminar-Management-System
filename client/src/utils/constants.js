export const ROLES = { ADMIN: 'admin', FACULTY: 'faculty', STUDENT: 'student' };

export const ROLE_LABELS = { admin: 'Admin', faculty: 'Faculty', student: 'Student' };

// Where each role lands after login / when they hit a page they can't access
export const HOME_BY_ROLE = {
   admin: '/admin/dashboard',
   faculty: '/faculty/dashboard',
   student: '/student/dashboard',
};

// Signup identifier label depends on role
export const ID_LABEL_BY_ROLE = { student: 'Roll number', faculty: 'Employee ID' };

export const WORKSHOP_STATUS = {
   DRAFT: 'draft',
   PENDING: 'pending',
   APPROVED: 'approved',
   REJECTED: 'rejected',
   COMPLETED: 'completed',
   CANCELLED: 'cancelled',
};

export const REGISTRATION_STATUS = {
   REGISTERED: 'registered',
   WAITLISTED: 'waitlisted',
   CANCELLED: 'cancelled',
   ATTENDED: 'attended',
};

// Labels for StatusBadge. Class is always `badge badge--<status>`.
export const STATUS_LABELS = {
   draft: 'Draft',
   pending: 'Pending',
   approved: 'Approved',
   rejected: 'Rejected',
   completed: 'Completed',
   cancelled: 'Cancelled',
   registered: 'Registered',
   waitlisted: 'Waitlisted',
   attended: 'Attended',
   active: 'Active',
   inactive: 'Inactive',
   admin: 'Admin',
   faculty: 'Faculty',
   student: 'Student',
};

export const WORKSHOP_TYPES = ['Workshop', 'Seminar', 'FDP'];
export const WORKSHOP_MODES = ['online', 'offline'];
export const MODE_LABELS = { online: 'Online', offline: 'Offline' };

// Workshop statuses where the owner may still edit / delete / submit
export const EDITABLE_STATUSES = ['draft', 'rejected'];