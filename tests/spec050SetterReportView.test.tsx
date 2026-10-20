import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GymInsightsView } from '../src/components/admin/GymInsightsView';
import { clearBatchServiceStorage, getWallBoulders, getSectors } from '../src/lib/batchBoulderService';
import { resetAllGymData, ensureInitialGymData } from '../src/lib/gymStorage';
import { setSessionUser } from '../src/lib/authService';
import { computeSetterReport } from '../src/lib/setterReport';
import { STORAGE_KEY_COMMENTS, STORAGE_KEY_RATINGS } from '../src/lib/ratingAndAscentService';
import * as syncService from '../src/lib/syncService';

/** SPEC-050 · Admin-Tab «Zahlen» → «Schrauber» */

const GYM = 'gym-6a-plus';

function seedRatingsAndComments() {
  const sectorIds = new Set(getSectors(GYM).map(s => s.id));
  const target = getWallBoulders().find(b => sectorIds.has(b.sectorId) && b.status === 'active')!;
  const now = new Date().toISOString();
  const ratings = [1, 2, 3].map(i => ({
    id: `r${i}`, boulderId: target.id, userId: `k${i}`, userNickname: `Geheimname${i}`,
    qualityStars: 5, gradeFeel: 'stiff', createdAt: now, updatedAt: now,
  }));
  const comments = [{ id: 'c1', boulderId: target.id, userId: 'k1', userNickname: 'Geheimname1', text: 'Erster Griff ist schlecht', createdAt: now }];
  localStorage.setItem(STORAGE_KEY_RATINGS, JSON.stringify(ratings));
  localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(comments));
  return target;
}

beforeEach(() => {
  localStorage.clear();
  resetAllGymData();
  clearBatchServiceStorage();
  ensureInitialGymData();
  setSessionUser('user-boris');
  vi.restoreAllMocks();
  vi.spyOn(syncService, 'syncFromSupabase').mockResolvedValue(false);
});

describe('SPEC-050 Ansicht «Schrauber»', () => {
  it('AC-1: Umschalter «Halle · Schrauber»; Halle zeigt keine Schrauber-Liste mehr', () => {
    render(<GymInsightsView gymId={GYM} />);
    expect(screen.getByTestId('insights-mode-hall')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByTestId('insights-setters')).toBeNull();
    fireEvent.click(screen.getByTestId('insights-mode-setters'));
    expect(screen.getByTestId('setter-report')).toBeInTheDocument();
    expect(screen.queryByTestId('insights-grades')).toBeNull();
  });

  it('AC-3, AC-9: Karten pro Schrauber und Hinweis «Gesprächsanlass»', () => {
    render(<GymInsightsView gymId={GYM} />);
    fireEvent.click(screen.getByTestId('insights-mode-setters'));
    expect(screen.getByTestId('setter-report-note')).toHaveTextContent('Gesprächsanlass, keine Note');
    const rows = computeSetterReport({ gymId: GYM });
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(screen.getByTestId(`insights-setter-${r.setterId}-routes`)).toHaveTextContent(`${r.routes} ${r.routes === 1 ? 'Route' : 'Routen'}`);
    }
  });

  it('AC-4: Sortier-Knöpfe, Standard «Routen»', () => {
    render(<GymInsightsView gymId={GYM} />);
    fireEvent.click(screen.getByTestId('insights-mode-setters'));
    expect(screen.getByTestId('setter-report-sort-routes')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByTestId('setter-report-sort-name'));
    expect(screen.getByTestId('setter-report-sort-name')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText(/Platz/)).toBeNull();
  });

  it('AC-5 bis AC-8: Detail öffnen, Route aufklappen, Beta ohne Namen, zurück', () => {
    const target = seedRatingsAndComments();
    render(<GymInsightsView gymId={GYM} />);
    fireEvent.click(screen.getByTestId('insights-mode-setters'));
    const row = computeSetterReport({ gymId: GYM }).find(r => r.routes > 0 && r.ratings >= 3)!;
    fireEvent.click(screen.getByTestId(`insights-setter-${row.setterId}`));

    expect(screen.getByTestId('setter-report-detail')).toBeInTheDocument();
    for (const k of ['stars', 'grade', 'firsttry', 'weekly']) {
      expect(screen.getByTestId(`setter-detail-kpi-${k}`)).toBeInTheDocument();
    }
    expect(screen.getByTestId('setter-detail-kpi-stars-value')).toHaveTextContent('5,0');
    expect(screen.getByTestId('setter-detail-favorite')).toHaveTextContent('Diese Route mögen die Leute besonders');
    expect(screen.getByTestId(`setter-detail-color-${target.gradeScaleId}-tendency`)).toHaveTextContent('wirkt eher hart');

    fireEvent.click(screen.getByTestId(`setter-detail-route-${target.id}`));
    const more = screen.getByTestId(`setter-detail-route-${target.id}-more`);
    expect(more).toHaveTextContent('zu hart 3');
    expect(screen.getByTestId('setter-detail-comment')).toHaveTextContent('Erster Griff ist schlecht');
    expect(document.body.textContent).not.toContain('Geheimname');

    fireEvent.click(screen.getByTestId('setter-report-back'));
    expect(screen.getByTestId('setter-report')).toBeInTheDocument();
  });

  it('leerer Zustand ohne Bewertungen', () => {
    localStorage.setItem(STORAGE_KEY_RATINGS, '[]');
    render(<GymInsightsView gymId={GYM} />);
    fireEvent.click(screen.getByTestId('insights-mode-setters'));
    const row = computeSetterReport({ gymId: GYM })[0];
    expect(screen.getByTestId(`insights-setter-${row.setterId}-toofew`)).toHaveTextContent('noch zu wenige Bewertungen');
    fireEvent.click(screen.getByTestId(`insights-setter-${row.setterId}`));
    expect(screen.getByTestId('setter-detail-empty')).toHaveTextContent('Ab 3 Bewertungen pro Route');
  });
});
