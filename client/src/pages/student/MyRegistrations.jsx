import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
   CalendarClock,
   CheckCircle,
   Compass,
   QrCode,
   TicketCheck,
} from "lucide-react";
import useFetch from "../../hooks/useFetch";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";
import DataTable from "../../components/common/DataTable";
import QRModal from "../../components/workshop/QRModal";
import {
   getMyRegistrationsApi,
   getRegistrationQrApi,
} from "../../api/registrations.api";
import { formatDate, formatTime } from "../../utils/formatDate";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { notify } from "../../utils/notify";

const asArray = (v) => (Array.isArray(v) ? v : []);

export default function MyRegistrations() {
   const regs = useFetch(() => getMyRegistrationsApi(), []);
   const [now] = useState(() => Date.now());
   const [qrOpen, setQrOpen] = useState(false);
   const [qr, setQr] = useState({ loading: false, error: null, data: null });

   const { rows, stats } = useMemo(() => {
      const all = asArray(regs.data).filter((r) => r.workshop);
      const active = all.filter((r) => r.status !== "cancelled");
      const sorted = [...all].sort(
         (a, b) =>
            new Date(b.workshop.startDate) - new Date(a.workshop.startDate),
      );
      return {
         rows: sorted,
         stats: {
            total: active.length,
            upcoming: active.filter(
               (r) =>
                  r.status === "registered" &&
                  new Date(r.workshop.startDate).getTime() > now,
            ).length,
            attended: active.filter((r) => r.status === "attended").length,
         },
      };
   }, [regs.data, now]);

   const openQr = async (reg) => {
      setQrOpen(true);
      setQr({ loading: true, error: null, data: null });
      try {
         const res = await getRegistrationQrApi(reg._id);
         setQr({ loading: false, error: null, data: res.data.data });
      } catch (err) {
         const message = getErrorMessage(err);
         setQr({ loading: false, error: message, data: null });
         notify.error(message);
      }
   };

   const closeQr = () => {
      setQrOpen(false);
      setQr({ loading: false, error: null, data: null });
   };

   const columns = [
      {
         key: "workshop",
         header: "Workshop",
         render: (r) => (
            <div className="cell-title">
               <strong>
                  <Link to={`/workshops/${r.workshop._id}`}>
                     {r.workshop.title}
                  </Link>
               </strong>
               <small>
                  {[r.workshop.type, r.workshop.speaker]
                     .filter(Boolean)
                     .join(" · ")}
               </small>
            </div>
         ),
      },
      {
         key: "date",
         header: "Date & time",
         render: (r) => (
            <>
               {formatDate(r.workshop.startDate)}
               <br />
               <small>{formatTime(r.workshop.startDate)}</small>
            </>
         ),
      },
      {
         key: "venue",
         header: "Venue",
         render: (r) =>
            r.workshop.mode === "online" ? "Online" : r.workshop.venue || "-",
      },
      {
         key: "status",
         header: "Status",
         render: (r) => <StatusBadge status={r.status} />,
      },
      {
         key: "ticket",
         header: "Ticket",
         className: "cell-actions",
         render: (r) => {
            if (r.status === "registered") {
               return (
                  <button
                     type="button"
                     className="btn btn-secondary btn-sm"
                     onClick={() => openQr(r)}
                  >
                     <QrCode /> View QR
                  </button>
               );
            }
            if (r.status === "attended") {
               return (
                  <Link className="btn btn-ghost btn-sm" to="/my-certificates">
                     Certificate
                  </Link>
               );
            }
            return (
               <Link
                  className="btn btn-ghost btn-sm"
                  to={`/workshops/${r.workshop._id}`}
               >
                  View
               </Link>
            );
         },
      },
   ];

   return (
      <>
         <PageHeader
            eyebrow="YOUR WORKSHOPS"
            title="My registrations"
            subtitle="Keep track of the workshops you've signed up for."
            action={
               <Link className="btn btn-primary" to="/workshops">
                  <Compass />
                  Browse workshops
               </Link>
            }
         />

         <section className="grid-stats" aria-label="Registration summary">
            <StatCard
               icon={TicketCheck}
               label="Total registrations"
               value={stats.total}
               hint="Across all workshops"
            />
            <StatCard
               icon={CalendarClock}
               label="Upcoming"
               value={stats.upcoming}
               hint="Ready for you to attend"
            />
            <StatCard
               icon={CheckCircle}
               label="Attended"
               value={stats.attended}
               hint="Keep learning!"
            />
         </section>

         <section style={{ marginTop: "var(--sp-8)" }}>
            <div className="section-heading row-between">
               <div>
                  <h2>Your registrations</h2>
                  <p className="text-secondary">
                     Your entry QR is available for upcoming sessions.
                  </p>
               </div>
               <span className="badge badge--registered">
                  {stats.total}{" "}
                  {stats.total === 1 ? "registration" : "registrations"}
               </span>
            </div>

            <DataTable
               columns={columns}
               rows={rows}
               loading={regs.loading}
               error={regs.error}
               emptyMessage="You haven't registered for any workshops yet."
            />
         </section>

         <QRModal
            open={qrOpen}
            onClose={closeQr}
            loading={qr.loading}
            error={qr.error}
            data={qr.data}
         />
      </>
   );
}
