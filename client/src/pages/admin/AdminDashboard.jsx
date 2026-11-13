import { Link } from "react-router-dom";
import {
   Plus,
   ArrowRight,
   CalendarDays,
   Users,
   Clock,
   CalendarPlus,
   CheckCircle,
   Calendar,
   CalendarX,
   CalendarCheck,
   Settings,
   ChartNoAxesColumn,
   ShieldCheck,
} from "lucide-react";
import { getWorkshopsApi } from "../../api/workshops.api";
import useFetch from "../../hooks/useFetch";
import useAuth from "../../hooks/useAuth";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatCard from "../../components/common/StatCard";
import {
   formatDate,
   formatLongDate,
   formatDateTime,
} from "../../utils/formatDate";
import { useState } from "react";
import { getStatsApi } from "../../api/stats.api";

const pad = (n) => String(n).padStart(2, "0");
const asArray = (v) => (Array.isArray(v) ? v : []);
const registeredOf = (w) => w.registeredCount ?? 0;

export default function AdminDashboard() {
   const { user } = useAuth();
   const stats = useFetch(() => getStatsApi(), []);
   const pending = useFetch(
      () => getWorkshopsApi({ status: "pending", limit: 5 }),
      [],
   );
   const recentList = useFetch(() => getWorkshopsApi({ limit: 20 }), []);

   const t = stats.data?.totals;
   const upcomingCount = stats.data?.upcoming?.length ?? 0;
   const pendingList = asArray(pending.data);
   const [now] = useState(() => Date.now());

   const recent = asArray(recentList.data)
      .filter((w) => ["approved", "completed"].includes(w.status))
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
      .slice(0, 3);

   return (
      <>
         <section className="dashboard-heading row-between">
            <div>
               <span className="eyebrow">
                  {formatLongDate(new Date(), true).toUpperCase()}
               </span>
               <h1>Welcome back, {user?.name || "Admin"} 👋</h1>
               <p>Here's an overview of your Workshop Hub platform.</p>
            </div>
            <Link className="btn btn-primary" to="/faculty/workshops/new">
               <Plus size={16} />
               Create event
            </Link>
         </section>

         <section className="grid-stats">
            <StatCard
               icon={CalendarDays}
               label="Total events"
               value={stats.loading ? "-" : (t?.workshops ?? "-")}
               hint={`${upcomingCount} upcoming`}
            />
            <StatCard
               icon={Users}
               label="Registered users"
               value={stats.loading ? "-" : (t?.users?.toLocaleString() ?? "-")}
               hint="Across all roles"
            />
            <StatCard
               icon={Clock}
               label="Pending approvals"
               value={stats.loading ? "-" : pad(t?.pendingApprovals ?? 0)}
               hint="Needs your attention"
            />
         </section>

         <section style={{ marginTop: "var(--sp-8)" }}>
            <div className="section-heading row-between">
               <div>
                  <h2>Pending approvals</h2>
                  <p className="text-secondary">
                     Review newly submitted events.
                  </p>
               </div>
               <Link className="btn btn-ghost btn-sm" to="/admin/approvals">
                  View all <ArrowRight size={14} />
               </Link>
            </div>
            <div className="card">
               {pending.loading ? (
                  <Loader text="Loading approvals..." />
               ) : pending.error ? (
                  <EmptyState message={pending.error} />
               ) : pendingList.length === 0 ? (
                  <EmptyState message="No workshops waiting for review." />
               ) : (
                  <div className="card-body activity-list">
                     {pendingList.map((w) => (
                        <div className="activity-item" key={w._id || w.id}>
                           <span className="icon-box">
                              <CalendarPlus size={16} />
                           </span>
                           <div style={{ flex: 1 }}>
                              <p>
                                 <strong>{w.title}</strong>
                              </p>
                              <small>
                                 Submitted by {w.createdBy?.name || "faculty"} ·{" "}
                                 {formatDateTime(w.updatedAt || w.createdAt)}
                              </small>
                           </div>
                           <span className="badge badge--warning">Pending</span>
                           <Link
                              className="btn btn-secondary btn-sm"
                              to="/admin/approvals"
                           >
                              Review
                           </Link>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </section>

         <div className="dashboard-lower">
            <section className="card">
               <div className="card-header">
                  <div>
                     <h2>Recent events</h2>
                     <p
                        className="text-secondary"
                        style={{ fontSize: "var(--fs-sm)" }}
                     >
                        Platform event activity
                     </p>
                  </div>
                  <CalendarCheck size={18} />
               </div>
               <div className="card-body activity-list">
                  {recentList.loading ? (
                     <Loader text="Loading events..." />
                  ) : recent.length === 0 ? (
                     <EmptyState message="No events yet." />
                  ) : (
                     recent.map((w) => {
                        const ended = w.status === "completed";
                        const Icon = ended
                           ? CalendarX
                           : new Date(w.startDate) > now
                             ? Calendar
                             : CheckCircle;
                        return (
                           <div className="activity-item" key={w._id || w.id}>
                              <span className="icon-box">
                                 <Icon size={16} />
                              </span>
                              <div>
                                 <p>
                                    <strong>{w.title}</strong>{" "}
                                    {ended
                                       ? "has been completed."
                                       : "is accepting registrations."}
                                 </p>
                                 <small>
                                    {formatDate(w.startDate)} ·{" "}
                                    {registeredOf(w)} registrations
                                 </small>
                              </div>
                              {ended ? (
                                 <span className="badge badge--neutral">
                                    Ended
                                 </span>
                              ) : (
                                 <span className="badge badge--success">
                                    Live
                                 </span>
                              )}
                           </div>
                        );
                     })
                  )}
               </div>
            </section>

            <section className="card">
               <div className="card-header">
                  <div>
                     <h2>Quick management</h2>
                     <p
                        className="text-secondary"
                        style={{ fontSize: "var(--fs-sm)" }}
                     >
                        Platform shortcuts
                     </p>
                  </div>
                  <Settings size={18} />
               </div>
               <div className="card-body stack">
                  <Link
                     className="btn btn-secondary btn-block"
                     to="/admin/users"
                  >
                     <Users size={16} />
                     Manage users
                  </Link>
                  <Link
                     className="btn btn-secondary btn-block"
                     to="/admin/reports"
                  >
                     <ChartNoAxesColumn size={16} />
                     View reports
                  </Link>
                  <Link
                     className="btn btn-secondary btn-block"
                     to="/admin/activity"
                  >
                     <ShieldCheck size={16} />
                     Activity log
                  </Link>
               </div>
            </section>
         </div>
      </>
   );
}
