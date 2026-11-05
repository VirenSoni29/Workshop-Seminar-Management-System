import clsx from "clsx";

// <EmptyState message="No attendees match your search." />
// Optional: icon (an emoji), action (a button/link), className
export default function EmptyState({
   message,
   icon,
   action,
   className,
   children,
}) {
   return (
      <div className={clsx("empty-state", className)}>
         {icon && <span aria-hidden="true">{icon} </span>}
         {message ?? children}
         {action && <div>{action}</div>}
      </div>
   );
}
