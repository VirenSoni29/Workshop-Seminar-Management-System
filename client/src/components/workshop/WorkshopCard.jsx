import { Link } from "react-router-dom";
import { Calendar, MapPin, Video } from 'lucide-react';
import clsx from "clsx";
import StatusBadge from "../common/StatusBadge";
import {
   formatDateTime,
   getDateParts,
   getDuration,
} from "../../utils/formatDate";
import { getTypeStyle } from '../../utils/workshopTypeStyle';

// Banner colour + icon come from the workshop type (the API has no topic)

// <WorkshopCard workshop={w} />
export default function WorkshopCard({ workshop: w }) {
   const { variant, Icon } = getTypeStyle(w.type);
   const { day, month } = getDateParts(w.startDate);
   const isOnline = w.mode === "online";
   const isFull = w.capacity > 0 && w.registeredCount >= w.capacity;
   const percent = w.capacity
      ? Math.min(100, Math.round((w.registeredCount / w.capacity) * 100))
      : 0;
   const duration = getDuration(w.startDate, w.endDate);
   const speakerLine = [w.speaker, w.department].filter(Boolean).join(" · ");

   return (
      <article className="workshop-card">
         <div
            className={clsx(
               "workshop-card__banner",
               `workshop-card__banner--${variant}`,
            )}
         >
            <div className="workshop-card__date">
               <strong>{day}</strong>
               <span>{month.charAt(0) + month.slice(1).toLowerCase()}</span>
            </div>
            <Icon />
         </div>

         <div className="workshop-card__body">
            <div className="workshop-card__tags">
               <span className="badge badge--info">{w.type}</span>
               {w.status === "completed" ? (
                  <StatusBadge status="completed" />
               ) : isFull ? (
                  <StatusBadge status="waitlisted" label="Full" />
               ) : percent >= 80 ? (
  <StatusBadge status="pending" label="Filling fast" />
) : (
                  <StatusBadge status="approved" label="Open" />
               )}
            </div>

            <h3 className="workshop-card__title">
               <Link to={`/workshops/${w._id}`}>{w.title}</Link>
            </h3>
            {speakerLine && (
               <p className="workshop-card__speaker">{speakerLine}</p>
            )}

            <ul className="meta-list">
               <li>
                  <Calendar />
                  {formatDateTime(w.startDate)}
               </li>
               <li>
                  {isOnline ? <Video /> : <MapPin />}
                  {isOnline ? "Online" : w.venue || "Venue to be announced"}
               </li>
            </ul>

            <div className="seats">
               <span>
                  {w.registeredCount} of {w.capacity} seats filled
               </span>
               <div
                  className={clsx("progress", isFull && "is-full")}
                  style={{ "--value": `${percent}%` }}
               >
                  <div className="progress__bar" />
               </div>
            </div>
         </div>

         <div className="workshop-card__footer">
            <span className="text-muted" style={{ fontSize: "var(--fs-xs)" }}>
               {duration || "Duration TBA"}
            </span>
            <Link className="btn btn-primary btn-sm" to={`/workshops/${w._id}`}>
               View details
            </Link>
         </div>
      </article>
   );
}
