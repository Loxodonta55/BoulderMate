import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoulderStatsBar } from '../src/components/BoulderStatsBar';
import { BoulderList } from '../src/components/BoulderList';
import { BoulderForm } from '../src/components/BoulderForm';
import { Boulder, BoulderStats } from '../src/types/boulder';

describe('UI Components (AC-8 & Specs)', () => {
  const sampleStats: BoulderStats = {
    totalLogged: 10,
    totalTops: 7,
    totalProjects: 3,
    flashRatePercent: 43,
    hardestGradeFont: '7B',
    hardestGradeV: 'V8',
    gradeDistribution: { '6A': 2, '7A': 3, '7B': 2 }
  };

  it('renders BoulderStatsBar with correct values', () => {
    render(<BoulderStatsBar stats={sampleStats} />);
    expect(screen.getAllByText('7B').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('(V8)')).toBeInTheDocument();
    expect(screen.getByText('43%')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // 3 projects
  });

  it('renders BoulderList and allows expanding crux notes', () => {
    const sampleBoulder: Boulder = {
      id: 'test-1',
      name: 'Highball Project',
      location: 'Magic Wood',
      sector: 'Darkness',
      date: '2026-09-04',
      gradeScale: 'font',
      grade: '7A+',
      ascentStyle: 'top',
      attempts: 5,
      holdTypes: ['sloper', 'crimp'],
      cruxDescription: 'Match on sloper and dynamic jump to lip',
      tags: ['highball'],
      createdAt: '2026-09-04T10:00:00Z',
      updatedAt: '2026-09-04T10:00:00Z'
    };

    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<BoulderList boulders={[sampleBoulder]} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('Highball Project')).toBeInTheDocument();
    expect(screen.getByText('Magic Wood')).toBeInTheDocument();

    // Toggle expand
    const expandBtn = screen.getByTitle('Details ausklappen');
    fireEvent.click(expandBtn);

    expect(screen.getByText(/Match on sloper and dynamic jump to lip/i)).toBeInTheDocument();
  });

  it('renders BoulderForm and enforces required fields', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<BoulderForm onSave={onSave} onCancel={onCancel} />);

    // Try submit empty form
    const submitBtn = screen.getByText('Boulder erfassen');
    fireEvent.click(submitBtn);

    // HTML5 required or component validation prevents onSave
    expect(onSave).not.toHaveBeenCalled();
  });
});
