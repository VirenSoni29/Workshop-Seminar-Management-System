import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
   Bar,
   BarChart,
   CartesianGrid,
   Cell,
   Legend,
   Pie,
   PieChart,
   ResponsiveContainer,
   Tooltip,
   XAxis,
   YAxis,
} from "recharts";
import { Users, Award, CalendarDays, Percent } from "lucide-react";
import { getStatsApi } from "../../api/stats.api";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatCard from "../../components/common/StatCard";
import { formatDate } from "../../utils/formatDate";
import { STATUS_LABELS, ROLE_LABELS } from "../../utils/constants";

// Colour tokens: rename to your real variables if these don't match
const ACCENT = "var(--accent, #c2410c)";
const MUTED = "var(--text-secondary, #6b7280)";
const GRID = "var(--border, #e5e5e5)";
const PALETTE = [
   "#c2410c",
   "#16a34a",
   "#d97706",
   "#2563eb",
   "#6b7280",
   "#dc2626",
   "#7c3aed",
];

const tooltipStyle = {
   background: "var(--surface, #fff)",
   border: "1px solid var(--border, #e5e5e5)",
   borderRadius: 8,
   fontSize: 13,
};

// Last 6 months as { key: 'YYYY-MM', label: 'Nov' }, oldest first
const lastSixMonths = () => {
   const out = [];
   const now = new Date();
   for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({
         key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
         label: d.toLocaleString("en-IN", { month: "short" }),
      });
   }
   return out;
};

function ChartCard({ title, subtitle, className, children }) {
   return (
      <section className={`card ${className || ""}`}>
         <div className="card-header">
            <div>
               <h2>{title}</h2>
               {subtitle && (
                  <p
                     className="text-secondary"
                     style={{ fontSize: "var(--fs-sm)" }}
                  >
                     {subtitle}
                  </p>
               )}
            </div>
         </div>
         <div className="card-body">
            <div className="tw:h-65 tw:w-full">{children}</div>
         </div>
      </section>
   );
}

const toRows = (obj, labels) =>
   Object.entries(obj || {}).map(([key, value]) => ({
      name: labels?.[key] || key,
      value,
   }));

export default function Reports() {
   const { data, loading, error } = useFetch(() => getStatsApi(), []);

   const monthly = useMemo(() => {
      const map = Object.fromEntries(
         (data?.monthlyRegistrations || []).map((m) => [m.month, m.count]),
      );
      return lastSixMonths().map((m) => ({
         name: m.label,
         value: map[m.key] || 0,
      }));
   }, [data]);

   if (loading) return <Loader text="Loading reports..." />;
   if (error)
      return (
         <div className="card">
            <EmptyState message={error} />
         </div>
      );

   const t = data?.totals || {};
   const workshopStatus = toRows(data?.workshops, STATUS_LABELS).filter(
      (r) => r.value > 0,
   );
   const registrationStatus = toRows(data?.registrations, STATUS_LABELS);
   const usersByRole = toRows(data?.users, ROLE_LABELS);
   const top = data?.topWorkshops || [];
   const upcoming = data?.upcoming || [];

   const bar = (rows) => (
      <ResponsiveContainer width="100%" height="100%">
         <BarChart
            data={rows}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
         >
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
               dataKey="name"
               tick={{ fill: MUTED, fontSize: 12 }}
               axisLine={false}
               tickLine={false}
            />
            <YAxis
               allowDecimals={false}
               tick={{ fill: MUTED, fontSize: 12 }}
               axisLine={false}
               tickLine={false}
            />
            <Tooltip
               contentStyle={tooltipStyle}
               cursor={{ fill: "rgba(0,0,0,0.04)" }}
            />
            <Bar
               dataKey="value"
               name="Count"
               fill={ACCENT}
               radius={[6, 6, 0, 0]}
               maxBarSize={48}
            />
         </BarChart>
      </ResponsiveContainer>
   );

   return (
      <>
         <section className="page-heading">
            <span className="eyebrow">ADMINISTRATION</span>
            <h1>Reports</h1>
            <p>
               Platform-wide numbers on events, registrations and attendance.
            </p>
         </section>

         <section className="grid-stats">
            <StatCard
               icon={Users}
               label="Total registrations"
               value={(t.registrations ?? 0).toLocaleString()}
               hint="All time"
            />
            <StatCard
               icon={Percent}
               label="Attendance rate"
               value={`${t.attendanceRate ?? 0}%`}
               hint="Attended of seated"
            />
            <StatCard
               icon={Award}
               label="Certificates issued"
               value={(t.certificatesIssued ?? 0).toLocaleString()}
               hint="All time"
            />
            <StatCard
               icon={CalendarDays}
               label="Total workshops"
               value={t.workshops ?? 0}
               hint={`${t.pendingApprovals ?? 0} awaiting approval`}
            />
         </section>

         <div className="tw:mt-(--sp-8) tw:grid tw:grid-cols-1 tw:gap-(--sp-5) tw:lg:grid-cols-2">
            <ChartCard
               title="Registrations per month"
               subtitle="Last 6 months"
               className="tw:lg:col-span-2"
            >
               {bar(monthly)}
            </ChartCard>

            <ChartCard
               title="Workshops by status"
               subtitle="Every workshop on the platform"
            >
               {workshopStatus.length === 0 ? (
                  <EmptyState message="No workshops yet." />
               ) : (
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={workshopStatus}
                           dataKey="value"
                           nameKey="name"
                           innerRadius={60}
                           outerRadius={90}
                           paddingAngle={2}
                        >
                           {workshopStatus.map((_, i) => (
                              <Cell
                                 key={i}
                                 fill={PALETTE[i % PALETTE.length]}
                              />
                           ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                     </PieChart>
                  </ResponsiveContainer>
               )}
            </ChartCard>

            <ChartCard
               title="Registrations by status"
               subtitle="Registered, attended and cancelled"
            >
               {bar(registrationStatus)}
            </ChartCard>

            <ChartCard
               title="Users by role"
               subtitle="Accounts on the platform"
            >
               {bar(usersByRole)}
            </ChartCard>

            <section className="card">
               <div className="card-header">
                  <div>
                     <h2>Top workshops</h2>
                     <p
                        className="text-secondary"
                        style={{ fontSize: "var(--fs-sm)" }}
                     >
                        By registrations
                     </p>
                  </div>
               </div>
               <div className="card-body tw:flex tw:flex-col tw:gap-(--sp-4)">
                  {top.length === 0 ? (
                     <EmptyState message="No data yet." />
                  ) : (
                     top.map((w) => {
                        const pct = w.capacity
                           ? Math.min(
                                100,
                                Math.round(
                                   (w.registeredCount / w.capacity) * 100,
                                ),
                             )
                           : 0;
                        return (
                           <div key={w._id || w.title}>
                              <div className="row-between">
                                 <strong>{w.title}</strong>
                                 <span className="text-secondary">
                                    {w.registeredCount} / {w.capacity}
                                 </span>
                              </div>
                              <div className="tw:mt-(--sp-2) tw:h-2 tw:overflow-hidden tw:rounded-full tw:bg-(--border,#e5e5e5)">
                                 <div
                                    className="tw:h-full tw:rounded-full"
                                    style={{
                                       width: `${pct}%`,
                                       background: ACCENT,
                                    }}
                                 />
                              </div>
                           </div>
                        );
                     })
                  )}
               </div>
            </section>

            <section className="card tw:lg:col-span-2">
               <div className="card-header">
                  <div>
                     <h2>Upcoming workshops</h2>
                     <p
                        className="text-secondary"
                        style={{ fontSize: "var(--fs-sm)" }}
                     >
                        Next approved events
                     </p>
                  </div>
               </div>
               <div className="card-body activity-list">
                  {upcoming.length === 0 ? (
                     <EmptyState message="No upcoming workshops." />
                  ) : (
                     upcoming.map((w) => (
                        <div className="activity-item" key={w._id}>
                           <span className="icon-box">
                              <CalendarDays size={16} />
                           </span>
                           <div style={{ flex: 1 }}>
                              <p>
                                 <strong>
                                    <Link to={`/workshops/${w._id}`}>
                                       {w.title}
                                    </Link>
                                 </strong>
                              </p>
                              <small>
                                 {formatDate(w.startDate)} · {w.registeredCount}{" "}
                                 / {w.capacity} registered
                              </small>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </section>
         </div>
      </>
   );
}
