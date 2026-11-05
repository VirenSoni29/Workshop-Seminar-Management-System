import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/getErrorMessage';

// fetcher: (signal) => axios promise. Pass `deps` to re-fetch when they change.
// Returns data = res.data.data and meta = res.data.meta.
export default function useFetch(fetcher, deps = [], { immediate = true } = {}) {
   const [data, setData] = useState(null);
   const [meta, setMeta] = useState(null);
   const [loading, setLoading] = useState(immediate);
   const [error, setError] = useState(null);

   const fetcherRef = useRef(fetcher);
   fetcherRef.current = fetcher;
   const requestId = useRef(0);

   const run = useCallback(async () => {
      const id = ++requestId.current; // ignore stale responses
      setLoading(true);
      setError(null);
      try {
         const res = await fetcherRef.current();
         if (id !== requestId.current) return;
         setData(res.data.data);
         setMeta(res.data.meta ?? null);
      } catch (err) {
         if (id !== requestId.current) return;
         setError(getErrorMessage(err));
      } finally {
         if (id === requestId.current) setLoading(false);
      }
   }, []);

   useEffect(() => {
      if (immediate) run();
      return () => {
         requestId.current++; // invalidate on unmount / deps change
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, deps);

   return { data, meta, loading, error, refetch: run, setData };
}