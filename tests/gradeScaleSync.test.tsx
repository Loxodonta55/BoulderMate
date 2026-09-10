import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { App } from '../src/App';
import {
  resetAllGymData,
  ensureInitialGymData,
  getGradeScales as getAdminGradeScales,
  setGymGradeScales,
  CURRENT_USER,
} from '../src/lib/gymStorage';
import {
  getGradeScales as getServiceGradeScales,
  clearBatchServiceStorage,
} from '../src/lib/batchBoulderService';
import { setSessionUser } from '../src/lib/authService';

describe('SPEC-001 AC-2.1: Farbsystem Cross-Area Synchronisation (Admin ⟷ Schrauber ⟷ Kletterer)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetAllGymData();
    clearBatchServiceStorage();
    ensureInitialGymData();
    setSessionUser('user-boris');
  });

  it('synchronizes edited color name and hex code from Admin to batchBoulderService immediately', () => {
    const gymId = 'gym-6a-plus';
    const initialScales = getAdminGradeScales(gymId);
    expect(initialScales.length).toBeGreaterThan(0);

    // Admin aendert die erste Farbe ("Gelb" -> "Sonnengelb", Hex -> "#fde047")
    const updatedScales = initialScales.map((s, idx) =>
      idx === 0
        ? { ...s, color_name: 'Sonnengelb', color_hex: '#fde047', difficulty_label: 'Anfaenger Plus' }
        : s
    );

    setGymGradeScales(gymId, CURRENT_USER.id, updatedScales);

    // Schrauber & Kletterer Service muss die Aenderung sofort sehen
    const serviceScales = getServiceGradeScales(gymId);
    const firstScale = serviceScales[0];

    expect(firstScale.colorName).toBe('Sonnengelb');
    expect(firstScale.colorHex).toBe('#fde047');
    expect(firstScale.difficultyLabel).toBe('Anfaenger Plus');
  });

  it('synchronizes newly added colors from Admin to Schrauber & Kletterer areas', () => {
    const gymId = 'gym-minimum-zh';
    const initialScales = getAdminGradeScales(gymId);
    const countBefore = initialScales.length;

    // Admin fuegt eine neue Farbe "Pink" hinzu
    const newColor = {
      gym_id: gymId,
      color_name: 'Pink',
      color_hex: '#ec4899',
      difficulty_label: 'Projekt-Crux',
      font_range_min: '7B',
      font_range_max: '8A',
      sort_order: countBefore + 1,
    };

    setGymGradeScales(gymId, CURRENT_USER.id, [...initialScales, newColor]);

    const serviceScales = getServiceGradeScales(gymId);
    expect(serviceScales.length).toBe(countBefore + 1);
    const pinkScale = serviceScales.find(s => s.colorName === 'Pink');
    expect(pinkScale).toBeDefined();
    expect(pinkScale?.colorHex).toBe('#ec4899');
    expect(pinkScale?.difficultyLabel).toBe('Projekt-Crux');
  });

  it('completely removes deleted colors without ghost resurrections', () => {
    const gymId = 'gym-6a-plus';
    const initialScales = getAdminGradeScales(gymId);
    expect(initialScales.some(s => s.color_name === 'Beige')).toBe(true);

    // Admin loescht die Farbe "Beige"
    const remainingScales = initialScales.filter(s => s.color_name !== 'Beige');
    setGymGradeScales(gymId, CURRENT_USER.id, remainingScales);

    const serviceScales = getServiceGradeScales(gymId);
    expect(serviceScales.some(s => s.colorName === 'Beige')).toBe(false);
    expect(serviceScales.length).toBe(initialScales.length - 1);
  });

  it('reflects updated sort order across services', () => {
    const gymId = 'gym-minimum-zh';
    const initialScales = getAdminGradeScales(gymId);

    // Kehre die Reihenfolge um
    const reversed = [...initialScales].reverse().map((s, idx) => ({
      ...s,
      sort_order: idx + 1,
    }));

    setGymGradeScales(gymId, CURRENT_USER.id, reversed);

    const serviceScales = getServiceGradeScales(gymId);
    expect(serviceScales[0].colorName).toBe(reversed[0].color_name);
    expect(serviceScales[serviceScales.length - 1].colorName).toBe(reversed[reversed.length - 1].color_name);
  });

  it('retains synchronized grade scales across workspace switching in App (Admin -> Setter -> Climber)', async () => {
    render(<App />);

    // 1. Boris waehlt Hallen-Administration im Gateway
    const adminBtn = screen.getByRole('button', { name: /Hallen-Administration/i });
    fireEvent.click(adminBtn);

    expect(screen.getByText('Hallen-Administration')).toBeInTheDocument();

    // 2. Farbsystem Tab oeffnen
    const farbsystemTab = screen.getByRole('button', { name: /Farbsystem/i });
    fireEvent.click(farbsystemTab);

    // 3. Neue Farbe programmatisch / via Storage fuer aktive Halle speichern
    act(() => {
      const activeGym = 'gym-minimum-zh';
      const existing = getAdminGradeScales(activeGym);
      setGymGradeScales(activeGym, CURRENT_USER.id, [
        ...existing,
        {
          gym_id: activeGym,
          color_name: 'Tuerkis',
          color_hex: '#14b8a6',
          difficulty_label: 'Spezial',
          font_range_min: '6B',
          font_range_max: '6C',
          sort_order: existing.length + 1,
        }
      ]);
    });

    // 4. Wechsel zum Schrauber-Studio via Bereich-Wechseln
    const switchBtn = screen.getByTestId('admin-switch-workspace-btn');
    fireEvent.click(switchBtn);

    const setterBtn = screen.getByRole('button', { name: /Schrauber-Studio/i });
    fireEvent.click(setterBtn);

    expect(screen.getByText('Schrauber-Studio')).toBeInTheDocument();

    // Verifizieren, dass der Service fuer diese Halle Tuerkis enthaelt
    const setterScales = getServiceGradeScales('gym-minimum-zh');
    expect(setterScales.some(s => s.colorName === 'Tuerkis')).toBe(true);

    // 5. Wechsel zur Kletterer-App
    const backToClimber = screen.getByTestId('studio-back-to-climber-btn');
    fireEvent.click(backToClimber);

    expect(screen.getByText('Wand & Sektoren')).toBeInTheDocument();

    // Kletterer-Bereich hat ebenfalls Tuerkis synchronisiert
    const climberScales = getServiceGradeScales('gym-minimum-zh');
    expect(climberScales.some(s => s.colorName === 'Tuerkis')).toBe(true);
  }, 15000);
});
