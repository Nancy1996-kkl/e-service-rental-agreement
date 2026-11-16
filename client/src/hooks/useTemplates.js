import { useEffect, useState } from 'react';
import { templateApi } from '../api/templateApi.js';

// Templates list-ah server-la irundhu edukkrom (4 or 5 — admin evlo vechaalum).
// Cache-la irundha udane kaattrom (fast), aana ovvoru page open-layum server kitta
// thirumba check pannrom — admin template add/maathinaa udane theriyum (pazhaya list nikkaadhu).
let cache = null;
let inflight = null;

function fetchTemplates() {
  if (!inflight) {
    inflight = templateApi
      .list()
      .then((data) => (cache = data.templates))
      .finally(() => (inflight = null));
  }
  return inflight;
}

export function useTemplates() {
  const [templates, setTemplates] = useState(cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    fetchTemplates()
      .then((list) => active && setTemplates(list))
      .catch((err) => active && !cache && setError(err)); // Cache irundha adha kaattite irukkalaam
    return () => {
      active = false;
    };
  }, []);

  const getTemplate = (id) => templates?.find((t) => t.id === id);

  return { templates, loading: !templates && !error, error, getTemplate };
}
