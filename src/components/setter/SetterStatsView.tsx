import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Info, Star, ThumbsUp, Eye } from 'lucide-react';
import { InsightsScope } from '../../lib/gymInsights';
import {
  computeSetterHints,
  computeSetterStats,
  dismissSetterHint,
  FEEL_WORD,
  formatPercent,
  formatStarValue,
  getDismissedSetterHints,
  getSetterStatsLastViewed,
  setSetterStatsLastViewed,
  SetterRouteRow,
  SetterStatsSort,
  sortSetterRoutes,
} from '../../lib/setterStats';
import { SetterRouteStatsSheet } from './SetterRouteStatsSheet';

/**
 * SPEC-044 · Schrauber-Studio, Bereich «Meine Routen»:
 * wie die eigenen Routen bei den Kletterern ankommen. Keine Kletterer-Namen, keine Rangliste.
 */

interface SetterStatsViewProps {
  gymId: string;
  setterId: string;
  /** «Im Studio öffnen»: zurück zu «Wände» mit dieser Route */
  onOpenInStudio?: (boulderId: string, sectorId: string) => void;
}

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

export function formatSinceLabel(lastViewedAt: number, now: number = Date.now()): string {
  const days = Math.floor((now - lastViewedAt) / (24 * 60 * 60 * 1000));
  if (days < 1) return 'Seit vorhin';
  if (days < 7) return `Seit ${WEEKDAYS[new Date(lastViewedAt).getDay()]}`;
  const d = new Date(lastViewedAt);
  return `Seit ${d.getDate()}.${d.getMonth() + 1}.`;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

const ColorDot: React.FC<{ hex?: string; name: string }> = ({ hex, name }) => (
  <span className="inline-flex items-center gap-1.5 shrink-0">
    <span className="w-5 h-5 rounded-full ring-1 ring-black/15" style={{ backgroundColor: hex || 'var(--bm-text-3)' }} aria-hidden />
    <span className="text-[15px] font-semibold text-[var(--bm-text)]">{name}</span>
  </span>
);

const SORTS: { id: SetterStatsSort; label: string }[] = [
  { id: 'newest', label: 'Neueste' },
  { id: 'favorite', label: 'Beliebteste' },
  { id: 'least', label: 'Wenig geklettert' },
];

const RouteRow: React.FC<{ r: SetterRouteRow; onOpen: () => void }> = ({ r, onOpen }) => {
  const archived = r.status === 'archived';
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        data-testid={`setter-route-${r.boulderId}`}
        className={`w-full min-h-[64px] px-4 py-3 text-left flex items-center gap-3 ${archived ? 'bg-[var(--bm-elevated)]' : ''}`}
      >
        <span className="flex-1 min-w-0 space-y-0.5">
          <span className="flex items-center gap-2 flex-wrap">
            <ColorDot hex={r.colorHex} name={r.colorName} />
            <span className="text-[17px] font-semibold text-[var(--bm-text)] truncate">{r.name || 'Ohne Name'}</span>
          </span>
          <span className="block text-[15px] text-[var(--bm-text-2)] truncate">
            {r.sectorName}
            {archived && (
              <span data-testid={`setter-route-${r.boulderId}-archived`}> · abgeschraubt am {formatDate(r.archivedAt)}</span>
            )}
          </span>
          <span className="flex flex-wrap gap-x-3 text-[15px] text-[var(--bm-text)]">
            <span>{r.ascents} {r.ascents === 1 ? 'Begehung' : 'Begehungen'}</span>
            {r.avgStars !== null ? (
              <span className="inline-flex items-center gap-1" data-testid={`setter-route-${r.boulderId}-stars`}>
                <Star className="w-4 h-4 fill-[var(--bm-star)] text-[var(--bm-star)]" aria-hidden />
                {formatStarValue(r.avgStars)}
              </span>
            ) : (
              <span className="text-[var(--bm-text-2)]" data-testid={`setter-route-${r.boulderId}-missing`}>
                noch {r.missingRatings} {r.missingRatings === 1 ? 'Bewertung' : 'Bewertungen'}
              </span>
            )}
            {r.dominantFeel && (
              <span data-testid={`setter-route-${r.boulderId}-feel`}>
                {FEEL_WORD[r.dominantFeel]} · {r.feel[r.dominantFeel]} von {r.feelTotal}
              </span>
            )}
          </span>
        </span>
      </button>
    </li>
  );
};

export const SetterStatsView: React.FC<SetterStatsViewProps> = ({ gymId, setterId, onOpenInStudio }) => {
  const [scope, setScope] = useState<InsightsScope>('active');
  const [sort, setSort] = useState<SetterStatsSort>('newest');
  const [openRouteId, setOpenRouteId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [dismissed, setDismissed] = useState<Record<string, number>>(() => getDismissedSetterHints(gymId));
  // «Seit deinem letzten Blick»: Zeitpunkt vor diesem Öffnen merken, dann auf jetzt setzen
  const [lastViewedAt] = useState<number | null>(() => getSetterStatsLastViewed(gymId));

  useEffect(() => {
    setSetterStatsLastViewed(gymId, Date.now());
  }, [gymId]);

  useEffect(() => {
    const bump = () => setVersion(v => v + 1);
    const events = ['bouldermate:ascents_updated', 'bouldermate:ratings_updated', 'bouldermate:boulders_updated', 'bouldermate:comments_updated'];
    events.forEach(e => window.addEventListener(e, bump));
    return () => events.forEach(e => window.removeEventListener(e, bump));
  }, []);

  const stats = useMemo(
    () => computeSetterStats({ gymId, setterId, scope, lastViewedAt }),
    [gymId, setterId, scope, lastViewedAt, version]
  );
  const hints = useMemo(() => computeSetterHints(stats, { dismissed }), [stats, dismissed]);
  const routes = useMemo(() => sortSetterRoutes(stats.routes, sort), [stats.routes, sort]);

  const kpis = [
    {
      id: 'routes',
      label: 'Routen',
      value: String(stats.kpis.routes),
      aria: `${stats.kpis.routes} Routen`,
    },
    {
      id: 'ascents',
      label: 'Begehungen',
      sub: 'Flash + Top',
      value: String(stats.kpis.ascents),
      aria: `${stats.kpis.ascents} Begehungen, Flash und Top`,
    },
    {
      id: 'stars',
      label: 'Ø Sterne',
      sub: `Andere, gleiche Farben: ${formatStarValue(stats.baseline.avgStars)}`,
      value: formatStarValue(stats.kpis.avgStars),
      aria: `Durchschnitt ${formatStarValue(stats.kpis.avgStars)} Sterne, andere Schrauber mit gleichen Farben ${formatStarValue(stats.baseline.avgStars)}`,
    },
    {
      id: 'flash',
      label: 'Flash-Quote',
      sub: `Andere, gleiche Farben: ${formatPercent(stats.baseline.flashRate)}`,
      value: formatPercent(stats.kpis.flashRate),
      aria: `Flash-Quote ${formatPercent(stats.kpis.flashRate)}, andere Schrauber mit gleichen Farben ${formatPercent(stats.baseline.flashRate)}`,
    },
  ];

  return (
    <div className="space-y-5 pb-4" data-testid="setter-stats">
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
            data-testid={`setter-stats-scope-${s.id}`}
            className={`flex-1 min-h-[48px] rounded-[10px] text-[17px] font-semibold ${
              scope === s.id ? 'bg-[var(--bm-surface)] text-[var(--bm-text)] shadow-sm' : 'text-[var(--bm-text-2)]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {stats.since && lastViewedAt && (
        <p className="rounded-2xl bg-[var(--bm-surface)] px-4 py-3 text-[17px] text-[var(--bm-text)]" data-testid="setter-stats-since">
          <Eye className="inline w-5 h-5 mr-1.5 -mt-0.5" aria-hidden />
          {formatSinceLabel(lastViewedAt)}:{' '}
          <strong>
            {[
              stats.since.ascents > 0 && `+${stats.since.ascents} ${stats.since.ascents === 1 ? 'Begehung' : 'Begehungen'}`,
              stats.since.ratings > 0 && `${stats.since.ratings} ${stats.since.ratings === 1 ? 'Bewertung' : 'Bewertungen'}`,
              stats.since.comments > 0 && `${stats.since.comments} Beta`,
            ].filter(Boolean).join(' · ')}
          </strong>
        </p>
      )}

      {stats.routes.length === 0 ? (
        <p className="rounded-2xl bg-[var(--bm-surface)] px-4 py-5 text-[17px] text-[var(--bm-text)]" data-testid="setter-stats-empty">
          Du hast in dieser Halle noch keine Routen. Routen, bei denen du unter «Geschraubt von» stehst, erscheinen hier.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            {kpis.map(k => (
              <div
                key={k.id}
                role="group"
                aria-label={k.aria}
                className="rounded-2xl bg-[var(--bm-surface)] px-4 py-3"
                data-testid={`setter-kpi-${k.id}`}
              >
                <div className="text-[32px] leading-tight font-bold tabular-nums text-[var(--bm-text)]" data-testid={`setter-kpi-${k.id}-value`}>
                  {k.value}
                </div>
                <div className="text-[16px] font-semibold text-[var(--bm-text)]">{k.label}</div>
                {k.sub && (
                  <div className="text-[15px] text-[var(--bm-text-2)]" data-testid={`setter-kpi-${k.id}-baseline`}>{k.sub}</div>
                )}
              </div>
            ))}
          </div>

          {!stats.hasAnyRatings && (
            <p className="rounded-2xl bg-[var(--bm-surface)] px-4 py-4 text-[16px] text-[var(--bm-text)]" data-testid="setter-stats-no-ratings">
              Sobald Kletterer bewerten, siehst du hier, wie deine Routen ankommen. Ab 3 Bewertungen pro Route.
            </p>
          )}

          {hints.length > 0 && (
            <section className="space-y-2" data-testid="setter-stats-hints">
              <h3 className="px-1 text-[20px] font-semibold text-[var(--bm-text)]">Hinweise</h3>
              <ul className="space-y-2">
                {hints.map(h => (
                  <li
                    key={h.key}
                    data-testid={`setter-hint-${h.kind}`}
                    className={`rounded-2xl px-4 py-3 flex items-start gap-3 border ${
                      h.positive ? 'border-[var(--bm-success)] bg-[var(--bm-surface)]' : 'border-[var(--bm-line)] bg-[var(--bm-surface)]'
                    }`}
                  >
                    {h.positive ? (
                      <ThumbsUp className="w-6 h-6 mt-0.5 shrink-0 text-[var(--bm-success)]" aria-hidden />
                    ) : (
                      <Info className="w-6 h-6 mt-0.5 shrink-0 text-[var(--bm-text-2)]" aria-hidden />
                    )}
                    <button
                      type="button"
                      onClick={() => setOpenRouteId(h.boulderId)}
                      className="flex-1 min-h-[48px] text-left text-[17px] text-[var(--bm-text)]"
                      data-testid={`setter-hint-open-${h.kind}`}
                    >
                      {h.text}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDismissed(dismissSetterHint(gymId, h.key))}
                      className="min-h-[48px] px-3 rounded-xl text-[16px] font-semibold text-[var(--bm-text)] bg-[var(--bm-elevated)] inline-flex items-center gap-1.5 shrink-0"
                      data-testid="setter-hint-dismiss"
                      aria-label={`Erledigt: ${h.text}`}
                    >
                      <CheckCircle2 className="w-5 h-5" aria-hidden />
                      Erledigt
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-2" data-testid="setter-stats-list">
            <h3 className="px-1 text-[20px] font-semibold text-[var(--bm-text)]">Meine Routen</h3>
            <div role="group" aria-label="Sortierung" className="flex gap-2 flex-wrap">
              {SORTS.map(s => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={sort === s.id}
                  onClick={() => setSort(s.id)}
                  data-testid={`setter-stats-sort-${s.id}`}
                  className={`min-h-[48px] px-4 rounded-full text-[16px] font-semibold border ${
                    sort === s.id
                      ? 'bg-[var(--bm-strong)] text-[var(--bm-bg)] border-[var(--bm-strong)]'
                      : 'bg-[var(--bm-surface)] text-[var(--bm-text)] border-[var(--bm-line)]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <ul className="rounded-2xl bg-[var(--bm-surface)] divide-y divide-[var(--bm-line)] overflow-hidden">
              {routes.map(r => (
                <RouteRow key={r.boulderId} r={r} onOpen={() => setOpenRouteId(r.boulderId)} />
              ))}
            </ul>
          </section>
        </>
      )}

      <p className="px-1 text-[15px] text-[var(--bm-text-2)]" data-testid="setter-stats-transparency">
        Was sieht die Hallenleitung? Im Tab «Zahlen» deine Kennzahlen im Vergleich zu den anderen Schraubern und jede deiner Routen mit Sternen, Grad-Gefühl und
        Beta-Kommentaren, ohne Namen der Kletterer. Keine Versuche, keine Hinweise, kein Export.
      </p>

      <SetterRouteStatsSheet
        stats={stats}
        boulderId={openRouteId}
        onClose={() => setOpenRouteId(null)}
        onOpenInStudio={
          onOpenInStudio
            ? (boulderId, sectorId) => {
                setOpenRouteId(null);
                onOpenInStudio(boulderId, sectorId);
              }
            : undefined
        }
      />
    </div>
  );
};
