import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoulderSheet } from '../src/components/BoulderSheet';
import {
  computeBoulderStatsAggregate,
  resetAscentAndRatingStorage,
  STORAGE_KEY_ASCENTS,
} from '../src/lib/ratingAndAscentService';
import { toKnownAuthUserUuid } from '../src/lib/syncService';
import { setStorageJson } from '../src/lib/storageUtils';
import { Ascent, WallBoulder } from '../src/types/boulder';

// Eine Person darf in «Wer war schon oben» nur einmal stehen,
// auch wenn ihre Begehung doppelt gespeichert ist (Demo-ID und Supabase-UUID).
const boulder: WallBoulder = {
  id: 'boulder-dedupe-1',
  sectorId: 'sector-x',
  gradeScaleId: 'scale-x',
  positionX: 0.5,
  positionY: 0.5,
  name: 'Doppelt',
  setterId: 'setter-1',
  status: 'active',
  radar: { maximalkraft: 3, kraftausdauer: 3, kraft: 3, technik: 3, balance: 3, koordination: 3, flexibilitaet: 3 },
  createdAt: '2026-09-01T10:00:00Z',
};

const ascents: Ascent[] = [
  { id: 'a-old', userId: 'hans-kletterer', userNickname: 'HansDereinfacheKletterer', boulderId: boulder.id, type: 'project', createdAt: '2026-09-02T10:00:00Z' },
  { id: 'a-new', userId: toKnownAuthUserUuid('hans-kletterer'), userNickname: 'HansDereinfacheKletterer', boulderId: boulder.id, type: 'flash', createdAt: '2026-09-05T10:00:00Z' },
  { id: 'a-other', userId: 'admin-minimum', userNickname: 'AdminMinimum', boulderId: boulder.id, type: 'top', createdAt: '2026-09-03T10:00:00Z' },
];

describe('Community: eine Begehung pro Person', () => {
  beforeEach(() => {
    resetAscentAndRatingStorage();
  });

  it('zählt doppelte Begehungen derselben Person nur einmal (die neueste)', () => {
    const stats = computeBoulderStatsAggregate(boulder, [], ascents, []);
    expect(stats.ascents.map(a => a.id)).toEqual(['a-new', 'a-other']);
    expect(stats.totalFlashes).toBe(1);
    expect(stats.totalTops).toBe(2);
    expect(stats.totalProjects).toBe(0);
  });

  it('zeigt jede Person in «Wer war schon oben» nur einmal', () => {
    setStorageJson(STORAGE_KEY_ASCENTS, ascents);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <BoulderSheet
        boulder={boulder}
        currentUser={{ id: 'user-boris', nickname: 'Boris', role: 'member' }}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('boulder-sheet-more'));

    const section = screen.getByTestId('community-ratings-section');
    expect(section.querySelectorAll('li').length).toBe(2);
    expect(screen.getAllByText('HansDereinfacheKletterer')).toHaveLength(1);
    expect(errors.mock.calls.some(c => String(c[0]).includes('same key'))).toBe(false);
    errors.mockRestore();
  });
});
