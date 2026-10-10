import React, { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { computeGymInsights, InsightsBoulderRow, InsightsScope } from '../../lib/gymInsights';
import { GradeFeel } from '../../types/boulder';

/**
 * SPEC-030 · Admin-Tab «Zahlen»: Hallen-Auswertung für Betreiber.
 * Nur Summen, keine Kletterer-Namen.
 */

interface GymInsightsViewProps {
  gymId: string;
}

const FEEL_LABEL: Record<GradeFeel, string> = { soft: 'Soft', fair: 'Fair', stiff: 'Stiff' };

function formatStars(v: number | null): string {
  return v === null ? '–' : v.toFixed(1).replace('.', ',');
}

const Section: React.FC<{ title: string; testId: string; children: React.ReactNode }> = ({ title, testId, children }) => (
  <section className="space-y-2" data-testid={testId}>
    <h3 className="px-1 text-[20px] font-semibold text-[var(--bm-text)]">{title}</h3>
    {children}
  </section>
);

const StarValue: React.FC<{ value: number | null }> = ({ value }) => (
  <span className="inline-flex items-center gap-1 tabular-nums">
    <Star className="w-4 h-4 fill-[var(--bm-star)] text-[var(--bm-star)]" aria-hidden />
    {formatStars(value)}
  </span>
);

const BoulderList: React.FC<{ rows: InsightsBoulderRow[]; value: (r: InsightsBoulderRow) => React.ReactNode; empty: string; testId: string }> = ({ rows, value, empty, testId }) =>
  rows.length === 0 ? (
    <p className="rounded-2xl bg-[var(--bm-surface)] px-4 py-4 text-[16px] text-[var(--bm-text-2)]" data-testid={`${testId}-empty`}>{empty}</p>
  ) : (
    <ul className="rounded-2xl bg-[var(--bm-surface)] divide-y divide-[var(--bm-line)] overflow-hidden">
      {rows.map(r => (
        <li key={r.boulderId} className="min-h-[56px] px-4 py-2 flex items-center gap-3" data-testid={`${testId}-row-${r.boulderId}`}>
          <span className="w-5 h-5 rounded-full shrink-0 ring-1 ring-black/10" style={{ backgroundColor: r.colorHex || 'var(--bm-text-3)' }} aria-hidden />
          <span className="flex-1 min-w-0">
            <span className="block text-[16px] font-medium truncate">{r.label}</span>
            <span className="block text-[14px] text-[var(--bm-text-2)] truncate">{r.sectorName}</span>
          </span>
          <span className="text-[16px] font-semibold shrink-0">{value(r)}</span>
        </li>
      ))}
    </ul>
  );

export const GymInsightsView: React.FC<GymInsightsViewProps> = ({ gymId }) => {
  const [scope, setScope] = useState<InsightsScope>('active');
  const [version, setVersion] = useState(0);

  // Live-Updates (neue Begehungen, Bewertungen, Boulder)
  useEffect(() => {
    const bump = () => setVersion(v => v + 1);
    const events = ['bouldermate:ascents_updated', 'bouldermate:ratings_updated', 'bouldermate:boulders_updated', 'bouldermate:sectors_updated'];
    events.forEach(e => window.addEventListener(e, bump));
    return () => events.forEach(e => window.removeEventListener(e, bump));
  }, []);

  const insights = useMemo(() => computeGymInsights({ gymId, scope }), [gymId, scope, version]);
  const maxGradeCount = Math.max(1, ...insights.grades.map(g => g.boulders));

  const kpis: { id: string; label: string; value: React.ReactNode }[] = [
    { id: 'boulders', label: 'Boulder', value: insights.kpis.boulders },
    { id: 'ascents', label: 'Begehungen', value: insights.kpis.ascents },
    { id: 'climbers', label: 'Kletterer (30 Tage)', value: insights.kpis.climbers30d },
    { id: 'stars', label: 'Ø Sterne', value: formatStars(insights.kpis.avgStars) },
  ];

  return (
    <div className="space-y-5 pb-4" data-testid="gym-insights">
      <div role="group" aria-label="Zeitraum" className="flex p-0.5 rounded-[12px] bg-[var(--bm-elevated)]">
        {([
          { id: 'active', label: 'An der Wand' },
          { id: 'all', label: 'Alle' },
        ] as { id: InsightsScope; label: string }[]).map(s => (
          <button
            key={s.id}
            type="button"
            aria-pressed={scope === s.id}
            onClick={() => setScope(s.id)}
            data-testid={`insights-scope-${s.id}`}
            className={`flex-1 min-h-[44px] rounded-[10px] text-[16px] font-semibold ${
              scope === s.id ? 'bg-[var(--bm-surface)] text-[var(--bm-text)] shadow-sm' : 'text-[var(--bm-text-2)]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {kpis.map(k => (
          <div key={k.id} className="rounded-2xl bg-[var(--bm-surface)] px-4 py-3" data-testid={`insights-kpi-${k.id}`}>
            <div className="text-[28px] font-bold tabular-nums text-[var(--bm-text)]" data-testid={`insights-kpi-${k.id}-value`}>{k.value}</div>
            <div className="text-[15px] text-[var(--bm-text-2)]">{k.label}</div>
          </div>
        ))}
      </div>

      <Section title="Farben" testId="insights-grades">
        <ul className="rounded-2xl bg-[var(--bm-surface)] divide-y divide-[var(--bm-line)] overflow-hidden">
          {insights.grades.map(g => (
            <li key={g.scaleId} className="px-4 py-3 space-y-1.5" data-testid={`insights-grade-${g.scaleId}`}>
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full shrink-0 ring-1 ring-black/10" style={{ backgroundColor: g.colorHex }} aria-hidden />
                <span className="flex-1 min-w-0 text-[16px] font-medium truncate">{g.colorName}</span>
                <span className="text-[16px] font-semibold tabular-nums" data-testid={`insights-grade-${g.scaleId}-count`}>{g.boulders}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--bm-elevated)] overflow-hidden" aria-hidden>
                <div className="h-full rounded-full bg-[var(--bm-accent)]" style={{ width: `${(g.boulders / maxGradeCount) * 100}%` }} />
              </div>
              <div className="text-[14px] text-[var(--bm-text-2)] flex flex-wrap gap-x-3">
                <span>{g.ascents} Begehungen</span>
                <StarValue value={g.avgStars} />
                {g.dominantFeel && <span>meist {FEEL_LABEL[g.dominantFeel]}</span>}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Beliebteste" testId="insights-top">
        <BoulderList
          rows={insights.top}
          testId="insights-top"
          empty="Noch zu wenige Bewertungen (ab 3 pro Boulder)."
          value={r => <StarValue value={r.avgStars} />}
        />
      </Section>

      <Section title="Kaum geklettert" testId="insights-unloved">
        <BoulderList
          rows={insights.unloved}
          testId="insights-unloved"
          empty="Kein Boulder hängt schon 7 Tage."
          value={r => <span className="tabular-nums">{r.ascents} ×</span>}
        />
      </Section>

      <Section title="Sektoren" testId="insights-sectors">
        <ul className="rounded-2xl bg-[var(--bm-surface)] divide-y divide-[var(--bm-line)] overflow-hidden">
          {insights.sectors.map(s => (
            <li key={s.sectorId} className="px-4 py-3" data-testid={`insights-sector-${s.sectorId}`}>
              <div className="flex items-center gap-3">
                <span className="flex-1 min-w-0 text-[16px] font-medium truncate">{s.name}</span>
                {s.ageDays !== null && (
                  <span className="text-[15px] font-semibold tabular-nums text-[var(--bm-text)]" data-testid={`insights-sector-${s.sectorId}-age`}>
                    seit {s.ageDays} {s.ageDays === 1 ? 'Tag' : 'Tagen'}
                  </span>
                )}
              </div>
              <div className="text-[14px] text-[var(--bm-text-2)] flex flex-wrap gap-x-3">
                <span>{s.boulders} Boulder</span>
                <span>{s.ascents} Begehungen</span>
                <StarValue value={s.avgStars} />
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Schrauber" testId="insights-setters">
        {insights.setters.length === 0 ? (
          <p className="rounded-2xl bg-[var(--bm-surface)] px-4 py-4 text-[16px] text-[var(--bm-text-2)]">Noch keine Routen.</p>
        ) : (
          <ul className="rounded-2xl bg-[var(--bm-surface)] divide-y divide-[var(--bm-line)] overflow-hidden">
            {insights.setters.map(s => (
              <li key={s.setterId} className="px-4 py-3" data-testid={`insights-setter-${s.setterId}`}>
                <div className="flex items-center gap-3">
                  <span className="flex-1 min-w-0 text-[17px] font-semibold truncate">{s.name}</span>
                  <span className="text-[15px] font-semibold tabular-nums" data-testid={`insights-setter-${s.setterId}-top`}>
                    {s.topRoutes} Top
                  </span>
                </div>
                <div className="text-[14px] text-[var(--bm-text-2)] flex flex-wrap gap-x-3">
                  <span data-testid={`insights-setter-${s.setterId}-routes`}>{s.routes} Routen</span>
                  <StarValue value={s.avgStars} />
                  <span>{s.ascents} Begehungen</span>
                  {(s.stiffPercent > 0 || s.softPercent > 0) && (
                    <span>{s.stiffPercent} % Stiff · {s.softPercent} % Soft</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
};
