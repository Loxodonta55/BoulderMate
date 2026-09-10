import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WallPhotoCanvas } from '../src/components/WallPhotoCanvas';
import { BoulderBottomSheet } from '../src/components/BoulderBottomSheet';
import { BatchSummaryModal } from '../src/components/BatchSummaryModal';
import { WallBoulder, GymGradeScale, Sector, DEFAULT_RADAR } from '../src/types/boulder';

describe('SPEC-002: UI Components Integration', () => {
  const sampleGradeScales: GymGradeScale[] = [
    { id: 'scale-green', gymId: 'gym-1', colorName: 'Grün', colorHex: '#22c55e', difficultyLabel: 'Leicht', fontRangeMin: '4a', fontRangeMax: '5b', sortOrder: 1 },
    { id: 'scale-blue', gymId: 'gym-1', colorName: 'Blau', colorHex: '#3b82f6', difficultyLabel: 'Mittel', fontRangeMin: '5c', fontRangeMax: '6b', sortOrder: 2 },
  ];

  const sampleSector: Sector = {
    id: 'sector-1',
    gymId: 'gym-1',
    name: 'Überhang 45°',
    wallPhotoUrl: 'https://example.com/wall.jpg',
    sortOrder: 1,
    createdAt: '2026-09-04T12:00:00Z',
  };

  const sampleDraft: WallBoulder = {
    id: 'draft-1',
    sectorId: 'sector-1',
    gradeScaleId: 'scale-green',
    positionX: 0.3,
    positionY: 0.4,
    name: 'Test Dyno',
    setterId: 'setter-1',
    status: 'draft',
    radar: { ...DEFAULT_RADAR },
    createdAt: '2026-09-04T12:00:00Z',
  };

  const sampleActive: WallBoulder = {
    id: 'active-1',
    sectorId: 'sector-1',
    gradeScaleId: 'scale-blue',
    positionX: 0.7,
    positionY: 0.8,
    name: 'Old Classic',
    setterId: 'setter-1',
    status: 'active',
    radar: { ...DEFAULT_RADAR },
    createdAt: '2026-08-01T12:00:00Z',
    publishedAt: '2026-08-01T14:00:00Z',
  };

  it('renders WallPhotoCanvas with pins and calls onPhotoClick', () => {
    const onPhotoClick = vi.fn();
    const onPinClick = vi.fn();
    const onPinMove = vi.fn();

    render(
      <WallPhotoCanvas
        photoUrl="https://example.com/wall.jpg"
        boulders={[sampleDraft, sampleActive]}
        gradeScales={sampleGradeScales}
        pendingArchiveIds={[]}
        selectedBoulderId={null}
        onPhotoClick={onPhotoClick}
        onPinClick={onPinClick}
        onPinMove={onPinMove}
      />
    );

    // Pins should be rendered
    expect(screen.getByTestId('pin-draft-1')).toBeInTheDocument();
    expect(screen.getByTestId('pin-active-1')).toBeInTheDocument();

    // Clicking pin triggers onPinClick
    fireEvent.click(screen.getByTestId('pin-draft-1'));
    expect(onPinClick).toHaveBeenCalledWith(sampleDraft);
  });

  it('renders BoulderBottomSheet, shows color buttons and saves with radar attributes', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <BoulderBottomSheet
        isOpen={true}
        boulder={sampleDraft}
        gradeScales={sampleGradeScales}
        defaultGradeScaleId="scale-green"
        isMarkedForArchive={false}
        onClose={onClose}
        onSave={onSave}
      />
    );

    expect(screen.getByText('Neuer Boulder (Entwurf)')).toBeInTheDocument();
    expect(screen.getByText('Grün')).toBeInTheDocument();
    expect(screen.getByText('Blau')).toBeInTheDocument();

    // Select Blau
    fireEvent.click(screen.getByText('Blau'));

    // Submit form
    fireEvent.click(screen.getByText(/Speichern & (Weiter|Nächster Boulder)/i));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        gradeScaleId: 'scale-blue',
        radar: expect.objectContaining({
          kraft: 3,
          technik: 3,
          balance: 3,
          koordination: 3,
          flexibilitaet: 3,
        }),
      })
    );
  });

  it('renders BatchSummaryModal and confirms batch publish', () => {
    const onConfirmPublish = vi.fn();
    const onClose = vi.fn();

    render(
      <BatchSummaryModal
        isOpen={true}
        sector={sampleSector}
        draftBoulders={[sampleDraft]}
        archivedBoulders={[sampleActive]}
        gradeScales={sampleGradeScales}
        hasPhotoUpdated={false}
        onClose={onClose}
        onConfirmPublish={onConfirmPublish}
      />
    );

    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getByText('-1')).toBeInTheDocument();
    expect(screen.getByText(/Batch-Veröffentlichung/i)).toBeInTheDocument();

    // Click publish button
    fireEvent.click(screen.getByText('Jetzt veröffentlichen'));
    expect(onConfirmPublish).toHaveBeenCalledTimes(1);
  });

  it('renders delete buttons for existing active boulder in BoulderBottomSheet and confirms deletion (AC-13)', () => {
    const onDeleteBoulder = vi.fn();
    const onClose = vi.fn();

    render(
      <BoulderBottomSheet
        isOpen={true}
        boulder={sampleActive}
        gradeScales={sampleGradeScales}
        defaultGradeScaleId="scale-blue"
        isMarkedForArchive={false}
        onClose={onClose}
        onSave={vi.fn()}
        onDeleteBoulder={onDeleteBoulder}
      />
    );

    // Delete buttons should be present in header, status card, and footer
    expect(screen.getByTestId('delete-boulder-sheet-header-btn')).toBeInTheDocument();
    expect(screen.getByTestId('delete-boulder-sheet-status-btn')).toBeInTheDocument();
    expect(screen.getByTestId('delete-boulder-sheet-footer-btn')).toBeInTheDocument();

    // Click footer delete button
    fireEvent.click(screen.getByTestId('delete-boulder-sheet-footer-btn'));

    // Confirmation dialog should be visible
    expect(screen.getByText(/Route unwiderruflich löschen\?/i)).toBeInTheDocument();
    expect(screen.getByTestId('confirm-delete-boulder-sheet-btn')).toBeInTheDocument();

    // Test cancel
    fireEvent.click(screen.getByRole('button', { name: /Abbrechen/i }));
    expect(screen.queryByText(/Route unwiderruflich löschen\?/i)).not.toBeInTheDocument();
    expect(onDeleteBoulder).not.toHaveBeenCalled();

    // Open again and confirm deletion
    fireEvent.click(screen.getByTestId('delete-boulder-sheet-status-btn'));
    fireEvent.click(screen.getByTestId('confirm-delete-boulder-sheet-btn'));

    expect(onDeleteBoulder).toHaveBeenCalledWith(sampleActive.id);
  });
});
