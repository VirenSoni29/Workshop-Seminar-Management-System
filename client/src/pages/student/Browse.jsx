import { useMemo, useState } from "react"; // Removed useEffect
import {
   ArrowDown,
   CircleAlert,
   Search,
   SlidersHorizontal,
} from "lucide-react";
import useFetch from "../../hooks/useFetch";
import useDebounce from "../../hooks/useDebounce";
import usePagination from "../../hooks/usePagination";
import Loader, { Spinner } from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import WorkshopCard from "../../components/workshop/WorkshopCard";
import { getWorkshopsApi } from "../../api/workshops.api";
import {
   WORKSHOP_TYPES,
   MODE_LABELS,
   WORKSHOP_MODES,
} from "../../utils/constants";

const VIEWS = [
   { key: "all", label: "All" },
   { key: "upcoming", label: "Upcoming" },
   { key: "open", label: "Open for registration" },
];

export default function Browse() {
   const { page, limit, setPage, reset } = usePagination(9);
   const [q, setQ] = useState("");
   const [appliedQ, setAppliedQ] = useState("");
   const [type, setType] = useState("");
   const [mode, setMode] = useState("");
   const [view, setView] = useState("all");

   // 1. Replace `items` with `pages` + `prevData`
   const [pages, setPages] = useState({});
   const [prevData, setPrevData] = useState(null);

   // 2. Sync debounced search without useEffect
   const debouncedQ = useDebounce(q);
   const [prevDebouncedQ, setPrevDebouncedQ] = useState(debouncedQ);

   if (debouncedQ !== prevDebouncedQ) {
      setPrevDebouncedQ(debouncedQ);
      setAppliedQ(debouncedQ.trim());
      reset();
   }

   const { data, meta, loading, error, refetch } = useFetch(() => {
      const params = { page, limit };
      if (appliedQ) params.q = appliedQ;
      if (type) params.type = type;
      if (mode) params.mode = mode;
      if (view !== "all") params.upcoming = true;
      if (view === "open") params.status = "approved";
      return getWorkshopsApi(params);
   }, [page, limit, appliedQ, type, mode, view]);

   // 3. Store fetched page data without useEffect
   if (data !== prevData) {
      setPrevData(data);
      if (Array.isArray(data) && meta?.page) {
         setPages((prev) =>
            meta.page === 1 ? { 1: data } : { ...prev, [meta.page]: data },
         );
      }
   }

   // 4. Flatten pages, deduplicate, and filter approved/completed
   const visible = useMemo(() => {
      const seen = new Set();
      return Object.keys(pages)
         .sort((a, b) => Number(a) - Number(b))
         .flatMap((p) => pages[p])
         .filter((w) => {
            if (seen.has(w._id)) return false;
            seen.add(w._id);
            return ["approved", "completed"].includes(w.status);
         });
   }, [pages]);

   const changeFilter = (setter) => (e) => {
      setter(e.target.value);
      reset();
   };

   const onSubmit = (e) => {
      e.preventDefault();
      setPrevDebouncedQ(q); // Prevents debounce from firing again after manual submit
      setAppliedQ(q.trim());
      reset();
   };

   const hasMore = meta && meta.page < meta.totalPages;
   const firstLoad = loading && page === 1;

   return (
      <>
         <section className="browse-heading row-between">
            <div>
               <span className="eyebrow">EXPLORE & LEARN</span>
               <h1>Browse workshops</h1>
               <p>Discover workshops and seminars happening across campus.</p>
            </div>
         </section>

         <form className="filter-bar" onSubmit={onSubmit}>
            <div className="input-wrap">
               <Search className="input-icon" />
               <input
                  className="input"
                  type="search"
                  name="q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search workshops, topics or speakers"
                  aria-label="Search workshops"
               />
            </div>
            <label className="field">
               <span className="field__label">Category</span>
               <select
                  className="input"
                  name="type"
                  value={type}
                  onChange={changeFilter(setType)}
               >
                  <option value="">All categories</option>
                  {WORKSHOP_TYPES.map((t) => (
                     <option key={t} value={t}>
                        {t}
                     </option>
                  ))}
               </select>
            </label>
            <label className="field">
               <span className="field__label">Mode</span>
               <select
                  className="input"
                  name="mode"
                  value={mode}
                  onChange={changeFilter(setMode)}
               >
                  <option value="">All modes</option>
                  {WORKSHOP_MODES.map((m) => (
                     <option key={m} value={m}>
                        {MODE_LABELS[m]}
                     </option>
                  ))}
               </select>
            </label>
            <button className="btn btn-secondary" type="submit">
               <SlidersHorizontal />
               Filter
            </button>
         </form>

         <div className="browse-tools">
            <div className="segmented" aria-label="Workshop availability">
               {VIEWS.map((v) => (
                  <button
                     key={v.key}
                     type="button"
                     className={`segmented__item${view === v.key ? " is-active" : ""}`}
                     onClick={() => {
                        setView(v.key);
                        reset();
                     }}
                  >
                     {v.label}
                  </button>
               ))}
            </div>
            {meta && !firstLoad && !error && (
               <span className="browse-count">
                  Showing {visible.length} of {meta.total} workshops
               </span>
            )}
         </div>

         {firstLoad ? (
            <Loader />
         ) : error && visible.length === 0 ? (
            <div className="alert alert--danger" role="alert">
               <CircleAlert />
               <div>
                  <p className="alert__title">Could not load workshops</p>
                  <p>{error}</p>
                  <button
                     type="button"
                     className="btn btn-secondary btn-sm"
                     onClick={refetch}
                  >
                     Try again
                  </button>
               </div>
            </div>
         ) : visible.length === 0 ? (
            <EmptyState icon="🔎" message="No workshops match your filters." />
         ) : (
            <>
               <section className="grid-cards" aria-label="Available workshops">
                  {visible.map((w) => (
                     <WorkshopCard key={w._id} workshop={w} />
                  ))}
               </section>

               {hasMore && (
                  <div
                     className="row-center"
                     style={{ marginTop: "var(--sp-8)" }}
                  >
                     <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setPage(page + 1)}
                        disabled={loading}
                     >
                        {loading ? <Spinner /> : null}
                        Load more workshops {!loading && <ArrowDown />}
                     </button>
                  </div>
               )}
            </>
         )}
      </>
   );
}
