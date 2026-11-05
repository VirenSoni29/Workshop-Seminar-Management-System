const TZ = 'Asia/Kolkata';

const toDate = (value) => {
   if (!value) return null;
   const d = new Date(value);
   return Number.isNaN(d.getTime()) ? null : d;
};

// "12 Nov 2026"
export const formatDate = (value) => {
   const d = toDate(value);
   return d
      ? d.toLocaleDateString('en-IN', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' })
      : '-';
};

// "10:30 am"
export const formatTime = (value) => {
   const d = toDate(value);
   return d
      ? d.toLocaleTimeString('en-IN', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true })
      : '-';
};

// "12 Nov 2026, 10:30 am"
export const formatDateTime = (value) => {
   const d = toDate(value);
   return d
      ? d.toLocaleString('en-IN', {
         timeZone: TZ,
         day: 'numeric',
         month: 'short',
         year: 'numeric',
         hour: 'numeric',
         minute: '2-digit',
         hour12: true,
      })
      : '-';
};

// For the .date-block on cards: { day: "12", month: "NOV" }
export const getDateParts = (value) => {
   const d = toDate(value);
   if (!d) return { day: '-', month: '' };
   return {
      day: d.toLocaleString('en-IN', { timeZone: TZ, day: 'numeric' }),
      month: d.toLocaleString('en-IN', { timeZone: TZ, month: 'short' }).toUpperCase(),
   };
};

// ISO (API) -> value for <input type="datetime-local"> (edit form prefill)
export const toDateTimeLocal = (value) => {
   const d = toDate(value);
   if (!d) return '';
   const pad = (n) => String(n).padStart(2, '0');
   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// datetime-local value -> ISO (send to API)
export const toISO = (localValue) => {
   const d = toDate(localValue);
   return d ? d.toISOString() : '';
};

// "2 hours", "90 minutes", "1 hr 30 min"
export const getDuration = (start, end) => {
   const s = toDate(start);
   const e = toDate(end);
   if (!s || !e || e <= s) return '';
   const mins = Math.round((e - s) / 60000);
   if (mins < 60) return `${mins} minutes`;
   const h = Math.floor(mins / 60);
   const m = mins % 60;
   if (m) return `${h} hr ${m} min`;
   return h === 1 ? '1 hour' : `${h} hours`;
};

// "Saturday, 14 November" (withYear adds the year)
export const formatLongDate = (value, withYear = false) => {
   const d = toDate(value);
   return d
      ? d.toLocaleDateString('en-IN', {
         timeZone: TZ,
         weekday: 'long',
         day: 'numeric',
         month: 'long',
         ...(withYear && { year: 'numeric' }),
      })
      : '-';
};

// "Good morning" / "Good afternoon" / "Good evening" (IST)
export const getGreeting = () => {
   const hour = Number(
      new Date().toLocaleString('en-IN', { timeZone: TZ, hour: 'numeric', hour12: false })
   ) % 24;
   if (hour < 12) return 'Good morning';
   if (hour < 17) return 'Good afternoon';
   return 'Good evening';
};