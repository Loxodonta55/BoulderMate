import React, { useEffect, useState } from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';
import { getPendingSyncCount, isDeviceOnline, PENDING_SYNC_EVENT } from '../../lib/pendingSync';
import { flushPendingSyncNow } from '../../lib/syncBridge';
import { showToast } from '../ui/Toast';
import { t, useLang } from '../../lib/i18n';

/** SPEC-032 F4: kleiner Chip im Kletterer-Header, solange offline oder etwas wartet. */
export function pendingText(count: number): string {
  if (count === 0) return 'Alles ist gespeichert. Ohne Netz wird später gesendet.';
  return count === 1
    ? '1 Eintrag wartet. Er wird automatisch gesendet.'
    : `${count} Einträge warten. Sie werden automatisch gesendet.`;
}

export const OfflineChip: React.FC = () => {
  const [online, setOnline] = useState(isDeviceOnline());
  const [count, setCount] = useState(getPendingSyncCount());

  useEffect(() => {
    const update = () => {
      setOnline(isDeviceOnline());
      setCount(getPendingSyncCount());
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    window.addEventListener(PENDING_SYNC_EVENT, update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      window.removeEventListener(PENDING_SYNC_EVENT, update);
    };
  }, []);

  useLang();
  if (online && count === 0) return null;

  return (
    <button
      type="button"
      data-testid="offline-chip"
      onClick={() => {
        if (online) void flushPendingSyncNow();
        showToast({ message: count > 1 ? t('{count} Einträge warten. Sie werden automatisch gesendet.', { count }) : t(pendingText(count)), durationMs: 5000 });
      }}
      className="min-h-[40px] px-3 rounded-full bg-[var(--bm-elevated)] text-[var(--bm-text)] text-[14px] font-semibold flex items-center gap-1.5 shrink-0"
      aria-label={online ? t('Wird gesendet, {count} wartend', { count }) : t('Offline, {count} wartend', { count })}
    >
      {online ? <RefreshCw className="w-4 h-4" aria-hidden /> : <CloudOff className="w-4 h-4" aria-hidden />}
      <span>{online ? t('Senden …') : t('Offline')}</span>
    </button>
  );
};
