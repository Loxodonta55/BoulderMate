import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ClimberSectorView } from '../src/components/ClimberSectorView';
import { BatchBoulderWorkflow } from '../src/components/BatchBoulderWorkflow';
import * as gymStorage from '../src/lib/gymStorage';
import {
  clearBatchServiceStorage,
  getSectors,
  getGradeScales,
  createDraftBoulder,
  publishBatch,
  setPlannedRebuild,
  getSectorById,
} from '../src/lib/batchBoulderService';
import { logAscent, resetAscentAndRatingStorage } from '../src/lib/ratingAndAscentService';
import { WALL_VISITS_KEY, formatPlannedDate } from '../src/lib/wallNews';
import { navigationHistory } from '../src/lib/navigationHistory';
import * as syncService from '../src/lib/syncService';
import type { CurrentUser } from '../src/types/boulder';

/** SPEC-031 · Hinweis-Streifen, Sektor-Liste, Ankündigung an der Wand und im Schrauber-Studio */

const GYM = 'gym-minimum-zh';
const climber: CurrentUser = { id: 'spec031-climber', nickname: 'Testkletterer', role: 'member', isPlatformAdmin: false };

function inDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function simulatePreviousVisit(hoursAgo: number) {
  const t = Date.now() - hoursAgo * 60 * 60 * 1000;
  localStorage.setItem(WALL_VISITS_KEY, JSON.stringify({
    [`${climber.id}::${GYM}`]: { lastSeenAt: t, visitStartedAt: t, previousVisitAt: null },
  }));
}

function publishNewBoulder(sectorIndex = 1) {
  const sector = getSectors(GYM)[sectorIndex];
  const scale = getGradeScales(GYM)[0];
  const draft = createDraftBoulder({ sectorId: sector.id, gradeScaleId: scale.id, positionX: 0.4, positionY: 0.4, name: 'Neu 031', setterId: 'schrauber-minimum' });
  publishBatch(sector.id, 'schrauber-minimum');
  return { sector, draft };
}

beforeEach(() => {
  localStorage.clear();
  resetAscentAndRatingStorage();
  gymStorage.resetAllGymData();
  clearBatchServiceStorage();
  gymStorage.ensureInitialGymData();
  navigationHistory.reset();
  vi.restoreAllMocks();
  vi.spyOn(syncService, 'syncFromSupabase').mockResolvedValue(false);
});

describe('AC-1 bis AC-3 «Neu seit deinem letzten Besuch»', () => {
  it('erster Besuch: kein Streifen', () => {
    publishNewBoulder();
    render(<ClimberSectorView currentUser={climber} activeGymId={GYM} />);
    expect(screen.queryByTestId('wall-news-banner')).not.toBeInTheDocument();
  });

  it('nächster Besuch: Streifen mit Anzahl, «Zeigen» öffnet die Sektor-Liste mit «1 neu»', () => {
    simulatePreviousVisit(5);
    const { sector } = publishNewBoulder();
    render(<ClimberSectorView currentUser={climber} activeGymId={GYM} />);
    expect(screen.getByTestId('wall-news-count')).toHaveTextContent('1 neuer Boulder seit deinem letzten Besuch');
    fireEvent.click(screen.getByTestId('wall-news-show'));
    const sheet = screen.getByTestId('sector-list-sheet');
    expect(within(sheet).getByTestId(`sector-new-count-${sector.id}`)).toHaveTextContent('1 neu');
    expect(screen.queryByTestId('wall-news-banner')).not.toBeInTheDocument();
  });

  it('✕ schließt den Streifen auch nach dem Neuladen', () => {
    simulatePreviousVisit(5);
    publishNewBoulder();
    const { unmount } = render(<ClimberSectorView currentUser={climber} activeGymId={GYM} />);
    fireEvent.click(screen.getByTestId('wall-news-dismiss'));
    expect(screen.queryByTestId('wall-news-banner')).not.toBeInTheDocument();
    unmount();
    render(<ClimberSectorView currentUser={climber} activeGymId={GYM} />);
    expect(screen.queryByTestId('wall-news-banner')).not.toBeInTheDocument();
  });

  it('Gäste sehen keinen Streifen', () => {
    simulatePreviousVisit(5);
    publishNewBoulder();
    render(<ClimberSectorView currentUser={{ ...climber, id: 'guest' }} activeGymId={GYM} />);
    expect(screen.queryByTestId('wall-news-banner')).not.toBeInTheDocument();
  });
});

describe('AC-5/AC-7 Angekündigter Umbau an der Wand', () => {
  it('Badge, Satz mit offenen Projekten und «Letzte Chance»', () => {
    const sector = getSectors(GYM)[0];
    const scale = getGradeScales(GYM)[0];
    const draft = createDraftBoulder({ sectorId: sector.id, gradeScaleId: scale.id, positionX: 0.2, positionY: 0.2, setterId: 'schrauber-minimum' });
    publishBatch(sector.id, 'schrauber-minimum');
    logAscent(climber.id, climber.nickname, draft.id, 'project');
    const date = inDays(3);
    setPlannedRebuild(sector.id, date);
    simulatePreviousVisit(5);

    render(<ClimberSectorView currentUser={climber} activeGymId={GYM} />);
    expect(screen.getByTestId('sector-pill-name')).toHaveTextContent(sector.name);
    expect(within(screen.getByTestId('sector-pill')).getByTestId('sector-planned-badge')).toHaveTextContent(`bis ${formatPlannedDate(date)}`);
    expect(screen.getByTestId('climber-planned-notice')).toHaveTextContent(`Wird am ${formatPlannedDate(date)} abgeschraubt · 1 Projekt offen`);
    expect(screen.getByTestId('wall-news-last-chance')).toHaveTextContent(`Letzte Chance: ${sector.name} wird am`);
  });

  it('ohne Ankündigung kein Badge und kein Satz', () => {
    render(<ClimberSectorView currentUser={climber} activeGymId={GYM} />);
    expect(screen.queryByTestId('sector-planned-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('climber-planned-notice')).not.toBeInTheDocument();
  });
});

describe('AC-4 Schrauber-Studio «Umbau ankündigen»', () => {
  it('ankündigen, Vergangenheit ablehnen, entfernen', () => {
    render(<BatchBoulderWorkflow currentRole="setter" currentUserId="schrauber-minimum" activeGymId={GYM} />);
    const sector = getSectors(GYM)[0];
    fireEvent.click(screen.getByTestId('announce-rebuild-btn'));
    const dialog = screen.getByTestId('rebuild-announce-dialog');

    fireEvent.change(within(dialog).getByTestId('rebuild-announce-date'), { target: { value: '2020-01-01' } });
    fireEvent.click(within(dialog).getByTestId('rebuild-announce-save'));
    expect(within(dialog).getByTestId('rebuild-announce-error')).toHaveTextContent('Vergangenheit');

    const date = inDays(4);
    fireEvent.change(within(dialog).getByTestId('rebuild-announce-date'), { target: { value: date } });
    fireEvent.click(within(dialog).getByTestId('rebuild-announce-save'));
    expect(getSectorById(sector.id)!.rebuildPlannedFor).toBe(date);
    expect(screen.getByTestId('announce-rebuild-btn')).toHaveTextContent(`Umbau am ${formatPlannedDate(date)}`);

    fireEvent.click(screen.getByTestId('announce-rebuild-btn'));
    fireEvent.click(screen.getByTestId('rebuild-announce-clear'));
    expect(getSectorById(sector.id)!.rebuildPlannedFor).toBeUndefined();
    expect(screen.getByTestId('announce-rebuild-btn')).toHaveTextContent('Umbau ankündigen');
  });
});
