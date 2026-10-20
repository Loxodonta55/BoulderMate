import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { SetterStatsView } from '../src/components/setter/SetterStatsView';
import { BatchBoulderWorkflow } from '../src/components/BatchBoulderWorkflow';
import { clearBatchServiceStorage, getWallBoulders, getSectors } from '../src/lib/batchBoulderService';
import { resetAllGymData, ensureInitialGymData } from '../src/lib/gymStorage';
import { setSessionUser } from '../src/lib/authService';
import { computeSetterStats, isOwnRoute, setSetterStatsLastViewed } from '../src/lib/setterStats';
import { addComment, getAscents, getComments, getRatings, saveRating } from '../src/lib/ratingAndAscentService';
import * as syncService from '../src/lib/syncService';

/** SPEC-044 · Ansicht «Meine Routen» im Schrauber-Studio */

const GYM = 'gym-6a-plus';
const ME = 'user-boris';

beforeEach(() => {
  localStorage.clear();
  resetAllGymData();
  clearBatchServiceStorage();
  ensureInitialGymData();
  setSessionUser(ME);
  vi.restoreAllMocks();
  vi.spyOn(syncService, 'syncFromSupabase').mockResolvedValue(false);
});

const ownActive = () => {
  const sectorIds = new Set(getSectors(GYM).map(s => s.id));
  return getWallBoulders().filter(b => sectorIds.has(b.sectorId) && b.status === 'active' && isOwnRoute(b, ME));
};

describe('AC-1 Umschalter im Studio', () => {
  it('«Wände» ist Standard, «Meine Routen» zeigt die Statistik und zurück', () => {
    render(<BatchBoulderWorkflow currentRole="setter" currentUserId={ME} activeGymId={GYM} />);
    expect(screen.getByTestId('setter-mode-walls')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByTestId('setter-stats')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('setter-mode-stats'));
    expect(screen.getByTestId('setter-stats')).toBeInTheDocument();
    expect(screen.queryByTestId('publish-batch-btn')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('setter-mode-walls'));
    expect(screen.getByTestId('publish-batch-btn')).toBeInTheDocument();
  });

  it('Kletterer sehen den Umschalter nicht', () => {
    render(<BatchBoulderWorkflow currentRole="member" currentUserId={ME} activeGymId={GYM} />);
    expect(screen.queryByTestId('setter-mode-stats')).not.toBeInTheDocument();
  });
});

describe('AC-2 bis AC-7 Ansicht', () => {
  it('Testdaten haben eigene Routen', () => {
    expect(ownActive().length).toBeGreaterThan(0);
  });

  it('Kacheln und Liste passen zur Berechnung, Vergleich heißt «Andere, gleiche Farben»', () => {
    const expected = computeSetterStats({ gymId: GYM, setterId: ME });
    render(<SetterStatsView gymId={GYM} setterId={ME} />);
    expect(screen.getByTestId('setter-kpi-routes-value')).toHaveTextContent(String(expected.kpis.routes));
    expect(screen.getByTestId('setter-kpi-ascents-value')).toHaveTextContent(String(expected.kpis.ascents));
    expect(screen.getByTestId('setter-kpi-stars-baseline')).toHaveTextContent('Andere, gleiche Farben');
    expect(screen.getByTestId('setter-kpi-stars')).toHaveAttribute('aria-label', expect.stringContaining('Sterne'));
    for (const r of expected.routes) {
      const row = screen.getByTestId(`setter-route-${r.boulderId}`);
      expect(row).toHaveTextContent(r.colorName); // AC-12 Farbname neben dem Punkt
    }
    expect(screen.getByTestId('setter-stats-transparency')).toHaveTextContent('Hallenleitung');
  });

  it('Routen unter 3 Bewertungen zeigen «noch n Bewertungen»', () => {
    const expected = computeSetterStats({ gymId: GYM, setterId: ME });
    render(<SetterStatsView gymId={GYM} setterId={ME} />);
    const few = expected.routes.find(r => r.avgStars === null);
    if (few) expect(screen.getByTestId(`setter-route-${few.boulderId}-missing`)).toHaveTextContent(`noch ${few.missingRatings}`);
  });

  it('Sortierung umschalten', () => {
    render(<SetterStatsView gymId={GYM} setterId={ME} />);
    expect(screen.getByTestId('setter-stats-sort-newest')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByTestId('setter-stats-sort-least'));
    expect(screen.getByTestId('setter-stats-sort-least')).toHaveAttribute('aria-pressed', 'true');
  });

  it('Zeitraum «Alle» zeigt abgeschraubte Routen mit Datum', () => {
    render(<SetterStatsView gymId={GYM} setterId={ME} />);
    fireEvent.click(screen.getByTestId('setter-stats-scope-all'));
    const all = computeSetterStats({ gymId: GYM, setterId: ME, scope: 'all' });
    const archived = all.routes.find(r => r.status === 'archived');
    if (archived) expect(screen.getByTestId(`setter-route-${archived.boulderId}-archived`)).toHaveTextContent('abgeschraubt am');
    expect(screen.getByTestId('setter-kpi-routes-value')).toHaveTextContent(String(all.kpis.routes));
  });

  it('leerer Zustand ohne eigene Routen', () => {
    render(<SetterStatsView gymId={GYM} setterId="niemand" />);
    expect(screen.getByTestId('setter-stats-empty')).toHaveTextContent('Geschraubt von');
    expect(screen.queryByTestId('setter-kpi-routes')).not.toBeInTheDocument();
  });

  it('«Seit deinem letzten Blick» erscheint erst beim zweiten Öffnen mit Neuem', () => {
    const { unmount } = render(<SetterStatsView gymId={GYM} setterId={ME} />);
    expect(screen.queryByTestId('setter-stats-since')).not.toBeInTheDocument();
    unmount();
    const target = ownActive()[0];
    setSetterStatsLastViewed(GYM, Date.now() - 60_000);
    addComment('hans-kletterer', 'Hans', target.id, 'Neue Beta zum Testen');
    render(<SetterStatsView gymId={GYM} setterId={ME} />);
    expect(screen.getByTestId('setter-stats-since')).toHaveTextContent('1 Beta');
  });
});

describe('AC-8 bis AC-10 Route im Detail', () => {
  it('öffnet die Route mit Grad-Gefühl, Beta ohne Namen und «Im Studio öffnen»', () => {
    const target = ownActive()[0];
    addComment('hans-kletterer', 'Hans Geheimname', target.id, 'Ferse rechts setzen');
    const onOpenInStudio = vi.fn();
    render(<SetterStatsView gymId={GYM} setterId={ME} onOpenInStudio={onOpenInStudio} />);
    fireEvent.click(screen.getByTestId(`setter-route-${target.id}`));
    const sheet = screen.getByTestId('setter-route-sheet');
    expect(within(sheet).getByTestId('setter-route-feel')).toBeInTheDocument();
    expect(within(sheet).getByTestId('setter-route-comments')).toHaveTextContent('Ferse rechts setzen');
    expect(sheet).not.toHaveTextContent('Hans Geheimname');
    fireEvent.click(within(sheet).getByTestId('setter-route-open-studio'));
    expect(onOpenInStudio).toHaveBeenCalledWith(target.id, target.sectorId);
  });

  it('keine Namen von Kletterern in der ganzen Ansicht', () => {
    const names = new Set([...getAscents(), ...getRatings(), ...getComments()].map(x => x.userNickname).filter(n => n && n.length > 3));
    const { container } = render(<SetterStatsView gymId={GYM} setterId={ME} />);
    for (const n of names) {
      if (n === 'Boris') continue; // Schrauber selbst kann im Seed auch klettern; sein Name steht nirgends
      expect(container.textContent).not.toContain(n);
    }
  });

  it('«Im Studio öffnen» springt zu «Wände» und öffnet das Boulder-Sheet', () => {
    const target = ownActive()[0];
    render(<BatchBoulderWorkflow currentRole="setter" currentUserId={ME} activeGymId={GYM} />);
    fireEvent.click(screen.getByTestId('setter-mode-stats'));
    fireEvent.click(screen.getByTestId(`setter-route-${target.id}`));
    fireEvent.click(screen.getByTestId('setter-route-open-studio'));
    expect(screen.getByTestId('setter-mode-walls')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('save-boulder-sheet-btn')).toBeInTheDocument();
  });
});

describe('AC-6 Hinweise in der Ansicht', () => {
  it('Lieblingsroute erscheint grün betont, «Erledigt» blendet sie aus', () => {
    const target = ownActive()[0];
    ['k-a', 'k-b', 'k-c'].forEach(k => saveRating(k, 'Geheim', target.id, { qualityStars: 5, gradeFeel: 'fair' }));
    render(<SetterStatsView gymId={GYM} setterId={ME} />);
    const hint = screen.getByTestId('setter-hint-favorite');
    expect(hint).toHaveTextContent('mögen die Leute: 5,0 ★ aus 3 Bewertungen');
    fireEvent.click(within(hint).getByTestId('setter-hint-dismiss'));
    expect(screen.queryByTestId('setter-hint-favorite')).not.toBeInTheDocument();
    expect(Object.keys(JSON.parse(localStorage.getItem(`bm_setter_hints_dismissed_${GYM}`) || '{}'))).toEqual([`${target.id}:favorite`]);
  });
});
