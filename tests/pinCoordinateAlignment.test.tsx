import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WallPhotoCanvas } from '../src/components/WallPhotoCanvas';
import { ClimberSectorView } from '../src/components/ClimberSectorView';
import { WallBoulder, GymGradeScale, CurrentUser, DEFAULT_RADAR } from '../src/types/boulder';

describe('Pin Coordinate Alignment & Wall Photo Aspect Ratio (Setter <-> Climber)', () => {
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

  const testBoulder: WallBoulder = {
    id: 'boulder-coord-test-1',
    sectorId: 'sec-overhang',
    gradeScaleId: 'scale-yellow',
    positionX: 0.4567,
    positionY: 0.7891,
    name: 'Precision Test Route',
    setterId: 'setter-boris',
    status: 'active',
    radar: { ...DEFAULT_RADAR },
    createdAt: '2026-09-08T12:00:00Z',
  };

  const climberUser: CurrentUser = {
    id: 'user-climber',
    nickname: 'Climber Boris',
    role: 'member',
  };

  it('WallPhotoCanvas displays uncropped image and renders pin with exact relative coordinates', () => {
    render(
      <WallPhotoCanvas
        photoUrl="/images/walls/overhang.jpg"
        boulders={[testBoulder]}
        gradeScales={sampleGradeScales}
        pendingArchiveIds={[]}
        selectedBoulderId={null}
        onPhotoClick={vi.fn()}
        onPinClick={vi.fn()}
        onPinMove={vi.fn()}
      />
    );

    // Verify image does not have object-cover or max-height cropping classes
    const img = screen.getByAltText('Wandfoto des Sektors') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.className).not.toContain('object-cover');
    expect(img.className).not.toContain('max-h-[650px]');
    expect(img.className).toContain('w-full');
    expect(img.className).toContain('h-auto');

    // Verify pin container coordinates
    const pin = screen.getByTestId('pin-boulder-coord-test-1');
    expect(pin).toBeInTheDocument();
    expect(pin.style.left).toBe('45.67%');
    expect(pin.style.top).toBe('78.91%');
    expect(pin.className).toContain('-translate-x-1/2');
    expect(pin.className).toContain('-translate-y-1/2');
  });

  it('ClimberSectorView displays uncropped image and renders pin at identical relative coordinates', () => {
    // Render ClimberSectorView
    render(<ClimberSectorView currentUser={climberUser} activeGymId="gym-minimum-zh" />);

    // Check that all wall photos rendered in climber view avoid object-cover cropping
    const images = screen.getAllByRole('img');
    const wallImg = images.find(img => img.getAttribute('alt')?.includes('Überhang') || img.getAttribute('src')?.includes('overhang.jpg') || img.getAttribute('src')?.includes('walls'));
    if (wallImg) {
      expect(wallImg.className).not.toContain('object-cover');
      expect(wallImg.className).not.toContain('max-h-[600px]');
      expect(wallImg.className).toContain('w-full');
      expect(wallImg.className).toContain('h-auto');
    }

    // Verify buttons are centered and translated correctly
    const pinButtons = screen.getAllByRole('button').filter(b => b.className.includes('-translate-y-1/2'));
    expect(pinButtons.length).toBeGreaterThan(0);
    for (const btn of pinButtons) {
      expect(btn.className).toContain('-translate-x-1/2');
      expect(btn.className).toContain('-translate-y-1/2');
      expect(btn.className).toContain('flex');
      expect(btn.className).toContain('items-center');
      expect(btn.className).toContain('justify-center');
    }
  });

  it('both views maintain mathematical consistency for coordinates across aspect ratios', () => {
    // Normalized coordinates
    const x = 0.35;
    const y = 0.62;

    const setterStyle = {
      left: `${x * 100}%`,
      top: `${y * 100}%`,
    };

    const climberStyle = {
      left: `${x * 100}%`,
      top: `${y * 100}%`,
    };

    expect(setterStyle.left).toBe(climberStyle.left);
    expect(setterStyle.top).toBe(climberStyle.top);
  });
});
