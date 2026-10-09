import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, MapPin, Clock, Plus, UserPlus, EyeOff, Flag, Trash2, WifiOff, Users } from 'lucide-react';
import { CurrentUser, Gym, WallBoulder } from '../../types/boulder';
import { Sheet } from '../ui/Sheet';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { showToast } from '../ui/Toast';
import { BoulderSheet } from '../BoulderSheet';
import { useBackHandler } from '../../hooks/useBackHandler';
import { getWallBoulders, getSectors, getGradeScales } from '../../lib/batchBoulderService';
import { getProfileData } from '../../lib/profileService';
import { normalizeFontGrade } from '../../lib/gradeConverter';
import {
  TreffEntry,
  TreffEntryInput,
  TreffReportReason,
  TREFF_REPORT_REASONS,
  TREFF_ERROR_TEXT,
  TREFF_NOTE_MAX,
  TREFF_TIME_OPTIONS,
  TREFF_GRADE_OPTIONS,
  TREFF_CHANGED_EVENT,
  TreffError,
  loadTreffEntries,
  splitTreffEntries,
  filterByGym,
  formatTreffDay,
  formatTreffTime,
  formatGradeRange,
  displayGrade,
  treffCompanions,
  treffDayOptions,
  nextHalfHour,
  getTreffSettings,
  refreshTreffSettings,
  saveTreffSettings,
  hasTreffConsent,
  isTreffEnabledForGym,
  createTreffEntry,
  checkInNow,
  joinTreffEntry,
  deleteTreffEntry,
  blockTreffUser,
  reportTreffEntry,
  cleanupLocalTreff,
} from '../../lib/treffService';

/**
 * SPEC-028 · Treff – «Wer ist da?»
 * Eigener Tab neben Wand und Ich. Eintragen, wann man in der Halle ist; keine Nachrichten.
 */

export interface TreffViewProps {
  currentUser: CurrentUser;
  activeGymId: string;
  gyms: Gym[];
}

// ---------------------------------------------------------------------------
// Kleine Bausteine (groß und kontrastreich, AC-14)
// ---------------------------------------------------------------------------

export const TreffAvatar: React.FC<{ name?: string; url?: string; size?: number }> = ({ name, url, size = 44 }) => (
  <span
    className="shrink-0 rounded-full bg-[var(--bm-elevated)] text-[var(--bm-text)] font-bold flex items-center justify-center overflow-hidden"
    style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    aria-hidden
  >
    {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : name ? name.trim().charAt(0).toUpperCase() : <Users className="w-1/2 h-1/2" />}
  </span>
);

export const GradeBadge: React.FC<{ min?: string; max?: string }> = ({ min, max }) => {
  const label = formatGradeRange(min, max);
  if (!label) return null;
  return (
    <span className="shrink-0 px-2.5 py-0.5 rounded-lg border-2 border-[var(--bm-text)] text-[15px] font-bold" data-testid="treff-grade">
      {label}
    </span>
  );
};

const BigToggle: React.FC<{ value: 'gym' | 'all'; onChange: (v: 'gym' | 'all') => void }> = ({ value, onChange }) => (
  <div role="tablist" data-testid="treff-scope" className="flex p-1 rounded-xl bg-[var(--bm-elevated)]">
    {([
      ['gym', 'Diese Halle'],
      ['all', 'Alle Hallen'],
    ] as const).map(([v, label]) => (
      <button
        key={v}
        type="button"
        role="tab"
        aria-selected={value === v}
        onClick={() => onChange(v)}
        data-testid={`treff-scope-${v}`}
        className={`flex-1 min-h-[48px] rounded-lg text-[17px] font-semibold transition ${
          value === v ? 'bg-[var(--bm-surface)] text-[var(--bm-text)] shadow-sm' : 'text-[var(--bm-text-2)]'
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);

const primaryBtn =
  'w-full min-h-[56px] rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[17px] font-bold flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-50';
const secondaryBtn =
  'w-full min-h-[56px] rounded-xl bg-[var(--bm-surface)] text-[var(--bm-text)] text-[17px] font-bold flex items-center justify-center gap-2 border-2 border-[var(--bm-line)] active:bg-[var(--bm-elevated)] disabled:opacity-50';
const selectCls =
  'w-full min-h-[52px] rounded-xl bg-[var(--bm-surface)] border-2 border-[var(--bm-line)] px-3 text-[17px] font-semibold text-[var(--bm-text)]';

// ---------------------------------------------------------------------------
// Boulder-Auswahl (F3)
// ---------------------------------------------------------------------------

export function boulderLabel(b: WallBoulder, gymId?: string): string {
  const sector = getSectors(gymId).find(s => s.id === b.sectorId);
  const scale = getGradeScales(gymId).find(s => s.id === b.gradeScaleId);
  const parts = [scale?.colorName, b.fontGrade ? displayGrade(b.fontGrade) : null, b.name].filter(Boolean).join(' ');
  return sector ? `${parts || 'Boulder'} · ${sector.name}` : parts || 'Boulder';
}

function activeBouldersForGym(gymId: string): WallBoulder[] {
  const sectorIds = new Set(getSectors(gymId).map(s => s.id));
  return getWallBoulders().filter(b => b.status === 'active' && sectorIds.has(b.sectorId));
}

/** Bester Grad aus «Ich» für die Vorbelegung (F9). */
function bestGradeOf(userId: string): string | undefined {
  try {
    const best = getProfileData(userId, 'all').kpis.bestTopFont;
    if (!best) return undefined;
    const g = normalizeFontGrade(best);
    return TREFF_GRADE_OPTIONS.includes(g) ? g : undefined;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Hinweis + Alters-Häkchen (F9, F11)
// ---------------------------------------------------------------------------

export const TreffConsentSheet: React.FC<{ open: boolean; onClose: () => void; onConfirm: () => void }> = ({ open, onClose, onConfirm }) => {
  const [age, setAge] = useState(false);
  useEffect(() => {
    if (!open) setAge(false);
  }, [open]);
  return (
    <Sheet open={open} onClose={onClose} fitContent testId="treff-consent" ariaLabel="Hinweis zu Treff">
      <div className="px-5 pt-2 space-y-5">
        <h2 className="text-[24px] font-bold">Bevor du dich einträgst</h2>
        <p className="text-[17px] leading-snug">
          Andere sehen deinen Spitznamen, dein Bild und wann du in der Halle bist. Sprich Leute nur in der Halle an.
        </p>
        <label className="flex items-center gap-3 min-h-[52px] text-[17px] font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={age}
            onChange={e => setAge(e.target.checked)}
            className="w-7 h-7 accent-[var(--bm-accent)]"
            data-testid="treff-consent-age"
          />
          Ich bin mindestens 16 Jahre alt.
        </label>
        <button type="button" className={primaryBtn} disabled={!age} onClick={onConfirm} data-testid="treff-consent-ok">
          Verstanden
        </button>
      </div>
    </Sheet>
  );
};

// ---------------------------------------------------------------------------
// Eintragen (Formular, gepushter Screen)
// ---------------------------------------------------------------------------

const TreffForm: React.FC<{
  gymId: string;
  gymName: string;
  bestGrade?: string;
  showGrade: boolean;
  onBack: () => void;
  onSubmit: (input: TreffEntryInput) => Promise<TreffError | null>;
}> = ({ gymId, gymName, bestGrade, showGrade, onBack, onSubmit }) => {
  const days = useMemo(() => treffDayOptions(), []);
  const [day, setDay] = useState(days[0].key);
  const initialFrom = useMemo(() => {
    const n = nextHalfHour();
    return TREFF_TIME_OPTIONS.includes(n) ? n : '18:00';
  }, []);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(() => {
    const i = TREFF_TIME_OPTIONS.indexOf(initialFrom);
    return TREFF_TIME_OPTIONS[Math.min(i + 4, TREFF_TIME_OPTIONS.length - 1)];
  });
  const bestIdx = bestGrade ? TREFF_GRADE_OPTIONS.indexOf(bestGrade) : -1;
  const [gradeMin, setGradeMin] = useState(bestIdx >= 0 ? TREFF_GRADE_OPTIONS[Math.max(0, bestIdx - 2)] : '');
  const [gradeMax, setGradeMax] = useState(bestIdx >= 0 ? TREFF_GRADE_OPTIONS[bestIdx] : '');
  const [boulderRef, setBoulderRef] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const boulders = useMemo(() => activeBouldersForGym(gymId), [gymId]);

  const submit = async () => {
    setBusy(true);
    const err = await onSubmit({
      gymId,
      day,
      from,
      to,
      gradeMin: gradeMin || undefined,
      gradeMax: gradeMax || undefined,
      boulderRef: boulderRef || undefined,
      note,
    });
    setBusy(false);
    setError(err ? TREFF_ERROR_TEXT[err] : null);
  };

  return (
    <div className="max-w-xl mx-auto px-4 pb-10" data-testid="treff-form">
      <div className="h-12 flex items-center -ml-2">
        <button type="button" onClick={onBack} className="flex items-center text-[17px] text-[var(--bm-accent)] min-h-[44px] pr-3" data-testid="treff-form-back">
          <ChevronLeft className="w-6 h-6" />
          Treff
        </button>
      </div>
      <h1 className="text-[28px] font-bold">Eintragen</h1>
      <p className="text-[17px] text-[var(--bm-text-2)] mb-5 flex items-center gap-1.5">
        <MapPin className="w-5 h-5" aria-hidden /> {gymName}
      </p>

      <div className="space-y-6">
        <section>
          <h2 className="text-[17px] font-bold mb-2">Tag</h2>
          <div className="grid grid-cols-3 gap-2" data-testid="treff-form-days">
            {days.map(d => (
              <button
                key={d.key}
                type="button"
                onClick={() => setDay(d.key)}
                aria-pressed={day === d.key}
                data-testid={`treff-day-${d.key}`}
                className={`min-h-[52px] rounded-xl text-[17px] font-semibold border-2 ${
                  day === d.key
                    ? 'bg-[var(--bm-strong)] text-[var(--bm-bg)] border-[var(--bm-strong)]'
                    : 'bg-[var(--bm-surface)] text-[var(--bm-text)] border-[var(--bm-line)]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-[17px] font-bold mb-2">Von</span>
            <select className={selectCls} value={from} onChange={e => setFrom(e.target.value)} data-testid="treff-form-from">
              {TREFF_TIME_OPTIONS.map(t => (
                <option key={t} value={t}>{t} Uhr</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[17px] font-bold mb-2">Bis</span>
            <select className={selectCls} value={to} onChange={e => setTo(e.target.value)} data-testid="treff-form-to">
              {TREFF_TIME_OPTIONS.map(t => (
                <option key={t} value={t}>{t} Uhr</option>
              ))}
            </select>
          </label>
        </section>

        {showGrade && (
          <section>
            <h2 className="text-[17px] font-bold mb-2">Mein Niveau (freiwillig)</h2>
            <div className="grid grid-cols-2 gap-3">
              <select className={selectCls} value={gradeMin} onChange={e => setGradeMin(e.target.value)} aria-label="Niveau von" data-testid="treff-form-grade-min">
                <option value="">–</option>
                {TREFF_GRADE_OPTIONS.map(g => (
                  <option key={g} value={g}>{displayGrade(g)}</option>
                ))}
              </select>
              <select className={selectCls} value={gradeMax} onChange={e => setGradeMax(e.target.value)} aria-label="Niveau bis" data-testid="treff-form-grade-max">
                <option value="">–</option>
                {TREFF_GRADE_OPTIONS.map(g => (
                  <option key={g} value={g}>{displayGrade(g)}</option>
                ))}
              </select>
            </div>
          </section>
        )}

        {boulders.length > 0 && (
          <section>
            <h2 className="text-[17px] font-bold mb-2">Boulder (freiwillig)</h2>
            <select className={selectCls} value={boulderRef} onChange={e => setBoulderRef(e.target.value)} data-testid="treff-form-boulder">
              <option value="">Kein bestimmter Boulder</option>
              {boulders.map(b => (
                <option key={b.id} value={b.id}>{boulderLabel(b, gymId)}</option>
              ))}
            </select>
          </section>
        )}

        <section>
          <label className="block">
            <span className="block text-[17px] font-bold mb-2">Ein Satz (freiwillig)</span>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value.slice(0, TREFF_NOTE_MAX))}
              rows={2}
              maxLength={TREFF_NOTE_MAX}
              placeholder="z. B. Bin meist am Überhang, tausche gern Beta."
              className="w-full rounded-xl bg-[var(--bm-surface)] border-2 border-[var(--bm-line)] p-3 text-[17px] text-[var(--bm-text)]"
              data-testid="treff-form-note"
            />
            <span className="block text-right text-[15px] text-[var(--bm-text-2)]">{note.length}/{TREFF_NOTE_MAX}</span>
          </label>
        </section>

        {error && (
          <p role="alert" className="text-[17px] font-semibold text-[var(--bm-danger)]" data-testid="treff-form-error">
            {error}
          </p>
        )}

        <button type="button" className={primaryBtn} onClick={submit} disabled={busy} data-testid="treff-form-submit">
          Eintragen
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Zeile in der Liste
// ---------------------------------------------------------------------------

const TreffRow: React.FC<{ entry: TreffEntry; gymName?: string; isMine: boolean; onOpen: () => void }> = ({ entry, gymName, isMine, onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    data-testid={`treff-row-${entry.id}`}
    className="w-full text-left flex items-center gap-3 px-4 py-3 min-h-[72px] active:bg-[var(--bm-elevated)]"
  >
    <span className="shrink-0 w-[88px]">
      <span className="block text-[15px] font-semibold text-[var(--bm-text-2)]">{formatTreffDay(entry.startsAt)}</span>
      <span className="block text-[20px] font-bold leading-tight">{formatTreffTime(entry).replace(' Uhr', '')}</span>
    </span>
    <TreffAvatar name={entry.nickname} url={entry.avatarUrl} />
    <span className="flex-1 min-w-0">
      <span className="flex items-center gap-2">
        <span className="text-[17px] font-bold truncate">{isMine ? 'Du' : entry.nickname}</span>
        <GradeBadge min={entry.gradeMin} max={entry.gradeMax} />
      </span>
      {gymName && <span className="block text-[15px] text-[var(--bm-text-2)] truncate">{gymName}</span>}
      {entry.note && <span className="block text-[15px] text-[var(--bm-text-2)] truncate">{entry.note}</span>}
    </span>
  </button>
);

// ---------------------------------------------------------------------------
// Treff-Seite
// ---------------------------------------------------------------------------

export const TreffView: React.FC<TreffViewProps> = ({ currentUser, activeGymId, gyms }) => {
  const [scope, setScope] = useState<'gym' | 'all'>('gym');
  const [entries, setEntries] = useState<TreffEntry[]>([]);
  const [offline, setOffline] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState(() => getTreffSettings(currentUser.id));
  const [consentFor, setConsentFor] = useState<null | 'now' | 'form' | { join: TreffEntry }>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [openEntry, setOpenEntry] = useState<TreffEntry | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockConfirm, setBlockConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<TreffEntry | null>(null);
  const [boulder, setBoulder] = useState<WallBoulder | null>(null);

  useBackHandler({ id: 'treff-form', isOpen: isFormOpen, onBack: () => setIsFormOpen(false) });

  const user = useMemo(
    () => ({ id: currentUser.id, nickname: currentUser.nickname, avatarUrl: currentUser.avatarUrl }),
    [currentUser.id, currentUser.nickname, currentUser.avatarUrl]
  );
  const bestGrade = useMemo(() => bestGradeOf(currentUser.id), [currentUser.id]);
  const gymName = (id: string) => gyms.find(g => g.id === id)?.name || 'Halle';
  const treffAllowed = isTreffEnabledForGym(activeGymId);

  const reload = useCallback(async () => {
    cleanupLocalTreff();
    const res = await loadTreffEntries(currentUser.id);
    setEntries(res.entries);
    setOffline(res.offline);
    setLoaded(true);
  }, [currentUser.id]);

  useEffect(() => {
    void reload();
    void refreshTreffSettings(currentUser.id).then(setSettings);
    const onChange = () => {
      setSettings(getTreffSettings(currentUser.id));
      void reload();
    };
    window.addEventListener(TREFF_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(TREFF_CHANGED_EVENT, onChange);
  }, [currentUser.id, reload]);

  const mine = useMemo(() => entries.filter(e => e.userId === currentUser.id), [entries, currentUser.id]);
  const others = useMemo(() => filterByGym(entries.filter(e => e.userId !== currentUser.id), scope, activeGymId), [entries, scope, activeGymId, currentUser.id]);
  const { now: nowList, later: laterList } = useMemo(() => splitTreffEntries(others), [others]);

  const fail = (err: TreffError) => showToast({ message: TREFF_ERROR_TEXT[err] });

  const doCheckInNow = async () => {
    const res = await checkInNow(user, activeGymId, bestGrade ? { min: bestGrade, max: bestGrade } : undefined);
    if (!res.ok) return fail(res.error);
    showToast({ message: 'Eingetragen: Du bist jetzt da.' });
  };

  const doJoin = async (target: TreffEntry) => {
    const res = await joinTreffEntry(user, target, entries, bestGrade ? { min: bestGrade, max: bestGrade } : undefined);
    if (!res.ok) return fail(res.error);
    setOpenEntry(null);
    showToast({ message: `Eingetragen: ${formatTreffDay(target.startsAt)} ${formatTreffTime(target)}` });
  };

  /** Erst Hinweis + Häkchen (F9/F11), dann die Aktion. */
  const withConsent = (action: 'now' | 'form' | { join: TreffEntry }) => {
    if (settings.banned) return fail('banned');
    if (!hasTreffConsent(settings)) {
      setConsentFor(action);
      return;
    }
    run(action);
  };

  const run = (action: 'now' | 'form' | { join: TreffEntry }) => {
    if (action === 'now') void doCheckInNow();
    else if (action === 'form') setIsFormOpen(true);
    else void doJoin(action.join);
  };

  const confirmConsent = async () => {
    const next = await saveTreffSettings({ userId: currentUser.id, consentAt: new Date().toISOString(), ageConfirmed: true });
    setSettings(next);
    const action = consentFor;
    setConsentFor(null);
    if (action) run(action);
  };

  if (isFormOpen) {
    return (
      <TreffForm
        gymId={activeGymId}
        gymName={gymName(activeGymId)}
        bestGrade={bestGrade}
        showGrade={settings.showGrade}
        onBack={() => setIsFormOpen(false)}
        onSubmit={async input => {
          const res = await createTreffEntry(user, input);
          if (!res.ok) return res.error;
          setIsFormOpen(false);
          showToast({ message: 'Eingetragen.' });
          return null;
        }}
      />
    );
  }

  const openIsMine = openEntry?.userId === currentUser.id;
  const companions = openEntry ? treffCompanions(openEntry, entries) : [];
  const openBoulder = openEntry?.boulderRef ? getWallBoulders().find(b => b.id === openEntry.boulderRef) : undefined;

  const section = (title: string, list: TreffEntry[], testId: string) => (
    <section className="space-y-1.5" data-testid={testId}>
      <h2 className="px-1 text-[20px] font-bold">
        {title} <span className="text-[var(--bm-text-2)]">({list.length})</span>
      </h2>
      {list.length === 0 ? (
        <p className="px-1 text-[17px] text-[var(--bm-text-2)]">Noch niemand eingetragen.</p>
      ) : (
        <div className="rounded-2xl bg-[var(--bm-surface)] overflow-hidden divide-y divide-[var(--bm-line)]">
          {list.map(e => (
            <TreffRow key={e.id} entry={e} isMine={false} gymName={scope === 'all' ? gymName(e.gymId) : undefined} onOpen={() => setOpenEntry(e)} />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="max-w-xl mx-auto px-4 pb-8 space-y-6" data-testid="treff-view">
      <div className="pt-3 space-y-1">
        <h1 className="text-[28px] font-bold">Wer ist da?</h1>
        <p className="text-[17px] text-[var(--bm-text-2)]">Trag dich ein, wenn du Lust auf Austausch hast.</p>
      </div>

      <BigToggle value={scope} onChange={setScope} />

      {offline && (
        <p className="flex items-center gap-2 text-[17px] font-semibold text-[var(--bm-warning)]" data-testid="treff-offline">
          <WifiOff className="w-5 h-5" aria-hidden /> Offline – zuletzt geladener Stand
        </p>
      )}

      {treffAllowed ? (
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className={primaryBtn} onClick={() => withConsent('now')} data-testid="treff-now">
            <Clock className="w-5 h-5" aria-hidden /> Ich bin jetzt da
          </button>
          <button type="button" className={secondaryBtn} onClick={() => withConsent('form')} data-testid="treff-new">
            <Plus className="w-5 h-5" aria-hidden /> Eintragen
          </button>
        </div>
      ) : (
        <p className="text-[17px] font-semibold" data-testid="treff-gym-disabled">
          {gymName(activeGymId)} nutzt Treff nicht.
        </p>
      )}

      {mine.length > 0 && (
        <section className="space-y-1.5" data-testid="treff-mine">
          <h2 className="px-1 text-[20px] font-bold">Meine Einträge</h2>
          <div className="rounded-2xl bg-[var(--bm-surface)] overflow-hidden divide-y divide-[var(--bm-line)]">
            {mine.map(e => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3 min-h-[72px]" data-testid={`treff-mine-${e.id}`}>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold text-[var(--bm-text-2)]">
                    {formatTreffDay(e.startsAt)} · {gymName(e.gymId)}
                  </span>
                  <span className="block text-[20px] font-bold">{formatTreffTime(e)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(e)}
                  className="shrink-0 min-h-[48px] px-4 rounded-xl border-2 border-[var(--bm-line)] text-[17px] font-semibold"
                  data-testid={`treff-mine-delete-${e.id}`}
                >
                  Doch nicht
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {loaded && section('Jetzt da', nowList, 'treff-section-now')}
      {loaded && section('Kommt noch', laterList, 'treff-section-later')}

      {/* Eintrag-Sheet */}
      <Sheet open={Boolean(openEntry)} onClose={() => setOpenEntry(null)} fitContent testId="treff-entry-sheet" ariaLabel="Eintrag">
        {openEntry && (
          <div className="px-5 pt-2 space-y-4">
            <div className="flex items-center gap-3">
              <TreffAvatar name={openEntry.nickname} url={openEntry.avatarUrl} size={56} />
              <div className="min-w-0">
                <h2 className="text-[24px] font-bold truncate">{openIsMine ? 'Du' : openEntry.nickname}</h2>
                <GradeBadge min={openEntry.gradeMin} max={openEntry.gradeMax} />
              </div>
            </div>
            <p className="text-[20px] font-bold" data-testid="treff-entry-time">
              {formatTreffDay(openEntry.startsAt)} · {formatTreffTime(openEntry)}
            </p>
            <p className="text-[17px] flex items-center gap-1.5">
              <MapPin className="w-5 h-5" aria-hidden /> {gymName(openEntry.gymId)}
            </p>
            {openEntry.note && (
              <p className="text-[17px] leading-snug whitespace-pre-wrap break-words" data-testid="treff-entry-note">
                {openEntry.note}
              </p>
            )}
            {openBoulder && (
              <button
                type="button"
                onClick={() => setBoulder(openBoulder)}
                className="w-full min-h-[52px] rounded-xl bg-[var(--bm-elevated)] px-4 text-left text-[17px] font-semibold"
                data-testid="treff-entry-boulder"
              >
                Boulder: {boulderLabel(openBoulder, openEntry.gymId)}
              </button>
            )}
            {companions.length > 0 && (
              <p className="text-[17px]" data-testid="treff-entry-companions">
                <span className="font-bold">Auch da: </span>
                {companions.map(c => (c.userId === currentUser.id ? 'Du' : c.nickname)).join(', ')}
              </p>
            )}
            {!openIsMine && (
              <>
                <button type="button" className={primaryBtn} onClick={() => withConsent({ join: openEntry })} data-testid="treff-join" disabled={!isTreffEnabledForGym(openEntry.gymId)}>
                  <UserPlus className="w-5 h-5" aria-hidden /> Ich komme auch
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" className={secondaryBtn} onClick={() => setBlockConfirm(true)} data-testid="treff-block">
                    <EyeOff className="w-5 h-5" aria-hidden /> Ausblenden
                  </button>
                  <button type="button" className={secondaryBtn} onClick={() => setReportOpen(true)} data-testid="treff-report">
                    <Flag className="w-5 h-5" aria-hidden /> Melden
                  </button>
                </div>
              </>
            )}
            {openIsMine && (
              <button type="button" className={secondaryBtn} onClick={() => setDeleteConfirm(openEntry)} data-testid="treff-entry-delete">
                <Trash2 className="w-5 h-5" aria-hidden /> Doch nicht
              </button>
            )}
          </div>
        )}
      </Sheet>

      {/* Melden (F14) */}
      <Sheet open={reportOpen} onClose={() => setReportOpen(false)} fitContent testId="treff-report-sheet" ariaLabel="Melden">
        <div className="px-5 pt-2 space-y-3">
          <h2 className="text-[24px] font-bold">Warum meldest du das?</h2>
          {TREFF_REPORT_REASONS.map(r => (
            <button
              key={r.value}
              type="button"
              className={secondaryBtn}
              data-testid={`treff-report-${r.value}`}
              onClick={async () => {
                if (!openEntry) return;
                const ok = await reportTreffEntry(currentUser.id, openEntry, r.value as TreffReportReason);
                setReportOpen(false);
                setOpenEntry(null);
                showToast({ message: ok ? 'Danke, die Meldung ist angekommen.' : TREFF_ERROR_TEXT.failed });
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </Sheet>

      <ConfirmDialog
        open={blockConfirm}
        title={`${openEntry?.nickname || 'Person'} ausblenden?`}
        message="Ihr seht eure Einträge gegenseitig nicht mehr. Rückgängig unter Ich → Einstellungen → Treff."
        confirmLabel="Ausblenden"
        onCancel={() => setBlockConfirm(false)}
        onConfirm={async () => {
          setBlockConfirm(false);
          if (!openEntry) return;
          await blockTreffUser(currentUser.id, openEntry.userId, openEntry.nickname);
          setOpenEntry(null);
          showToast({ message: 'Ausgeblendet.' });
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteConfirm)}
        title="Eintrag löschen?"
        confirmLabel="Löschen"
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={async () => {
          const target = deleteConfirm;
          setDeleteConfirm(null);
          if (!target) return;
          await deleteTreffEntry(currentUser.id, target.id);
          setOpenEntry(null);
        }}
      />

      <TreffConsentSheet open={consentFor !== null} onClose={() => setConsentFor(null)} onConfirm={confirmConsent} />

      {boulder && (
        <BoulderSheet
          boulder={boulder}
          sector={getSectors(openEntry?.gymId || activeGymId).find(s => s.id === boulder.sectorId)}
          gradeScale={getGradeScales(openEntry?.gymId || activeGymId).find(s => s.id === boulder.gradeScaleId)}
          currentUser={currentUser}
          onClose={() => setBoulder(null)}
        />
      )}
    </div>
  );
};
