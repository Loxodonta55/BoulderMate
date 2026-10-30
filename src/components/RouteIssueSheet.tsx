import React from 'react';
import { AlertTriangle, MapPin, Palette, SearchX } from 'lucide-react';
import { Sheet } from './ui/Sheet';
import { showToast } from './ui/Toast';
import { t } from '../lib/i18n';
import { ROUTE_ISSUE_TEXT, hasReportedIssue, reportRouteIssue, type RouteIssueKind } from '../lib/aiCapture/aiCaptureService';
import type { WallBoulder } from '../types/boulder';

/**
 * SPEC-052 F8: «Stimmt was nicht?» – drei große Gründe, ein Tipp sendet.
 * Die Schrauber sehen die Meldung in «Kurz prüfen», niemand bekommt eine Einzelbenachrichtigung.
 */
export const RouteIssueSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  boulder: WallBoulder;
  gymId: string;
  userId: string;
}> = ({ open, onClose, boulder, gymId, userId }) => {
  const reasons: { kind: Exclude<RouteIssueKind, 'missing'>; Icon: typeof Palette }[] = [
    { kind: 'wrong_grade', Icon: Palette },
    { kind: 'not_exists', Icon: SearchX },
    { kind: 'wrong_pin', Icon: MapPin },
  ];

  const send = async (kind: RouteIssueKind) => {
    await reportRouteIssue({ gymId, sectorId: boulder.sectorId, boulderId: boulder.id, kind, userId });
    showToast({ message: t('Danke! Die Schrauber schauen es sich an.') });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} fitContent testId="route-issue-sheet" ariaLabel={t('Stimmt was nicht?')}>
      <div className="px-5 pt-2 pb-5 space-y-3">
        <h2 className="text-[22px] font-bold flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-[var(--bm-warning)]" aria-hidden />
          {t('Stimmt was nicht?')}
        </h2>
        <p className="text-[16px] text-[var(--bm-text-2)]">{t('Die Schrauber der Halle sehen deine Meldung.')}</p>
        {reasons.map(({ kind, Icon }) => {
          const done = hasReportedIssue(boulder.id, userId, kind);
          return (
            <button
              key={kind}
              type="button"
              disabled={done}
              data-testid={`route-issue-${kind}`}
              onClick={() => send(kind)}
              className="w-full min-h-[56px] px-4 flex items-center gap-3 text-left text-[17px] font-semibold rounded-xl border-2 border-[var(--bm-line)] bg-[var(--bm-elevated)] disabled:opacity-60"
            >
              <Icon className="w-6 h-6 shrink-0" aria-hidden />
              <span className="flex-1">{t(ROUTE_ISSUE_TEXT[kind])}</span>
              {done && <span className="text-[15px] font-normal text-[var(--bm-text-2)]">{t('gemeldet')}</span>}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onClose}
          data-testid="route-issue-cancel"
          className="w-full min-h-[52px] text-[17px] font-semibold text-[var(--bm-text)]"
        >
          {t('Abbrechen')}
        </button>
      </div>
    </Sheet>
  );
};
