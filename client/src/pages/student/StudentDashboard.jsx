import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
   Activity,
   ArrowRight,
   Award,
   CalendarDays,
   CalendarPlus,
   CheckCircle,
   CircleAlert,
   Clock,
   MapPin,
   Calendar,
   Plus,
   TicketCheck,
   Video,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import useFetch from "../../hooks/useFetch";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import WorkshopCard from "../../components/workshop/WorkshopCard";
import { getMyRegistrationsApi } from "../../api/registrations.api";
import { getMyCertificatesApi } from "../../api/certificates.api";
import { getWorkshopsApi } from "../../api/workshops.api";
import {
   formatDateTime,
   formatLongDate,
   formatTime,
   getGreeting,
} from "../../utils/formatDate";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const asArray = (v) => (Array.isArray(v) ? v : []);

export default function StudentDashboard() {
   const { user } = useAuth();
   const [now] = useState(() => Date.now());
   const regs = useFetch(() => getMyRegistrationsApi(), []);
   const certs = useFetch(() => getMyCertificatesApi(), []);
   const discover = useFetch(
      () => getWorkshopsApi({ limit: 9, upcoming: true }),
      [],
   );

   const stats = useMemo(() => {
      // const now = Date.now();
      const registrations = asArray(regs.data).filter((r) => r.workshop);
      const active = registrations.filter((r) => r.status === "registered");
      const upcoming = active
         .filter((r) => new Date(r.workshop.startDate).getTime() > now)
         .sort(
            (a, b) =>
               new Date(a.workshop.startDate) - new Date(b.workshop.startDate),
         );
      const thisWeek = upcoming.filter(
         (r) => new Date(r.workshop.startDate).getTime() - now < WEEK,
      );
      const certificates = asArray(certs.data);

      // Recent activity is derived: the backend has no activity feed
      const activity = [
         ...registrations.map((r) => ({
            id: `r-${r._id}`,
            date: r.createdAt,
            icon: r.status === "waitlisted" ? CalendarPlus : CheckCircle,
            text:
               r.status === "waitlisted" ? (
                  <>
                     You joined the waitlist for{" "}
                     <strong>{r.workshop.title}</strong>.
                  </>
               ) : (
                  <>
                     You registered for <strong>{r.workshop.title}</strong>.
                  </>
               ),
         })),
         ...certificates
            .filter((c) => c.workshop)
            .map((c) => ({
               id: `c-${c._id}`,
               date: c.issuedAt || c.createdAt,
               icon: Award,
               text: (
                  <>
                     Your certificate for <strong>{c.workshop.title}</strong> is
                     ready.
                  </>
               ),
            })),
      ]
         .filter((a) => a.date)
         .sort((a, b) => new Date(b.date) - new Date(a.date))
         .slice(0, 3);

      return {
         registrations,
         registeredCount: active.length,
         upcoming,
         thisWeekCount: thisWeek.length,
         next: upcoming[0],
         certificateCount: certificates.length,
         activity,
      };
   }, [regs.data, certs.data, now]);

   // Hide workshops I already joined, show 3
   const discoverList = useMemo(() => {
      const joined = new Set(stats.registrations.map((r) => r.workshop._id));
      return asArray(discover.data)
         .filter((w) => w.status === "approved" && !joined.has(w._id))
         .slice(0, 3);
   }, [discover.data, stats.registrations]);

   if (regs.loading || certs.loading) return <Loader />;

   const loadError = regs.error || certs.error;
   const firstName = user.name.split(" ")[0];
   const next = stats.next?.workshop;

   return (
      <>
         <PageHeader
            eyebrow={formatLongDate(new Date(), true)
               .replace(/,/g, "")
               .toUpperCase()}
            title={`${getGreeting()}, ${firstName} 👋`}
            subtitle="Here's what's happening with your workshops."
            action={
               <Link className="btn btn-primary" to="/workshops">
                  <Plus />
                  Explore workshops
               </Link>
            }
         />

         {loadError && (
            <div
               className="alert alert--danger"
               role="alert"
               style={{ marginBottom: "var(--sp-5)" }}
            >
               <CircleAlert />
               <div>
                  <p className="alert__title">
                     Could not load some of your data
                  </p>
                  <p>{loadError}</p>
                  <button
                     type="button"
                     className="btn btn-secondary btn-sm"
                     onClick={() => {
                        regs.refetch();
                        certs.refetch();
                     }}
                  >
                     Try again
                  </button>
               </div>
            </div>
         )}

         <section className="grid-stats" aria-label="Your workshop statistics">
            <StatCard
               icon={TicketCheck}
               label="Registered workshops"
               value={stats.registeredCount}
               hint={`${stats.thisWeekCount} happening this week`}
            />
            <StatCard
               icon={CalendarDays}
               label="Upcoming sessions"
               value={stats.upcoming.length}
               hint={
                  next
                     ? `Your next one is ${formatLongDate(next.startDate).split(",")[0]}`
                     : "Nothing scheduled yet"
               }
            />
            <StatCard
               icon={Award}
               label="Certificates earned"
               value={stats.certificateCount}
               hint="Keep learning!"
            />
         </section>

         <section style={{ marginTop: "var(--sp-8)" }}>
            <div className="section-heading row-between">
               <div>
                  <h2>Discover workshops</h2>
                  <p className="text-secondary">
                     Find your next opportunity to learn something new.
                  </p>
               </div>
               <Link className="btn btn-ghost btn-sm" to="/workshops">
                  View all <ArrowRight />
               </Link>
            </div>

            {discover.loading ? (
               <Loader />
            ) : discover.error ? (
               <EmptyState message={discover.error} icon="⚠️" />
            ) : discoverList.length === 0 ? (
               <EmptyState
                  message="No new workshops right now. Check back soon."
                  icon="📭"
               />
            ) : (
               <div className="grid-cards">
                  {discoverList.map((w) => (
                     <WorkshopCard key={w._id} workshop={w} />
                  ))}
               </div>
            )}
         </section>

         <div className="dashboard-lower">
            <section className="card">
               <div className="card-header">
                  <div>
                     <h2>Recent activity</h2>
                     <p
                        className="text-secondary"
                        style={{ fontSize: "var(--fs-sm)" }}
                     >
                        Your latest updates
                     </p>
                  </div>
                  <Activity />
               </div>
               <div className="card-body activity-list">
                  {stats.activity.length === 0 ? (
                     <EmptyState message="No activity yet. Register for a workshop to get started." />
                  ) : (
                     stats.activity.map(({ id, icon: Icon, text, date }) => (
                        <div className="activity-item" key={id}>
                           <span className="icon-box">
                              <Icon />
                           </span>
                           <div>
                              <p>{text}</p>
                              <small>{formatDateTime(date)}</small>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </section>

            <section className="card">
               <div className="card-header">
                  <div>
                     <h2>Next session</h2>
                     <p
                        className="text-secondary"
                        style={{ fontSize: "var(--fs-sm)" }}
                     >
                        Your upcoming workshop
                     </p>
                  </div>
                  {next && <StatusBadge status="registered" />}
               </div>
               <div className="card-body stack">
                  {next ? (
                     <>
                        <div>
                           <span className="badge badge--accent">
                              {next.type}
                           </span>
                           <h3 style={{ marginTop: "var(--sp-3)" }}>
                              {next.title}
                           </h3>
                        </div>
                        <ul className="meta-list">
                           <li>
                              <Calendar />
                              {formatLongDate(next.startDate)}
                           </li>
                           <li>
                              <Clock />
                              {formatTime(next.startDate)} –{" "}
                              {formatTime(next.endDate)}
                           </li>
                           <li>
                              {next.mode === "online" ? <Video /> : <MapPin />}
                              {next.mode === "online"
                                 ? "Online"
                                 : next.venue || "Venue to be announced"}
                           </li>
                        </ul>
                        <Link
                           className="btn btn-secondary btn-block"
                           to="/my-registrations"
                        >
                           View registration <ArrowRight />
                        </Link>
                     </>
                  ) : (
                     <EmptyState
                        message="You have no upcoming sessions."
                        action={
                           <Link
                              className="btn btn-primary btn-sm"
                              to="/workshops"
                           >
                              Browse workshops
                           </Link>
                        }
                     />
                  )}
               </div>
            </section>
         </div>
      </>
   );
}
