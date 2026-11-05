const DEFAULT = 'Something went wrong. Please try again.';

// Turns any Axios error into one readable string.
export const getErrorMessage = (err, fallback = DEFAULT) => {
   if (!err) return fallback;

   // Timeout
   if (err.code === 'ECONNABORTED') return 'The request timed out. Please try again.';

   // No response at all = network / server down
   if (!err.response) {
      return err.request
         ? 'Cannot reach the server. Check your connection and try again.'
         : err.message || fallback;
   }

   const { status, data } = err.response;

   // Blob errors are parsed to JSON inside downloadBlob (Step 2d).
   // If one still arrives raw, don't show "[object Blob]".
   if (typeof Blob !== 'undefined' && data instanceof Blob) return fallback;

   if (data?.message) return data.message; // covers 429 too, the backend sends a message

   if (status === 429) return 'Too many attempts. Please wait a few minutes and try again.';
   if (status === 403) return 'You do not have permission to do that.';
   if (status === 404) return 'The requested item was not found.';
   if (status >= 500) return 'Server error. Please try again later.';
   return fallback;
};

// Backend field errors [{field,message}] -> { field: message } for useForm's setServerErrors.
// Keeps the first message per field. Returns {} when there are none.
export const getFieldErrors = (err) => {
   const list = err?.response?.data?.errors;
   if (!Array.isArray(list)) return {};
   return list.reduce((acc, { field, message }) => {
      if (field && !acc[field]) acc[field] = message;
      return acc;
   }, {});
};