import { toast } from 'sonner';

// The only file that imports Sonner's `toast`. Pages call notify.success / notify.error.
export const notify = {
   success: (message) => toast.success(message),
   error: (message) => toast.error(message),
   info: (message) => toast.info(message),
};