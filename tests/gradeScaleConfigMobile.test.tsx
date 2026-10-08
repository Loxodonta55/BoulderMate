import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { GradeScale } from '../src/types/gym';

// SPEC-023 F5: Farben als Liste + Sheet; jede Änderung speichert sofort.
const setGymGradeScales = vi.fn((_gym: string, _user: string, scales: GradeScale[]) => scales);
vi.mock('../src/lib/gymStorage', async (orig) => ({
  ...(await orig<typeof import('../src/lib/gymStorage')>()),
  setGymGradeScales: (...a: [string, string, GradeScale[]]) => setGymGradeScales(...a),
}));
vi.mock('../src/lib/syncService', async (orig) => ({
  ...(await orig<typeof import('../src/lib/syncService')>()),
  syncGradeScalesToSupabase: vi.fn(() => Promise.resolve()),
}));

import { GradeScaleConfig, formatFontRange } from '../src/components/GradeScaleConfig';

const uuid = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
const initialScales: GradeScale[] = [
  { id: uuid(1), gym_id: 'gym-test', color_name: 'Gelb', color_hex: '#eab308', difficulty_label: 'Sehr leicht', font_range_min: '3', font_range_max: '4+', sort_order: 1, created_at: '' },
  { id: uuid(2), gym_id: 'gym-test', color_name: 'Grün', color_hex: '#22c55e', difficulty_label: 'Leicht', font_range_min: '5', font_range_max: '5+', sort_order: 2, created_at: '' },
  { id: uuid(3), gym_id: 'gym-test', color_name: 'Blau', color_hex: '#3b82f6', difficulty_label: 'Mittel', font_range_min: '6A', font_range_max: '6B+', sort_order: 3, created_at: '' },
];

const renderConfig = (onSaved = vi.fn()) =>
  render(<GradeScaleConfig gymId="gym-test" userId="user-admin" initialScales={initialScales} onSaved={onSaved} />);

describe('SPEC-023 F5: Farben als Liste + Sheet', () => {
  beforeEach(() => setGymGradeScales.mockClear());

  it('zeigt jede Farbe als kompakte Zeile mit Name, Hallengrad und Font-Bereich', () => {
    renderConfig();
    const row = screen.getByTestId('grade-row-0');
    expect(row).toHaveTextContent('Gelb');
    expect(row).toHaveTextContent('Sehr leicht');
    expect(row).toHaveTextContent('Font 3–4+');
    expect(screen.getAllByTestId(/^grade-row-/)).toHaveLength(3);
    // Keine Eingabefelder in der Liste
    expect(screen.queryByDisplayValue('Gelb')).not.toBeInTheDocument();
  });

  it('formatFontRange fasst Min/Max knapp zusammen', () => {
    expect(formatFontRange('6A', '6B+')).toBe('Font 6A–6B+');
    expect(formatFontRange('7A', '7A')).toBe('Font 7A');
    expect(formatFontRange('', '')).toBe('');
  });

  it('Tippen auf eine Zeile öffnet das Sheet; Sichern speichert sofort', async () => {
    const onSaved = vi.fn();
    renderConfig(onSaved);
    fireEvent.click(screen.getByTestId('grade-row-0'));
    expect(screen.getByTestId('grade-sheet')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('grade-label-input'), { target: { value: 'Anfänger' } });
    fireEvent.click(screen.getByTestId('grade-save-btn'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const saved = setGymGradeScales.mock.calls[0][2];
    expect(saved[0].difficulty_label).toBe('Anfänger');
    expect(screen.getByTestId('grade-row-0')).toHaveTextContent('Anfänger');
  });

  it('+ Farbe legt eine neue Farbe mit gültiger UUID an', async () => {
    renderConfig();
    fireEvent.click(screen.getByTestId('add-grade-btn'));
    expect(screen.queryByTestId('grade-delete-btn')).not.toBeInTheDocument();
    fireEvent.change(screen.getByTestId('grade-name-input'), { target: { value: 'Pink' } });
    fireEvent.change(screen.getByTestId('grade-label-input'), { target: { value: 'Schwer' } });
    fireEvent.click(screen.getByTestId('grade-save-btn'));
    await waitFor(() => expect(screen.getByTestId('grade-row-3')).toHaveTextContent('Pink'));
    const saved = setGymGradeScales.mock.calls[0][2];
    expect(saved[3].id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('Sortieren zeigt Pfeile erst nach Tippen auf «Sortieren»', async () => {
    renderConfig();
    expect(screen.queryByTestId('move-grade-up-1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('toggle-grade-reorder-btn'));
    fireEvent.click(screen.getByTestId('move-grade-up-1'));
    await waitFor(() => expect(screen.getByTestId('grade-row-0')).toHaveTextContent('Grün'));
    expect(screen.getByTestId('grade-row-1')).toHaveTextContent('Gelb');
  });

  it('Löschen fragt erst nach (AC Rückfrage)', async () => {
    renderConfig();
    fireEvent.click(screen.getByTestId('grade-row-0'));
    fireEvent.click(screen.getByTestId('grade-delete-btn'));
    const dialog = screen.getByTestId('confirm-dialog');
    expect(within(dialog).getByText(/Gelb/)).toBeInTheDocument();
    expect(setGymGradeScales).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('confirm-ok'));
    await waitFor(() => expect(screen.getAllByTestId(/^grade-row-/)).toHaveLength(2));
    expect(screen.getByTestId('grade-row-0')).toHaveTextContent('Grün');
  });
});
