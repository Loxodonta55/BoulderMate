import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BatchSummaryModal } from '../src/components/BatchSummaryModal';
import { BatchBoulderWorkflow } from '../src/components/BatchBoulderWorkflow';
import { WallBoulder, GymGradeScale, Sector, DEFAULT_RADAR } from '../src/types/boulder';
import * as batchService from '../src/lib/batchBoulderService';

describe('Schrauber-Bereich: Änderungen speichern & Veröffentlichen (SPEC-002 / User Feedback)', () => {
  const sampleGradeScales: GymGradeScale[] = [
    { id: 'scale-green', gymId: 'gym-1', colorName: 'Grün', colorHex: '#22c55e', difficultyLabel: 'Leicht', fontRangeMin: '4a', fontRangeMax: '5b', sortOrder: 1 },
    { id: 'scale-blue', gymId: 'gym-1', colorName: 'Blau', colorHex: '#3b82f6', difficultyLabel: 'Mittel', fontRangeMin: '5c', fontRangeMax: '6b', sortOrder: 2 },
  ];

  const sampleSector: Sector = {
    id: 'sec-1',
    gymId: 'gym-1',
    name: 'Wand 1',
    wallPhotoUrl: 'https://example.com/wall.jpg',
    sortOrder: 1,
    createdAt: '2026-09-01T10:00:00Z',
  };

  const sampleActiveBoulder: WallBoulder = {
    id: 'active-boulder-1',
    sectorId: 'sec-1',
    gradeScaleId: 'scale-green',
    positionX: 0.5,
    positionY: 0.5,
    name: 'Alte Linie',
    setterId: 'setter-1',
    status: 'active',
    radar: { ...DEFAULT_RADAR },
    createdAt: '2026-09-01T10:00:00Z',
    publishedAt: '2026-09-01T12:00:00Z',
  };

  it('BatchSummaryModal displays modified boulders section and enables save button when only modified routes exist', () => {
    const onConfirmPublish = vi.fn();
    const onClose = vi.fn();

    const modifiedBoulder: WallBoulder = {
      ...sampleActiveBoulder,
      name: 'Umgebaute Linie',
      gradeScaleId: 'scale-blue',
    };

    render(
      <BatchSummaryModal
        isOpen={true}
        sector={sampleSector}
        draftBoulders={[]}
        archivedBoulders={[]}
        modifiedBoulders={[modifiedBoulder]}
        gradeScales={sampleGradeScales}
        hasPhotoUpdated={false}
        onClose={onClose}
        onConfirmPublish={onConfirmPublish}
      />
    );

    // Overview Badge
    expect(screen.getByText('~1')).toBeInTheDocument();
    expect(screen.getAllByText('Geändert').length).toBeGreaterThan(0);

    // Modified details
    expect(screen.getByText('Umgebaute Linie')).toBeInTheDocument();

    // Confirm button enabled and labeled for saving modifications
    const saveBtn = screen.getByRole('button', { name: /Änderungen final speichern \(1\)/i });
    expect(saveBtn).toBeInTheDocument();
    expect(saveBtn).not.toBeDisabled();

    fireEvent.click(saveBtn);
    expect(onConfirmPublish).toHaveBeenCalledTimes(1);
  });

  it('BatchBoulderWorkflow enables bottom bar save button when an active route is modified', async () => {
    // Mock getWallBoulders to return sampleActiveBoulder
    vi.spyOn(batchService, 'getWallBoulders').mockReturnValue([sampleActiveBoulder]);
    vi.spyOn(batchService, 'getGyms').mockReturnValue([{
      id: 'gym-1',
      name: 'Test Gym',
      city: 'Zürich',
      address: 'Teststr',
      logoUrl: '',
      createdBy: 'user-boris',
      createdAt: '2026-09-01T10:00:00Z',
    }]);
    vi.spyOn(batchService, 'getSectors').mockReturnValue([sampleSector]);
    vi.spyOn(batchService, 'getGradeScales').mockReturnValue(sampleGradeScales);

    render(
      <BatchBoulderWorkflow
        currentRole="setter"
        currentUserId="setter-1"
        activeGymId="gym-1"
      />
    );

    // Initial state: 0 neu, 0 geändert, 0 archiviert -> button disabled
    const publishBtn = screen.getByTestId('publish-batch-btn');
    expect(publishBtn).toBeDisabled();
    expect(screen.getByText('0 geändert')).toBeInTheDocument();

    // Click on the existing active pin to edit
    const pin = screen.getByTestId(`pin-${sampleActiveBoulder.id}`);
    expect(pin).toBeInTheDocument();
    fireEvent.click(pin);

    // Sheet opens: click save button in sheet
    const saveSheetBtn = screen.getByTestId('save-boulder-sheet-btn');
    expect(saveSheetBtn).toBeInTheDocument();
    expect(screen.getByText('Änderung übernehmen')).toBeInTheDocument();
    fireEvent.click(saveSheetBtn);

    // Now 1 geändert badge must be visible and bottom button MUST BE ENABLED!
    await waitFor(() => {
      expect(screen.getByText('1 geändert')).toBeInTheDocument();
    });

    expect(publishBtn).not.toBeDisabled();
    expect(screen.getByText(/Änderungen speichern \(1\)/i)).toBeInTheDocument();

    // Click bottom bar save button -> opens BatchSummaryModal
    const updateBoulderDetailsSpy = vi.spyOn(batchService, 'updateBoulderDetails').mockReturnValue(sampleActiveBoulder);
    const updateBoulderPositionSpy = vi.spyOn(batchService, 'updateBoulderPosition').mockReturnValue(sampleActiveBoulder);
    const publishBatchSpy = vi.spyOn(batchService, 'publishBatch').mockReturnValue({
      sectorId: 'sec-1',
      publishedCount: 0,
      archivedCount: 0,
      publishedBoulderIds: [],
      archivedBoulderIds: [],
    });

    fireEvent.click(publishBtn);

    // Modal is open, verify confirm button
    const confirmModalBtn = await screen.findByRole('button', { name: /Änderungen final speichern \(1\)/i });
    expect(confirmModalBtn).toBeInTheDocument();

    fireEvent.click(confirmModalBtn);

    // Staged modifications are committed to service and publishBatch is executed
    expect(updateBoulderDetailsSpy).toHaveBeenCalledWith(
      sampleActiveBoulder.id,
      expect.objectContaining({
        gradeScaleId: sampleActiveBoulder.gradeScaleId,
        name: sampleActiveBoulder.name,
      })
    );
    expect(updateBoulderPositionSpy).toHaveBeenCalledWith(
      sampleActiveBoulder.id,
      sampleActiveBoulder.positionX,
      sampleActiveBoulder.positionY
    );
    expect(publishBatchSpy).toHaveBeenCalledWith('sec-1', 'setter-1', []);
  });
});

