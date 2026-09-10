import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WallPhotoCanvas } from '../src/components/WallPhotoCanvas';
import { BatchBoulderWorkflow } from '../src/components/BatchBoulderWorkflow';
import { WallBoulder, GymGradeScale, DEFAULT_RADAR } from '../src/types/boulder';
import {
  createDraftBoulder,
  getSectors,
} from '../src/lib/batchBoulderService';

describe('AC-12: Marquee / Box Selection & Bulk Deletion (Schrauber-Bereich)', () => {
  const sampleGradeScales: GymGradeScale[] = [
    {
      id: 'scale-yellow',
      gymId: 'gym-minimum-zh',
      colorName: 'Gelb',
      colorHex: '#eab308',
      difficultyLabel: 'Einfach',
      fontRangeMin: '4a',
      fontRangeMax: '5b',
      sortOrder: 1,
    },
    {
      id: 'scale-blue',
      gymId: 'gym-minimum-zh',
      colorName: 'Blau',
      colorHex: '#3b82f6',
      difficultyLabel: 'Mittel',
      fontRangeMin: '5c',
      fontRangeMax: '6b',
      sortOrder: 2,
    },
  ];

  const boulderInside1: WallBoulder = {
    id: 'boulder-inside-1',
    sectorId: 'sector-test',
    gradeScaleId: 'scale-yellow',
    positionX: 0.25,
    positionY: 0.3,
    name: 'Inside Boulder 1',
    setterId: 'setter-1',
    status: 'draft',
    radar: { ...DEFAULT_RADAR },
    createdAt: '2026-09-10T12:00:00Z',
  };

  const boulderInside2: WallBoulder = {
    id: 'boulder-inside-2',
    sectorId: 'sector-test',
    gradeScaleId: 'scale-blue',
    positionX: 0.4,
    positionY: 0.45,
    name: 'Inside Boulder 2',
    setterId: 'setter-1',
    status: 'active',
    radar: { ...DEFAULT_RADAR },
    createdAt: '2026-09-10T12:00:00Z',
  };

  const boulderOutside: WallBoulder = {
    id: 'boulder-outside',
    sectorId: 'sector-test',
    gradeScaleId: 'scale-yellow',
    positionX: 0.85,
    positionY: 0.9,
    name: 'Outside Boulder',
    setterId: 'setter-1',
    status: 'active',
    radar: { ...DEFAULT_RADAR },
    createdAt: '2026-09-10T12:00:00Z',
  };

  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 1000,
      height: 1000,
      right: 1000,
      bottom: 1000,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
  });

  describe('WallPhotoCanvas Box Selection', () => {
    it('renders instruction badge mentioning box selection mode', () => {
      render(
        <WallPhotoCanvas
          photoUrl="/test-wall.jpg"
          boulders={[boulderInside1, boulderInside2, boulderOutside]}
          gradeScales={sampleGradeScales}
        />
      );

      expect(screen.getByText(/Quadrat-Auswahl/i)).toBeInTheDocument();
    });

    it('displays selection rectangle on mouse drag and computes enclosed boulders', () => {
      const onSelectionChange = vi.fn();

      const { container } = render(
        <WallPhotoCanvas
          photoUrl="/test-wall.jpg"
          boulders={[boulderInside1, boulderInside2, boulderOutside]}
          gradeScales={sampleGradeScales}
          onSelectionChange={onSelectionChange}
        />
      );

      const canvasContainer = container.querySelector('.cursor-crosshair') as HTMLElement;
      expect(canvasContainer).toBeInTheDocument();

      // Initially no selection rectangle
      expect(screen.queryByTestId('selection-rectangle')).not.toBeInTheDocument();

      // Mouse down at client (200, 200) -> normalized (0.2, 0.2)
      fireEvent.mouseDown(canvasContainer, { clientX: 200, clientY: 200, button: 0 });

      // Mouse move to client (500, 600) -> normalized (0.5, 0.6)
      fireEvent.mouseMove(canvasContainer, { clientX: 500, clientY: 600 });

      // Selection rectangle is now rendered
      const selectionRect = screen.getByTestId('selection-rectangle');
      expect(selectionRect).toBeInTheDocument();

      // Style should match 20% to 50% X (width 30%) and 20% to 60% Y (height 40%)
      expect(selectionRect.style.left).toBe('20%');
      expect(selectionRect.style.top).toBe('20%');
      expect(selectionRect.style.width).toBe('30%');
      expect(selectionRect.style.height).toBe('40%');

      // Both boulderInside1 (0.25, 0.3) and boulderInside2 (0.4, 0.45) fall inside [0.2, 0.5] x [0.2, 0.6]
      expect(onSelectionChange).toHaveBeenCalledWith(['boulder-inside-1', 'boulder-inside-2']);

      // Mouse up clears selection rectangle overlay
      fireEvent.mouseUp(canvasContainer);
      expect(screen.queryByTestId('selection-rectangle')).not.toBeInTheDocument();
    });

    it('highlights selected boulders with badge and ring', () => {
      render(
        <WallPhotoCanvas
          photoUrl="/test-wall.jpg"
          boulders={[boulderInside1, boulderInside2, boulderOutside]}
          gradeScales={sampleGradeScales}
          selectedBoulderIds={['boulder-inside-1', 'boulder-inside-2']}
        />
      );

      // Selection check badges
      expect(screen.getByTestId('selection-badge-boulder-inside-1')).toBeInTheDocument();
      expect(screen.getByTestId('selection-badge-boulder-inside-2')).toBeInTheDocument();
      expect(screen.queryByTestId('selection-badge-boulder-outside')).not.toBeInTheDocument();
    });

    it('clears selection when clicking on empty canvas while items are selected', () => {
      const onSelectionChange = vi.fn();

      const { container } = render(
        <WallPhotoCanvas
          photoUrl="/test-wall.jpg"
          boulders={[boulderInside1, boulderInside2, boulderOutside]}
          gradeScales={sampleGradeScales}
          selectedBoulderIds={['boulder-inside-1']}
          onSelectionChange={onSelectionChange}
        />
      );

      const canvasContainer = container.querySelector('.cursor-crosshair') as HTMLElement;
      fireEvent.click(canvasContainer, { clientX: 100, clientY: 100 });

      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });
  });

  describe('BatchBoulderWorkflow Multi-Selection & Bulk Deletion', () => {
    it('renders multi-selection bar and deletes selected boulders', () => {
      localStorage.clear();
      const defaultSectorId = getSectors('gym-minimum-zh')[0]?.id || 'sec-overhang';
      const draftA = createDraftBoulder(
        {
          sectorId: defaultSectorId,
          gradeScaleId: 'scale-yellow',
          positionX: 0.2,
          positionY: 0.3,
          setterId: 'setter-1',
        },
        'setter'
      );
      const draftB = createDraftBoulder(
        {
          sectorId: defaultSectorId,
          gradeScaleId: 'scale-blue',
          positionX: 0.3,
          positionY: 0.4,
          setterId: 'setter-1',
        },
        'setter'
      );

      render(<BatchBoulderWorkflow currentRole="setter" />);

      const canvasContainer = screen.getByTestId(`pin-${draftA.id}`).closest('.cursor-crosshair') as HTMLElement;
      expect(canvasContainer).toBeInTheDocument();

      fireEvent.mouseDown(canvasContainer, { clientX: 100, clientY: 100, button: 0 });
      fireEvent.mouseMove(canvasContainer, { clientX: 500, clientY: 500 });
      fireEvent.mouseUp(canvasContainer);

      // Multi-selection bar appears
      const multiBar = screen.getByTestId('multi-selection-bar');
      expect(multiBar).toBeInTheDocument();
      expect(multiBar).toHaveTextContent(/Boulder ausgewählt/);

      // Click delete button
      const deleteBtn = screen.getByTestId('btn-delete-multi-selection');
      fireEvent.click(deleteBtn);

      // Boulders should be deleted and bar should disappear
      expect(screen.queryByTestId('multi-selection-bar')).not.toBeInTheDocument();
      expect(screen.queryByTestId(`pin-${draftA.id}`)).not.toBeInTheDocument();
      expect(screen.queryByTestId(`pin-${draftB.id}`)).not.toBeInTheDocument();
    });

    it('allows cancelling multi-selection via Cancel button', () => {
      localStorage.clear();
      const defaultSectorId = getSectors('gym-minimum-zh')[0]?.id || 'sec-overhang';
      const draft = createDraftBoulder(
        {
          sectorId: defaultSectorId,
          gradeScaleId: 'scale-yellow',
          positionX: 0.2,
          positionY: 0.3,
          setterId: 'setter-1',
        },
        'setter'
      );

      render(<BatchBoulderWorkflow currentRole="setter" />);

      const canvasContainer = screen.getByTestId(`pin-${draft.id}`).closest('.cursor-crosshair') as HTMLElement;

      fireEvent.mouseDown(canvasContainer, { clientX: 100, clientY: 100, button: 0 });
      fireEvent.mouseMove(canvasContainer, { clientX: 400, clientY: 400 });
      fireEvent.mouseUp(canvasContainer);

      expect(screen.getByTestId('multi-selection-bar')).toBeInTheDocument();

      // Click cancel
      const cancelBtn = screen.getByTestId('btn-cancel-multi-selection');
      fireEvent.click(cancelBtn);

      // Bar disappears, draft still exists
      expect(screen.queryByTestId('multi-selection-bar')).not.toBeInTheDocument();
      expect(screen.getByTestId(`pin-${draft.id}`)).toBeInTheDocument();
    });

    it('deletes multi-selected boulders via Delete keyboard shortcut', () => {
      localStorage.clear();
      const defaultSectorId = getSectors('gym-minimum-zh')[0]?.id || 'sec-overhang';
      const draft = createDraftBoulder(
        {
          sectorId: defaultSectorId,
          gradeScaleId: 'scale-yellow',
          positionX: 0.2,
          positionY: 0.3,
          setterId: 'setter-1',
        },
        'setter'
      );

      render(<BatchBoulderWorkflow currentRole="setter" />);

      const canvasContainer = screen.getByTestId(`pin-${draft.id}`).closest('.cursor-crosshair') as HTMLElement;

      fireEvent.mouseDown(canvasContainer, { clientX: 100, clientY: 100, button: 0 });
      fireEvent.mouseMove(canvasContainer, { clientX: 400, clientY: 400 });
      fireEvent.mouseUp(canvasContainer);

      expect(screen.getByTestId('multi-selection-bar')).toBeInTheDocument();

      // Trigger Delete keydown on window
      fireEvent.keyDown(window, { key: 'Delete' });

      // Draft deleted
      expect(screen.queryByTestId('multi-selection-bar')).not.toBeInTheDocument();
      expect(screen.queryByTestId(`pin-${draft.id}`)).not.toBeInTheDocument();
    });
  });
});
