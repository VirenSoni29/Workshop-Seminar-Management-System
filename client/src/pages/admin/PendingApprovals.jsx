import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Eye, X, Check, Clock3, Inbox } from "lucide-react";
import {
   getWorkshopsApi,
   approveWorkshopApi,
   rejectWorkshopApi,
} from "../../api/workshops.api";
import useFetch from "../../hooks/useFetch";
import useDebounce from "../../hooks/useDebounce";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import StatCard from "../../components/common/StatCard";
import { notify } from "../../utils/notify";
import { getErrorMessage } from "../../utils/getErrorMessage";
import formatSchedule from "../../utils/formatSchedule";
import { formatDateTime } from "../../utils/formatDate";
import { WORKSHOP_TYPES } from "../../utils/constants";

const pad = (n) => String(n).padStart(2, "0");
const idOf = (w) => w._id || w.id;

export default function PendingApprovals() {
   const { data, loading, error, refetch } = useFetch(
      () => getWorkshopsApi({ status: "pending", limit: 100 }),
      [],
   );

   const [search, setSearch] = useState("");
   const [type, setType] = useState("all");
   const [department, setDepartment] = useState("all");
   const debounced = useDebounce(search, 300);

   const [busyId, setBusyId] = useState(null);
   const [rejecting, setRejecting] = useState(null); // workshop object
   const [reason, setReason] = useState("");
   const [rejectBusy, setRejectBusy] = useState(false);
   const reasonRef = useRef(null);

   const list = useMemo(() => (Array.isArray(data) ? data : []), [data]);

   const departments = useMemo(
      () => [...new Set(list.map((w) => w.department).filter(Boolean))].sort(),
      [list],
   );

   const filtered = useMemo(() => {
      const q = debounced.trim().toLowerCase();
      return list.filter(
         (w) =>
            (type === "all" || w.type === type) &&
            (department === "all" || w.department === department) &&
            (!q ||
               w.title?.toLowerCase().includes(q) ||
               w.createdBy?.name?.toLowerCase().includes(q)),
      );
   }, [list, debounced, type, department]);

   const approve = async (w) => {
      setBusyId(idOf(w));
      try {
         await approveWorkshopApi(idOf(w));
         notify.success(`“${w.title}” approved. It can now be published.`);
         refetch();
      } catch (err) {
         notify.error(getErrorMessage(err));
      } finally {
         setBusyId(null);
      }
   };

   const openReject = (w) => {
      console.log("reject clicked", w.title);
      setRejecting(w);
      setReason("");
   };
   const closeReject = () => {
      if (rejectBusy) return;
      setRejecting(null);
      setReason("");
   };

   const confirmReject = async () => {
      const remarks = reason.trim();
      if (!remarks) {
         notify.error("Please enter a rejection reason.");
         reasonRef.current?.focus();
         return;
      }
      setRejectBusy(true);
      try {
         await rejectWorkshopApi(idOf(rejecting), { remarks });
         notify.success(`“${rejecting.title}” rejected. Feedback recorded.`);
         setRejecting(null);
         setReason("");
         refetch();
      } catch (err) {
         notify.error(getErrorMessage(err));
      } finally {
         setRejectBusy(false);
      }
   };

   return (
      <>
         <section className="page-heading">
            <span className="eyebrow">ADMINISTRATION</span>
            <h1>Pending approvals</h1>
            <p>
               Review workshop, seminar and FDP submissions before publishing
               them.
            </p>
         </section>

         <section className="grid-stats">
            <StatCard
               icon={Clock3}
               label="Awaiting review"
               value={loading ? "-" : pad(list.length)}
               hint="Require your attention"
            />
         </section>

         <div className="toolbar">
            <div className="input-wrap">
               <Search className="input-icon" />
               <input
                  className="input"
                  type="search"
                  placeholder="Search event or faculty..."
                  aria-label="Search approvals"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
               />
            </div>
            <select
               className="input"
               aria-label="Filter by event type"
               value={type}
               onChange={(e) => setType(e.target.value)}
            >
               <option value="all">All types</option>
               {WORKSHOP_TYPES.map((t) => (
                  <option key={t} value={t}>
                     {t}
                  </option>
               ))}
            </select>
            <select
               className="input"
               aria-label="Filter by department"
               value={department}
               onChange={(e) => setDepartment(e.target.value)}
            >
               <option value="all">All departments</option>
               {departments.map((d) => (
                  <option key={d} value={d}>
                     {d}
                  </option>
               ))}
            </select>
         </div>

         {loading ? (
            <Loader text="Loading submissions..." />
         ) : error ? (
            <div className="card">
               <EmptyState message={error} />
            </div>
         ) : filtered.length === 0 ? (
            <div className="card empty-state">
               <Inbox />
               <h3>No pending submissions found</h3>
               <p>
                  {list.length === 0
                     ? "Everything has been reviewed."
                     : "Try changing your search or filters."}
               </p>
            </div>
         ) : (
            <section className="approval-list">
               {filtered.map((w) => {
                  const id = idOf(w);
                  const schedule = formatSchedule(w.startDate, w.endDate);
                  const busy = busyId === id;
                  return (
                     <article className="card approval-card" key={id}>
                        <div className="approval-top">
                           <div>
                              <h3>{w.title}</h3>
                              <div className="approval-meta">
                                 Submitted by{" "}
                                 <strong>
                                    {w.createdBy?.name || "Faculty"}
                                 </strong>{" "}
                                 · {formatDateTime(w.updatedAt || w.createdAt)}
                              </div>
                           </div>
                           <span className="badge badge--warning">Pending</span>
                        </div>

                        <div className="approval-grid">
                           <div>
                              <span>Type</span>
                              <strong>{w.type}</strong>
                           </div>
                           <div>
                              <span>Department</span>
                              <strong>{w.department || "-"}</strong>
                           </div>
                           <div>
                              <span>Schedule</span>
                              <strong>
                                 {[schedule.primary, schedule.secondary].join(
                                    " · ",
                                 )}
                              </strong>
                           </div>
                           <div>
                              <span>Registrations</span>
                              <strong>— / {w.capacity ?? "-"}</strong>
                           </div>
                        </div>

                        {w.description && (
                           <p className="approval-description">
                              {w.description}
                           </p>
                        )}

                        <div className="approval-actions">
                           <Link
                              className="btn btn-secondary btn-sm"
                              to={`/workshops/${id}`}
                           >
                              <Eye size={16} />
                              View details
                           </Link>
                           <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              disabled={busy}
                              onClick={() => openReject(w)}
                           >
                              <X size={16} />
                              Reject
                           </button>
                           <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={busy}
                              onClick={() => approve(w)}
                           >
                              <Check size={16} />
                              {busy ? "Approving..." : "Approve"}
                           </button>
                        </div>
                     </article>
                  );
               })}
            </section>
         )}

         <Modal
            open={Boolean(rejecting)}
            onClose={closeReject}
            title="Reject submission"
            size="sm"
            footer={
               <>
                  <button
                     type="button"
                     className="btn btn-secondary"
                     onClick={closeReject}
                     disabled={rejectBusy}
                  >
                     Cancel
                  </button>
                  <button
                     type="button"
                     className="btn btn-danger"
                     onClick={confirmReject}
                     disabled={rejectBusy}
                  >
                     {rejectBusy ? "Rejecting..." : "Confirm rejection"}
                  </button>
               </>
            }
         >
            <p className="text-secondary" style={{ marginTop: 0 }}>
               <strong>{rejecting?.title}</strong>
            </p>
            <p className="text-secondary">
               Provide a reason so the faculty member knows what needs to be
               corrected before resubmission.
            </p>
            <label className="field-label" htmlFor="reject-reason">
               Reason for rejection <span aria-hidden="true">*</span>
            </label>
            <textarea
               ref={reasonRef}
               className="input reject-reason"
               id="reject-reason"
               placeholder="Explain why this submission is being rejected..."
               value={reason}
               onChange={(e) => setReason(e.target.value)}
            />
            <small className="text-secondary">
               This feedback will be shared with the submitting faculty member.
            </small>
         </Modal>
      </>
   );
}
