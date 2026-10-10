import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { GymInsightsView } from '../src/components/admin/GymInsightsView';
import { GymManagement } from '../src/components/GymManagement';
import { BoulderBottomSheet } from '../src/components/BoulderBottomSheet';
import { clearBatchServiceStorage, getGradeScales, getSectors, getWallBoulders } from '../src/lib/batchBoulderService';
import { resetAllGymData, ensureInitialGymData } from '../src/lib/gymStorage';
import { setSessionUser } from '../src/lib/authService';
import { computeGymInsights } from '../src/lib/gymInsights';
import * as syncService from '../src/lib/syncService';

/** SPEC-030 · Admin-Tab «Zahlen» und «Geschraubt von» im Schrauber-Sheet */

const GYM = 'gym-minimum-zh';

beforeEach(() => {
  localStorage.clear();
  resetAllGymData();
  clearBatchServiceStorage();
  ensureInitialGymData();
  setSessionUser('user-boris');
  vi.restoreAllMocks();
  vi.spyOn(syncService, 'syncFromSupabase').mockResolvedValue(false);
});

describe('AC-1 bis AC-7 Tab «Zahlen»', () => {
  it('Admin-Konsole hat den Tab «Zahlen» mit der Auswertung', () => {
    render(<GymManagement activeGymId={GYM} userId="user-boris" />);
    fireEvent.click(screen.getByTestId('admin-tab-insights'));
    expect(screen.getByTestId('gym-insights')).toBeInTheDocument();
  });

  it('zeigt Kacheln, Farben, Listen, Sektoren und Schrauber passend zur Berechnung', () => {
    const expected = computeGymInsights({ gymId: GYM });
    render(<GymInsightsView gymId={GYM} />);
    expect(screen.getByTestId('insights-kpi-boulders-value')).toHaveTextContent(String(expected.kpis.boulders));
    expect(screen.getByTestId('insights-kpi-ascents-value')).toHaveTextContent(String(expected.kpis.ascents));
    for (const scale of getGradeScales(GYM)) {
      expect(screen.getByTestId(`insights-grade-${scale.id}`)).toHaveTextContent(scale.colorName);
    }
    for (const sector of getSectors(GYM)) {
      expect(screen.getByTestId(`insights-sector-${sector.id}`)).toHaveTextContent(sector.name);
    }
    expect(screen.getByTestId('insights-top')).toBeInTheDocument();
    expect(screen.getByTestId('insights-unloved')).toBeInTheDocument();
    for (const s of expected.setters) {
      expect(screen.getByTestId(`insights-setter-${s.setterId}-routes`)).toHaveTextContent(`${s.routes} Routen`);
    }
  });

  it('«Alle» schaltet den Zeitraum um', () => {
    render(<GymInsightsView gymId={GYM} />);
    expect(screen.getByTestId('insights-scope-active')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByTestId('insights-scope-all'));
    expect(screen.getByTestId('insights-scope-all')).toHaveAttribute('aria-pressed', 'true');
    const expected = computeGymInsights({ gymId: GYM, scope: 'all' });
    expect(screen.getByTestId('insights-kpi-boulders-value')).toHaveTextContent(String(expected.kpis.boulders));
  });
});

describe('AC-8 «Geschraubt von»', () => {
  const options = [
    { id: 'anna', name: 'Anna' },
    { id: 'ben', name: 'Ben' },
  ];

  function renderSheet(onSave = vi.fn()) {
    const sector = getSectors(GYM)[0];
    const scales = getGradeScales(GYM);
    const boulder = getWallBoulders(sector.id).find(b => b.status === 'active') || {
      id: 'x', sectorId: sector.id, gradeScaleId: scales[0].id, positionX: 0.5, positionY: 0.5,
      setterId: 'anna', status: 'draft' as const, radar: { technik: 3, balance: 3, koordination: 3, flexibilitaet: 3 }, createdAt: '',
    };
    render(
      <BoulderBottomSheet
        isOpen
        boulder={{ ...boulder, setterId: 'anna' }}
        gradeScales={scales}
        defaultGradeScaleId={scales[0].id}
        isMarkedForArchive={false}
        onClose={() => {}}
        onSave={onSave}
        setterOptions={options}
      />
    );
    return onSave;
  }

  it('zeigt das Team, vorausgewählt ist der gespeicherte Schrauber', () => {
    renderSheet();
    const select = screen.getByTestId('setter-select') as HTMLSelectElement;
    expect(select.value).toBe('anna');
    expect(within(select).getAllByRole('option').map(o => o.textContent)).toEqual(['Anna', 'Ben']);
  });

  it('Speichern liefert den geänderten Schrauber mit', () => {
    const onSave = renderSheet();
    fireEvent.change(screen.getByTestId('setter-select'), { target: { value: 'ben' } });
    fireEvent.click(screen.getByRole('button', { name: /Änderung übernehmen|Speichern & Weiter/ }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ setterId: 'ben' }));
  });

  it('unveränderter Schrauber wird nicht mitgeschickt', () => {
    const onSave = renderSheet();
    fireEvent.click(screen.getByRole('button', { name: /Änderung übernehmen|Speichern & Weiter/ }));
    expect(onSave.mock.calls[0][0].setterId).toBeUndefined();
  });

  it('ohne Team keine Zeile', () => {
    const sector = getSectors(GYM)[0];
    const scales = getGradeScales(GYM);
    render(
      <BoulderBottomSheet
        isOpen
        boulder={{ id: 'y', sectorId: sector.id, gradeScaleId: scales[0].id, positionX: 0.5, positionY: 0.5, setterId: 'a', status: 'draft', radar: { technik: 3, balance: 3, koordination: 3, flexibilitaet: 3 }, createdAt: '' }}
        gradeScales={scales}
        defaultGradeScaleId={scales[0].id}
        isMarkedForArchive={false}
        onClose={() => {}}
        onSave={() => {}}
      />
    );
    expect(screen.queryByTestId('setter-select')).not.toBeInTheDocument();
  });
});
