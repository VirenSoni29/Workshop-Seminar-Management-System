import { formatDate, formatTime } from './formatDate';

const sameDay = (a, b) => {
   const x = new Date(a);
   const y = new Date(b);
   return (
      x.getFullYear() === y.getFullYear() &&
      x.getMonth() === y.getMonth() &&
      x.getDate() === y.getDate()
   );
};

// Returns { primary, secondary }
//  single day: "17 Nov 2026" / "10:00 AM – 1:00 PM"
//  multi-day:  "17 Nov – 19 Nov 2026" / "Starts 9:00 AM · Ends 12:00 PM"
export default function formatSchedule(start, end) {
   if (!start) return { primary: 'Not scheduled', secondary: 'Dates not set' };
   if (!end || sameDay(start, end)) {
      return {
         primary: formatDate(start),
         secondary: end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start),
      };
   }
   return {
      primary: `${formatDate(start)} – ${formatDate(end)}`,
      secondary: `Starts ${formatTime(start)} · Ends ${formatTime(end)}`,
   };
}