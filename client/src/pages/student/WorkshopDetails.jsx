import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
   ArrowLeft,
   ArrowRight,
   BadgeCheck,
   CalendarCheck,
   CalendarDays,
   CircleAlert,
   Clock,
   ExternalLink,
   MapPin,
   QrCode,
   Users,
   Video,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import useFetch from "../../hooks/useFetch";
import Loader, { Spinner } from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import ConfirmModal from "../../components/common/ConfirmModal";
import { getWorkshopApi } from "../../api/workshops.api";
import {
   cancelRegistrationApi,
   getMyRegistrationsApi,
   registerForWorkshopApi,
} from "../../api/registrations.api";
import { getTypeStyle } from "../../utils/workshopTypeStyle";
import {
   formatDate,
   formatDateTime,
   formatLongDate,
   formatTime,
   getDuration,
} from "../../utils/formatDate";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { getInitials } from "../../utils/getInitials";
import { notify } from "../../utils/notify";
import { ROLES } from "../../utils/constants";

export default function WorkshopDetails() {
   const [now] = useState(() => Date.now());
   const { id } = useParams();
   const { user } = useAuth();
   const isAdmin = user.role === ROLES.ADMIN;

   const workshop = useFetch(() => getWorkshopApi(id), [id]);
   // Admins can't register, so they skip this call
   const regs = useFetch(() => getMyRegistrationsApi(), [id], {
      immediate: !isAdmin,
   });

   const [busy, setBusy] = useState(false);
   const [confirmOpen, setConfirmOpen] = useState(false);

   const w = workshop.data;

   const myReg = useMemo(() => {
      if (!Array.isArray(regs.data)) return null;
      return (
         regs.data.find(
            (r) => r.workshop?._id === id && r.status !== "cancelled",
         ) || null
      );
   }, [regs.data, id]);

   if (workshop.loading || regs.loading) return <Loader />;

   if (workshop.error || !w) {
      return (
         <>
            <div className="detail-heading">
               <Link className="btn btn-ghost btn-sm" to="/workshops">
                  <ArrowLeft />
                  Back to workshops
               </Link>
            </div>
            <EmptyState
               icon="⚠️"
               message={workshop.error || "Workshop not found."}
               />
         </>
      );
   }
   
   const { variant, Icon } = getTypeStyle(w.type);
   const isOnline = w.mode === "online";
   const isOwner = w.createdBy?._id === user._id;
   const canManage = isAdmin || isOwner;
   const deadlinePassed =
      w.registrationDeadline &&
      now > new Date(w.registrationDeadline).getTime();
   const isFull = w.registeredCount >= w.capacity;
   const percent = w.capacity
      ? Math.min(100, Math.round((w.registeredCount / w.capacity) * 100))
      : 0;
   const duration = getDuration(w.startDate, w.endDate);
   const sameDay = formatDate(w.startDate) === formatDate(w.endDate);
   const paragraphs = (w.description || "").split(/\n{2,}/).filter(Boolean);
   const showLink = isOnline && w.meetingLink && (myReg || canManage);

   const stateBadge =
      w.status === "completed" ? (
         <StatusBadge status="completed" />
      ) : w.status === "cancelled" ? (
         <StatusBadge status="cancelled" />
      ) : w.status !== "approved" ? (
         <StatusBadge status={w.status} />
      ) : deadlinePassed ? (
         <StatusBadge status="cancelled" label="Registration closed" />
      ) : isFull ? (
         <StatusBadge status="waitlisted" label="Full: waitlist open" />
      ) : (
         <StatusBadge status="approved" label="Open for registration" />
      );

   const refresh = () => {
      workshop.refetch();
      regs.refetch();
   };

   const handleRegister = async () => {
      setBusy(true);
      try {
         const res = await registerForWorkshopApi(w._id);
         notify.success(res.data.message || "Registered successfully");
         refresh();
      } catch (err) {
         notify.error(getErrorMessage(err));
      } finally {
         setBusy(false);
      }
   };

   const handleCancel = async () => {
      setBusy(true);
      try {
         const res = await cancelRegistrationApi(myReg._id);
         notify.success(res.data.message || "Registration cancelled");
         setConfirmOpen(false);
         refresh();
      } catch (err) {
         notify.error(getErrorMessage(err));
      } finally {
         setBusy(false);
      }
   };

   // What the action area shows for this person
   let action;
   if (canManage) {
      action = (
         <>
            <p className="text-secondary" style={{ fontSize: "var(--fs-sm)" }}>
               {isOwner
                  ? "This is your workshop."
                  : "You are viewing this as an admin."}
            </p>
            {["approved", "completed"].includes(w.status) && (
               <Link
                  className="btn btn-primary btn-block"
                  to={`/faculty/workshops/${w._id}/attendees`}
               >
                  Manage attendees <ArrowRight />
               </Link>
            )}
         </>
      );
   } else if (myReg?.status === "attended") {
      action = (
         <div className="alert alert--success">
            <BadgeCheck />
            <p>You attended this workshop.</p>
         </div>
      );
   } else if (myReg) {
      action = (
         <>
            <div className="alert alert--info">
               <CircleAlert />
               <p>
                  {myReg.status === "waitlisted"
                     ? "You are on the waitlist. You move up automatically when a seat opens."
                     : "You are registered for this workshop."}
               </p>
            </div>
            {myReg.status === "registered" && (
               <Link
                  className="btn btn-secondary btn-block"
                  to="/my-registrations"
               >
                  View QR pass <QrCode />
               </Link>
            )}
            {!deadlinePassed && w.status === "approved" && (
               <button
                  type="button"
                  className="btn btn-danger-soft btn-block"
                  onClick={() => setConfirmOpen(true)}
               >
                  Cancel registration
               </button>
            )}
         </>
      );
   } else if (w.status === "approved" && !deadlinePassed) {
      action = (
         <button
            type="button"
            className={`btn btn-primary btn-block${busy ? " is-loading" : ""}`}
            onClick={handleRegister}
            disabled={busy}
         >
            {busy && <Spinner />}
            {isFull ? "Join waitlist" : "Register now"}{" "}
            {!busy && <ArrowRight />}
         </button>
      );
   } else {
      action = (
         <div className="alert alert--warning">
            <CircleAlert />
            <p>
               {w.status === "approved"
                  ? "Registration has closed."
                  : "Registration is not available."}
            </p>
         </div>
      );
   }

   return (
      <>
         <div className="detail-heading">
            <Link className="btn btn-ghost btn-sm" to="/workshops">
               <ArrowLeft />
               Back to workshops
            </Link>
         </div>

         {regs.error && !isAdmin && (
            <div
               className="alert alert--danger"
               role="alert"
               style={{ marginBottom: "var(--sp-5)" }}
            >
               <CircleAlert />
               <p>Could not check your registration status. {regs.error}</p>
            </div>
         )}

         <div className="detail-layout">
            <div className="detail-main">
               <section
                  className={`detail-banner workshop-card__banner--${variant}`}
               >
                  <div>
                     <span className="eyebrow">
                        {w.type.toUpperCase()} ·{" "}
                        {formatLongDate(w.startDate, true)
                           .split(", ")[1]
                           ?.toUpperCase()}
                     </span>
                     <h2>{w.title}</h2>
                     <div
                        className="workshop-card__tags"
                        style={{ marginTop: "var(--sp-3)" }}
                     >
                        <span className="badge badge--info">{w.type}</span>
                        {stateBadge}
                     </div>
                  </div>
                  <Icon />
               </section>

               {paragraphs.length > 0 && (
                  <section className="card detail-card">
                     <h2>About this {w.type.toLowerCase()}</h2>
                     {paragraphs.map((p, i) => (
                        <p key={i}>{p}</p>
                     ))}
                  </section>
               )}

               {w.status === "rejected" && w.adminRemarks && canManage && (
                  <div className="alert alert--danger">
                     <CircleAlert />
                     <div>
                        <p className="alert__title">Rejected by admin</p>
                        <p>{w.adminRemarks}</p>
                     </div>
                  </div>
               )}

               <section className="card detail-card">
                  <h2>Workshop information</h2>
                  <div className="detail-facts">
                     <div className="detail-fact">
                        <span className="icon-box">
                           <CalendarDays />
                        </span>
                        <div>
                           <strong>Date & time</strong>
                           {sameDay ? (
                              <span>
                                 {formatDate(w.startDate)}
                                 <br />
                                 {formatTime(w.startDate)} –{" "}
                                 {formatTime(w.endDate)}
                              </span>
                           ) : (
                              <span>
                                 {formatDateTime(w.startDate)}
                                 <br />
                                 to {formatDateTime(w.endDate)}
                              </span>
                           )}
                        </div>
                     </div>
                     <div className="detail-fact">
                        <span className="icon-box">
                           {isOnline ? <Video /> : <MapPin />}
                        </span>
                        <div>
                           <strong>{isOnline ? "Online" : "Venue"}</strong>
                           {isOnline ? (
                              showLink ? (
                                 <span>
                                    <a
                                       href={w.meetingLink}
                                       target="_blank"
                                       rel="noreferrer"
                                    >
                                       Join meeting <ExternalLink size={14} />
                                    </a>
                                 </span>
                              ) : (
                                 <span>Link shared after you register</span>
                              )
                           ) : (
                              <span>{w.venue || "To be announced"}</span>
                           )}
                        </div>
                     </div>
                     <div className="detail-fact">
                        <span className="icon-box">
                           <Users />
                        </span>
                        <div>
                           <strong>Organizer</strong>
                           <span>
                              {w.createdBy?.name}
                              {w.createdBy?.department
                                 ? `, ${w.createdBy.department}`
                                 : ""}
                           </span>
                        </div>
                     </div>
                     {duration && (
                        <div className="detail-fact">
                           <span className="icon-box">
                              <Clock />
                           </span>
                           <div>
                              <strong>Duration</strong>
                              <span>{duration}</span>
                           </div>
                        </div>
                     )}
                  </div>
               </section>

               {w.speaker && (
                  <section className="card detail-card">
                     <h2>About the speaker</h2>
                     <div className="speaker-row">
                        <span className="speaker-avatar">
                           {getInitials(w.speaker)}
                        </span>
                        <div>
                           <strong>{w.speaker}</strong>
                           {w.department && (
                              <p
                                 style={{ margin: 0, fontSize: "var(--fs-sm)" }}
                              >
                                 {w.department}
                              </p>
                           )}
                        </div>
                     </div>
                  </section>
               )}
            </div>

            <aside className="card registration-card">
               <div className="row-between">
                  {stateBadge}
                  {!isFull && percent >= 80 && w.status === "approved" && (
                     <span
                        className="text-muted"
                        style={{ fontSize: "var(--fs-xs)" }}
                     >
                        Limited seats
                     </span>
                  )}
               </div>

               <div className="seats">
                  <span>
                     {w.registeredCount} of {w.capacity} seats filled
                  </span>
                  <div
                     className={`progress${isFull ? " is-full" : ""}`}
                     style={{ "--value": `${percent}%` }}
                  >
                     <div className="progress__bar" />
                  </div>
               </div>

               {action}

               <ul className="meta-list">
                  {w.registrationDeadline && (
                     <li>
                        <CalendarCheck />
                        {deadlinePassed
                           ? "Registration closed"
                           : "Registration closes"}{" "}
                        {formatDate(w.registrationDeadline)}
                     </li>
                  )}
                  <li>
                     <BadgeCheck />
                     Certificate of participation
                  </li>
                  <li>
                     <QrCode />
                     QR-based attendance
                  </li>
               </ul>
            </aside>
         </div>

         <ConfirmModal
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={handleCancel}
            loading={busy}
            danger
            title="Cancel registration?"
            message={`You will lose your ${myReg?.status === "waitlisted" ? "waitlist spot" : "seat"} for "${w.title}".`}
            confirmText="Yes, cancel"
            cancelText="Keep it"
         />
      </>
   );
}
