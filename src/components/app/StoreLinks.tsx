import React, { useEffect, useState } from 'react';
import { Apple, Play } from 'lucide-react';
import { t } from '../../lib/i18n';
import { isNativeApp } from '../../lib/app/platform';
import { AppVersionInfo, loadAppVersionInfo } from '../../lib/app/appVersion';

/**
 * SPEC-045 §5: Knöpfe «App Store» und «Google Play» auf der Startseite.
 * Erscheinen erst, wenn in `public/app-version.json` unter `stores` eine Adresse steht. Nicht in der App.
 */
export const StoreLinks: React.FC = () => {
  const [info, setInfo] = useState<AppVersionInfo | null>(null);
  useEffect(() => {
    if (isNativeApp()) return;
    let alive = true;
    loadAppVersionInfo().then(i => alive && setInfo(i));
    return () => {
      alive = false;
    };
  }, []);
  if (!info || (!info.stores.ios && !info.stores.android)) return null;
  const cls =
    'inline-flex items-center gap-2 min-h-[48px] px-4 rounded-xl bg-[var(--bm-surface)] text-[16px] font-semibold text-[var(--bm-text)]';
  return (
    <div className="flex flex-wrap justify-center gap-2" data-testid="store-links">
      {info.stores.ios && (
        <a href={info.stores.ios} target="_blank" rel="noopener" className={cls} data-testid="store-link-ios">
          <Apple className="w-5 h-5" aria-hidden />
          {t('Im App Store laden')}
        </a>
      )}
      {info.stores.android && (
        <a href={info.stores.android} target="_blank" rel="noopener" className={cls} data-testid="store-link-android">
          <Play className="w-5 h-5" aria-hidden />
          {t('Bei Google Play laden')}
        </a>
      )}
    </div>
  );
};
