import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  BannerState,
  ChallengeContext,
  STORE_KEY,
  BANNER_SETTING_KEY,
  closeBanner,
  decideBanner,
  evaluateBoulder,
  getChallengeToday,
  isTodaysChallenge,
  pickChallengeCandidates,
  readBannerState,
  resolveChallengeToday,
  safeGrade,
  setBannerEnabled,
  shouldShowBannerToday,
  swapChallengeToday,
} from '../src/lib/challengeToday';
import { ChallengeTodayRow, ChallengeTodayBanner, reasonLines, CHALLENGE_HELP } from '../src/components/challenge/ChallengeToday';
import { ClimberSectorView } from '../src/components/ClimberSectorView';
import { BoulderSheet } from '../src/components/BoulderSheet';
import { ToastHost, hideToast } from '../src/components/ui/Toast';
import { updateBoulderDetails, getWallBoulders, setPlannedRebuild, getSectors } from '../src/lib/batchBoulderService';
import { dayKey } from '../src/lib/challengeToday';
import { logAscent, resetAscentAndRatingStorage } from '../src/lib/ratingAndAscentService';
import { EN } from '../src/lib/i18n';
import { BoulderRating, CurrentUser, GymGradeScale, LogbookEntry, RadarAttributes, Sector, WallBoulder } from '../src/types/boulder';

// ---------------------------------------------------------------------------
// Hilfen für die reine Berechnung
// ---------------------------------------------------------------------------
const NOW = new Date('2026-10-20T18:00:00');

const scale = (id: string, min: string, max = min, colorName = 'Weiß'): GymGradeScale => ({
  id, gymId: 'g', colorName, colorHex: '#f8fafc', difficultyLabel: '', fontRangeMin: min, fontRangeMax: max, sortOrder: 1,
});

function entry(boulderId: string, fontGrade: string, createdAt = '2026-10-10T10:00:00', type: LogbookEntry['type'] = 'top'): LogbookEntry {
  return {
    id: boulderId, ascentId: 'a', boulderId, type, createdAt, gymId: 'g', gymName: 'G', sectorId: 's', sectorName: 'S',
    gradeScale: scale('x', fontGrade), fontGrade,
  } as LogbookEntry;
}

function wb(id: string, radar: Partial<RadarAttributes>, extra: Partial<WallBoulder> = {}): WallBoulder {
  return {
    id, sectorId: 's', gradeScaleId: 'white', positionX: 0, positionY: 0, setterId: 'x', status: 'active',
    radar: { maximalkraft: 3, kraftausdauer: 3, technik: 3, balance: 3, koordination: 3, flexibilitaet: 3, ...radar },
    createdAt: '2026-10-01', ...extra,
  } as WallBoulder;
}

const rating = (boulderId: string, r: Partial<BoulderRating>): BoulderRating =>
  ({ id: `${boulderId}-${Math.random()}`, boulderId, userId: 'u', userNickname: 'u', createdAt: '', updatedAt: '', ...r });

/** Hans: dynamisch und kräftig, Technik und Beweglichkeit schwach. Sicherer Grad 6a. */
const HANS_RADAR: RadarAttributes = { maximalkraft: 4.5, kraftausdauer: 3, technik: 2, balance: 3, koordination: 4.2, flexibilitaet: 2.2 };
const POWER = { maximalkraft: 5, koordination: 5, technik: 2, flexibilitaet: 2 };

function ctx(boulders: WallBoulder[], opts: Partial<ChallengeContext> & { ratings?: BoulderRating[]; topped?: string[]; rebuild?: string[] } = {}): ChallengeContext {
  const scales: Record<string, GymGradeScale> = {
    white: scale('white', '6a+'),
    w6a: scale('w6a', '6a'),
    w6b: scale('w6b', '6b'),
    w7a: scale('w7a', '7a'),
  };
  return {
    userRadar: HANS_RADAR,
    unlocked: true,
    logbook: [entry('l1', '6a'), entry('l2', '6a'), entry('l3', '5c'), entry('l4', '5c'), entry('l5', '5b')],
    boulders,
    scaleOf: b => scales[b.gradeScaleId],
    sectorOf: b => ({ id: b.sectorId, gymId: 'g', name: 'Höhle', wallPhotoUrl: '', sortOrder: 0, createdAt: '', rebuildStartedAt: opts.rebuild?.includes(b.id) ? '2026-10-19' : undefined } as Sector),
    ratingsOf: id => (opts.ratings || []).filter(r => r.boulderId === id),
    isTopped: id => (opts.topped || []).includes(id),
    now: NOW,
    ...opts,
  };
}

describe('SPEC-051 F1: Auswahl der Route', () => {
  it('Hans-Beispiel: stiffe weiße 6a+ mit Dynamik und Maximalkraft ja, mit Technik nein (AC-2, AC-3)', () => {
    const feelStiff = [rating('dyn', { gradeFeel: 'stiff' }), rating('dyn', { gradeFeel: 'stiff' }), rating('tech', { gradeFeel: 'stiff' })];
    const dyn = wb('dyn', POWER);
    const tech = wb('tech', { ...POWER, technik: 4 });
    const list = pickChallengeCandidates(ctx([dyn, tech], { ratings: feelStiff }));
    expect(list.map(c => c.boulder.id)).toEqual(['dyn']);
    expect(list[0].fontGrade).toBe('6b'); // stiff: 6a+ → 6b
    expect(list[0].feel).toBe('stiff');
    expect(list[0].steps).toBe(2);
    expect(list[0].strengths.map(s => s.key)).toEqual(['maximalkraft', 'koordination']);
    expect(list[0].lowNeeds.map(s => s.key)).toEqual(['technik']);
  });

  it('nur 1–2 Stufen über dem sicheren Grad; Stiff kann eine Route herausschieben (AC-1, AC-3)', () => {
    const atSafe = wb('atSafe', POWER, { gradeScaleId: 'w6a' });
    const plus2 = wb('plus2', POWER, { gradeScaleId: 'w6b' });
    const tooHard = wb('tooHard', POWER, { gradeScaleId: 'w7a' });
    const base = ctx([atSafe, plus2, tooHard]);
    expect(pickChallengeCandidates(base).map(c => c.boulder.id)).toEqual(['plus2']);
    const stiff = ctx([plus2], { ratings: [rating('plus2', { gradeFeel: 'stiff' })] });
    expect(pickChallengeCandidates(stiff)).toHaveLength(0); // 6b stiff → 6b+ = 3 Stufen
  });

  it('braucht eine Stärke ≥ 4 und keine Schwäche über 3 (AC-2)', () => {
    const noStrength = wb('noStrength', { maximalkraft: 3.5, koordination: 3, balance: 4 });
    const flexy = wb('flexy', { ...POWER, flexibilitaet: 3.5 });
    expect(pickChallengeCandidates(ctx([noStrength, flexy]))).toHaveLength(0);
  });

  it('getoppt, archiviert, Umbau und schlecht bewertet sind raus; unbewertet ist erlaubt (AC-4)', () => {
    const ok = wb('ok', POWER);
    const topped = wb('topped', POWER);
    const archived = wb('archived', POWER, { status: 'archived' });
    const rebuild = wb('rebuild', POWER);
    const bad = wb('bad', POWER);
    const list = pickChallengeCandidates(
      ctx([ok, topped, archived, rebuild, bad], {
        topped: ['topped'],
        rebuild: ['rebuild'],
        ratings: [rating('bad', { qualityStars: 2 }), rating('bad', { qualityStars: 3 })],
      })
    );
    expect(list.map(c => c.boulder.id)).toEqual(['ok']);
    expect(list[0].stars).toBeNull();
  });

  it('gut bewertete und nur 1 Stufe höhere Routen kommen zuerst', () => {
    const a = wb('a', POWER, { gradeScaleId: 'w6b' });
    const b = wb('b', POWER); // 6a+, 1 Stufe
    const c = wb('c', POWER);
    const list = pickChallengeCandidates(ctx([a, b, c], { ratings: [rating('c', { qualityStars: 5 })] }));
    expect(list.map(x => x.boulder.id)).toEqual(['c', 'b', 'a']);
  });

  it('gesperrt ohne Stil-Profil (unter 5 Tops)', () => {
    expect(evaluateBoulder(wb('x', POWER), ctx([], { unlocked: false }))).toBeNull();
  });

  it('Begründung: höchstens 2 Stärken, 1 «Kaum … nötig», Stufen über dem sicheren Grad', () => {
    const [c] = pickChallengeCandidates(ctx([wb('dyn', POWER)]));
    expect(reasonLines(c)).toEqual(['Liegt dir: Maximalkraft 5 · Koordination 5', 'Kaum Technik nötig', '1 Stufe über deinem sicheren Grad 6a']);
  });
});

describe('SPEC-051: sicherer Grad (AC-5)', () => {
  it('schwerster Grad mit 2 Tops in 90 Tagen, ein Ausreißer zählt nicht', () => {
    expect(safeGrade([entry('a', '7a'), entry('b', '6b'), entry('c', '6b'), entry('d', '6a')], NOW)).toBe('6b');
  });
  it('alte Tops zählen erst, wenn es in 90 Tagen keinen Grad mit 2 Tops gibt', () => {
    const old = '2026-01-01T10:00:00';
    expect(safeGrade([entry('a', '7a', old), entry('b', '7a', old), entry('c', '6a'), entry('d', '6a')], NOW)).toBe('6a');
    expect(safeGrade([entry('a', '7a', old), entry('b', '7a', old), entry('c', '6a')], NOW)).toBe('7a');
  });
  it('sonst bester Top; Projekte zählen nicht', () => {
    expect(safeGrade([entry('a', '6c'), entry('b', '5c'), entry('p', '7a', undefined, 'project')], NOW)).toBe('6c');
    expect(safeGrade([], NOW)).toBeNull();
  });
});

describe('SPEC-051 F2: eine Challenge pro Tag (AC-6)', () => {
  const list = [wb('a', POWER), wb('b', POWER), wb('c', POWER), wb('d', POWER)];
  it('gleicher Tag = gleiche Wahl, aus den besten 3', () => {
    const c = ctx(list);
    const first = resolveChallengeToday(c, 'u1', 'g', undefined);
    const again = resolveChallengeToday(c, 'u1', 'g', first.state);
    expect(again.result.candidate?.boulder.id).toBe(first.result.candidate?.boulder.id);
    expect(['a', 'b', 'c']).toContain(first.result.candidate?.boulder.id);
    expect(first.result.canSwap).toBe(true);
  });
  it('neuer Tag wählt neu', () => {
    const today = resolveChallengeToday(ctx(list), 'u1', 'g', undefined);
    const tomorrow = resolveChallengeToday(ctx(list, { now: new Date('2026-10-21T09:00:00') }), 'u1', 'g', today.state);
    expect(tomorrow.state.day).toBe('2026-10-21');
    expect(tomorrow.state.swaps).toBe(0);
  });
  it('heute getoppt: bleibt die Challenge und gilt als geschafft', () => {
    const first = resolveChallengeToday(ctx(list), 'u1', 'g', undefined);
    const id = first.result.candidate!.boulder.id;
    const after = resolveChallengeToday(ctx(list, { topped: [id] }), 'u1', 'g', first.state);
    expect(after.result.candidate?.boulder.id).toBe(id);
    expect(after.result.done).toBe(true);
    expect(after.result.canSwap).toBe(false);
  });
});

describe('SPEC-051 F5: Streifen-Regeln (AC-7)', () => {
  const fresh: BannerState = { dismissStreak: 0, visitsWithout: 0 };
  it('40 % pro Besuchstag, einmal entschieden gilt den ganzen Tag', () => {
    expect(decideBanner(fresh, '2026-10-20', () => 0.39).show).toBe(true);
    const no = decideBanner(fresh, '2026-10-20', () => 0.41);
    expect(no.show).toBe(false);
    expect(no.state.visitsWithout).toBe(1);
    expect(decideBanner(no.state, '2026-10-20', () => 0).show).toBe(false);
  });
  it('nach 3 Besuchstagen ohne Streifen kommt er sicher', () => {
    expect(decideBanner({ ...fresh, visitsWithout: 3 }, '2026-10-20', () => 0.99).show).toBe(true);
  });
  it('höchstens 1× am Tag, 2× «X» hintereinander = 14 Tage Pause, «Zeigen» setzt zurück', () => {
    const once = closeBanner(fresh, '2026-10-20', false);
    expect(decideBanner(once, '2026-10-20', () => 0).show).toBe(false);
    expect(once.dismissStreak).toBe(1);
    const twice = closeBanner(once, '2026-10-22', false);
    expect(twice.pausedUntil).toBe('2026-11-05');
    expect(decideBanner(twice, '2026-11-04', () => 0).show).toBe(false);
    expect(decideBanner(twice, '2026-11-05', () => 0).show).toBe(true);
    expect(closeBanner(once, '2026-10-22', true).dismissStreak).toBe(0);
  });
  it('Schalter aus = nie', () => {
    expect(decideBanner({ ...fresh, visitsWithout: 9 }, '2026-10-20', () => 0, false).show).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Mit echtem Speicher und Seed-Daten (Minimum Zürich)
// ---------------------------------------------------------------------------
const HANS: CurrentUser = { id: 'hans-kletterer', nickname: 'Hans', role: 'member' };
const GYM = 'gym-minimum-zh';

/** Gleiche Vorbereitung wie im Playwright-Test: 5 Kraft-Tops in 5c, zwei Kraft-Routen in 6a+. */
function setupHans() {
  const easy = ['boulder-overhang-3', 'boulder-overhang-6', 'boulder-roof-3', 'boulder-roof-5', 'boulder-overhang-4'];
  for (const id of easy) updateBoulderDetails(id, { fontGrade: '5c' });
  for (const id of ['boulder-roof-2', 'boulder-roof-4', 'boulder-slab-2']) updateBoulderDetails(id, { fontGrade: '6a+' });
  for (const id of easy) logAscent(HANS.id, HANS.nickname, id, 'top');
}

describe('SPEC-051 mit Speicher', () => {
  beforeEach(() => {
    localStorage.clear();
    resetAscentAndRatingStorage();
    hideToast();
  });

  it('wählt eine Kraft-Route, merkt sie für den Tag, «Andere zeigen» höchstens bis nichts mehr da ist (AC-6)', () => {
    setupHans();
    const first = getChallengeToday(HANS.id, GYM);
    const id = first.candidate!.boulder.id;
    expect(['boulder-roof-2', 'boulder-roof-4']).toContain(id);
    expect(getChallengeToday(HANS.id, GYM).candidate!.boulder.id).toBe(id);
    expect(isTodaysChallenge(HANS.id, id)).toBe(true);
    expect(first.canSwap).toBe(true);
    const swapped = swapChallengeToday(HANS.id, GYM);
    expect(swapped.candidate!.boulder.id).not.toBe(id);
    expect(swapped.canSwap).toBe(false); // nur 2 Kandidatinnen
    expect(isTodaysChallenge(HANS.id, id)).toBe(false);
  });

  it('ohne Stil-Profil: weder Zeile noch Challenge (AC-10)', () => {
    expect(getChallengeToday('nobody', GYM).unlocked).toBe(false);
    const { container } = render(<ChallengeTodayRow userId="nobody" gymId={GYM} gymName="Minimum" onOpen={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('Zeile in «Ich»: eingeklappt, aufklappbar mit Begründung, «Route öffnen» und «?» (AC-10)', () => {
    setupHans();
    let opened: WallBoulder | null = null;
    render(<ChallengeTodayRow userId={HANS.id} gymId={GYM} gymName="Minimum" onOpen={b => (opened = b)} />);
    expect(screen.getByTestId('challenge-today-toggle')).toHaveTextContent('Deine Challenge heute');
    expect(screen.getByTestId('challenge-today-subtitle')).toHaveTextContent('6a+');
    expect(screen.queryByTestId('challenge-today-details')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('challenge-today-toggle'));
    expect(screen.getByTestId('challenge-today-reasons')).toHaveTextContent('Liegt dir: Maximalkraft 5');
    expect(screen.getByTestId('challenge-today-reasons')).toHaveTextContent('Stufen über deinem sicheren Grad 5c');
    fireEvent.click(screen.getByTestId('challenge-today-help'));
    expect(screen.getByTestId('challenge-today-help-text')).toHaveTextContent('nur auf deinem Gerät');
    fireEvent.click(screen.getByTestId('challenge-today-swap'));
    expect(screen.queryByTestId('challenge-today-swap')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('challenge-today-open'));
    expect(opened).not.toBeNull();
  });

  it('ohne passende Route: ehrlicher Satz', () => {
    setupHans();
    updateBoulderDetails('boulder-roof-2', { fontGrade: '7a' });
    updateBoulderDetails('boulder-roof-4', { fontGrade: '7a' });
    render(<ChallengeTodayRow userId={HANS.id} gymId={GYM} gymName="Minimum" onOpen={() => {}} />);
    expect(screen.getByTestId('challenge-today-subtitle')).toHaveTextContent('Heute keine passende Route in Minimum. Schau morgen wieder.');
  });

  it('Streifen: Text, «Zeigen» und «X»', () => {
    setupHans();
    const c = getChallengeToday(HANS.id, GYM).candidate!;
    const calls: string[] = [];
    render(<ChallengeTodayBanner candidate={c} onShow={() => calls.push('show')} onDismiss={() => calls.push('x')} />);
    expect(screen.getByTestId('challenge-today-banner')).toHaveTextContent('Deine Challenge heute');
    fireEvent.click(screen.getByTestId('challenge-today-banner-show'));
    fireEvent.click(screen.getByTestId('challenge-today-banner-dismiss'));
    expect(calls).toEqual(['show', 'x']);
  });

  it('an der Wand: erscheint nach Garantie, «Zeigen» öffnet die Route und schließt für heute (AC-7, AC-9)', async () => {
    setupHans();
    localStorage.setItem(STORE_KEY, JSON.stringify({ [HANS.id]: { days: {}, banner: { dismissStreak: 0, visitsWithout: 3 } } }));
    render(<ClimberSectorView currentUser={HANS} activeGymId={GYM} />);
    const banner = await screen.findByTestId('challenge-today-banner', {}, { timeout: 2000 });
    expect(banner).toHaveTextContent('Deine Challenge heute');
    fireEvent.click(screen.getByTestId('challenge-today-banner-show'));
    expect(screen.queryByTestId('challenge-today-banner')).not.toBeInTheDocument();
    expect(await screen.findByTestId('challenge-today-sheet-line')).toHaveTextContent('Deine Challenge heute');
    expect(readBannerState(HANS.id).closedDay).toBeTruthy();
    expect(shouldShowBannerToday(HANS.id)).toBe(false);
  });

  it('«Neu an der Wand» hat Vorrang: kein Streifen im selben Besuch, auch nicht nach dem Wegklicken (AC-8)', async () => {
    setupHans();
    const slab = getWallBoulders().find(b => b.id === 'boulder-slab-6')!;
    logAscent(HANS.id, HANS.nickname, slab.id, 'project');
    const soon = new Date();
    soon.setDate(soon.getDate() + 2);
    setPlannedRebuild(slab.sectorId, dayKey(soon));
    expect(getSectors(GYM).some(s => s.rebuildPlannedFor)).toBe(true);
    localStorage.setItem(STORE_KEY, JSON.stringify({ [HANS.id]: { days: {}, banner: { dismissStreak: 0, visitsWithout: 3 } } }));
    render(<ClimberSectorView currentUser={HANS} activeGymId={GYM} />);
    expect(await screen.findByTestId('wall-news-banner')).toBeInTheDocument();
    await act(() => new Promise(r => setTimeout(r, 600)));
    expect(screen.queryByTestId('challenge-today-banner')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('wall-news-dismiss'));
    await act(() => new Promise(r => setTimeout(r, 600)));
    expect(screen.queryByTestId('challenge-today-banner')).not.toBeInTheDocument();
  });

  it('Schalter aus: kein Streifen an der Wand (AC-7)', async () => {
    setupHans();
    setBannerEnabled(false);
    expect(localStorage.getItem(BANNER_SETTING_KEY)).toBe('off');
    localStorage.setItem(STORE_KEY, JSON.stringify({ [HANS.id]: { days: {}, banner: { dismissStreak: 0, visitsWithout: 3 } } }));
    render(<ClimberSectorView currentUser={HANS} activeGymId={GYM} />);
    await act(() => new Promise(r => setTimeout(r, 600)));
    expect(screen.queryByTestId('challenge-today-banner')).not.toBeInTheDocument();
  });

  it('Top auf der Challenge: «Challenge geschafft!» im normalen Log-Hinweis (AC-11)', () => {
    setupHans();
    const id = getChallengeToday(HANS.id, GYM).candidate!.boulder.id;
    const boulder = getWallBoulders().find(b => b.id === id)!;
    render(
      <>
        <BoulderSheet boulder={boulder} currentUser={HANS} onClose={() => {}} />
        <ToastHost />
      </>
    );
    expect(screen.getByTestId('challenge-today-sheet-line')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('log-top-btn'));
    expect(screen.getAllByTestId('toast')).toHaveLength(1);
    expect(screen.getByTestId('toast')).toHaveTextContent('Challenge geschafft!');
    expect(screen.getByTestId('toast-feel')).toBeInTheDocument();
  });
});

describe('SPEC-051: Englisch (AC-12)', () => {
  it('alle neuen Texte haben einen englischen Eintrag', () => {
    for (const key of [
      'Deine Challenge heute', '{color} Nr. {n}', 'Liegt dir: {list}', 'Kaum {label} nötig',
      '1 Stufe über deinem sicheren Grad {grade}', '{n} Stufen über deinem sicheren Grad {grade}',
      'Heute keine passende Route in {gym}. Schau morgen wieder.', 'Route öffnen', 'Andere zeigen', 'Geschafft',
      CHALLENGE_HELP, 'Wie wird die Challenge gewählt?', 'Zeigen', 'Hinweis schließen', 'Challenge-Hinweis an der Wand',
      '«Deine Challenge heute» bleibt in «Ich» immer erreichbar.', 'Challenge geschafft!', 'Maximalkraft', 'Technik',
    ]) {
      expect(EN[key], key).toBeTruthy();
    }
  });
});
