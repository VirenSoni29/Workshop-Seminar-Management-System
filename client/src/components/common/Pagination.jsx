import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

// Builds [1, '...', 4, 5, 6, '...', 20]
const getPages = (page, totalPages) => {
   if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
   const pages = [1];
   const start = Math.max(2, page - 1);
   const end = Math.min(totalPages - 1, page + 1);
   if (start > 2) pages.push("...");
   for (let p = start; p <= end; p++) pages.push(p);
   if (end < totalPages - 1) pages.push("...");
   pages.push(totalPages);
   return pages;
};

// <Pagination meta={meta} onPageChange={setPage} />   (meta = { page, limit, total, totalPages })
export default function Pagination({ meta, onPageChange }) {
   if (!meta || meta.totalPages <= 1) return null;
   const { page, totalPages } = meta;

   return (
      <nav className="pagination" aria-label="Pagination">
         <button
            type="button"
            className="pagination__btn"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
         >
            <ChevronLeft />
         </button>

         {getPages(page, totalPages).map((p, i) =>
            p === "..." ? (
               <span key={`gap-${i}`} className="pagination__info">
                  …
               </span>
            ) : (
               <button
                  key={p}
                  type="button"
                  className={clsx("pagination__btn", p === page && "is-active")}
                  onClick={() => onPageChange(p)}
                  aria-current={p === page ? "page" : undefined}
               >
                  {p}
               </button>
            ),
         )}

         <button
            type="button"
            className="pagination__btn"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
         >
            <ChevronRight />
         </button>
      </nav>
   );
}
