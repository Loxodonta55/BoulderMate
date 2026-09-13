import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  clearBatchServiceStorage,
  createDraftBoulder,
  getWallBoulders,
  publishBatch,
  getLastSelectedGradeScaleId,
  setLastSelectedGradeScaleId,
  updateBoulderDetails,
} from '../src/lib/batchBoulderService';
import { BoulderBottomSheet, resolveScaleId } from '../src/components/BoulderBottomSheet';
import { BatchBoulderWorkflow } from '../src/components/BatchBoulderWorkflow';
import { WallBoulder, GymGradeScale, DEFAULT_RADAR } from '../src/types/boulder';

const MOCK_6A_GRADE_SCALES: GymGradeScale[] = [
  { id: 'scale_6a_gelb', gymId: 'gym-6a-plus', colorName: 'Gelb', colorHex: '#FCD34D', difficultyLabel: '4a - 5c', fontRangeMin: '4a', fontRangeMax: '5c', sortOrder: 1 },
  { id: 'scale_6a_blau', gymId: 'gym-6a-plus', colorName: 'Blau', colorHex: '#3B82F6', difficultyLabel: '5c - 6a+', fontRangeMin: '5c', fontRangeMax: '6a+', sortOrder: 2 },
  { id: 'scale_6a_gruen', gymId: 'gym-6a-plus', colorName: 'Grün', colorHex: '#10B981', difficultyLabel: '6a+ - 6c', fontRangeMin: '6a+', fontRangeMax: '6c', sortOrder: 3 },
  { id: 'scale_6a_rot', gymId: 'gym-6a-plus', colorName: 'Rot', colorHex: '#EF4444', difficultyLabel: '6c - 7a+', fontRangeMin: '6c', fontRangeMax: '7a+', sortOrder: 4 },
  { id: 'scale_6a_schwarz', gymId: 'gym-6a-plus', colorName: 'Schwarz', colorHex: '#1F2937', difficultyLabel: '7a+ - 7c', fontRangeMin: '7a+', fontRangeMax: '7c', sortOrder: 5 },
  { id: 'scale_6a_beige', gymId: 'gym-6a-plus', colorName: 'Beige', colorHex: '#D4C5B9', difficultyLabel: '7c - 8a', fontRangeMin: '7c', fontRangeMax: '8a', sortOrder: 6 },
];

describe('SPEC-002 AC-14: Zero-Color-Mutation Guarantee (Schrauber-Bereich)', () => {
  beforeEach(() => {
    localStorage.clear();
    clearBatchServiceStorage();
    vi.clearAllMocks();
  });

  it('1) Draft Boulder Farbauswahl wird beim Speichern im Bottom-Sheet sofort in localStorage persistiert', () => {
    // 1. Initialer Draft wird mit Gelb angelegt
    const draft = createDraftBoulder({
      sectorId: 'sec_6a_slab_vorne',
      gradeScaleId: 'scale_6a_gelb',
      positionX: 0.3,
      positionY: 0.4,
      setterId: 'setter-1',
    });

    expect(draft.gradeScaleId).toBe('scale_6a_gelb');
    let stored = getWallBoulders('sec_6a_slab_vorne');
    expect(stored.find(b => b.id === draft.id)?.gradeScaleId).toBe('scale_6a_gelb');

    // 2. Schrauber ändert die Farbe im Bottom-Sheet auf Grün (#10B981)
    const onSaveMock = vi.fn((data) => {
      updateBoulderDetails(draft.id, data);
      setLastSelectedGradeScaleId('gym-6a-plus', data.gradeScaleId);
    });

    render(
      <BoulderBottomSheet
        isOpen={true}
        boulder={draft}
        gradeScales={MOCK_6A_GRADE_SCALES}
        defaultGradeScaleId="scale_6a_gelb"
        isMarkedForArchive={false}
        onClose={vi.fn()}
        onSave={onSaveMock}
      />
    );

    // Klick auf Grün
    const greenBtn = screen.getByText('Grün');
    fireEvent.click(greenBtn);

    // Formular absenden (Speichern)
    const saveBtn = screen.getByTestId('save-boulder-sheet-btn');
    fireEvent.click(saveBtn);

    expect(onSaveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        gradeScaleId: 'scale_6a_gruen',
      })
    );

    // 3. Verifizieren: In localStorage MUSS der Entwurf nun Grün sein!
    stored = getWallBoulders('sec_6a_slab_vorne');
    const updatedDraft = stored.find(b => b.id === draft.id);
    expect(updatedDraft?.gradeScaleId).toBe('scale_6a_gruen');

    // 4. Und die zuletzt gewählte Farbe für 6a plus muss Grün sein!
    expect(getLastSelectedGradeScaleId('gym-6a-plus')).toBe('scale_6a_gruen');
  });

  it('2) Batch-Publishing erhält die im Formular geänderte Farbe lückenlos im active-Status', () => {
    // 1. Draft anlegen (initial Gelb)
    const draft = createDraftBoulder({
      sectorId: 'sec_6a_slab_vorne',
      gradeScaleId: 'scale_6a_gelb',
      positionX: 0.5,
      positionY: 0.5,
      setterId: 'setter-1',
    });

    // 2. Schrauber ändert Farbe auf Schwarz
    updateBoulderDetails(draft.id, {
      gradeScaleId: 'scale_6a_schwarz',
      name: 'Schwarzer Dynamo',
    });

    // 3. Veröffentlichen im Batch
    const result = publishBatch('sec_6a_slab_vorne', 'setter-1', []);
    expect(result.publishedCount).toBe(1);

    // 4. Abrufen aller Boulder der Wand
    const activeBoulders = getWallBoulders('sec_6a_slab_vorne');
    const published = activeBoulders.find(b => b.id === draft.id);

    expect(published).toBeDefined();
    expect(published?.status).toBe('active');
    expect(published?.gradeScaleId).toBe('scale_6a_schwarz');
    expect(published?.name).toBe('Schwarzer Dynamo');
  });

  it('3) resolveScaleId löst Aliase, Farbnamen und Font-Grades robust auf und fällt nicht blind auf Gelb zurück', () => {
    // a) Alias scale_6a_schwarz
    const boulderSchwarz: WallBoulder = {
      id: 'b-1',
      sectorId: 'sec-1',
      gradeScaleId: 'scale_6a_schwarz',
      positionX: 0.2,
      positionY: 0.2,
      setterId: 'setter-1',
      status: 'active',
      radar: DEFAULT_RADAR,
      createdAt: new Date().toISOString(),
    };
    expect(resolveScaleId(boulderSchwarz, MOCK_6A_GRADE_SCALES, 'scale_6a_gelb')).toBe('scale_6a_schwarz');

    // b) Reiner Farbname "Rot"
    const boulderRot: WallBoulder = {
      ...boulderSchwarz,
      gradeScaleId: 'rot',
    };
    expect(resolveScaleId(boulderRot, MOCK_6A_GRADE_SCALES, 'scale_6a_gelb')).toBe('scale_6a_rot');

    // c) Farbname im Bouldernamen "Blauer Pfeil"
    const boulderBlauName: WallBoulder = {
      ...boulderSchwarz,
      gradeScaleId: 'unknown_scale_uuid',
      name: 'Blauer Pfeil an der Kante',
    };
    expect(resolveScaleId(boulderBlauName, MOCK_6A_GRADE_SCALES, 'scale_6a_gelb')).toBe('scale_6a_blau');
  });

  it('4) BoulderBottomSheet Re-Render mit neuem gradeScales-Array setzt selektierte Farbe während Bearbeitung NICHT zurück', () => {
    const draft = createDraftBoulder({
      sectorId: 'sec_6a_slab_vorne',
      gradeScaleId: 'scale_6a_gelb',
      positionX: 0.3,
      positionY: 0.3,
      setterId: 'setter-1',
    });

    const onSaveMock = vi.fn();

    const { rerender } = render(
      <BoulderBottomSheet
        isOpen={true}
        boulder={draft}
        gradeScales={MOCK_6A_GRADE_SCALES}
        defaultGradeScaleId="scale_6a_gelb"
        isMarkedForArchive={false}
        onClose={vi.fn()}
        onSave={onSaveMock}
      />
    );

    // Schrauber wählt Blau
    fireEvent.click(screen.getByText('Blau'));

    // Simuliere einen externen Re-Render (z.B. Hintergrund-Sync liefert neue gradeScales Referenz)
    const clonedScales = MOCK_6A_GRADE_SCALES.map(s => ({ ...s }));
    rerender(
      <BoulderBottomSheet
        isOpen={true}
        boulder={draft}
        gradeScales={clonedScales}
        defaultGradeScaleId="scale_6a_gelb"
        isMarkedForArchive={false}
        onClose={vi.fn()}
        onSave={onSaveMock}
      />
    );

    // Klick auf Speichern
    fireEvent.click(screen.getByTestId('save-boulder-sheet-btn'));

    // Es MUSS Blau gespeichert werden, nicht das ursprüngliche Gelb!
    expect(onSaveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        gradeScaleId: 'scale_6a_blau',
      })
    );
  });

  it('5) Schwarze und lila Routen werden in getWallBoulders NIEMALS zu Beige mutiert', () => {
    const rawList: WallBoulder[] = [
      {
        id: 'b-black',
        sectorId: 'sec_6a_slab_vorne',
        gradeScaleId: 'scale_6a_schwarz',
        positionX: 0.1,
        positionY: 0.2,
        name: 'Schwarzer Riss',
        setterId: 'setter-1',
        status: 'active',
        radar: DEFAULT_RADAR,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'b-purple',
        sectorId: 'sec_6a_slab_vorne',
        gradeScaleId: 'scale_6a_lila',
        positionX: 0.4,
        positionY: 0.5,
        name: 'Lila Leiste',
        setterId: 'setter-1',
        status: 'active',
        radar: DEFAULT_RADAR,
        createdAt: new Date().toISOString(),
      },
    ];

    localStorage.setItem('boulderapp_wall_boulders_v2', JSON.stringify(rawList));

    const loaded = getWallBoulders('sec_6a_slab_vorne');
    const black = loaded.find(b => b.id === 'b-black');
    const purple = loaded.find(b => b.id === 'b-purple');

    expect(black?.gradeScaleId).toBe('scale_6a_schwarz');
    expect(purple?.gradeScaleId).toBe('scale_6a_lila');
  });

  it('6) BatchBoulderWorkflow Integration: Bestehender Boulder bearbeiten, Farbe ändern & Batch speichern behält Farbe', () => {
    // 1. Initialer aktiver Boulder mit Gelb
    const initialBoulder: WallBoulder = {
      id: 'active-boulder-1',
      sectorId: 'sector-overhang',
      gradeScaleId: 'scale_minimum_gelb',
      positionX: 0.4,
      positionY: 0.4,
      name: 'Gelbe Wand',
      setterId: 'setter-boris',
      status: 'active',
      radar: DEFAULT_RADAR,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('boulderapp_wall_boulders_v2', JSON.stringify([initialBoulder]));

    render(
      <BatchBoulderWorkflow
        currentRole="setter"
        currentUserId="setter-boris"
        activeGymId="gym-minimum-zh"
      />
    );

    // Klick auf den existierenden Pin
    const pin = screen.getByTestId('pin-active-boulder-1');
    expect(pin).toBeInTheDocument();
    fireEvent.click(pin);

    // Sheet öffnet sich
    expect(screen.getByText('Boulder bearbeiten')).toBeInTheDocument();

    // Wähle Farbe "Rot"
    const rotBtn = screen.getByText('Rot');
    fireEvent.click(rotBtn);

    // Speichere Sheet
    const saveSheetBtn = screen.getByTestId('save-boulder-sheet-btn');
    fireEvent.click(saveSheetBtn);

    // Sheet schließt sich
    expect(screen.queryByText('Boulder bearbeiten')).not.toBeInTheDocument();

    // Veröffentlichen / Speichern im Batch über den Button unten
    const publishBtn = screen.getByTestId('publish-batch-btn');
    expect(publishBtn).not.toBeDisabled();
    fireEvent.click(publishBtn);

    // Modal öffnet sich -> Klick auf Veröffentlichen
    const confirmBtn = screen.getByRole('button', { name: /Änderungen final speichern/i });
    fireEvent.click(confirmBtn);

    // Verifiziere aus getWallBoulders
    const boulders = getWallBoulders('sector-overhang');
    const updated = boulders.find(b => b.id === 'active-boulder-1');
    expect(updated).toBeDefined();
    expect(updated?.status).toBe('active');
    expect(updated?.gradeScaleId).not.toBe('scale_minimum_gelb');
    expect(updated?.gradeScaleId).toBe('130c2372-d28e-416c-85af-a3380426c9bd');
  });
});
