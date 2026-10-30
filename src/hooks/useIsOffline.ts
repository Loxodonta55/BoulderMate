import { useEffect, useState } from 'react';

/** SPEC-045: true, solange das Gerät kein Netz hat (navigator.onLine + online/offline-Ereignisse). */
export function useIsOffline(): boolean {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false);
  useEffect(() => {
    const update = () => setOffline(navigator.onLine === false);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return offline;
}
