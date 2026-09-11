import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BatchBoulderWorkflow } from '../src/components/BatchBoulderWorkflow';
import {
  createDraftBoulder,
  publishBatch,
  getWallBoulders,
  deleteWallBoulder,
} from '../src/lib/batchBoulderService';
import * as gymStorage from '../src/lib/gymStorage';

describe('SPEC-002 AC-13: Route löschen im Schrauber-Bereich', () => {
  beforeEach(() => {
    localStorage.clear();
    gymStorage.ensureInitialGymData();
  });

  it('allows setter to tap an active boulder pin, opens sheet, confirms deletion, and removes pin from wall', async () => {
    const sectors = gymStorage.getSectors('gym-6a-plus');
    const targetSector = sectors[0];
    const scales = gymStorage.getGradeScales('gym-6a-plus');

    // Create and publish an active boulder
    const route = createDraftBoulder({
      sectorId: targetSector.id,
      gradeScaleId: scales[0].id,
      positionX: 0.45,
      positionY: 0.55,
      name: 'Schrauber Test Boulder',
      setterId: 'schrauber-6aplus',
    });
    publishBatch(targetSector.id, 'schrauber-6aplus');

    expect(getWallBoulders(targetSector.id).some(b => b.id === route.id && b.status === 'active')).toBe(true);

    render(
      <BatchBoulderWorkflow
        currentRole="setter"
        currentUserId="schrauber-6aplus"
        activeGymId="gym-6a-plus"
      />
    );

    // Pin should be present on wall
    const pin = screen.getByTestId(`pin-${route.id}`);
    expect(pin).toBeInTheDocument();

    // Click pin to open bottom sheet
    fireEvent.click(pin);

    // Sheet should be open with delete button
    expect(screen.getByText('Boulder bearbeiten')).toBeInTheDocument();
    const deleteBtn = screen.getByTestId('delete-boulder-sheet-status-btn');
    expect(deleteBtn).toBeInTheDocument();

    // Click delete button
    fireEvent.click(deleteBtn);

    // Confirmation dialog appears
    expect(screen.getByText(/Route unwiderruflich löschen\?/i)).toBeInTheDocument();
    const confirmBtn = screen.getByTestId('confirm-delete-boulder-sheet-btn');

    // Confirm deletion
    fireEvent.click(confirmBtn);

    // Verify toast notification and pin removal
    await waitFor(() => {
      expect(screen.getByText('Route erfolgreich gelöscht!')).toBeInTheDocument();
      expect(screen.queryByTestId(`pin-${route.id}`)).not.toBeInTheDocument();
    });

    // Verify route is completely gone from storage
    expect(getWallBoulders(targetSector.id).some(b => b.id === route.id)).toBe(false);
  });

  it('reactively updates setter canvas when a boulder is deleted from another view via custom event', async () => {
    const sectors = gymStorage.getSectors('gym-6a-plus');
    const targetSector = sectors[0];
    const scales = gymStorage.getGradeScales('gym-6a-plus');

    const route = createDraftBoulder({
      sectorId: targetSector.id,
      gradeScaleId: scales[0].id,
      positionX: 0.25,
      positionY: 0.35,
      name: 'External Delete Target',
      setterId: 'schrauber-6aplus',
    });
    publishBatch(targetSector.id, 'schrauber-6aplus');

    render(
      <BatchBoulderWorkflow
        currentRole="setter"
        currentUserId="schrauber-6aplus"
        activeGymId="gym-6a-plus"
      />
    );

    expect(screen.getByTestId(`pin-${route.id}`)).toBeInTheDocument();

    // Simulate deletion happening elsewhere (e.g. Climber view or Admin view)
    act(() => {
      deleteWallBoulder(route.id);
    });

    // Pin should disappear from setter canvas reactively
    await waitFor(() => {
      expect(screen.queryByTestId(`pin-${route.id}`)).not.toBeInTheDocument();
    });
  });

  it('permanently deletes pre-seeded boulders in Slab Vorne and prevents their resurrection', async () => {
    // Check Slab Vorne boulders exist initially
    const initialBoulders = getWallBoulders('sec_6a_slab_vorne');
    expect(initialBoulders.length).toBeGreaterThan(0);
    const targetBoulder = initialBoulders[0];

    render(
      <BatchBoulderWorkflow
        currentRole="setter"
        currentUserId="schrauber-6aplus"
        activeGymId="gym-6a-plus"
      />
    );

    // Switch to sector Slab Vorne
    const slabBtn = screen.getByRole('button', { name: /Slab Vorne/i });
    fireEvent.click(slabBtn);

    // Pin should be present on wall
    const pin = screen.getByTestId(`pin-${targetBoulder.id}`);
    expect(pin).toBeInTheDocument();

    // Click pin to open bottom sheet
    fireEvent.click(pin);

    // Click delete
    const deleteBtn = screen.getByTestId('delete-boulder-sheet-status-btn');
    fireEvent.click(deleteBtn);

    // Confirm deletion
    const confirmBtn = screen.getByTestId('confirm-delete-boulder-sheet-btn');
    fireEvent.click(confirmBtn);

    // Pin must disappear from wall
    await waitFor(() => {
      expect(screen.queryByTestId(`pin-${targetBoulder.id}`)).not.toBeInTheDocument();
    });

    // Verify targetBoulder is permanently gone from storage and not resurrected
    expect(getWallBoulders('sec_6a_slab_vorne').some(b => b.id === targetBoulder.id)).toBe(false);

    // Re-running gymStorage.ensureInitialGymData() must NOT resurrect it
    gymStorage.ensureInitialGymData();
    expect(getWallBoulders('sec_6a_slab_vorne').some(b => b.id === targetBoulder.id)).toBe(false);
  });
});

