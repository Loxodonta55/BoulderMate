import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronDown, Zap, Check } from 'lucide-react';
import {
  getDeepDiveReport,
  formatAxisValue,
  AttributeHighlight,
  DeepDiveRoute,
} from '../lib/deepDiveService';

/**
 * SPEC-004 (Deep Dive v2) · Was verlangen meine Routen?
 * Nur Boulder, die an der Wand abgehakt wurden. Gleicher Hallenfilter wie «Ich».
 */
export interface DeepDiveViewProps {
  userId: string;
  /** 'all' oder Hallen-ID – derselbe Filter wie auf der Ich-Seite. */
  gymId: string;
  /** Erhöhen, um nach neuen Begehungen/Wertungen neu zu rechnen. */
  version?: number;
  /** Filter-Steuerung (z. B. Halle | Alle Hallen), wird unter dem Titel gezeigt. */
  filter?: React.ReactNode;
  onBack?: () => void;
  onSelectBoulder?: (boulderId: string) => void;
}

const TypeIcon: React.FC<{ type: 'flash' | 'top' }> = ({ type }) =>
  type === 'flash' ? (
    <Zap className="w-4 h-4 text-[var(--bm-star)]" aria-label="Flash" />
  ) : (
    <Check className="w-4 h-4 text-[var(--bm-success)]" aria-label="Top" />
  );

const TraitChip: React.FC<{ h: AttributeHighlight; testId?: string }> = ({ h, testId }) => (
  <span
    data-testid={testId}
    className={`inline-flex items-center gap-1 h-6 px-2 rounded-full text-[12px] font-medium ${
      h.value >= 4.5 ? 'bg-[var(--bm-accent)] text-[var(--bm-on-accent)]' : 'bg-[var(--bm-elevated)] text-[var(--bm-text)]'
    }`}
  >
    {h.label} <span className="font-semibold tabular-nums">{formatAxisValue(h.value)}</span>
  </span>
);

const RouteRow: React.FC<{
  route: DeepDiveRoute;
  rank?: number;
  testId: string;
  onSelect?: (id: string) => void;
}> = ({ route, rank, testId, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect?.(route.boulderId)}
    data-testid={testId}
    className="w-full text-left flex items-start gap-3 px-4 py-3 active:bg-[var(--bm-elevated)]"
  >
    {rank !== undefined && (
      <span className="w-4 pt-0.5 text-[15px] font-semibold tabular-nums text-[var(--bm-text-2)]">{rank}</span>
    )}
    <span className="mt-1.5 w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: route.gradeScale.colorHex }} />
    <span className="flex-1 min-w-0">
      <span className="flex items-center gap-2">
        <span className="text-[16px] truncate">{route.name}</span>
        <TypeIcon type={route.type} />
      </span>
      <span className="block text-[13px] text-[var(--bm-text-2)] truncate">
        {[route.fontGrade, route.sectorName].filter(Boolean).join(' · ')}
      </span>
      <span className="flex flex-wrap gap-1.5 mt-1.5">
        {route.highlights.length > 0 ? (
          route.highlights.map(h => <TraitChip key={h.key} h={h} testId={`${testId}-trait-${h.key}`} />)
        ) : (
          <span className="text-[12px] text-[var(--bm-text-2)]" data-testid={`${testId}-balanced`}>
            Ausgeglichen
          </span>
        )}
      </span>
    </span>
  </button>
);

export const DeepDiveView: React.FC<DeepDiveViewProps> = ({ userId, gymId, version = 0, filter, onBack, onSelectBoulder }) => {
  const report = useMemo(
    () => getDeepDiveReport(userId, gymId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, gymId, version]
  );
  const [openGrade, setOpenGrade] = useState<string | null>(null);

  return (
    <div className="max-w-xl mx-auto px-4 pb-8 space-y-7" data-testid="deep-dive-view">
      {onBack ? (
        <div>
          <div className="h-12 flex items-center -ml-2">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center text-[17px] text-[var(--bm-accent)] min-h-[44px] pr-3"
              data-testid="deep-dive-back"
            >
              <ChevronLeft className="w-6 h-6" />
              Ich
            </button>
          </div>
          <h1 className="text-[28px] font-bold">Deep Dive</h1>
        </div>
      ) : (
        <h2 className="text-[20px] font-semibold pt-3">Deep Dive</h2>
      )}

      {filter}

      {report.sendCount === 0 ? (
        <p className="text-[15px] text-[var(--bm-text-2)]" data-testid="deep-dive-empty">
          Hake an der Wand deinen ersten Top ab – dann siehst du hier, was deine Routen verlangen.
        </p>
      ) : (
        <>
          {/* Schwerste 5 */}
          <section className="space-y-2.5" data-testid="deep-dive-top5">
            <h2 className="text-[20px] font-semibold">
              {report.top5.length === 1 ? 'Dein schwerster Top' : `Deine schwersten ${report.top5.length}`}
            </h2>
            {report.top5Pattern.length > 0 ? (
              <p className="text-[15px]" data-testid="deep-dive-pattern">
                Fällt auf:{' '}
                {report.top5Pattern.slice(0, 2).map((p, i) => (
                  <React.Fragment key={p.key}>
                    {i > 0 && ' und '}
                    <strong>{p.label}</strong> Ø {formatAxisValue(p.topAvg)} statt {formatAxisValue(p.restAvg)}
                  </React.Fragment>
                ))}
                .
              </p>
            ) : report.sendCount > report.top5.length ? (
              <p className="text-[15px] text-[var(--bm-text-2)]" data-testid="deep-dive-pattern">
                Kein Merkmal sticht heraus – deine schwersten Routen verlangen dasselbe wie der Rest.
              </p>
            ) : null}
            <div className="rounded-2xl bg-[var(--bm-surface)] overflow-hidden divide-y divide-[var(--bm-line)]">
              {report.top5.map((r, i) => (
                <RouteRow
                  key={r.boulderId}
                  route={r}
                  rank={i + 1}
                  testId={`deep-dive-top-${r.boulderId}`}
                  onSelect={onSelectBoulder}
                />
              ))}
            </div>
          </section>

          {/* Pro Grad */}
          <section className="space-y-2.5" data-testid="deep-dive-levels">
            <h2 className="text-[20px] font-semibold">Was jeder Grad verlangt</h2>
            <div className="rounded-2xl bg-[var(--bm-surface)] overflow-hidden divide-y divide-[var(--bm-line)]">
              {report.levels.map(level => {
                const isOpen = openGrade === level.fontGrade;
                return (
                  <div key={level.fontGrade}>
                    <button
                      type="button"
                      onClick={() => setOpenGrade(isOpen ? null : level.fontGrade)}
                      aria-expanded={isOpen}
                      data-testid={`deep-dive-level-${level.fontGrade}`}
                      className="w-full text-left flex items-center gap-3 px-4 min-h-[52px] py-2.5 active:bg-[var(--bm-elevated)]"
                    >
                      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: level.gradeScale.colorHex }} />
                      <span className="w-9 text-[15px] font-semibold tabular-nums">{level.fontGrade}</span>
                      <span className="flex-1 min-w-0 flex flex-wrap gap-1.5">
                        {level.demands.length > 0 ? (
                          level.demands.map(h => (
                            <TraitChip key={h.key} h={h} testId={`deep-dive-level-${level.fontGrade}-trait-${h.key}`} />
                          ))
                        ) : (
                          <span className="text-[13px] text-[var(--bm-text-2)]">Ausgeglichen</span>
                        )}
                      </span>
                      <span className="text-[14px] text-[var(--bm-text-2)] tabular-nums">{level.sendCount}×</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[var(--bm-text-3)] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="bg-[var(--bm-bg)] divide-y divide-[var(--bm-line)]">
                        {level.routes.map(r => (
                          <RouteRow
                            key={r.boulderId}
                            route={r}
                            testId={`deep-dive-route-${r.boulderId}`}
                            onSelect={onSelectBoulder}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      <p className="text-[12px] text-[var(--bm-text-2)]" data-testid="deep-dive-source-note">
        Nur Boulder, die du an der Wand als Top oder Flash abgehakt hast. Merkmale von 1 bis 5 aus Schrauber- und
        Community-Einschätzung.
      </p>
    </div>
  );
};
