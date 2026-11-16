import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Auto-save hook — user type panni nirutthina `delay` ms apram save aagum.
 *
 * const { status, schedule, flush, cancel } = useAutoSave(saveFn, 1500);
 *  - schedule(data): pudhu data vandhuchu, konja neram kazhichu save pannu
 *  - flush(): ippove save pannu (wait panna vendaam)
 *  - cancel(): pending save-ah cancel pannu
 *  - status: 'idle' | 'pending' | 'saving' | 'saved' | 'error'
 */
export function useAutoSave(save, delay = 1500) {
  const [status, setStatus] = useState('idle');
  const timer = useRef(null);
  const pendingData = useRef(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const data = pendingData.current;
    if (!data) return;
    pendingData.current = null;
    setStatus('saving');
    try {
      await saveRef.current(data);
      // Save nadakkumbodhe innum type pannirundha → thirumba pending
      setStatus(pendingData.current ? 'pending' : 'saved');
    } catch {
      setStatus('error');
    }
  }, []);

  const schedule = useCallback(
    (data) => {
      pendingData.current = data;
      setStatus('pending');
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [flush, delay]
  );

  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    pendingData.current = null;
  }, []);

  useEffect(() => {
    // Save aagaadha data irukkumbodhu tab close pannaa browser warning kaattum
    const warn = (e) => {
      if (pendingData.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);

    return () => {
      window.removeEventListener('beforeunload', warn);
      // Page-ah vittu poyitta (vera page) — pending data-ah save panniduvom
      clearTimeout(timer.current);
      if (pendingData.current) saveRef.current(pendingData.current).catch(() => {});
    };
  }, []);

  return { status, schedule, flush, cancel };
}
