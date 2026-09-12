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
  createDraftBoulder,
  publishBatch,
  getWallBoulders,
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

  it('assigns valid UUIDs to newly created grade scales and prevents temporary string IDs (AC-2.3)', () => {
    const gymId = 'gym-6a-plus';
    const initialScales = getAdminGradeScales(gymId);

    const newScaleInput = {
      gym_id: gymId,
      color_name: 'Koralle',
      color_hex: '#ff7f50',
      difficulty_label: 'Herausfordernd',
      font_range_min: '6C',
      font_range_max: '7A',
      sort_order: initialScales.length + 1,
    };

    const saved = setGymGradeScales(gymId, CURRENT_USER.id, [...initialScales, newScaleInput]);
    const coralScale = saved.find(s => s.color_name === 'Koralle');

    expect(coralScale).toBeDefined();
    // Must be a valid UUID v4, not a string like 'scale_...'
    expect(coralScale!.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(coralScale!.id.startsWith('scale_')).toBe(false);

    // batchBoulderService must have the exact same UUID
    const serviceScales = getServiceGradeScales(gymId);
    const serviceCoral = serviceScales.find(s => s.colorName === 'Koralle');
    expect(serviceCoral).toBeDefined();
    expect(serviceCoral!.id).toBe(coralScale!.id);
  });

  it('preserves route color when created with newly added grade scale and prevents turning into Blue (AC-2.3)', () => {
    const gymId = 'gym-6a-plus';
    const initialScales = getAdminGradeScales(gymId);

    // 1. Admin legt neue Farbe "Lila" (#a855f7) an
    const savedScales = setGymGradeScales(gymId, CURRENT_USER.id, [
      ...initialScales,
      {
        gym_id: gymId,
        color_name: 'Lila',
        color_hex: '#a855f7',
        difficulty_label: 'Elite',
        font_range_min: '7C',
        font_range_max: '8A',
        sort_order: initialScales.length + 1,
      }
    ]);

    const lilaScale = savedScales.find(s => s.color_name === 'Lila')!;
    expect(lilaScale).toBeDefined();

    // 2. Im Schrauberbereich wird eine Route mit Lila angelegt
    const sectorId = 'sec_6a_slab_vorne';
    const draft = createDraftBoulder(
      {
        sectorId,
        gradeScaleId: lilaScale.id,
        positionX: 0.5,
        positionY: 0.5,
        setterId: 'setter-1',
        name: 'Lila Traum',
      },
      'setter'
    );

    expect(draft.gradeScaleId).toBe(lilaScale.id);

    // 3. Batch veroeffentlichen / speichern
    const publishResult = publishBatch(sectorId, 'setter-1');
    expect(publishResult.publishedCount).toBe(1);

    const boulders = getWallBoulders(sectorId);
    const published = boulders.find(b => b.id === draft.id);
    expect(published).toBeDefined();
    expect(published!.status).toBe('active');
    expect(published!.gradeScaleId).toBe(lilaScale.id);

    // 4. Verifizieren, dass die Skala im Service vorhanden ist und NICHT zu Blau wird
    const serviceScales = getServiceGradeScales(gymId);
    const scale = serviceScales.find(s => s.id === published!.gradeScaleId);
    expect(scale).toBeDefined();
    expect(scale!.colorName).toBe('Lila');
    expect(scale!.colorHex).toBe('#a855f7');
    expect(scale!.colorHex).not.toBe('#3b82f6'); // NOT Blau!
  });
});
