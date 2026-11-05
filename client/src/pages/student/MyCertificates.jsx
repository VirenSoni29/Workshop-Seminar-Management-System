import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
   Award,
   BadgeCheck,
   Calendar,
   CalendarCheck,
   CircleAlert,
   Download,
   ExternalLink,
   Hash,
   ShieldCheck,
} from "lucide-react";
import useFetch from "../../hooks/useFetch";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import Loader, { Spinner } from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import { getMyCertificatesApi } from "../../api/certificates.api";
import { downloadBlob } from "../../utils/downloadBlob";
import { formatDate } from "../../utils/formatDate";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { notify } from "../../utils/notify";

// Header colour by workshop type (classes from your CSS; Workshop uses the default)
const TOP_CLASS = {
   Seminar: " certificate-card__top--violet",
   FDP: " certificate-card__top--green",
};

export default function MyCertificates() {
   const certs = useFetch(() => getMyCertificatesApi(), []);
   const [downloadingId, setDownloadingId] = useState(null);

   const list = useMemo(
      () =>
         (Array.isArray(certs.data) ? certs.data : [])
            .filter((c) => c.workshop)
            .sort(
               (a, b) =>
                  new Date(b.issuedAt || b.createdAt) -
                  new Date(a.issuedAt || a.createdAt),
            ),
      [certs.data],
   );

   const thisYear = list.filter(
      (c) =>
         new Date(c.issuedAt || c.createdAt).getFullYear() ===
         new Date().getFullYear(),
   ).length;

   const handleDownload = async (c) => {
      setDownloadingId(c._id);
      try {
         await downloadBlob(
            `/certificates/${c._id}/download`,
            `${c.certificateId}.pdf`,
         );
         notify.success("Certificate downloaded");
      } catch (err) {
         notify.error(getErrorMessage(err));
      } finally {
         setDownloadingId(null);
      }
   };

   return (
      <>
         <PageHeader
            eyebrow="YOUR ACHIEVEMENTS"
            title="My certificates"
            subtitle="View and share certificates earned from completed workshops."
            action={
               <a className="btn btn-secondary" href="/#verify">
                  <BadgeCheck />
                  Verify a certificate
               </a>
            }
         />

         <section className="grid-stats" aria-label="Certificate summary">
            <StatCard
               icon={Award}
               label="Certificates earned"
               value={list.length}
               hint="Across all workshops"
            />
            <StatCard
               icon={CalendarCheck}
               label="This year"
               value={thisYear}
               hint={`Issued in ${new Date().getFullYear()}`}
            />
            <StatCard
               icon={ShieldCheck}
               label="Verified"
               value={list.length}
               hint="Publicly verifiable"
            />
         </section>

         <section style={{ marginTop: "var(--sp-8)" }}>
            <div className="section-heading row-between">
               <div>
                  <h2>Your certificates</h2>
                  <p className="text-secondary">
                     Download a copy or verify its authenticity.
                  </p>
               </div>
               <span className="badge badge--success">
                  {list.length}{" "}
                  {list.length === 1 ? "certificate" : "certificates"}
               </span>
            </div>

            {certs.loading ? (
               <Loader />
            ) : certs.error ? (
               <div className="alert alert--danger" role="alert">
                  <CircleAlert />
                  <div>
                     <p className="alert__title">Could not load certificates</p>
                     <p>{certs.error}</p>
                     <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={certs.refetch}
                     >
                        Try again
                     </button>
                  </div>
               </div>
            ) : list.length === 0 ? (
               <EmptyState
                  icon="🎓"
                  message="No certificates yet. Attend a workshop and it will appear here once it is completed."
                  action={
                     <Link className="btn btn-primary btn-sm" to="/workshops">
                        Browse workshops
                     </Link>
                  }
               />
            ) : (
               <div className="grid-cards certificate-grid">
                  {list.map((c) => {
                     const w = c.workshop;
                     const busy = downloadingId === c._id;
                     return (
                        <article className="card certificate-card" key={c._id}>
                           <div
                              className={`certificate-card__top${TOP_CLASS[w.type] || ""}`}
                           >
                              <span className="certificate-card__icon">
                                 <Award />
                              </span>
                              <span className="badge badge--success">
                                 Issued
                              </span>
                           </div>
                           <div className="card-body">
                              <span className="eyebrow">
                                 {w.type.toUpperCase()} CERTIFICATE
                              </span>
                              <h3>{w.title}</h3>
                              {w.department && (
                                 <p className="text-secondary">
                                    Issued by {w.department}
                                 </p>
                              )}
                              <div className="certificate-card__meta">
                                 <span>
                                    <Calendar />{" "}
                                    {formatDate(c.issuedAt || c.createdAt)}
                                 </span>
                                 <span>
                                    <Hash /> {c.certificateId}
                                 </span>
                              </div>
                           </div>
                           <div className="card-footer certificate-card__actions">
                              <button
                                 type="button"
                                 className={`btn btn-primary btn-sm${busy ? " is-loading" : ""}`}
                                 onClick={() => handleDownload(c)}
                                 disabled={busy}
                              >
                                 {busy ? <Spinner /> : <Download />} Download
                              </button>
                              <Link
                                 className="btn btn-ghost btn-sm"
                                 to={`/verify/${c.certificateId}`}
                              >
                                 Verify <ExternalLink />
                              </Link>
                           </div>
                        </article>
                     );
                  })}
               </div>
            )}
         </section>
      </>
   );
}
