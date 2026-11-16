import { useEffect, useState } from 'react';
import api from '../api/axiosInstance.js';

// Admin add panna standard clauses — preview / editor-la document-la kaatta.
// Cache-la irundha udane kudukkrom, background-la latest edukkrom.
let cache = null;

export function useClauses() {
  const [clauses, setClauses] = useState(cache || []);

  useEffect(() => {
    let active = true;
    api
      .get('/clauses')
      .then((res) => {
        cache = res.data.clauses;
        if (active) setClauses(cache);
      })
      .catch(() => {}); // Login illana / error — clauses illama preview kaattalaam
    return () => {
      active = false;
    };
  }, []);

  return clauses;
}
