import clsx from "clsx";
import { STATUS_LABELS } from "../../utils/constants";

// <StatusBadge status="pending" />  ->  <span class="badge badge--pending">Pending</span>
export default function StatusBadge({ status, label, dot = false, className }) {
   if (!status) return null;
   return (
      <span
         className={clsx(
            "badge",
            `badge--${status}`,
            dot && "badge--dot",
            className,
         )}
      >
         {label ?? STATUS_LABELS[status] ?? status}
      </span>
   );
}
