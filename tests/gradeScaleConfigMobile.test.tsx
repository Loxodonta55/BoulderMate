import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GradeScaleConfig } from '../src/components/GradeScaleConfig';
import { GradeScale } from '../src/types/gym';

describe('GradeScaleConfig: Mobile Mode & Usability Improvements', () => {
  const initialScales: GradeScale[] = [
    {
      id: 'scale-1',
      gym_id: 'gym-test',
      color_name: 'Gelb',
      color_hex: '#eab308',
      difficulty_label: 'Sehr leicht',
      font_range_min: '3',
      font_range_max: '4+',
      sort_order: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 'scale-2',
      gym_id: 'gym-test',
      color_name: 'Grün',
      color_hex: '#22c55e',
      difficulty_label: 'Leicht',
      font_range_min: '5',
      font_range_max: '5+',
      sort_order: 2,
      created_at: new Date().toISOString(),
    },
    {
      id: 'scale-3',
      gym_id: 'gym-test',
      color_name: 'Blau',
      color_hex: '#3b82f6',
      difficulty_label: 'Mittel',
      font_range_min: '6A',
      font_range_max: '6B+',
      sort_order: 3,
      created_at: new Date().toISOString(),
    },
  ];

  it('renders all difficulty labels and color names prominently with clear labels', () => {
    const onSaved = vi.fn();
    render(
      <GradeScaleConfig
        gymId="gym-test"
        userId="user-admin"
        initialScales={initialScales}
        onSaved={onSaved}
      />
    );

    // 1. Check title & headers
    expect(screen.getByText('Hallenspezifisches Farbsystem (Grade Scales)')).toBeInTheDocument();
    expect(screen.getAllByText(/Schwierigkeitsgrad/i).length).toBeGreaterThan(0);

    // 2. Check each scale's color name and difficulty label are rendered in input fields
    expect(screen.getByDisplayValue('Gelb')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sehr leicht')).toBeInTheDocument();

    expect(screen.getByDisplayValue('Grün')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Leicht')).toBeInTheDocument();

    expect(screen.getByDisplayValue('Blau')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Mittel')).toBeInTheDocument();

    // 3. Check mobile preview badges contain the difficulty names
    expect(screen.getAllByText('(Sehr leicht)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('(Leicht)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('(Mittel)').length).toBeGreaterThan(0);
  });

  it('allows editing difficulty label and reflects changes immediately in live preview', () => {
    const onSaved = vi.fn();
    render(
      <GradeScaleConfig
        gymId="gym-test"
        userId="user-admin"
        initialScales={initialScales}
        onSaved={onSaved}
      />
    );

    // Change difficulty of Gelb from 'Sehr leicht' to 'Anfänger Warmup'
    const diffInput = screen.getByDisplayValue('Sehr leicht');
    fireEvent.change(diffInput, { target: { value: 'Anfänger Warmup' } });

    expect(screen.getByDisplayValue('Anfänger Warmup')).toBeInTheDocument();
    // Live preview badge immediately reflects the updated difficulty name
    expect(screen.getAllByText('(Anfänger Warmup)').length).toBeGreaterThan(0);
  });

  it('allows adding a new color scale with clear default difficulty and values', () => {
    const onSaved = vi.fn();
    render(
      <GradeScaleConfig
        gymId="gym-test"
        userId="user-admin"
        initialScales={initialScales}
        onSaved={onSaved}
      />
    );

    const addBtn = screen.getByRole('button', { name: /Farbe hinzufügen/i });
    fireEvent.click(addBtn);

    // Newly added scale has name 'Neue Farbe' and difficulty 'Mittel'
    expect(screen.getByDisplayValue('Neue Farbe')).toBeInTheDocument();
    // Total count of scale rows is now 4
    expect(screen.getByTestId('scale-row-3')).toBeInTheDocument();
  });

  it('allows reordering scales up and down', () => {
    const onSaved = vi.fn();
    render(
      <GradeScaleConfig
        gymId="gym-test"
        userId="user-admin"
        initialScales={initialScales}
        onSaved={onSaved}
      />
    );

    // Row 1 (Grün) move up -> becomes Row 0
    const moveUpButtons = screen.getAllByTitle('Nach oben verschieben');
    // Button for scale index 1 (Grün) is moveUpButtons[1]
    fireEvent.click(moveUpButtons[1]);

    const rows = screen.getAllByTestId(/scale-row-/);
    expect(rows[0]).toHaveTextContent('Grün');
    expect(rows[1]).toHaveTextContent('Gelb');
  });

  it('allows deleting a scale', () => {
    const onSaved = vi.fn();
    render(
      <GradeScaleConfig
        gymId="gym-test"
        userId="user-admin"
        initialScales={initialScales}
        onSaved={onSaved}
      />
    );

    const deleteButtons = screen.getAllByTitle('Farbe entfernen');
    // Delete first scale (Gelb)
    fireEvent.click(deleteButtons[0]);

    expect(screen.queryByDisplayValue('Gelb')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Grün')).toBeInTheDocument();
  });
});
