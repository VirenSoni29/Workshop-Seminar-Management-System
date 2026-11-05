import { useCallback, useState } from 'react';

export default function usePagination(initialLimit = 10) {
   const [page, setPage] = useState(1);
   const [limit] = useState(initialLimit);

   const goTo = useCallback((p) => setPage(Math.max(1, p)), []);
   const reset = useCallback(() => setPage(1), []); // call when search/filters change

   return { page, limit, setPage: goTo, reset };
}