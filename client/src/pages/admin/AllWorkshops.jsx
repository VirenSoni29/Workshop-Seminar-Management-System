import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, X, CalendarDays, Clock3, Users, Database } from "lucide-react";
import { getWorkshopsApi } from "../../api/workshops.api";
import { getStatsApi } from "../../api/stats.api";
import useFetch from "../../hooks/useFetch";
import useDebounce from "../../hooks/useDebounce";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";
import { formatDate } from "../../utils/formatDate";
import { STATUS_LABELS, WORKSHOP_TYPES } from "../../utils/constants";

const pad = (n) => String(n).padStart(2, "0");
const idOf = (w) => w._id || w.id;

const TABS = [
   { value: "all", label: "All" },
   { value: "draft", label: "Draft" },
   { value: "pending", label: "Pending" },
   { value: "approved", label: "Approved" },
   { value: "rejected", label: "Rejected" },
   { value: "completed", label: "Completed" },
   { value: "cancelled", label: "Cancelled" },
];

export default function AllWorkshops() {
   const { data, loading, error } = useFetch(
      () => getWorkshopsApi({ limit: 500 }),
      [],
   );
   const stats = useFetch(() => getStatsApi(), []);

   const [search, setSearch] = useState("");
   const [type, setType] = useState("all");
   const [department, setDepartment] = useState("all");
   const [sort, setSort] = useState("newest");
   const [tab, setTab] = useState("all");
   const debounced = useDebounce(search, 300);

   const workshops = useMemo(() => (Array.isArray(data) ? data : []), [data]);

   const departments = useMemo(
      () =>
         [
            ...new Set(workshops.map((w) => w.department).filter(Boolean)),
         ].sort(),
      [workshops],
   );

   const counts = useMemo(() => {
      const c = { all: workshops.length };
      TABS.slice(1).forEach((t) => {
         c[t.value] = workshops.filter((w) => w.status === t.value).length;
      });
      return c;
   }, [workshops]);

   const filtered = useMemo(() => {
      const q = debounced.trim().toLowerCase();
      const list = workshops.filter(
         (w) =>
            (tab === "all" || w.status === tab) &&
            (type === "all" || w.type === type) &&
            (department === "all" || w.department === department) &&
            (!q ||
               [w.title, w.department, w.createdBy?.name]
                  .join(" ")
                  .toLowerCase()
                  .includes(q)),
      );
      return [...list].sort((a, b) => {
         if (sort === "title")
            return (a.title || "").localeCompare(b.title || "");
         const da = a.startDate
            ? new Date(a.startDate).getTime()
            : sort === "oldest"
              ? Infinity
              : -Infinity;
         const db = b.startDate
            ? new Date(b.startDate).getTime()
            : sort === "oldest"
              ? Infinity
              : -Infinity;
         if (da === db) return 0;
         return sort === "oldest" ? da - db : db - da;
      });
   }, [workshops, tab, type, department, sort, debounced]);

   const clearFilters = () => {
      setSearch("");
      setType("all");
      setDepartment("all");
      setSort("newest");
      setTab("all");
   };

   const t = stats.data?.totals;

   return (
      <>
         <section className="page-heading row-between">
            <div>
               <span className="eyebrow">ADMINISTRATION</span>
               <h1>All workshops</h1>
               <p>
                  View and oversee every workshop, seminar and FDP across the
                  platform.
               </p>
            </div>
            <div className="status-summary">
               <Database size={16} />
               <strong>All records</strong> · Every status
            </div>
         </section>

         <section className="grid-stats">
            <StatCard
               icon={CalendarDays}
               label="Total events"
               value={stats.loading ? "-" : (t?.workshops ?? workshops.length)}
               hint="Across all statuses"
            />
            <StatCard
               icon={Clock3}
               label="Awaiting approval"
               value={
                  stats.loading
                     ? "-"
                     : pad(t?.pendingApprovals ?? counts.pending ?? 0)
               }
               hint="Pending admin review"
            />
            <StatCard
               icon={Users}
               label="Total registrations"
               value={
                  stats.loading ? "-" : (t?.registrations ?? 0).toLocaleString()
               }
               hint="Across all events"
            />
         </section>

         <section>
            <div className="toolbar">
               <div className="input-wrap search-field">
                  <Search className="input-icon" />
                  <input
                     className="input"
                     type="search"
                     placeholder="Search title, faculty or department..."
                     aria-label="Search all workshops"
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
                  {WORKSHOP_TYPES.map((x) => (
                     <option key={x} value={x}>
                        {x}
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
               <select
                  className="input"
                  aria-label="Sort workshops"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
               >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="title">Title A–Z</option>
               </select>
            </div>

            <div
               className="filter-tabs"
               role="group"
               aria-label="Filter by event status"
            >
               {TABS.map((x) => (
                  <button
                     key={x.value}
                     type="button"
                     className={`filter-tab${tab === x.value ? " is-active" : ""}`}
                     onClick={() => setTab(x.value)}
                  >
                     {x.label} <span>{counts[x.value] ?? 0}</span>
                  </button>
               ))}
            </div>

            <div className="card">
               {loading ? (
                  <Loader text="Loading workshops..." />
               ) : error ? (
                  <EmptyState message={error} />
               ) : filtered.length === 0 ? (
                  <EmptyState message="No workshops match your filters." />
               ) : (
                  <div className="workshop-table-wrap">
                     <table className="workshop-table">
                        <thead>
                           <tr>
                              <th>Workshop / Seminar</th>
                              <th>Type</th>
                              <th>Department</th>
                              <th>Created by</th>
                              <th>Schedule</th>
                              <th>Registrations</th>
                              <th>Status</th>
                              <th style={{ textAlign: "right" }}>Actions</th>
                           </tr>
                        </thead>
                        <tbody>
                           {filtered.map((w) => {
                              const id = idOf(w);
                              const isPending = w.status === "pending";
                              return (
                                 <tr key={id}>
                                    <td>
                                       <div className="event-title">
                                          {w.title}
                                       </div>
                                       <div className="event-subtitle">
                                          {w.speaker || ""}
                                       </div>
                                    </td>
                                    <td>{w.type}</td>
                                    <td>{w.department || "-"}</td>
                                    <td>{w.createdBy?.name || "-"}</td>
                                    <td>
                                       {w.startDate
                                          ? formatDate(w.startDate)
                                          : "Not scheduled"}
                                    </td>
                                    <td>
                                       <span className="registration-count">
                                          {w.registeredCount ?? 0} /{" "}
                                          {w.capacity ?? "-"}
                                       </span>
                                    </td>
                                    <td>
                                       <StatusBadge
                                          status={w.status}
                                          label={STATUS_LABELS[w.status]}
                                       />
                                    </td>
                                    <td>
                                       <div className="table-actions">
                                          <Link
                                             className="btn btn-secondary btn-sm"
                                             to={
                                                isPending
                                                   ? "/admin/approvals"
                                                   : `/workshops/${id}`
                                             }
                                          >
                                             {isPending ? "Review" : "View"}
                                          </Link>
                                       </div>
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               )}

               {!loading && !error && (
                  <div className="table-footer">
                     <span>
                        Showing {filtered.length} of {workshops.length}{" "}
                        workshops
                     </span>
                     <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        onClick={clearFilters}
                     >
                        <X size={16} />
                        Clear filters
                     </button>
                  </div>
               )}
            </div>
         </section>
      </>
   );
}
