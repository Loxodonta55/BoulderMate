import React, { useMemo, useState } from 'react';
import { Star, PencilLine } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { GradeFeel } from '../../types/boulder';
import {
  computeSetterRouteDetail,
  FEEL_WORD,
  formatPercent,
  formatStarValue,
  SetterStats,
} from '../../lib/setterStats';

/**
 * SPEC-044 · Eine eigene Route im Detail: Grad-Gefühl mit Wort und Zahl, Flash/Top/Projekt,
 * Versuche (nur Median ab 3 Tops), Merkmale (ab 3 Bewertungen), Beta ohne Namen.
 */

interface SetterRouteStatsSheetProps {
  stats: SetterStats;
  boulderId: string | null;
  onClose: () => void;
  onOpenInStudio?: (boulderId: string, sectorId: string) => void;
}

function relativeDays(iso: string, now: number = Date.now()): string {
  const days = Math.floor((now - Date.parse(iso)) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'heute';
  if (days === 1) return 'gestern';
  return `vor ${days} Tagen`;
}

const FEELS: GradeFeel[] = ['soft', 'fair', 'stiff'];

export const SetterRouteStatsSheet: React.FC<SetterRouteStatsSheetProps> = ({ stats, boulderId, onClose, onOpenInStudio }) => {
  const [detent, setDetent] = useState<'half' | 'full'>('half');
  const detail = useMemo(() => (boulderId ? computeSetterRouteDetail(stats, boulderId) : null), [stats, boulderId]);
  if (!boulderId || !detail) return null;
  const { row } = detail;
  const maxFeel = Math.max(1, ...FEELS.map(f => row.feel[f]));

  return (
    <Sheet open onClose={onClose} detent={detent} onDetentChange={setDetent} testId="setter-route-sheet" ariaLabel={`Route ${row.label}`}>
      <div className="px-5 pb-6 space-y-5 text-[var(--bm-text)]">
        <header className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-6 h-6 rounded-full ring-1 ring-black/15" style={{ backgroundColor: row.colorHex || 'var(--bm-text-3)' }} aria-hidden />
            <span className="text-[17px] font-semibold">{row.colorName}</span>
          </div>
          <h2 className="text-[22px] font-bold">{row.name || 'Ohne Name'}</h2>
          <p className="text-[16px] text-[var(--bm-text-2)]">
            {row.sectorName} · {row.status === 'archived' ? `hing ${row.daysUp} Tage` : `hängt seit ${row.daysUp} ${row.daysUp === 1 ? 'Tag' : 'Tagen'}`}
          </p>
        </header>

        <section className="grid grid-cols-3 gap-2" data-testid="setter-route-ascents">
          {[
            { label: 'Flash', value: row.flashes },
            { label: 'Top', value: row.tops },
            { label: 'Projekt', value: row.projects },
          ].map(x => (
            <div key={x.label} className="rounded-2xl bg-[var(--bm-elevated)] px-3 py-2 text-center">
              <div className="text-[26px] font-bold tabular-nums">{x.value}</div>
              <div className="text-[15px]">{x.label}</div>
            </div>
          ))}
        </section>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[17px]">
          <dt className="text-[var(--bm-text-2)]">Flash-Quote</dt>
          <dd className="font-semibold" data-testid="setter-route-flash">{formatPercent(row.flashRate)}</dd>
          <dt className="text-[var(--bm-text-2)]">Ø Sterne</dt>
          <dd className="font-semibold" data-testid="setter-route-stars">
            {row.avgStars !== null ? (
              <span className="inline-flex items-center gap-1">
                <Star className="w-4 h-4 fill-[var(--bm-star)] text-[var(--bm-star)]" aria-hidden />
                {formatStarValue(row.avgStars)} <span className="font-normal text-[var(--bm-text-2)]">({row.ratingsCount})</span>
              </span>
            ) : (
              <span className="font-normal">noch {row.missingRatings} {row.missingRatings === 1 ? 'Bewertung' : 'Bewertungen'}</span>
            )}
          </dd>
          {detail.medianAttempts !== null && (
            <>
              <dt className="text-[var(--bm-text-2)]">Versuche bis Top</dt>
              <dd className="font-semibold" data-testid="setter-route-attempts">meist im {detail.medianAttempts}. Versuch</dd>
            </>
          )}
          {detail.traits.length > 0 && (
            <>
              <dt className="text-[var(--bm-text-2)]">Merkmale</dt>
              <dd className="font-semibold" data-testid="setter-route-traits">{detail.traits.join(', ')}</dd>
            </>
          )}
        </dl>

        <section className="space-y-2" data-testid="setter-route-feel">
          <h3 className="text-[19px] font-semibold">Grad-Gefühl</h3>
          {row.feelTotal >= 3 ? (
            <ul className="space-y-1.5">
              {FEELS.map(f => (
                <li key={f} className="flex items-center gap-3" data-testid={`setter-route-feel-${f}`}>
                  <span className="w-14 text-[16px]">{FEEL_WORD[f]}</span>
                  <span className="flex-1 h-3 rounded-full bg-[var(--bm-elevated)] overflow-hidden" aria-hidden>
                    <span className="block h-full rounded-full bg-[var(--bm-strong)]" style={{ width: `${(row.feel[f] / maxFeel) * 100}%` }} />
                  </span>
                  <span className="w-8 text-right text-[17px] font-semibold tabular-nums">{row.feel[f]}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[16px] text-[var(--bm-text-2)]">Ab 3 Angaben.</p>
          )}
          {detail.colorFeel && (
            <p className="text-[15px] text-[var(--bm-text-2)]" data-testid="setter-route-color-feel">
              {row.colorName} bei den anderen Schraubern: meist «{FEEL_WORD[detail.colorFeel]}»
            </p>
          )}
        </section>

        <section className="space-y-2" data-testid="setter-route-comments">
          <h3 className="text-[19px] font-semibold">Beta der Kletterer ({detail.comments.length})</h3>
          {detail.comments.length === 0 ? (
            <p className="text-[16px] text-[var(--bm-text-2)]">Noch keine Beta.</p>
          ) : (
            <ul className="space-y-2">
              {detail.comments.map(c => (
                <li key={c.id} className="rounded-2xl bg-[var(--bm-elevated)] px-4 py-3">
                  <p className="text-[16px] whitespace-pre-wrap break-words">{c.text}</p>
                  <p className="text-[14px] text-[var(--bm-text-2)] mt-1">{relativeDays(c.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {onOpenInStudio && row.status === 'active' && (
          <button
            type="button"
            data-testid="setter-route-open-studio"
            onClick={() => onOpenInStudio(row.boulderId, row.sectorId)}
            className="w-full min-h-[52px] rounded-xl bg-[var(--bm-strong)] text-[var(--bm-bg)] text-[17px] font-semibold inline-flex items-center justify-center gap-2"
          >
            <PencilLine className="w-5 h-5" aria-hidden />
            Im Studio öffnen
          </button>
        )}
      </div>
    </Sheet>
  );
};
