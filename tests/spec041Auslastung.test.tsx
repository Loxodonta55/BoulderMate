import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import * as gymStorage from '../src/lib/gymStorage';
import { createDraftBoulder, publishBatch, getSectors, getGradeScales } from '../src/lib/batchBoulderService';
import { resetAscentAndRatingStorage, logAscent } from '../src/lib/ratingAndAscentService';
import {
  levelFromCount,
  countActiveClimbers,
  getCrowdInfo,
  gymReport,
  setGymCrowdLevel,
  crowdSourceText,
} from '../src/lib/crowdService';
import { CrowdBadge, GymCrowdControl } from '../src/components/basis/CrowdBadge';
import { ToastHost, hideToast } from '../src/components/ui/Toast';

const GYM = 'gym-6a-plus';
const OTHER = 'gym-minimum-zh';

function seedBoulder(gymId = GYM, sectorIndex = 0) {
  const sector = getSectors(gymId)[sectorIndex];
  const scale = getGradeScales(gymId)[0];
  const b = createDraftBoulder({ sectorId: sector.id, gradeScaleId: scale.id, positionX: 0.4, positionY: 0.4, name: 'Voll?', setterId: 'schrauber-6aplus' });
  publishBatch(sector.id, 'schrauber-6aplus');
  return b.id;
}

describe('SPEC-041: Wie voll ist die Halle?', () => {
  beforeEach(() => {
    localStorage.clear();
    resetAscentAndRatingStorage();
    gymStorage.resetAllGymData();
    gymStorage.ensureInitialGymData();
  });
  afterEach(() => act(() => hideToast()));

  it('Stufen: unter 5 Ruhig, 5–14 Normal, ab 15 Viel los, 0 = keine Anzeige (AC-1/AC-5)', () => {
    expect(levelFromCount(0)).toBeNull();
    expect(levelFromCount(1)).toBe('ruhig');
    expect(levelFromCount(4)).toBe('ruhig');
    expect(levelFromCount(5)).toBe('normal');
    expect(levelFromCount(14)).toBe('normal');
    expect(levelFromCount(15)).toBe('voll');
  });

  it('zählt verschiedene Personen der letzten 60 Minuten in dieser Halle, plus Treff «Jetzt da» (AC-1)', () => {
    const b = seedBoulder();
    for (let i = 0; i < 6; i++) logAscent(`p${i}`, `P${i}`, b, 'top');
    logAscent('p0', 'P0', seedBoulder(GYM, 1), 'flash'); // gleiche Person zählt einmal
    expect(countActiveClimbers(GYM)).toBe(6);
    expect(countActiveClimbers(OTHER)).toBe(0);
    expect(countActiveClimbers(GYM, new Date(Date.now() + 61 * 60000))).toBe(0);
    expect(countActiveClimbers(GYM, new Date(), ['treff-1', 'p1'])).toBe(7);
    expect(getCrowdInfo(GYM)).toEqual({ level: 'normal', source: 'app' });
    expect(getCrowdInfo(OTHER)).toBeNull();
  });

  it('Meldung der Halle hat Vorrang und verfällt nach 90 Minuten; nur Admins (AC-2)', () => {
    const t0 = new Date('2026-10-09T18:00:00Z');
    expect(setGymCrowdLevel(GYM, 'hans-kletterer', 'voll', t0)).toBe(false);
    expect(setGymCrowdLevel(GYM, 'admin-6aplus', 'voll', t0)).toBe(true);
    expect(gymReport(GYM, new Date(t0.getTime() + 20 * 60000))).toEqual({ level: 'voll', source: 'halle', minutesAgo: 20 });
    expect(crowdSourceText(gymReport(GYM, new Date(t0.getTime() + 20 * 60000))!)).toBe('laut Halle, vor 20 Min');
    expect(gymReport(GYM, new Date(t0.getTime() + 90 * 60000))).toBeNull();
    expect(setGymCrowdLevel(GYM, 'admin-6aplus', null, t0)).toBe(true);
    expect(gymReport(GYM, t0)).toBeNull();
  });

  it('Anzeige ohne Zahl; Admin-Knöpfe setzen die Stufe sichtbar (AC-3/AC-4)', () => {
    const b = seedBoulder();
    for (let i = 0; i < 3; i++) logAscent(`q${i}`, `Q${i}`, b, 'top');
    render(
      <>
        <ToastHost />
        <CrowdBadge gymId={GYM} />
        <GymCrowdControl gymId={GYM} userId="admin-6aplus" />
      </>
    );
    const badge = screen.getByTestId('crowd-badge');
    expect(badge).toHaveTextContent('Gerade: Ruhig');
    expect(badge).toHaveTextContent('laut BoulderMate-Nutzern');
    expect(badge.textContent).not.toMatch(/\d/);
    fireEvent.click(screen.getByTestId('gym-crowd-voll'));
    expect(screen.getByTestId('crowd-badge')).toHaveTextContent('Gerade: Viel los');
    expect(screen.getByTestId('crowd-badge')).toHaveTextContent('laut Halle');
  });

  it('ohne Daten erscheint nichts (AC-5)', () => {
    render(<CrowdBadge gymId={GYM} />);
    expect(screen.queryByTestId('crowd-badge')).not.toBeInTheDocument();
  });
});
