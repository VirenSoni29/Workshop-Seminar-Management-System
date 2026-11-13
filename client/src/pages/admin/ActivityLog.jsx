import { useState } from "react";
import {
   CalendarPlus,
   CheckCircle,
   XCircle,
   CheckCheck,
   Ban,
   Trash2,
   UserCog,
   UserCheck,
   UserX,
   Send,
   ShieldCheck,
} from "lucide-react";
import { getActivityApi } from "../../api/activity.api";
import useFetch from "../../hooks/useFetch";
import usePagination from "../../hooks/usePagination";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import { formatDateTime } from "../../utils/formatDate";

const PAGE_SIZE = 15;

// action -> icon + sentence
const ACTIONS = {
   "workshop.submitted": { icon: Send, verb: "submitted" },
   "workshop.approved": { icon: CheckCircle, verb: "approved" },
   "workshop.rejected": { icon: XCircle, verb: "rejected" },
   "workshop.completed": { icon: CheckCheck, verb: "marked as completed" },
   "workshop.cancelled": { icon: Ban, verb: "cancelled" },
   "workshop.deleted": { icon: Trash2, verb: "deleted" },
   "user.role_changed": { icon: UserCog, verb: "changed the role of" },
   "user.activated": { icon: UserCheck, verb: "activated the account of" },
   "user.deactivated": { icon: UserX, verb: "deactivated the account of" },
};

const FILTERS = [
   { value: "all", label: "All activity" },
   { value: "workshop", label: "Workshops" },
   { value: "user", label: "Users" },
];

export default function ActivityLog() {
   const { page, setPage, reset } = usePagination(PAGE_SIZE);
   const [entityType, setEntityType] = useState("all");

   const { data, meta, loading, error } = useFetch(
      () =>
         getActivityApi({
            page,
            limit: PAGE_SIZE,
            ...(entityType !== "all" && { entityType }),
         }),
      [page, entityType],
   );

   const rows = Array.isArray(data) ? data : [];

   return (
      <>
         <section className="page-heading">
            <span className="eyebrow">ADMINISTRATION</span>
            <h1>Activity log</h1>
            <p>
               A record of approvals, rejections and account changes made on the
               platform.
            </p>
         </section>

         <div className="toolbar">
            <select
               className="input"
               aria-label="Filter by type"
               value={entityType}
               onChange={(e) => {
                  setEntityType(e.target.value);
                  reset();
               }}
            >
               {FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                     {f.label}
                  </option>
               ))}
            </select>
         </div>

         <section className="card">
            <div className="card-header">
               <div>
                  <h2>Recent activity</h2>
                  <p
                     className="text-secondary"
                     style={{ fontSize: "var(--fs-sm)" }}
                  >
                     Newest first
                  </p>
               </div>
               <ShieldCheck size={18} />
            </div>

            {loading ? (
               <Loader text="Loading activity..." />
            ) : error ? (
               <EmptyState message={error} />
            ) : rows.length === 0 ? (
               <EmptyState message="No activity recorded yet." />
            ) : (
               <div className="card-body activity-list">
                  {rows.map((a) => {
                     const cfg = ACTIONS[a.action] || {
                        icon: CalendarPlus,
                        verb: a.action,
                     };
                     const Icon = cfg.icon;
                     return (
                        <div className="activity-item" key={a._id}>
                           <span className="icon-box">
                              <Icon size={16} />
                           </span>
                           <div>
                              <p>
                                 <strong>
                                    {a.actor?.name || "Unknown user"}
                                 </strong>{" "}
                                 {cfg.verb}{" "}
                                 <strong>{a.entityLabel || "an item"}</strong>.
                              </p>
                              {a.details && <small>{a.details}</small>}
                              <small style={{ display: "block" }}>
                                 {formatDateTime(a.createdAt)}
                              </small>
                           </div>
                        </div>
                     );
                  })}
               </div>
            )}

            {!loading && !error && meta?.totalPages > 1 && (
               <div className="card-body">
                  <Pagination meta={meta} onPageChange={setPage} />
               </div>
            )}
         </section>
      </>
   );
}
