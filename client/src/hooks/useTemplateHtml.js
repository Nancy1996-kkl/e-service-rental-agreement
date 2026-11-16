import { useEffect, useState } from 'react';
import { templateApi } from '../api/templateApi.js';

// Oru template-oda full HTML edukka.
// Cache-la irundha udane kaattrom (tabs fast-ah switch aaga), aana background-la
// server kitta latest version-um edukkrom — template update aanaa automatic-ah maarum.
const cache = new Map();

export function useTemplateHtml(templateId) {
  const [state, setState] = useState(() => ({ template: cache.get(templateId) || null, error: null }));

  useEffect(() => {
    if (!templateId) return;
    let active = true;
    setState({ template: cache.get(templateId) || null, error: null });

    templateApi
      .get(templateId)
      .then((res) => {
        cache.set(templateId, res.template);
        if (active) setState({ template: res.template, error: null });
      })
      .catch((error) => active && !cache.has(templateId) && setState({ template: null, error }));

    return () => {
      active = false;
    };
  }, [templateId]);

  return state;
}
