import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BoulderSheet } from '../src/components/BoulderSheet';
import { MeView } from '../src/components/MeView';
import { ToastHost, hideToast } from '../src/components/ui/Toast';
import * as gymStorage from '../src/lib/gymStorage';
import { createDraftBoulder, publishBatch, getSectors, getGradeScales, getWallBoulders } from '../src/lib/batchBoulderService';
import {
  resetAscentAndRatingStorage,
  logAscent,
  addAttempt,
  restoreAscent,
  getUserAscent,
  attemptsAfterLog,
} from '../src/lib/ratingAndAscentService';
import { resetProfileStorage } from '../src/lib/profileService';
import { selectMyProjects } from '../src/lib/meStats';
import { FIRST_STEPS_KEY } from '../src/components/basis/FirstStepsCard';
import { Ascent, CurrentUser, LogbookEntry, WallBoulder } from '../src/types/boulder';
import { UserRoleInfo } from '../src/lib/roleService';

const GYM = 'gym-6a-plus';
const lena: CurrentUser = { id: 'spec035-lena', nickname: 'Lena', role: 'member', isPlatformAdmin: false };
const roleInfo = { canAccessSetterStudio: false, canAccessAdminConsole: false } as UserRoleInfo;

function seed(name: string, sectorIndex = 0) {
  const sector = getSectors(GYM)[sectorIndex];
  const scale = getGradeScales(GYM)[0];
  const b = createDraftBoulder({ sectorId: sector.id, gradeScaleId: scale.id, positionX: 0.3, positionY: 0.3, name, setterId: 'schrauber-6aplus' });
  publishBatch(sector.id, 'schrauber-6aplus');
  return { sector, scale, boulder: getWallBoulders(sector.id).find(x => x.id === b.id)! };
}

describe('SPEC-035: Meine Projekte und Versuche', () => {
  beforeEach(() => {
    localStorage.clear();
    resetProfileStorage();
    resetAscentAndRatingStorage();
    gymStorage.ensureInitialGymData();
    localStorage.setItem(FIRST_STEPS_KEY, 'true');
  });
  afterEach(() => act(() => hideToast()));

  it('Versuche nach dem Loggen: Top nach n Versuchen = n+1, Flash = 1, ohne Zählung leer (F3)', () => {
    const prev = { type: 'project', attempts: 4 } as Ascent;
    expect(attemptsAfterLog(prev, 'top')).toBe(5);
    expect(attemptsAfterLog(prev, 'flash')).toBe(1);
    expect(attemptsAfterLog(null, 'top')).toBeUndefined();
    expect(attemptsAfterLog({ type: 'project' } as Ascent, 'top')).toBeUndefined();
  });

  it('«+1» macht einen ungeloggten Boulder zum Projekt und zählt hoch; Rückgängig stellt her (AC-3)', () => {
    const { boulder } = seed('Projekt A');
    const first = addAttempt(lena.id, lena.nickname, boulder.id);
    expect(first.previous).toBeNull();
    expect(getUserAscent(lena.id, boulder.id)).toMatchObject({ type: 'project', attempts: 1 });
    const second = addAttempt(lena.id, lena.nickname, boulder.id);
    expect(getUserAscent(lena.id, boulder.id)?.attempts).toBe(2);
    restoreAscent(lena.id, boulder.id, second.previous);
    expect(getUserAscent(lena.id, boulder.id)?.attempts).toBe(1);
    restoreAscent(lena.id, boulder.id, null);
    expect(getUserAscent(lena.id, boulder.id)).toBeNull();
  });

  it('Sheet: «+1» bleibt offen, Top danach zeigt «Top im 3. Versuch» (AC-3/AC-4)', () => {
    const { boulder, sector, scale } = seed('Projekt B');
    let closed = false;
    render(
      <>
        <ToastHost />
        <BoulderSheet boulder={boulder} sector={sector} gradeScale={scale} currentUser={lena} onClose={() => (closed = true)} />
      </>
    );
    fireEvent.click(screen.getByTestId('attempt-plus-btn'));
    fireEvent.click(screen.getByTestId('attempt-plus-btn'));
    expect(screen.getByTestId('attempts-count')).toHaveTextContent('2');
    expect(screen.getByTestId('toast')).toHaveTextContent('2. Versuch');
    expect(closed).toBe(false);
    fireEvent.click(screen.getByTestId('log-top-btn'));
    expect(screen.getByTestId('toast')).toHaveTextContent('Top im 3. Versuch');
    expect(getUserAscent(lena.id, boulder.id)).toMatchObject({ type: 'top', attempts: 3 });
    // Rückgängig stellt das Projekt mit 2 Versuchen wieder her
    fireEvent.click(screen.getByTestId('toast-action'));
    expect(getUserAscent(lena.id, boulder.id)).toMatchObject({ type: 'project', attempts: 2 });
  });

  it('selectMyProjects nimmt nur Projekte an aktiven Bouldern, neueste zuerst', () => {
    const mk = (id: string, type: LogbookEntry['type'], createdAt: string) => ({ id, boulderId: id, type, createdAt } as LogbookEntry);
    const boulders = [
      { id: 'a', status: 'active' },
      { id: 'b', status: 'archived' },
      { id: 'c', status: 'active' },
      { id: 'd', status: 'active' },
    ] as WallBoulder[];
    const list = selectMyProjects(
      [mk('a', 'project', '2026-10-01'), mk('b', 'project', '2026-10-02'), mk('c', 'project', '2026-10-03'), mk('d', 'top', '2026-10-04')],
      boulders
    );
    expect(list.map(e => e.boulderId)).toEqual(['c', 'a']);
  });

  it('«Ich» zeigt «Meine Projekte (n)» über Sektoren hinweg; Tippen öffnet das Sheet (AC-1/AC-2)', () => {
    const one = seed('Überhang-Projekt', 0);
    const two = seed('Platten-Projekt', 1);
    logAscent(lena.id, lena.nickname, one.boulder.id, 'project');
    addAttempt(lena.id, lena.nickname, two.boulder.id);
    addAttempt(lena.id, lena.nickname, two.boulder.id);
    render(<MeView currentUser={lena} activeGymId={GYM} roleInfo={roleInfo} onSwitchMode={() => {}} onLogout={() => {}} />);
    const section = screen.getByTestId('my-projects-section');
    expect(section).toHaveTextContent('Meine Projekte');
    expect(section).toHaveTextContent('(2)');
    expect(screen.getByTestId(`my-project-${two.boulder.id}`)).toHaveTextContent('2 Versuche');
    fireEvent.click(screen.getByTestId(`my-project-${one.boulder.id}`));
    expect(screen.getByTestId('boulder-sheet-title')).toHaveTextContent('Überhang-Projekt');
  });
});
