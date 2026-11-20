import { useMemo } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, CalendarCheck, Clock3, Users, Search } from "lucide-react";
import { getMyWorkshopsApi } from "../../api/workshops.api";
import useFetch from "../../hooks/useFetch";
import useDebounce from "../../hooks/useDebounce";
import usePagination from "../../hooks/usePagination";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import StatCard from "../../components/common/StatCard";
import Pagination from "../../components/common/Pagination";
import formatSchedule from "../../utils/formatSchedule";
import {
   STATUS_LABELS,
   WORKSHOP_TYPES,
   EDITABLE_STATUSES,
} from "../../utils/constants";
import RowActionsMenu from "../../components/workshop/RowActionsMenu";

const PAGE_SIZE = 5;
const pad = (n) => String(n).padStart(2, "0");

// Tab value -> backend statuses it covers (assumed names)
const TABS = [
   { value: "all", label: "All" },
   { value: "approved", label: "Approved" },
   { value: "pending", label: "Pending" },
   { value: "draft", label: "Draft" },
   { value: "rejected", label: "Rejected" },
];

export default function MyWorkshops() {
   const { data, loading, error, refetch } = useFetch(
      () => getMyWorkshopsApi({ limit: 100 }),
      [],
   );
   const { page, setPage, reset } = usePagination(PAGE_SIZE);

   const [search, setSearch] = useState("");
   const [type, setType] = useState("all");
   const [sort, setSort] = useState("newest");
   const [tab, setTab] = useState("all");
   const debounced = useDebounce(search, 300);

   const workshops = useMemo(
      () => (Array.isArray(data) ? data : (data?.workshops ?? [])),
      [data],
   );
   const dateOf = (w) => w.startDate || w.date;
   const registeredOf = (w) => w.registeredCount ?? w.registrationsCount ?? 0;

   const counts = useMemo(() => {
      const c = { all: workshops.length };
      TABS.slice(1).forEach((t) => {
         c[t.value] = workshops.filter((w) => w.status === t.value).length;
      });
      return c;
   }, [workshops]);

   const filtered = useMemo(() => {
      const q = debounced.trim().toLowerCase();
      let list = workshops.filter(
         (w) =>
            (tab === "all" || w.status === tab) &&
            (type === "all" || w.type === type) &&
            (!q || w.title?.toLowerCase().includes(q)),
      );
      list = [...list].sort((a, b) => {
         if (sort === "title")
            return (a.title || "").localeCompare(b.title || "");
         const da = new Date(dateOf(a) || 0).getTime();
         const db = new Date(dateOf(b) || 0).getTime();
         return sort === "oldest" ? da - db : db - da;
      });
      return list;
   }, [workshops, tab, type, sort, debounced]);

   const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
   const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
   const meta = { page, limit: PAGE_SIZE, total: filtered.length, totalPages };

   const totalRegistrations = workshops.reduce(
      (s, w) => s + registeredOf(w),
      0,
   );

   const onFilter = (setter) => (value) => {
      setter(value);
      reset();
   };

   const actionFor = (w) => {
      const id = w._id || w.id;
      if (w.status === "rejected")
         return {
            to: `/faculty/workshops/${id}/edit`,
            label: "Edit & resubmit",
         };
      if (EDITABLE_STATUSES.includes(w.status))
         return {
            to: `/faculty/workshops/${id}/edit`,
            label: "Continue editing",
         };
      if (w.status === "pending")
         return { to: `/workshops/${id}`, label: "View" };
      return { to: `/faculty/workshops/${id}/attendees`, label: "Manage" };
   };

   return (
      <>
         <section className="page-heading row-between">
            <div>
               <span className="eyebrow">FACULTY WORKSPACE</span>
               <h1>My workshops</h1>
               <p>View and manage the workshops and seminars you've created.</p>
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
               value={pad(workshops.length)}
               hint="All time"
            />
            <StatCard
               icon={Clock3}
               label="Pending approval"
               value={pad(counts.pending ?? 0)}
               hint="Awaiting admin review"
            />
            <StatCard
               icon={Users}
               label="Total registrations"
               value={totalRegistrations}
               hint="Across all workshops"
            />
         </section>

         <section style={{ marginTop: "var(--sp-8)" }}>
            <div className="toolbar">
               <div className="input-wrap search">
                  <Search className="input-icon" />
                  <input
                     className="input"
                     type="search"
                     placeholder="Search workshops by title..."
                     aria-label="Search workshops"
                     value={search}
                     onChange={(e) => {
                        setSearch(e.target.value);
                        reset();
                     }}
                  />
               </div>
               <select
                  className="input"
                  aria-label="Filter by type"
                  value={type}
                  onChange={(e) => onFilter(setType)(e.target.value)}
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
                  aria-label="Sort workshops"
                  value={sort}
                  onChange={(e) => onFilter(setSort)(e.target.value)}
               >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="title">Title A–Z</option>
               </select>
            </div>

            <div
               className="filter-tabs"
               role="group"
               aria-label="Filter by status"
            >
               {TABS.map((t) => (
                  <button
                     key={t.value}
                     type="button"
                     className={`filter-tab${tab === t.value ? " is-active" : ""}`}
                     onClick={() => onFilter(setTab)(t.value)}
                  >
                     {t.label} <span>{counts[t.value] ?? 0}</span>
                  </button>
               ))}
            </div>

            <div className="card">
               {loading ? (
                  <Loader text="Loading your workshops..." />
               ) : error ? (
                  <EmptyState message={error} />
               ) : rows.length === 0 ? (
                  <EmptyState message="No workshops match your filters." />
               ) : (
                  <div className="workshop-table-wrap">
                     <table className="workshop-table">
                        <thead>
                           <tr>
                              <th>Workshop</th>
                              <th>Type</th>
                              <th>Schedule</th>
                              <th>Registrations</th>
                              <th>Status</th>
                              <th style={{ textAlign: "right" }}>Actions</th>
                           </tr>
                        </thead>
                        <tbody>
                           {rows.map((w) => {
                              const id = w._id || w.id;
                              const start = dateOf(w);
                              const end = w.endDate;
                              const schedule = formatSchedule(start, end);
                              const action = actionFor(w);
                              return (
                                 <tr key={id}>
                                    <td>
                                       <div className="event-title">
                                          {w.title}
                                       </div>
                                       <div className="event-subtitle">
                                          {[w.department, w.speaker]
                                             .filter(Boolean)
                                             .join(" · ")}
                                       </div>
                                    </td>
                                    <td>{w.type}</td>
                                    <td>
                                       {schedule.primary}
                                       <br />
                                       <span className="event-subtitle">
                                          {schedule.secondary}
                                       </span>
                                    </td>
                                    <td>
                                       <span className="registration-count">
                                          {registeredOf(w)} /{" "}
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
                                             to={action.to}
                                          >
                                             {action.label}
                                          </Link>
                                          <RowActionsMenu
                                             workshop={w}
                                             onChanged={refetch}
                                             showGenerateCert
                                          />
                                       </div>
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               )}

               {!loading && !error && filtered.length > 0 && (
                  <div className="table-footer">
                     <span>
                        Showing {rows.length} of {filtered.length} workshops
                     </span>
                     <Pagination meta={meta} onPageChange={setPage} />
                  </div>
               )}
            </div>
         </section>
      </>
   );
}
