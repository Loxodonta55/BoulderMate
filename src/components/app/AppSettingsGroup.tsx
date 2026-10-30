import React, { useState } from 'react';
import { Smartphone, Download, ImageOff } from 'lucide-react';
import { ListGroup, ListRow } from '../ui/primitives';
import { t } from '../../lib/i18n';
import { isNativeApp } from '../../lib/app/platform';
import { AppUpdateStatus } from '../../lib/app/appVersion';
import { clearPhotoCache, photoCacheBytes } from '../../lib/app/photoCache';
import { openExternal } from '../../lib/app/openExternal';

export function formatMegabytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb <= 0) return '0 MB';
  if (mb < 1) return '< 1 MB';
  return `${Math.round(mb)} MB`;
}

/**
 * SPEC-045 §4.7: Einstellungen, die es nur in der App gibt.
 * Version · «Neue Version im Store» · Wandfotos offline.
 */
export const AppSettingsGroup: React.FC<{ update: AppUpdateStatus }> = ({ update }) => {
  const [bytes, setBytes] = useState(() => photoCacheBytes());
  if (!isNativeApp()) return null;

  const version = update.installed
    ? update.installed.build
      ? t('{v} (Build {b})', { v: update.installed.version, b: update.installed.build })
      : update.installed.version
    : '–';

  return (
    <ListGroup title={t('App')}>
      <ListRow
        testId="app-version-row"
        icon={<Smartphone className="w-5 h-5 text-[var(--bm-text-2)]" />}
        title={t('App-Version')}
        value={version}
      />
      {update.state !== 'ok' && update.storeUrl && (
        <ListRow
          testId="app-update-available"
          icon={<Download className="w-5 h-5 text-[var(--bm-accent)]" />}
          title={t('Neue Version im Store')}
          subtitle={t('Tippen zum Aktualisieren')}
          onClick={() => openExternal(update.storeUrl!)}
        />
      )}
      <ListRow
        testId="app-photo-cache"
        icon={<ImageOff className="w-5 h-5 text-[var(--bm-text-2)]" />}
        title={t('Wandfotos offline: {size}', { size: formatMegabytes(bytes) })}
        subtitle={t('Fotos der zuletzt geöffneten Halle')}
        value={bytes > 0 ? t('Löschen') : undefined}
        chevron={false}
        onClick={
          bytes > 0
            ? () => {
                clearPhotoCache().then(() => setBytes(0));
              }
            : undefined
        }
      />
    </ListGroup>
  );
};
