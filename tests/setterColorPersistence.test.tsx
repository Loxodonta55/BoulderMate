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
import { isValidUuid } from '../src/lib/storageUtils';

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

  it('7) AC-15: Ausprägungen (Radar-Attribute) ändern und speichern persistiert alle 6 Achsen sofort lückenlos', () => {
    // 1. Initialer Draft mit Default-Werten (3, 3, 3, 3, 3, 3)
    const draft = createDraftBoulder({
      sectorId: 'sec_6a_slab_vorne',
      gradeScaleId: 'scale_6a_rot',
      positionX: 0.5,
      positionY: 0.6,
      setterId: 'setter-1',
    });

    expect(draft.radar.maximalkraft).toBe(3);
    expect(draft.radar.technik).toBe(3);

    // 2. Im Bottom-Sheet Ausprägungen anpassen
    let savedData: any = null;
    const onSaveMock = vi.fn((data) => {
      savedData = data;
      updateBoulderDetails(draft.id, data);
    });

    render(
      <BoulderBottomSheet
        isOpen={true}
        boulder={draft}
        gradeScales={MOCK_6A_GRADE_SCALES}
        defaultGradeScaleId="scale_6a_rot"
        isMarkedForArchive={false}
        onClose={vi.fn()}
        onSave={onSaveMock}
      />
    );

    // Klick auf Stufe 5 bei Maximalkraft und Stufe 1 bei Technik
    // RADAR_AXIS_DEFINITIONS: 1. Maximalkraft, 3. Technik
    const allStep5Buttons = screen.getAllByRole('button', { name: '5' });
    fireEvent.click(allStep5Buttons[0]); // Maximalkraft = 5

    const allStep1Buttons = screen.getAllByRole('button', { name: '1' });
    fireEvent.click(allStep1Buttons[2]); // Technik = 1

    // Speichern
    fireEvent.click(screen.getByTestId('save-boulder-sheet-btn'));

    expect(onSaveMock).toHaveBeenCalled();
    expect(savedData.radar.maximalkraft).toBe(5);
    expect(savedData.radar.kraft).toBe(5);
    expect(savedData.radar.technik).toBe(1);

    // Verifiziere in getWallBoulders
    const loaded = getWallBoulders('sec_6a_slab_vorne');
    const updatedDraft = loaded.find(b => b.id === draft.id);
    expect(updatedDraft?.radar.maximalkraft).toBe(5);
    expect(updatedDraft?.radar.kraft).toBe(5);
    expect(updatedDraft?.radar.technik).toBe(1);

    // Batch publish übernimmt die Ausprägungen 1:1
    const pubResult = publishBatch('sec_6a_slab_vorne', 'setter-1');
    expect(pubResult.publishedCount).toBe(1);

    const activeList = getWallBoulders('sec_6a_slab_vorne');
    const published = activeList.find(b => b.id === draft.id);
    expect(published?.status).toBe('active');
    expect(published?.radar.maximalkraft).toBe(5);
    expect(published?.radar.technik).toBe(1);
  });

  it('8) AC-15: Bearbeiten der Ausprägungen einer Route verändert NIEMALS ihre Farbe, selbst wenn lastSelectedGradeScaleId anders ist', () => {
    // Schrauber hat zuvor einen GELBEN Boulder gesetzt -> lastSelectedGradeScaleId ist Gelb
    setLastSelectedGradeScaleId('gym-6a-plus', 'scale_6a_gelb');

    // Jetzt öffnet er einen SCHWARZEN aktiven Boulder
    const blackBoulder: WallBoulder = {
      id: 'active-black-route-1',
      sectorId: 'sec_6a_slab_vorne',
      gradeScaleId: 'scale_6a_schwarz',
      positionX: 0.25,
      positionY: 0.35,
      name: 'Schwarze Kante',
      setterId: 'setter-1',
      status: 'active',
      radar: { ...DEFAULT_RADAR, maximalkraft: 2 },
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('boulderapp_wall_boulders_v2', JSON.stringify([blackBoulder]));

    // resolveScaleId darf für blackBoulder NIEMALS defaultGradeScaleId (Gelb) zurückgeben!
    const resolved = resolveScaleId(blackBoulder, MOCK_6A_GRADE_SCALES, 'scale_6a_gelb');
    expect(resolved).toBe('scale_6a_schwarz');
    expect(resolved).not.toBe('scale_6a_gelb');

    let savedData: any = null;
    const onSaveMock = vi.fn((data) => {
      savedData = data;
      updateBoulderDetails(blackBoulder.id, data);
    });

    render(
      <BoulderBottomSheet
        isOpen={true}
        boulder={blackBoulder}
        gradeScales={MOCK_6A_GRADE_SCALES}
        defaultGradeScaleId="scale_6a_gelb"
        isMarkedForArchive={false}
        onClose={vi.fn()}
        onSave={onSaveMock}
      />
    );

    // Schrauber ändert nur eine Ausprägung (z.B. Maximalkraft auf 4) ohne die Farbe anzufassen
    const allStep4Buttons = screen.getAllByRole('button', { name: '4' });
    fireEvent.click(allStep4Buttons[0]);

    fireEvent.click(screen.getByTestId('save-boulder-sheet-btn'));

    expect(onSaveMock).toHaveBeenCalled();
    // Die Farbe MUSS Schwarz geblieben sein und darf NICHT zu Gelb mutieren!
    expect(savedData.gradeScaleId).toBe('scale_6a_schwarz');
    expect(savedData.gradeScaleId).not.toBe('scale_6a_gelb');
    expect(savedData.radar.maximalkraft).toBe(4);

    const boulders = getWallBoulders('sec_6a_slab_vorne');
    const stored = boulders.find(b => b.id === blackBoulder.id);
    expect(stored?.gradeScaleId).toBe('scale_6a_schwarz');
    expect(stored?.radar.maximalkraft).toBe(4);
  });

  it('9) AC-15: createDraftBoulder generiert standardkonforme RFC4122 v4 UUIDs statt draft_ Präfixen', () => {
    const draft1 = createDraftBoulder({
      sectorId: 'sec_6a_slab_vorne',
      gradeScaleId: 'scale_6a_blau',
      positionX: 0.1234,
      positionY: 0.5678,
      setterId: 'setter-1',
    });

    const draft2 = createDraftBoulder({
      sectorId: 'sec_6a_slab_vorne',
      gradeScaleId: 'scale_6a_rot',
      positionX: 0.4321,
      positionY: 0.8765,
      setterId: 'setter-1',
    });

    // Keine 'draft_' Präfixe mehr!
    expect(draft1.id.startsWith('draft_')).toBe(false);
    expect(draft2.id.startsWith('draft_')).toBe(false);

    // Valide v4 UUIDs
    expect(isValidUuid(draft1.id)).toBe(true);
    expect(isValidUuid(draft2.id)).toBe(true);
    expect(draft1.id).not.toBe(draft2.id);
  });
});
