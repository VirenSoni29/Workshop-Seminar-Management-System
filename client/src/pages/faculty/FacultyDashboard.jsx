import { Link } from "react-router-dom";
import {
   Plus,
   ArrowRight,
   CalendarCheck,
   Users,
   Zap,
   Award,
   UserPlus,
   ClipboardCheck,
} from "lucide-react";
import { getMyWorkshopsApi } from "../../api/workshops.api";
import useAuth from "../../hooks/useAuth";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import StatCard from "../../components/common/StatCard";
import {
   formatDate,
   formatLongDate,
   formatDateTime,
} from "../../utils/formatDate";
import { STATUS_LABELS, EDITABLE_STATUSES } from "../../utils/constants";

const pad = (n) => String(n).padStart(2, "0");

export default function FacultyDashboard() {
   const { user } = useAuth();
   const { data, meta, loading, error } = useFetch(
      () => getMyWorkshopsApi({ limit: 100 }),
      [],
   );

   // Response shape is an assumption: array or { workshops: [] }
   const workshops = Array.isArray(data) ? data : (data?.workshops ?? []);
   const totalWorkshops = meta?.total ?? workshops.length;
   const totalRegistrations = workshops.reduce(
      (sum, w) => sum + (w.registeredCount ?? w.registrationsCount ?? 0),
      0,
   );
   const scheduledThisMonth = workshops.filter((w) => {
      const d = new Date(w.startDate || w.date);
      const now = new Date();
      return (
         !Number.isNaN(d.getTime()) &&
         d.getMonth() === now.getMonth() &&
         d.getFullYear() === now.getFullYear()
      );
   }).length;
   const preview = workshops.slice(0, 3);

   // TODO: replace with real data. Shape: { id, type: 'registration' | 'attendance', name, workshop, at }
   const activity = [];

   return (
      <>
         <section className="dashboard-heading row-between">
            <div>
               <span className="eyebrow">
                  {formatLongDate(new Date(), true).toUpperCase()}
               </span>
               <h1>Welcome, {user?.name} 👋</h1>
               <p>Manage your workshops and keep track of registrations.</p>
            </div>
            <Link className="btn btn-primary" to="/faculty/workshops/new">
               <Plus size={16} />
               Create workshop
            </Link>
         </section>

         <section className="grid-stats">
            <StatCard
               icon={CalendarCheck}
               label="Total workshops"
               value={pad(totalWorkshops)}
               hint={`${scheduledThisMonth} scheduled this month`}
            />
            <StatCard
               icon={Users}
               label="Total registrations"
               value={totalRegistrations}
               hint="Across all your workshops"
            />
         </section>

         <section style={{ marginTop: "var(--sp-8)" }}>
            <div className="section-heading row-between">
               <div>
                  <h2>Your workshops</h2>
                  <p className="text-secondary">
                     A quick overview of workshops you're managing.
                  </p>
               </div>
               <Link className="btn btn-ghost btn-sm" to="/faculty/workshops">
                  View all <ArrowRight size={14} />
               </Link>
            </div>

            {loading ? (
               <Loader text="Loading your workshops..." />
            ) : error ? (
               <div className="card">
                  <EmptyState message={error} />
               </div>
            ) : preview.length === 0 ? (
               <div className="card">
                  <EmptyState
                     message="You haven't created any workshops yet."
                     action={
                        <Link
                           className="btn btn-primary btn-sm"
                           to="/faculty/workshops/new"
                        >
                           Create workshop
                        </Link>
                     }
                  />
               </div>
            ) : (
               <div className="card">
                  <div className="card-body stack">
                     {preview.map((w, i) => {
                        const id = w._id || w.id;
                        const registered =
                           w.registeredCount ?? w.registrationsCount ?? 0;
                        const pct = w.capacity
                           ? Math.min(
                                100,
                                Math.round((registered / w.capacity) * 100),
                             )
                           : 0;
                        const editable = EDITABLE_STATUSES.includes(w.status);
                        const when = w.startDate || w.date;
                        return (
                           <div key={id} className="stack">
                              {i > 0 && <hr />}
                              <div className="row-between">
                                 <div>
                                    <StatusBadge
                                       status={w.status}
                                       label={STATUS_LABELS[w.status]}
                                    />
                                    <h3 style={{ marginTop: "var(--sp-2)" }}>
                                       {w.title}
                                    </h3>
                                    <p className="text-secondary">
                                       {when
                                          ? formatDate(when)
                                          : "Date not scheduled"}
                                       {w.venue ? ` · ${w.venue}` : ""}
                                    </p>
                                 </div>
                                 {!editable && (
                                    <div className="text-right">
                                       <strong>
                                          {registered} / {w.capacity ?? "-"}
                                       </strong>
                                       <p className="text-secondary">
                                          Registrations
                                       </p>
                                    </div>
                                 )}
                              </div>
                              {!editable && (
                                 <div
                                    className="progress"
                                    style={{ "--value": `${pct}%` }}
                                 >
                                    <div className="progress__bar"></div>
                                 </div>
                              )}
                              <div className="row-between">
                                 <span className="text-muted">
                                    {[user?.name, w.type]
                                       .filter(Boolean)
                                       .join(" · ")}
                                 </span>
                                 {editable ? (
                                    <Link
                                       className="btn btn-secondary btn-sm"
                                       to={`/faculty/workshops/${id}/edit`}
                                    >
                                       Continue editing
                                    </Link>
                                 ) : (
                                    <Link
                                       className="btn btn-secondary btn-sm"
                                       to={`/faculty/workshops/${id}/attendees`}
                                    >
                                       Manage
                                    </Link>
                                 )}
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>
            )}
         </section>

         <div className="dashboard-lower">
            <section className="card">
               <div className="card-header">
                  <div>
                     <h2>Recent registrations</h2>
                     <p
                        className="text-secondary"
                        style={{ fontSize: "var(--fs-sm)" }}
                     >
                        Latest attendee activity
                     </p>
                  </div>
                  <Users />
               </div>
               <div className="card-body activity-list">
                  {activity.length === 0 ? (
                     <EmptyState message="No recent activity yet." />
                  ) : (
                     activity.map((a) => (
                        <div className="activity-item" key={a.id}>
                           <span className="icon-box">
                              {a.type === "attendance" ? (
                                 <ClipboardCheck size={16} />
                              ) : (
                                 <UserPlus size={16} />
                              )}
                           </span>
                           <div>
                              {a.type === "attendance" ? (
                                 <p>
                                    Attendance was updated for{" "}
                                    <strong>{a.workshop}</strong>.
                                 </p>
                              ) : (
                                 <p>
                                    <strong>{a.name}</strong> registered for{" "}
                                    {a.workshop}.
                                 </p>
                              )}
                              <small>{formatDateTime(a.at)}</small>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </section>

            <section className="card">
               <div className="card-header">
                  <div>
                     <h2>Quick actions</h2>
                     <p
                        className="text-secondary"
                        style={{ fontSize: "var(--fs-sm)" }}
                     >
                        Common tasks
                     </p>
                  </div>
                  <Zap />
               </div>
               <div className="card-body stack">
                  <Link
                     className="btn btn-secondary btn-block"
                     to="/faculty/workshops/new"
                  >
                     <Plus size={16} />
                     Create a workshop
                  </Link>
                  <Link
                     className="btn btn-secondary btn-block"
                     to="/faculty/workshops"
                  >
                     <Users size={16} />
                     View attendees
                  </Link>
                  <Link
                     className="btn btn-secondary btn-block"
                     to="/faculty/workshops"
                  >
                     <Award size={16} />
                     Issue certificates
                  </Link>
               </div>
            </section>
         </div>
      </>
   );
}
