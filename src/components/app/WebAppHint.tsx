import React, { useEffect, useState } from 'react';
import { X, Smartphone } from 'lucide-react';
import { t } from '../../lib/i18n';
import { isNativeApp, isStandaloneWebApp, mobileBrowserOs } from '../../lib/app/platform';
import { loadAppVersionInfo } from '../../lib/app/appVersion';

export const WEB_APP_HINT_KEY = 'bouldermate_web_app_hint_closed_v1';

function isClosed(): boolean {
  try {
    return localStorage.getItem(WEB_APP_HINT_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * SPEC-045 §5 / AC-14: schließbare Zeile «Auch als App» – nur auf Handys im Browser,
 * nur wenn es für dieses Handy einen Store-Eintrag gibt (app-version.json → stores). Kein Pop-up.
 */
export const WebAppHint: React.FC = () => {
  const [storeUrl, setStoreUrl] = useState<string | null>(null);
  const [closed, setClosed] = useState(isClosed);
  const os = mobileBrowserOs();

  useEffect(() => {
    if (closed || isNativeApp() || isStandaloneWebApp() || !os) return;
    let alive = true;
    loadAppVersionInfo().then(info => {
      if (alive) setStoreUrl(info ? info.stores[os] : null);
    });
    return () => {
      alive = false;
    };
  }, [closed, os]);

  if (closed || !storeUrl) return null;

  const close = () => {
    try {
      localStorage.setItem(WEB_APP_HINT_KEY, '1');
    } catch {
      // ignore
    }
    setClosed(true);
  };

  return (
    <div className="mx-3 mt-2 rounded-2xl bg-[var(--bm-surface)] flex items-center gap-3 pl-4 pr-1 py-2" data-testid="web-app-hint">
      <Smartphone className="w-5 h-5 text-[var(--bm-text-2)] shrink-0" aria-hidden />
      <a href={storeUrl} target="_blank" rel="noopener" className="flex-1 min-w-0 text-[16px] text-[var(--bm-text)]" data-testid="web-app-hint-link">
        <span className="font-semibold">{t('BoulderMate gibt’s auch als App.')}</span>{' '}
        <span className="text-[var(--bm-text-2)]">{t('Hast du sie schon? Deine Daten sind dieselben.')}</span>
      </a>
      <button
        type="button"
        onClick={close}
        className="w-12 h-12 flex items-center justify-center shrink-0 rounded-full text-[var(--bm-text-2)]"
        aria-label={t('Hinweis schließen')}
        data-testid="web-app-hint-close"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
