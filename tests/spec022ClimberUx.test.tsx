import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { ClimberSectorView } from '../src/components/ClimberSectorView';
import { MobileBottomNav } from '../src/components/MobileBottomNav';
import { MeView } from '../src/components/MeView';
import { WallPhotoCanvas } from '../src/components/WallPhotoCanvas';
import { ToastHost, hideToast } from '../src/components/ui/Toast';
import * as gymStorage from '../src/lib/gymStorage';
import {
  createDraftBoulder,
  publishBatch,
  getSectors,
  getGradeScales,
  getWallBoulders,
} from '../src/lib/batchBoulderService';
import { getUserAscent, logAscent, saveRating, resetAscentAndRatingStorage } from '../src/lib/ratingAndAscentService';
import {
  filterClimberBoulders,
  sortByDifficulty,
  formatGrade,
  isOpenForClimber,
} from '../src/lib/climberWallFilters';
import { navigationHistory } from '../src/lib/navigationHistory';
import { Ascent, BoulderStatsAggregate, CurrentUser, GymGradeScale, WallBoulder } from '../src/types/boulder';
import { UserRoleInfo } from '../src/lib/roleService';

const GYM = 'gym-6a-plus';
const climber: CurrentUser = { id: 'spec022-climber', nickname: 'Testkletterer', role: 'member', isPlatformAdmin: false };

function boulder(id: string, gradeScaleId: string, name: string): WallBoulder {
  return {
    id,
    sectorId: 's',
    gradeScaleId,
    positionX: 0.5,
    positionY: 0.5,
    name,
    setterId: 'x',
    status: 'active',
    radar: { maximalkraft: 3, kraftausdauer: 3, kraft: 3, technik: 3, balance: 3, koordination: 3, flexibilitaet: 3 },
    createdAt: '2026-10-01T10:00:00Z',
  } as WallBoulder;
}

function scale(id: string, sortOrder: number, min = '5a', max = '5c'): GymGradeScale {
  return { id, gymId: GYM, colorName: id, colorHex: '#000', difficultyLabel: 'L', fontRangeMin: min, fontRangeMax: max, sortOrder };
}

function ascent(type: Ascent['type']): Ascent {
  return { id: 'a', userId: climber.id, userNickname: 'x', boulderId: 'b', type, createdAt: '2026-10-01T10:00:00Z' };
}

/** Zwei frisch veröffentlichte Boulder im ersten Sektor der 6a-plus-Halle (leicht + schwer). */
function seedTwoBoulders() {
  const sector = getSectors(GYM)[0];
  const scales = getGradeScales(GYM).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const hard = createDraftBoulder({
    sectorId: sector.id,
    gradeScaleId: scales[scales.length - 1].id,
    positionX: 0.3,
    positionY: 0.3,
    name: 'Zebra schwer',
    setterId: 'schrauber-6aplus',
  });
  const easy = createDraftBoulder({
    sectorId: sector.id,
    gradeScaleId: scales[0].id,
    positionX: 0.6,
    positionY: 0.6,
    name: 'Anfang leicht',
    setterId: 'schrauber-6aplus',
  });
  publishBatch(sector.id, 'schrauber-6aplus');
  return { sector, easy, hard };
}

describe('SPEC-022: Kletterer-UX – Ordnung, Übersicht, wenig Text', () => {
  beforeEach(() => {
    localStorage.clear();
    resetAscentAndRatingStorage();
    gymStorage.ensureInitialGymData();
    navigationHistory.reset();
  });

  afterEach(() => {
    act(() => hideToast());
  });

  describe('Filter und Sortierung (F4/F5, reine Funktionen)', () => {
    const a = boulder('a', 'gelb', 'A');
    const b = boulder('b', 'blau', 'B');
    const c = boulder('c', 'gelb', 'C');
    const stats = new Map<string, BoulderStatsAggregate>([
      ['a', { avgStars: 4.5 } as BoulderStatsAggregate],
      ['b', { avgStars: 3.9 } as BoulderStatsAggregate],
    ]);
    const ctx = {
      userAscentMap: new Map<string, Ascent | null>([
        ['a', ascent('top')],
        ['b', ascent('project')],
      ]),
      statsMap: stats,
      newBoulderIds: new Set(['c']),
    };

    it('«Offen» zeigt alles ohne Top/Flash, Projekte zählen als offen', () => {
      expect(filterClimberBoulders([a, b, c], 'open', ctx).map(x => x.id)).toEqual(['b', 'c']);
      expect(isOpenForClimber(null)).toBe(true);
      expect(isOpenForClimber(ascent('project'))).toBe(true);
      expect(isOpenForClimber(ascent('flash'))).toBe(false);
    });

    it('«Neu» und «★ Top» filtern nach Badge bzw. ≥ 4 Sternen', () => {
      expect(filterClimberBoulders([a, b, c], 'new', ctx).map(x => x.id)).toEqual(['c']);
      expect(filterClimberBoulders([a, b, c], 'top_rated', ctx).map(x => x.id)).toEqual(['a']);
      expect(filterClimberBoulders([a, b, c], 'all', ctx)).toHaveLength(3);
    });

    it('sortiert nach Hallenfarben-Reihenfolge, dann Name', () => {
      const scales = new Map([['gelb', scale('gelb', 2)], ['blau', scale('blau', 1)]]);
      expect(sortByDifficulty([c, a, b], x => scales.get(x.gradeScaleId)).map(x => x.id)).toEqual(['b', 'a', 'c']);
    });

    it('formatiert Grade kompakt', () => {
      expect(formatGrade(scale('x', 1, '6a', '6b'))).toBe('6a–6b');
      expect(formatGrade(scale('x', 1, '4', '4'))).toBe('4');
      expect(formatGrade(undefined, '7a')).toBe('7a');
    });
  });

  describe('Wand (F1–F6)', () => {
    it('zeigt das Foto vor Sektor-Pill und Filter und keine zweite Hallenwahl', () => {
      seedTwoBoulders();
      render(<ClimberSectorView currentUser={climber} activeGymId={GYM} />);

      const view = screen.getByTestId('climber-wall-view');
      const photo = screen.getByTestId('climber-wall-photo');
      const pill = screen.getByTestId('sector-pill');
      const chips = screen.getByTestId('climber-filter-chips');
      // Dokument-Reihenfolge: Foto → Pill → Filter
      expect(photo.compareDocumentPosition(pill) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(pill.compareDocumentPosition(chips) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(view.firstElementChild).toBe(photo);

      expect(within(view).queryByRole('combobox')).not.toBeInTheDocument();
      expect(screen.queryByText('Filter zurücksetzen')).not.toBeInTheDocument();
    });

    it('listet Routen leicht → schwer als kompakte Zeilen mit Status-Symbol', () => {
      const { easy, hard } = seedTwoBoulders();
      logAscent(climber.id, climber.nickname, hard.id, 'flash');
      render(<ClimberSectorView currentUser={climber} activeGymId={GYM} />);

      const rows = within(screen.getByTestId('climber-route-list')).getAllByRole('button');
      const ids = rows.map(r => r.getAttribute('data-testid'));
      expect(ids.indexOf(`route-row-${easy.id}`)).toBeLessThan(ids.indexOf(`route-row-${hard.id}`));
      expect(within(screen.getByTestId(`route-status-${hard.id}`)).getByLabelText('Flash')).toBeInTheDocument();
      expect(screen.getByTestId(`route-status-${easy.id}`)).toBeEmptyDOMElement();
    });

    it('F19: zeigt geschaffte Routen gross beschriftet (Flash/Top) in Liste und Foto, mit Fortschritt der Wand', () => {
      const { easy, hard } = seedTwoBoulders();
      logAscent(climber.id, climber.nickname, easy.id, 'top');
      logAscent(climber.id, climber.nickname, hard.id, 'flash');
      render(<ClimberSectorView currentUser={climber} activeGymId={GYM} />);

      expect(screen.getByTestId(`route-status-${easy.id}`)).toHaveTextContent('Top');
      expect(screen.getByTestId(`route-status-${hard.id}`)).toHaveTextContent('Flash');
      expect(screen.getByTestId(`pin-status-${easy.id}`)).toHaveAttribute('aria-label', 'Top');
      expect(screen.getByTestId(`pin-status-${hard.id}`)).toHaveAttribute('aria-label', 'Flash');

      const total = within(screen.getByTestId('climber-route-list')).getAllByRole('button').length;
      expect(screen.getByTestId('climber-progress')).toHaveTextContent(`2 von ${total} geschafft`);
    });

    it('F20: Hallen-Klassiker hat einen grossen Stern am Pin statt winzigem «5.0» und eine goldene Plakette in der Liste', () => {
      const { easy } = seedTwoBoulders();
      saveRating('friend-1', 'Freundin', easy.id, { qualityStars: 5, gradeFeel: 'fair' });
      render(<ClimberSectorView currentUser={climber} activeGymId={GYM} />);

      const badge = screen.getByTestId(`classic-badge-${easy.id}`);
      expect(badge).toHaveClass('w-6', 'h-6');
      expect(badge).not.toHaveTextContent('5.0');
      const hero = screen.getByTestId(`hero-score-${easy.id}`);
      expect(hero).toHaveTextContent('5.0');
      expect(hero.className).toContain('bg-[var(--bm-star)]');
      expect(hero.className).toContain('text-[16px]');
    });

    it('F21: Kletterer sehen keinen «Pin antippen»-Hinweis, Schrauber behalten ihre Bedienhilfe', () => {
      seedTwoBoulders();
      const { unmount } = render(<ClimberSectorView currentUser={climber} activeGymId={GYM} />);
      expect(screen.queryByText('Pin antippen')).not.toBeInTheDocument();
      unmount();

      render(<WallPhotoCanvas mode="setter" photoUrl="/wall.jpg" boulders={[]} gradeScales={[]} />);
      expect(screen.getByText('Klick = Pin')).toBeInTheDocument();
    });

    it('Filter «Offen» blendet getoppte Boulder aus; «Neu» erscheint nur bei neuen Bouldern', () => {
      const { easy, hard } = seedTwoBoulders();
      logAscent(climber.id, climber.nickname, easy.id, 'top');
      render(<ClimberSectorView currentUser={climber} activeGymId={GYM} />);

      expect(screen.getByTestId('filter-chip-new')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('filter-chip-open'));
      expect(screen.queryByTestId(`route-row-${easy.id}`)).not.toBeInTheDocument();
      expect(screen.getByTestId(`route-row-${hard.id}`)).toBeInTheDocument();
    });

    it('zeigt bei leerem Filter «Nichts gefunden» mit «Alle zeigen»', () => {
      const { sector } = seedTwoBoulders();
      // alles an der Wand getoppt → «Offen» ist leer
      for (const b of getWallBoulders(sector.id)) logAscent(climber.id, climber.nickname, b.id, 'top');
      render(<ClimberSectorView currentUser={climber} activeGymId={GYM} />);
      fireEvent.click(screen.getByTestId('filter-chip-open'));
      expect(screen.getByText('Nichts gefunden.')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Alle zeigen' }));
      expect(screen.getByTestId('filter-chip-all')).toHaveAttribute('aria-pressed', 'true');
    });

    it('Sektor-Pill: Pfeile wechseln, Tippen öffnet die Sektor-Liste mit Anzahl Boulder', () => {
      seedTwoBoulders();
      const sectors = getSectors(GYM);
      render(<ClimberSectorView currentUser={climber} activeGymId={GYM} />);

      expect(screen.getByTestId('sector-pill-name')).toHaveTextContent(`1/${sectors.length}`);
      fireEvent.click(screen.getByTestId('sector-next-btn'));
      expect(screen.getByTestId('sector-pill-name')).toHaveTextContent(sectors[1].name);

      fireEvent.click(screen.getByTestId('sector-pill-name'));
      const sheet = screen.getByTestId('sector-list-sheet');
      expect(within(sheet).getByTestId(`sector-list-item-${sectors[0].id}`)).toHaveTextContent(/\d+ Boulder/);
      expect(within(sheet).getByTestId(`sector-list-item-${sectors[1].id}`)).toHaveAttribute('aria-current', 'true');

      fireEvent.click(within(sheet).getByTestId(`sector-list-item-${sectors[0].id}`));
      expect(screen.queryByTestId('sector-list-sheet')).not.toBeInTheDocument();
      expect(screen.getByTestId('sector-pill-name')).toHaveTextContent(sectors[0].name);
    });
  });

  describe('Boulder-Sheet statt Detail-Modal (F7–F9)', () => {
    it('loggt mit einem Tap, schliesst das Sheet und bietet Rückgängig', () => {
      const { easy } = seedTwoBoulders();
      render(
        <>
          <ClimberSectorView currentUser={climber} activeGymId={GYM} />
          <ToastHost />
        </>
      );

      fireEvent.click(screen.getByTestId(`route-row-${easy.id}`));
      expect(screen.getByTestId('boulder-sheet')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('log-top-btn'));
      expect(screen.queryByTestId('boulder-sheet')).not.toBeInTheDocument();
      expect(getUserAscent(climber.id, easy.id)?.type).toBe('top');
      expect(screen.getByText('Top geloggt')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Rückgängig' }));
      expect(getUserAscent(climber.id, easy.id)).toBeNull();
    });

    it('erneuter Tap auf den aktiven Status ändert nichts', () => {
      const { easy } = seedTwoBoulders();
      logAscent(climber.id, climber.nickname, easy.id, 'top');
      render(<ClimberSectorView currentUser={climber} activeGymId={GYM} />);
      fireEvent.click(screen.getByTestId(`route-row-${easy.id}`));
      fireEvent.click(screen.getByTestId('log-top-btn'));
      expect(getUserAscent(climber.id, easy.id)?.type).toBe('top');
    });

    it('zeigt in den Details «Wer war schon oben» mit Wertungen anderer', () => {
      const { easy } = seedTwoBoulders();
      logAscent('friend-1', 'Freundin', easy.id, 'flash');
      saveRating('friend-1', 'Freundin', easy.id, { qualityStars: 4, gradeFeel: 'soft' });
      render(<ClimberSectorView currentUser={climber} activeGymId={GYM} />);

      fireEvent.click(screen.getByTestId(`route-row-${easy.id}`));
      fireEvent.click(screen.getByTestId('boulder-sheet-more'));
      const section = screen.getByTestId('community-ratings-section');
      const row = within(section).getByTestId('community-rating-row-friend-1');
      expect(row).toHaveTextContent('Freundin');
      expect(row).toHaveTextContent('4');
      expect(row).toHaveTextContent('Soft');
    });
  });

  describe('Bewerten-Knopf im halben Sheet (F23)', () => {
    it('öffnet das Bewertungsfenster mit einem Tap, ohne Details aufzuziehen', () => {
      const { easy } = seedTwoBoulders();
      render(<ClimberSectorView currentUser={climber} activeGymId={GYM} />);
      fireEvent.click(screen.getByTestId(`route-row-${easy.id}`));

      const btn = screen.getByTestId('quick-rate-btn');
      expect(btn).toHaveTextContent('Bewerten');
      expect(screen.queryByTestId('boulder-sheet-details')).not.toBeInTheDocument();

      fireEvent.click(btn);
      expect(screen.getByText('Wie fandest du den Grad / die Schwierigkeit?')).toBeInTheDocument();
    });

    it('zeigt die eigene Bewertung auf dem Knopf', () => {
      const { easy } = seedTwoBoulders();
      saveRating(climber.id, climber.nickname, easy.id, { qualityStars: 4 });
      render(<ClimberSectorView currentUser={climber} activeGymId={GYM} />);
      fireEvent.click(screen.getByTestId(`route-row-${easy.id}`));
      expect(screen.getByTestId('quick-rate-btn')).toHaveTextContent('Deine Bewertung: 4 Sterne');
    });

    it('nach dem Loggen geht kein Bewertungsfenster von selbst auf', () => {
      const { easy } = seedTwoBoulders();
      render(
        <>
          <ClimberSectorView currentUser={climber} activeGymId={GYM} />
          <ToastHost />
        </>
      );
      fireEvent.click(screen.getByTestId(`route-row-${easy.id}`));
      fireEvent.click(screen.getByTestId('log-top-btn'));
      expect(screen.queryByText('Wie fandest du den Grad / die Schwierigkeit?')).not.toBeInTheDocument();
    });
  });

  describe('Navigation und Ich (F10, F11)', () => {
    it('Bottom-Nav hat genau zwei Tabs', () => {
      render(<MobileBottomNav activeTab="wall" onSelectTab={() => {}} />);
      const nav = screen.getByTestId('mobile-bottom-nav');
      expect(within(nav).getAllByRole('button')).toHaveLength(2);
      expect(screen.getByTestId('mobile-tab-wall')).toHaveAttribute('aria-current', 'page');
      expect(screen.getByTestId('mobile-tab-stats')).toHaveTextContent('Ich');
    });

    const climberRole: UserRoleInfo = {
      userId: climber.id,
      gymId: GYM,
      roles: ['member'],
      isClimber: true,
      isSetter: false,
      isAdmin: false,
      isPlatformAdmin: false,
      canAccessSetterStudio: false,
      canAccessAdminConsole: false,
      canCreateGyms: false,
      canAppointSetters: false,
      canAppointAdmins: false,
    };

    it('Ich ist eine Seite ohne Unter-Tabs; Stil zeigt Fortschritt bis zum Profil', () => {
      render(<MeView currentUser={climber} activeGymId={GYM} roleInfo={climberRole} onSwitchMode={() => {}} onLogout={() => {}} />);
      expect(screen.getByTestId('user-profile-view')).toBeInTheDocument();
      // nur ein Umschalter (Halle | Alle Hallen), keine Unter-Tabs
      expect(screen.getAllByRole('tablist')).toHaveLength(1);
      expect(screen.queryByTestId('subtab-overall')).not.toBeInTheDocument();
      expect(screen.queryByTestId('subtab-deep-dive')).not.toBeInTheDocument();
      expect(screen.getByTestId('me-style-locked')).toHaveTextContent(/Noch \d+ Tops/);
    });

    it('Einstellungen zeigen den Arbeitsbereich nur berechtigten Rollen', () => {
      const { rerender } = render(
        <MeView currentUser={climber} activeGymId={GYM} roleInfo={climberRole} onSwitchMode={() => {}} onLogout={() => {}} />
      );
      fireEvent.click(screen.getByTestId('open-settings-btn'));
      expect(screen.queryByTestId('settings-open-studio')).not.toBeInTheDocument();
      expect(screen.getByTestId('settings-logout')).toBeInTheDocument();

      rerender(
        <MeView
          currentUser={climber}
          activeGymId={GYM}
          roleInfo={{ ...climberRole, isSetter: true, canAccessSetterStudio: true }}
          onSwitchMode={() => {}}
          onLogout={() => {}}
        />
      );
      expect(screen.getByTestId('settings-open-studio')).toBeInTheDocument();
    });
  });
});
