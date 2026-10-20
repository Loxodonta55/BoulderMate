import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Star } from 'lucide-react';
import {
  computeSetterDetail,
  computeSetterReport,
  FeelCounts,
  SetterReportRow,
  SetterReportSort,
  SetterRouteRow,
  sortSetterReport,
} from '../../lib/setterReport';
import { InsightsScope, UNKNOWN_SETTER_ID } from '../../lib/gymInsights';

/**
 * SPEC-050 · Admin-Tab «Zahlen» → «Schrauber»: Übersicht aller Schrauber und Detailseite.
 * Keine Kletterer-Namen, keine Versuche, keine Platznummern.
 */

interface SetterReportViewProps {
  gymId: string;
  scope: InsightsScope;
  /** erhöht sich bei Live-Updates, damit neu gerechnet wird */
  version?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const fmt1 = (v: number) => v.toFixed(1).replace('.', ',');
const pct = (v: number) => `${Math.round(v * 100)} %`;

function relativeDays(iso: string, now: number): string {
  const days = Math.max(0, Math.floor((now - Date.parse(iso)) / DAY_MS));
  if (days === 0) return 'heute';
  if (days === 1) return 'gestern';
  return `vor ${days} Tagen`;
}

function shortDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

const FEEL_WORD: Record<'soft' | 'fair' | 'stiff', string> = { soft: 'zu leicht', fair: 'passt', stiff: 'zu hart' };

const FeelLine: React.FC<{ feel: FeelCounts; testId?: string }> = ({ feel, testId }) => (
  <span data-testid={testId}>
    {FEEL_WORD.soft} {feel.soft} · {FEEL_WORD.fair} {feel.fair} · {FEEL_WORD.stiff} {feel.stiff}
  </span>
);

const ColorDot: React.FC<{ hex?: string }> = ({ hex }) => (
  <span className="w-5 h-5 rounded-full shrink-0 ring-1 ring-black/20" style={{ backgroundColor: hex || 'var(--bm-text-3)' }} aria-hidden />
);

const StarsWithHall: React.FC<{ value: number | null; hall: number | null; testId?: string }> = ({ value, hall, testId }) =>
  value === null ? null : (
    <span className="inline-flex items-center gap-1 tabular-nums" data-testid={testId}>
      {fmt1(value)}
      <Star className="w-4 h-4 fill-[var(--bm-star)] text-[var(--bm-star)]" aria-label="Sterne" />
      {hall !== null && <span>· andere {fmt1(hall)}</span>}
    </span>
  );

const SORTS: { id: SetterReportSort; label: string }[] = [
  { id: 'routes', label: 'Routen' },
  { id: 'stars', label: 'Sterne' },
  { id: 'grade', label: 'Grad passt' },
  { id: 'name', label: 'Name' },
];

const SetterCard: React.FC<{ row: SetterReportRow; onOpen: () => void }> = ({ row, onOpen }) => {
  const unknown = row.setterId === UNKNOWN_SETTER_ID;
  const tooFew = row.avgStars === null && row.gradeFair === null;
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        data-testid={`insights-setter-${row.setterId}`}
        className="w-full min-h-[56px] px-4 py-3 text-left flex items-center gap-3 active:bg-[var(--bm-elevated)]"
      >
        <span className="flex-1 min-w-0 space-y-1">
          <span className="flex flex-wrap items-baseline gap-x-3">
            <span className="text-[17px] font-semibold text-[var(--bm-text)]">{row.name}</span>
            <span className="text-[16px] tabular-nums text-[var(--bm-text)]" data-testid={`insights-setter-${row.setterId}-routes`}>
              {row.routes} {row.routes === 1 ? 'Route' : 'Routen'}
            </span>
            <span className="text-[16px] tabular-nums text-[var(--bm-text)]" data-testid={`insights-setter-${row.setterId}-top`}>
              {row.topRoutes} Top
            </span>
          </span>
          <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-[16px] text-[var(--bm-text-2)]">
            <StarsWithHall value={row.avgStars} hall={row.hallStars} testId={`insights-setter-${row.setterId}-stars`} />
            {row.gradeFair !== null && (
              <span data-testid={`insights-setter-${row.setterId}-grade`}>Grad passt: {row.gradeFair} von {row.feelTotal}</span>
            )}
            {row.weekly !== null && (
              <span className="tabular-nums" data-testid={`insights-setter-${row.setterId}-weekly`}>
                {fmt1(row.weekly)} pro Woche{row.hallWeekly !== null ? ` · andere ${fmt1(row.hallWeekly)}` : ''}
              </span>
            )}
            {tooFew && <span data-testid={`insights-setter-${row.setterId}-toofew`}>noch zu wenige Bewertungen</span>}
          </span>
          {unknown && (
            <span className="block text-[15px] text-[var(--bm-text-2)]">
              Routen ohne Schrauber. Im Studio unter «Geschraubt von» nachtragen.
            </span>
          )}
        </span>
        <ChevronRight className="w-6 h-6 shrink-0 text-[var(--bm-text-2)]" aria-hidden />
      </button>
    </li>
  );
};

const Kpi: React.FC<{ id: string; label: string; value: string; sub?: string; aria: string }> = ({ id, label, value, sub, aria }) => (
  <div className="rounded-2xl bg-[var(--bm-surface)] px-4 py-3" data-testid={`setter-detail-kpi-${id}`} aria-label={aria} role="group">
    <div className="text-[28px] font-bold tabular-nums text-[var(--bm-text)]" data-testid={`setter-detail-kpi-${id}-value`}>{value}</div>
    <div className="text-[15px] font-medium text-[var(--bm-text)]">{label}</div>
    {sub && <div className="text-[15px] text-[var(--bm-text-2)]">{sub}</div>}
  </div>
);

const RouteItem: React.FC<{ route: SetterRouteRow; now: number }> = ({ route, now }) => {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        data-testid={`setter-detail-route-${route.boulderId}`}
        className="w-full min-h-[56px] px-4 py-3 text-left flex items-center gap-3"
      >
        <ColorDot hex={route.colorHex} />
        <span className="flex-1 min-w-0">
          <span className="block text-[16px] font-medium text-[var(--bm-text)]">
            {route.colorName} · {route.label}
          </span>
          <span className="flex flex-wrap gap-x-3 text-[15px] text-[var(--bm-text-2)]">
            <span>{route.sectorName}</span>
            <span className="tabular-nums">{route.ascents} {route.ascents === 1 ? 'Begehung' : 'Begehungen'}</span>
            {route.avgStars !== null ? (
              <StarsWithHall value={route.avgStars} hall={null} />
            ) : (
              <span>noch {Math.max(1, 3 - route.ratings)} {3 - route.ratings === 1 ? 'Bewertung' : 'Bewertungen'}</span>
            )}
            {route.dominantFeel && <span>meist {FEEL_WORD[route.dominantFeel]}</span>}
            {route.status === 'archived' && <span>abgeschraubt am {shortDate(route.archivedAt)}</span>}
          </span>
        </span>
        {open
          ? <ChevronUp className="w-6 h-6 shrink-0 text-[var(--bm-text-2)]" aria-hidden />
          : <ChevronDown className="w-6 h-6 shrink-0 text-[var(--bm-text-2)]" aria-hidden />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 text-[16px] text-[var(--bm-text)]" data-testid={`setter-detail-route-${route.boulderId}-more`}>
          <p className="tabular-nums">im 1. Versuch {route.flashes} · Top {route.tops} · Projekt {route.projects}</p>
          {route.feelTotal > 0 && <p>Grad: <FeelLine feel={route.feel} /></p>}
          {route.comments.length > 0 ? (
            <ul className="space-y-2">
              {route.comments.map(c => (
                <li key={c.id} className="rounded-xl bg-[var(--bm-elevated)] px-3 py-2" data-testid="setter-detail-comment">
                  <p>{c.text}</p>
                  <p className="text-[14px] text-[var(--bm-text-2)]">{relativeDays(c.createdAt, now)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[var(--bm-text-2)]">Noch keine Beta-Kommentare.</p>
          )}
        </div>
      )}
    </li>
  );
};

const SetterDetailView: React.FC<{ gymId: string; scope: InsightsScope; setterId: string; version: number; onBack: () => void }> = ({ gymId, scope, setterId, version, onBack }) => {
  const now = useMemo(() => Date.now(), [version, scope]);
  const detail = useMemo(() => computeSetterDetail(setterId, { gymId, scope, now }), [setterId, gymId, scope, now]);

  return (
    <div className="space-y-4" data-testid="setter-report-detail">
      <button
        type="button"
        onClick={onBack}
        data-testid="setter-report-back"
        className="min-h-[48px] px-3 -ml-1 inline-flex items-center gap-1 rounded-xl text-[17px] font-semibold text-[var(--bm-accent)]"
      >
        <ChevronLeft className="w-6 h-6" aria-hidden />
        Zurück zur Übersicht
      </button>

      {!detail ? (
        <p className="rounded-2xl bg-[var(--bm-surface)] px-4 py-4 text-[16px] text-[var(--bm-text-2)]">In diesem Zeitraum keine Routen.</p>
      ) : (
        <>
          <div>
            <h3 className="text-[22px] font-bold text-[var(--bm-text)]" data-testid="setter-detail-name">{detail.summary.name}</h3>
            <p className="text-[16px] text-[var(--bm-text-2)]">
              {detail.summary.routes} {detail.summary.routes === 1 ? 'Route' : 'Routen'} · {detail.summary.activeRoutes} an der Wand
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Kpi
              id="stars"
              label="Ø Sterne"
              value={detail.summary.avgStars === null ? '–' : fmt1(detail.summary.avgStars)}
              sub={detail.summary.hallStars === null ? undefined : `Andere Schrauber, gleiche Farben: ${fmt1(detail.summary.hallStars)}`}
              aria={detail.summary.avgStars === null
                ? 'Durchschnitt Sterne: noch zu wenige Bewertungen'
                : `Durchschnitt ${fmt1(detail.summary.avgStars)} Sterne${detail.summary.hallStars !== null ? `, andere Schrauber in gleichen Farben ${fmt1(detail.summary.hallStars)}` : ''}`}
            />
            <Kpi
              id="grade"
              label="Grad passt"
              value={detail.summary.gradeFair === null ? '–' : `${detail.summary.gradeFair} von ${detail.summary.feelTotal}`}
              aria={detail.summary.gradeFair === null
                ? 'Grad passt: noch zu wenige Stimmen'
                : `${detail.summary.gradeFair} von ${detail.summary.feelTotal} sagen, der Grad passt`}
            />
            <Kpi
              id="firsttry"
              label="Im 1. Versuch"
              value={detail.summary.firstTryRate === null ? '–' : `${detail.summary.flashes} von ${detail.summary.ascents}`}
              sub={detail.summary.hallFirstTryRate === null ? undefined : `Andere: ${pct(detail.summary.hallFirstTryRate)}`}
              aria={detail.summary.firstTryRate === null
                ? 'Im ersten Versuch: noch zu wenige Begehungen'
                : `${detail.summary.flashes} von ${detail.summary.ascents} Begehungen im ersten Versuch`}
            />
            <Kpi
              id="weekly"
              label="Pro Woche"
              value={detail.summary.weekly === null ? '–' : fmt1(detail.summary.weekly)}
              sub={detail.summary.hallWeekly === null ? undefined : `Andere: ${fmt1(detail.summary.hallWeekly)}`}
              aria={`${detail.summary.weekly === null ? 'keine' : fmt1(detail.summary.weekly)} Begehungen pro Route und Woche`}
            />
          </div>

          {detail.summary.avgStars === null && detail.summary.gradeFair === null && (
            <p className="rounded-2xl bg-[var(--bm-surface)] px-4 py-4 text-[16px] text-[var(--bm-text-2)]" data-testid="setter-detail-empty">
              Noch zu wenige Bewertungen. Ab 3 Bewertungen pro Route erscheinen hier Sterne und Grad-Gefühl.
            </p>
          )}

          {detail.favorite && (
            <section className="rounded-2xl bg-[var(--bm-surface)] px-4 py-3 space-y-1" data-testid="setter-detail-favorite">
              <h4 className="text-[17px] font-semibold text-[var(--bm-text)]">Lieblingsroute</h4>
              <div className="flex items-center gap-3">
                <ColorDot hex={detail.favorite.colorHex} />
                <span className="text-[16px] font-medium text-[var(--bm-text)]">{detail.favorite.colorName} · {detail.favorite.label}</span>
              </div>
              <p className="text-[16px] text-[var(--bm-text)] tabular-nums">
                {fmt1(detail.favorite.avgStars as number)} ★ aus {detail.favorite.ratings} Bewertungen
              </p>
              <p className="text-[15px] text-[var(--bm-text-2)]">Diese Route mögen die Leute besonders.</p>
            </section>
          )}

          <section className="space-y-2" data-testid="setter-detail-colors">
            <h4 className="px-1 text-[20px] font-semibold text-[var(--bm-text)]">Pro Farbe</h4>
            <ul className="rounded-2xl bg-[var(--bm-surface)] divide-y divide-[var(--bm-line)] overflow-hidden">
              {detail.colors.map(c => (
                <li key={c.scaleId} className="px-4 py-3 space-y-1" data-testid={`setter-detail-color-${c.scaleId}`}>
                  <div className="flex items-center gap-3">
                    <ColorDot hex={c.colorHex} />
                    <span className="flex-1 text-[16px] font-medium text-[var(--bm-text)]">{c.colorName}</span>
                    <span className="text-[16px] tabular-nums text-[var(--bm-text)]">{c.routes} {c.routes === 1 ? 'Route' : 'Routen'}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 text-[15px] text-[var(--bm-text-2)]">
                    <StarsWithHall value={c.avgStars} hall={c.hallStars} />
                    {c.feelTotal >= 3 && <FeelLine feel={c.feel} testId={`setter-detail-color-${c.scaleId}-feel`} />}
                  </div>
                  {c.tendency && (
                    <p className="text-[16px] font-semibold text-[var(--bm-text)]" data-testid={`setter-detail-color-${c.scaleId}-tendency`}>
                      {c.tendency === 'stiff' ? 'wirkt eher hart' : 'wirkt eher leicht'}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2" data-testid="setter-detail-routes">
            <h4 className="px-1 text-[20px] font-semibold text-[var(--bm-text)]">Routen</h4>
            <ul className="rounded-2xl bg-[var(--bm-surface)] divide-y divide-[var(--bm-line)] overflow-hidden">
              {detail.routes.map(r => <RouteItem key={r.boulderId} route={r} now={now} />)}
            </ul>
          </section>
        </>
      )}
    </div>
  );
};

export const SetterReportView: React.FC<SetterReportViewProps> = ({ gymId, scope, version = 0 }) => {
  const [sort, setSort] = useState<SetterReportSort>('routes');
  const [openSetterId, setOpenSetterId] = useState<string | null>(null);
  const rows = useMemo(() => sortSetterReport(computeSetterReport({ gymId, scope }), sort), [gymId, scope, sort, version]);

  if (openSetterId) {
    return (
      <SetterDetailView
        gymId={gymId}
        scope={scope}
        setterId={openSetterId}
        version={version}
        onBack={() => setOpenSetterId(null)}
      />
    );
  }

  return (
    <div className="space-y-4" data-testid="setter-report">
      <p className="rounded-2xl bg-[var(--bm-surface)] px-4 py-3 text-[16px] text-[var(--bm-text)]" data-testid="setter-report-note">
        Die Zahlen sind ein Gesprächsanlass, keine Note. Deine Schrauber sehen ihre eigenen Zahlen unter «Meine Routen».
      </p>

      <div role="group" aria-label="Sortieren nach" className="grid grid-cols-2 gap-2">
        {SORTS.map(s => (
          <button
            key={s.id}
            type="button"
            aria-pressed={sort === s.id}
            onClick={() => setSort(s.id)}
            data-testid={`setter-report-sort-${s.id}`}
            className={`min-h-[48px] rounded-xl text-[16px] font-semibold border ${
              sort === s.id
                ? 'bg-[var(--bm-text)] text-[var(--bm-bg)] border-[var(--bm-text)]'
                : 'bg-[var(--bm-surface)] text-[var(--bm-text)] border-[var(--bm-line)]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <section className="space-y-2" data-testid="insights-setters">
        <h3 className="px-1 text-[20px] font-semibold text-[var(--bm-text)]">Schrauber</h3>
        {rows.length === 0 ? (
          <p className="rounded-2xl bg-[var(--bm-surface)] px-4 py-4 text-[16px] text-[var(--bm-text-2)]" data-testid="setter-report-empty">
            Noch keine Routen.
          </p>
        ) : (
          <ul className="rounded-2xl bg-[var(--bm-surface)] divide-y divide-[var(--bm-line)] overflow-hidden">
            {rows.map(r => <SetterCard key={r.setterId} row={r} onOpen={() => setOpenSetterId(r.setterId)} />)}
          </ul>
        )}
      </section>
    </div>
  );
};
