import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MeView } from '../src/components/MeView';
import { DeepDiveView } from '../src/components/DeepDiveView';
import * as gymStorage from '../src/lib/gymStorage';
import { createDraftBoulder, publishBatch, getSectors, getGradeScales } from '../src/lib/batchBoulderService';
import { logAscent, resetAscentAndRatingStorage } from '../src/lib/ratingAndAscentService';
import {
  buildDeepDiveReport,
  getDeepDiveReport,
  formatAxisValue,
  getHighlights,
  toAxisValues,
} from '../src/lib/deepDiveService';
import { navigationHistory } from '../src/lib/navigationHistory';
import { CurrentUser, GymGradeScale, LogbookEntry, RadarAttributes } from '../src/types/boulder';
import { UserRoleInfo } from '../src/lib/roleService';

/**
 * SPEC-004 · Deep Dive v2: nur Wand-Begehungen, gleicher Hallenfilter wie «Ich»,
 * Top 5 mit auffälligen Merkmalen und «Was jeder Grad verlangt».
 */

const climber: CurrentUser = { id: 'deepdive-climber', nickname: 'Tiefgang', role: 'member', isPlatformAdmin: false };
const climberRole: UserRoleInfo = {
  userId: climber.id,
  gymId: 'gym-6a-plus',
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
} as UserRoleInfo;

const scale: GymGradeScale = {
  id: 's', gymId: 'g', colorName: 'Rot', colorHex: '#f00', difficultyLabel: 'Schwer', fontRangeMin: '6b+', fontRangeMax: '6c+', sortOrder: 4,
};

function entry(id: string, fontGrade: string, type: LogbookEntry['type'], createdAt = '2026-10-01T10:00:00Z'): LogbookEntry {
  return {
    id: `log-${id}`, ascentId: id, boulderId: id, boulderName: `Route ${id}`, type, createdAt,
    gymId: 'g', gymName: 'Halle', sectorId: 'sec', sectorName: 'Dach', gradeScale: scale, fontGrade,
  };
}

const flat: RadarAttributes = { maximalkraft: 3, kraftausdauer: 3, technik: 3, balance: 3, koordination: 3, flexibilitaet: 3 };

describe('SPEC-004 Deep Dive v2', () => {
  describe('deepDiveService (reine Berechnung)', () => {
    it('zählt nur Top/Flash, ignoriert Projekte und nimmt pro Boulder den besten Eintrag', () => {
      const report = buildDeepDiveReport(
        [entry('a', '6a', 'project'), entry('b', '6b', 'top'), entry('b', '6b', 'flash'), entry('c', '5c', 'top')],
        () => flat
      );
      expect(report.sendCount).toBe(2);
      expect(report.flashCount).toBe(1);
      expect(report.top5.map(r => r.boulderId)).toEqual(['b', 'c']);
      expect(report.top5[0].type).toBe('flash');
    });

    it('Top 5 = die fünf schwersten Grade, mit Merkmalen ≥ 4 wie «Maximalkraft 5»', () => {
      const grades = ['5a', '5b', '5c', '6a', '6a+', '6b', '6b+', '6c'];
      const log = grades.map((g, i) => entry(`r${i}`, g, 'top'));
      const report = buildDeepDiveReport(log, id =>
        id === 'r7' ? { ...flat, maximalkraft: 5, koordination: 4.2 } : flat
      );
      expect(report.top5.map(r => r.fontGrade)).toEqual(['6c', '6b+', '6b', '6a+', '6a']);
      expect(report.top5[0].highlights).toEqual([
        { key: 'maximalkraft', label: 'Maximalkraft', value: 5 },
        { key: 'koordination', label: 'Koordination', value: 4.2 },
      ]);
      expect(report.top5[1].highlights).toEqual([]);
    });

    it('erkennt, was die Top 5 vom Rest unterscheidet', () => {
      const log = ['5a', '5b', '5c', '6a', '6a+', '6b', '6b+', '6c'].map((g, i) => entry(`r${i}`, g, 'top'));
      const hard = new Set(['r3', 'r4', 'r5', 'r6', 'r7']);
      const report = buildDeepDiveReport(log, id => (hard.has(id) ? { ...flat, maximalkraft: 5 } : flat));
      expect(report.top5Pattern[0]).toMatchObject({ key: 'maximalkraft', topAvg: 5, restAvg: 3, delta: 2 });
      expect(report.top5Pattern).toHaveLength(1);
    });

    it('gruppiert pro Grad (schwerster zuerst) mit typischen Anforderungen', () => {
      const report = buildDeepDiveReport(
        [entry('a', '6a', 'top'), entry('b', '6a', 'flash'), entry('c', '6c', 'top')],
        id => (id === 'c' ? { ...flat, balance: 4 } : { ...flat, technik: 4 })
      );
      expect(report.levels.map(l => l.fontGrade)).toEqual(['6c', '6a']);
      expect(report.levels[1]).toMatchObject({ sendCount: 2, flashCount: 1 });
      expect(report.levels[1].demands.map(d => d.key)).toEqual(['technik']);
      expect(report.levels[0].demands.map(d => d.key)).toEqual(['balance']);
    });

    it('Hilfsfunktionen: Formatierung, Legacy-«kraft», Schwelle', () => {
      expect(formatAxisValue(5)).toBe('5');
      expect(formatAxisValue(4.25)).toBe('4,3');
      expect(toAxisValues({ technik: 3, balance: 3, koordination: 3, flexibilitaet: 3, kraft: 5 }).maximalkraft).toBe(5);
      expect(getHighlights(toAxisValues({ ...flat, technik: 3.9 }))).toEqual([]);
    });
  });

  describe('mit echten Wand-Begehungen', () => {
    beforeEach(() => {
      localStorage.clear();
      resetAscentAndRatingStorage();
      gymStorage.ensureInitialGymData();
      navigationHistory.reset();
    });

    function seedBoulder(gymId: string, name: string, radar: Partial<RadarAttributes>) {
      const sector = getSectors(gymId)[0];
      const scales = getGradeScales(gymId).slice().sort((a, b) => a.sortOrder - b.sortOrder);
      const b = createDraftBoulder({
        sectorId: sector.id,
        gradeScaleId: scales[scales.length - 1].id,
        positionX: 0.5,
        positionY: 0.5,
        name,
        setterId: 'schrauber',
        radar,
      });
      publishBatch(sector.id, 'schrauber');
      return b;
    }

    it('Hallenfilter wirkt wie auf der Ich-Seite', () => {
      const a = seedBoulder('gym-6a-plus', 'Kraftpaket', { maximalkraft: 5 });
      const m = seedBoulder('gym-minimum-zh', 'Plattenzauber', { balance: 5 });
      logAscent(climber.id, climber.nickname, a.id, 'top');
      logAscent(climber.id, climber.nickname, m.id, 'flash');

      expect(getDeepDiveReport(climber.id, 'all').sendCount).toBe(2);
      const only6a = getDeepDiveReport(climber.id, 'gym-6a-plus');
      expect(only6a.top5.map(r => r.name)).toEqual(['Kraftpaket']);
      expect(only6a.top5[0].highlights[0]).toMatchObject({ label: 'Maximalkraft', value: 5 });
    });

    it('Ich → Deep Dive: gleicher Filter, Merkmal-Chips, keine manuelle Erfassung, Zurück', () => {
      const a = seedBoulder('gym-6a-plus', 'Kraftpaket', { maximalkraft: 5 });
      const m = seedBoulder('gym-minimum-zh', 'Plattenzauber', { balance: 5 });
      logAscent(climber.id, climber.nickname, a.id, 'top');
      logAscent(climber.id, climber.nickname, m.id, 'flash');

      render(<MeView currentUser={climber} activeGymId="gym-6a-plus" roleInfo={climberRole} onSwitchMode={() => {}} onLogout={() => {}} />);
      fireEvent.click(screen.getByTestId('me-open-deep-dive'));

      const view = screen.getByTestId('deep-dive-view');
      expect(navigationHistory.has('me-deep-dive')).toBe(true);
      // Standard «Alle Hallen» → beide Routen
      expect(within(view).getByTestId(`deep-dive-top-${a.id}`)).toBeInTheDocument();
      expect(within(view).getByTestId(`deep-dive-top-${m.id}`)).toBeInTheDocument();
      expect(within(view).getByTestId(`deep-dive-top-${a.id}-trait-maximalkraft`).textContent).toBe('Maximalkraft 5');

      // gleicher Umschalter wie auf «Ich»
      const scope = within(view).getByTestId('me-scope');
      fireEvent.click(within(scope).getAllByRole('tab')[0]);
      expect(screen.queryByTestId(`deep-dive-top-${m.id}`)).not.toBeInTheDocument();

      // keine manuelle Erfassung mehr
      expect(screen.queryByText('Begehung erfassen')).not.toBeInTheDocument();
      expect(screen.queryByText('Backup')).not.toBeInTheDocument();
      expect(screen.getByTestId('deep-dive-source-note').textContent).toContain('an der Wand');

      // Grad aufklappen zeigt die Routen
      const level = screen.getAllByTestId(/^deep-dive-level-[^-]+$/)[0];
      fireEvent.click(level);
      expect(screen.getByTestId(`deep-dive-route-${a.id}`)).toBeInTheDocument();

      // Zurück zur Ich-Seite, Filter bleibt
      fireEvent.click(screen.getByTestId('deep-dive-back'));
      expect(screen.queryByTestId('deep-dive-view')).not.toBeInTheDocument();
      expect(within(screen.getByTestId('me-scope')).getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('leerer Zustand ohne Wand-Begehungen', () => {
      render(<DeepDiveView userId={climber.id} gymId="all" />);
      expect(screen.getByTestId('deep-dive-empty')).toBeInTheDocument();
    });
  });
});
