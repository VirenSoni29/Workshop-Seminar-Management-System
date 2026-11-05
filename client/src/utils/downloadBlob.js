import axiosInstance from '../api/axiosInstance';

// Blob error responses arrive as a Blob, not JSON. Parse it and put the
// parsed object back on err.response.data so getErrorMessage works unchanged.
const unwrapBlobError = async (err) => {
   const data = err?.response?.data;
   if (typeof Blob !== 'undefined' && data instanceof Blob) {
      try {
         err.response.data = JSON.parse(await data.text());
      } catch {
         err.response.data = {};
      }
   }
   return err;
};

// Pulls filename from Content-Disposition, if the backend sends one.
const getFilename = (headers, fallback) => {
   const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(headers?.['content-disposition'] || '');
   return match ? decodeURIComponent(match[1]) : fallback;
};

// Saves a Blob to disk via a temporary <a download>.
export const saveBlob = (blob, filename) => {
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = filename;
   document.body.appendChild(a);
   a.click();
   a.remove();
   setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// GET `url` as a blob with the auth header, then trigger a download.
// Throws a normal error (message-ready) on failure.
export const downloadBlob = async (url, fallbackName = 'download.pdf') => {
   try {
      const res = await axiosInstance.get(url, { responseType: 'blob' });
      saveBlob(res.data, getFilename(res.headers, fallbackName));
   } catch (err) {
      throw await unwrapBlobError(err);
   }
};