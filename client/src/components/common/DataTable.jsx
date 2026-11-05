import Loader from "./Loader";
import EmptyState from "./EmptyState";
import Pagination from "./Pagination";

// columns: [{ key, header, render?: (row) => node, className? }]
// <DataTable columns rows loading error emptyMessage meta onPageChange itemLabel="attendees" />
// Search/filter bars (.table-toolbar / .filter-bar) are rendered by the page, above this.
export default function DataTable({
   columns,
   rows = [],
   rowKey = "_id",
   loading = false,
   error = null,
   emptyMessage = "Nothing to show.",
   meta,
   onPageChange,
   itemLabel = "items",
   tableClassName = "table",
}) {
   let body;
   if (loading) body = <Loader text="Loading..." />;
   else if (error) body = <EmptyState message={error} icon="⚠️" />;
   else if (rows.length === 0) body = <EmptyState message={emptyMessage} />;
   else {
      body = (
         <table className={tableClassName}>
            <thead>
               <tr>
                  {columns.map((c) => (
                     <th key={c.key} className={c.className}>
                        {c.header}
                     </th>
                  ))}
               </tr>
            </thead>
            <tbody>
               {rows.map((row) => (
                  <tr key={row[rowKey]}>
                     {columns.map((c) => (
                        <td key={c.key} className={c.className}>
                           {c.render ? c.render(row) : row[c.key]}
                        </td>
                     ))}
                  </tr>
               ))}
            </tbody>
         </table>
      );
   }

   return (
      <div className="card">
         <div className="table-wrap">{body}</div>
         {meta && !loading && !error && rows.length > 0 && (
            <div className="table-footer">
               <span>
                  Showing {rows.length} of {meta.total} {itemLabel}
               </span>
               <Pagination meta={meta} onPageChange={onPageChange} />
            </div>
         )}
      </div>
   );
}
