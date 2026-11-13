import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Search, Download } from "lucide-react";
import { getWorkshopApi } from "../../api/workshops.api";
import { getWorkshopAttendeesApi } from "../../api/registrations.api";
import useFetch from "../../hooks/useFetch";
import useDebounce from "../../hooks/useDebounce";
import usePagination from "../../hooks/usePagination";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
import { formatDate } from "../../utils/formatDate";
import formatSchedule from "../../utils/formatSchedule";
import { STATUS_LABELS } from "../../utils/constants";
import PersonCell from "../../components/common/PersonCell";

const PAGE_SIZE = 5;

// Normalise one attendee record (field names are assumptions)
const normalise = (r) => ({
   id: r._id,
   name: r.user?.name || "",
   email: r.user?.email || "",
   roll: r.user?.identifier || "",
   department: r.user?.department || "",
   registeredOn: r.registeredAt,
   present: r.status === "attended",
});

export default function AttendeeList() {
   const { id } = useParams();
   const { data: workshop } = useFetch(() => getWorkshopApi(id), [id]);
   const { data, loading, error } = useFetch(
      () => getWorkshopAttendeesApi(id, { limit: 1000 }),
      [id],
   );
   const { page, setPage, reset } = usePagination(PAGE_SIZE);

   const [search, setSearch] = useState("");
   const [filter, setFilter] = useState("all");
   const debounced = useDebounce(search, 300);

   const w = workshop?.workshop || workshop;

   const attendees = useMemo(
      () =>
         (Array.isArray(data) ? data : [])
            .filter((r) => r.status !== "cancelled")
            .map(normalise),
      [data],
   );

   const presentCount = attendees.filter((a) => a.present).length;

   const filtered = useMemo(() => {
      const q = debounced.trim().toLowerCase();
      return attendees.filter(
         (a) =>
            (filter === "all" ||
               (filter === "present" ? a.present : !a.present)) &&
            (!q || `${a.name} ${a.email} ${a.roll}`.toLowerCase().includes(q)),
      );
   }, [attendees, filter, debounced]);

   const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
   const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
   const meta = { page, limit: PAGE_SIZE, total: filtered.length, totalPages };

   const handleExport = () => {
      const header = [
         "Name",
         "Email",
         "Roll number",
         "Department",
         "Registered on",
         "Attendance",
      ];
      const body = filtered.map((a) => [
         a.name,
         a.email,
         a.roll,
         a.department,
         a.registeredOn ? formatDate(a.registeredOn) : "",
         a.present ? "Present" : "Not checked in",
      ]);
      const csv = [header, ...body]
         .map((row) =>
            row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
         )
         .join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "attendees.csv";
      a.click();
      URL.revokeObjectURL(url);
   };

   const start = w?.startDate || w?.date;
   const end = w?.endDate;

   return (
      <>
         <section className="page-heading row-between">
            <div>
               <span className="eyebrow">FACULTY WORKSPACE</span>
               <h1>Attendee list</h1>
               <p>
                  View registration details and track attendance. Attendee QR
                  codes are available only to registered students.
               </p>
            </div>
            <Link className="btn btn-secondary" to="/faculty/workshops">
               <ArrowLeft size={16} />
               Back to workshops
            </Link>
         </section>

         {w && (
            <section className="card event-context">
               <div>
                  <div className="event-title">{w.title}</div>
                  <div className="event-context__meta">
                     {(() => {
                        const s = formatSchedule(start, end);
                        return [w.type, s.primary, s.secondary]
                           .filter(Boolean)
                           .join(" · ");
                     })()}
                  </div>
               </div>
               <StatusBadge status={w.status} label={STATUS_LABELS[w.status]} />
            </section>
         )}

         <section className="stats-row">
            <article className="card mini-stat">
               <span>Total registrations</span>
               <strong>{attendees.length}</strong>
            </article>
            <article className="card mini-stat">
               <span>Present</span>
               <strong>{presentCount}</strong>
            </article>
            <article className="card mini-stat">
               <span>Not checked in</span>
               <strong>{attendees.length - presentCount}</strong>
            </article>
         </section>

         <section>
            <div className="toolbar">
               <div className="input-wrap search">
                  <Search className="input-icon" />
                  <input
                     className="input"
                     type="search"
                     placeholder="Search by name, email or roll number..."
                     aria-label="Search attendees"
                     value={search}
                     onChange={(e) => {
                        setSearch(e.target.value);
                        reset();
                     }}
                  />
               </div>
               <select
                  className="input"
                  aria-label="Filter by attendance"
                  value={filter}
                  onChange={(e) => {
                     setFilter(e.target.value);
                     reset();
                  }}
               >
                  <option value="all">All attendees</option>
                  <option value="present">Present</option>
                  <option value="pending">Not checked in</option>
               </select>
               <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={handleExport}
                  disabled={filtered.length === 0}
               >
                  <Download size={16} />
                  Export CSV
               </button>
            </div>

            <div className="card">
               {loading ? (
                  <Loader text="Loading attendees..." />
               ) : error ? (
                  <EmptyState message={error} />
               ) : rows.length === 0 ? (
                  <EmptyState message="No attendees match your search." />
               ) : (
                  <div className="table-wrap">
                     <table className="attendee-table">
                        <thead>
                           <tr>
                              <th>Student</th>
                              <th>Roll number</th>
                              <th>Department</th>
                              <th>Registered on</th>
                              <th>Attendance</th>
                           </tr>
                        </thead>
                        <tbody>
                           {rows.map((a) => (
                              <tr key={a.id}>
                                 <td>
                                    <PersonCell name={a.name} email={a.email} />
                                 </td>
                                 <td>{a.roll || "-"}</td>
                                 <td>{a.department || "-"}</td>
                                 <td>
                                    {a.registeredOn
                                       ? formatDate(a.registeredOn)
                                       : "-"}
                                 </td>
                                 <td>
                                    {a.present ? (
                                       <span className="badge badge--success">
                                          Present
                                       </span>
                                    ) : (
                                       <span className="badge badge--warning">
                                          Not checked in
                                       </span>
                                    )}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               )}

               {!loading && !error && filtered.length > 0 && (
                  <div className="table-footer">
                     <span>
                        Showing {rows.length} of {filtered.length} attendees
                     </span>
                     <Pagination meta={meta} onPageChange={setPage} />
                  </div>
               )}
            </div>
         </section>
      </>
   );
}
