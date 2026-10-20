import { useEffect, useState } from 'react';

/** SPEC-049 AC-4: Knopf nach dem Senden sperren und die verbleibenden Sekunden zählen. */
export const RESEND_COOLDOWN_SECONDS = 60;

export function useCooldown(seconds: number = RESEND_COOLDOWN_SECONDS, startActive = false) {
  const [until, setUntil] = useState(() => (startActive ? Date.now() + seconds * 1000 : 0));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (until <= now) return;
    const id = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(id);
  }, [until, now]);

  const remaining = Math.max(0, Math.ceil((until - now) / 1000));
  const start = () => {
    const current = Date.now();
    setNow(current);
    setUntil(current + seconds * 1000);
  };
  return { remaining, start };
}
