import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { App } from '../src/App';
import { GymManagement } from '../src/components/GymManagement';
import { SectorManager } from '../src/components/SectorManager';
import { TeamManager } from '../src/components/admin/TeamManager';
import { AdminGymSheet, getManageableGyms } from '../src/components/admin/AdminGymSheet';
import { ConfirmDialog } from '../src/components/ui/ConfirmDialog';
import {
  resetAllGymData,
  ensureInitialGymData,
  createGym,
  createSector,
  renameSector,
  getSectors,
} from '../src/lib/gymStorage';
import { clearBatchServiceStorage } from '../src/lib/batchBoulderService';
import { appointGymSetter, appointGymAdmin, getGymTeamMembers } from '../src/lib/roleService';
import { groupTeamByPerson, searchTeamCandidates } from '../src/lib/adminTeam';
import { setSessionUser } from '../src/lib/authService';
import * as syncService from '../src/lib/syncService';
import type { GymMember, Sector } from '../src/types/gym';
import type { UserProfile } from '../src/types/boulder';

/**
 * SPEC-023 · Admin-UX «Ordnung & wenig Text».
 * Deckt AC-1 bis AC-11 auf Komponentenebene ab; AC-12 (8 Sektoren ohne Scrollen) prüft Playwright.
 */

const BORIS = 'user-boris';
const GYM = 'gym-spec023';

const profile = (id: string, nickname: string): UserProfile => ({ id, nickname, createdAt: '' } as UserProfile);
const member = (user_id: string, role: 'admin' | 'setter'): GymMember =>
  ({ id: `${user_id}-${role}`, gym_id: GYM, user_id, role, created_at: '' } as GymMember);

beforeEach(() => {
  localStorage.clear();
  resetAllGymData();
  clearBatchServiceStorage();
  ensureInitialGymData();
  setSessionUser(BORIS);
  vi.restoreAllMocks();
  vi.spyOn(syncService, 'syncSectorOrderToSupabase').mockResolvedValue(undefined as any);
  vi.spyOn(syncService, 'syncGymMemberToSupabase').mockResolvedValue(undefined as any);
  vi.spyOn(syncService, 'removeGymMemberFromSupabase').mockResolvedValue(undefined as any);
});

describe('Logik', () => {
  it('renameSector benennt um, verweigert leere und doppelte Namen', () => {
    createGym({ id: GYM, name: 'Testhalle' }, BORIS);
    const a = createSector(GYM, BORIS, { name: 'Slab', wall_photo_url: '/wand.jpg' });
    createSector(GYM, BORIS, { name: 'Dach', wall_photo_url: '/wand.jpg' });

    expect(renameSector(a.id, BORIS, '  Slab Vorne ').name).toBe('Slab Vorne');
    expect(getSectors().find(s => s.id === a.id)?.name).toBe('Slab Vorne');
    expect(() => renameSector(a.id, BORIS, '   ')).toThrow();
    expect(() => renameSector(a.id, BORIS, 'dach')).toThrow(/schon einen Sektor/);
    expect(() => renameSector(a.id, 'hans-kletterer', 'X')).toThrow();
  });

  it('groupTeamByPerson: eine Zeile pro Person, Admins zuerst', () => {
    const profiles = [profile('u-a', 'Anna'), profile('u-z', 'Zoe'), profile('u-b', 'Ben')];
    const team = groupTeamByPerson(
      [member('u-a', 'setter'), member('u-z', 'admin'), member('u-z', 'setter'), member('u-b', 'setter')],
      profiles
    );
    expect(team.map(p => p.name)).toEqual(['Zoe', 'Anna', 'Ben']);
    expect(team[0].roles).toEqual(['admin', 'setter']);
  });

  it('searchTeamCandidates ignoriert Groß/Klein und Akzente, leere Suche liefert nichts', () => {
    const profiles = [profile('1', 'Jürgen'), profile('2', 'Anja'), profile('3', 'Sanja')];
    expect(searchTeamCandidates('', profiles)).toEqual([]);
    expect(searchTeamCandidates('JURG', profiles).map(p => p.id)).toEqual(['1']);
    // Treffer am Wortanfang zuerst
    expect(searchTeamCandidates('anj', profiles).map(p => p.nickname)).toEqual(['Anja', 'Sanja']);
  });

  it('getManageableGyms zeigt Hallen-Admins nur eigene Hallen', () => {
    const gyms = [{ id: 'gym-6a-plus', name: '6a' }, { id: 'gym-minimum-zh', name: 'Min' }] as any;
    expect(getManageableGyms(gyms, BORIS, true)).toHaveLength(2);
    expect(getManageableGyms(gyms, 'admin-6aplus', false).map((g: any) => g.id)).toEqual(['gym-6a-plus']);
  });
});

describe('AC-6 ConfirmDialog', () => {
  it('«Abbrechen» hat den Fokus, erst OK bestätigt', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog open title="Sektor «Slab» löschen?" onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.getByTestId('confirm-cancel')).toHaveFocus();
    fireEvent.click(screen.getByTestId('confirm-cancel'));
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('confirm-ok'));
    expect(onConfirm).toHaveBeenCalled();
  });
});

describe('AC-1 Admin-Konsole', () => {
  it('zeigt direkt die Tabs, keine Hallen-Karten, keine Suche, kein Banner', () => {
    render(<GymManagement activeGymId="gym-6a-plus" userId={BORIS} />);
    const tabs = screen.getByTestId('admin-tabs');
    expect(within(tabs).getAllByRole('tab').map(t => t.textContent)).toEqual(['Sektoren', 'Farben', 'Team', 'Halle']);
    expect(screen.getByTestId('admin-tab-sectors')).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Halle suchen/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('sector-list')).toBeInTheDocument();
  });

  it('Tab «Halle» zeigt den Standort-Editor aus SPEC-025', () => {
    render(<GymManagement activeGymId="gym-6a-plus" userId={BORIS} />);
    fireEvent.click(screen.getByTestId('admin-tab-gym'));
    expect(screen.getByTestId('gym-location-editor')).toBeInTheDocument();
  });

  it('wechselt auf eine verwaltbare Halle, wenn die aktive nicht verwaltet wird', () => {
    const onSelect = vi.fn();
    render(<GymManagement activeGymId="gym-minimum-zh" userId="admin-6aplus" onSelectGym={onSelect} />);
    expect(onSelect).toHaveBeenCalledWith('gym-6a-plus');
  });
});

describe('AC-4/5/6 Sektoren', () => {
  const sectors = (counts: number[]): (Sector & { active_boulder_count: number })[] =>
    counts.map((n, i) => ({
      id: `s-${i + 1}`,
      gym_id: GYM,
      name: `Sektor ${i + 1}`,
      wall_photo_url: '',
      sort_order: i + 1,
      created_at: '',
      active_boulder_count: n,
    }));

  const renderManager = (counts: number[], onRefresh = vi.fn()) => {
    createGym({ id: GYM, name: 'Testhalle' }, BORIS);
    return render(<SectorManager gymId={GYM} userId={BORIS} isAdmin sectors={sectors(counts)} onRefresh={onRefresh} />);
  };

  it('Zeile zeigt Name und Boulder-Anzahl; Tippen öffnet das Sheet', () => {
    renderManager([3, 0]);
    expect(screen.getByTestId('sector-row-s-1')).toHaveTextContent('Sektor 1');
    expect(screen.getByTestId('sector-row-s-1')).toHaveTextContent('3 Boulder');
    fireEvent.click(screen.getByTestId('sector-row-s-1'));
    const sheet = screen.getByTestId('sector-sheet');
    expect(within(sheet).getByTestId('sector-rename-input')).toHaveValue('Sektor 1');
    expect(within(sheet).getByTestId('sector-photo-btn')).toBeInTheDocument();
  });

  it('Sortier-Pfeile erscheinen nur im Sortier-Modus', () => {
    renderManager([0, 0]);
    expect(screen.queryByTestId('move-down-s-1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('toggle-reorder-mode-btn'));
    expect(screen.getByTestId('toggle-reorder-mode-btn')).toHaveTextContent('Fertig');
    expect(screen.getByTestId('move-down-s-1')).toBeInTheDocument();
  });

  it('Löschen fragt nach; Abbrechen behält den Sektor', () => {
    const onRefresh = vi.fn();
    renderManager([0, 0], onRefresh);
    fireEvent.click(screen.getByTestId('sector-row-s-2'));
    fireEvent.click(screen.getByTestId('sector-delete-btn'));
    expect(screen.getByTestId('confirm-dialog')).toHaveTextContent('Sektor 2');
    fireEvent.click(screen.getByTestId('confirm-cancel'));
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('Sektor mit aktiven Bouldern ist gesperrt und nennt die Anzahl', () => {
    renderManager([9]);
    fireEvent.click(screen.getByTestId('sector-row-s-1'));
    fireEvent.click(screen.getByTestId('sector-delete-btn'));
    const dialog = screen.getByTestId('confirm-dialog');
    expect(dialog).toHaveTextContent('9 Boulder');
    expect(within(dialog).queryByTestId('confirm-ok')).not.toBeInTheDocument();
  });
});

describe('AC-8 Team', () => {
  beforeEach(() => {
    createGym({ id: GYM, name: 'Testhalle' }, BORIS);
  });

  it('eine Zeile pro Person mit Rollen-Chips, keine IDs', () => {
    appointGymAdmin(GYM, 'admin-6aplus', BORIS);
    appointGymSetter(GYM, 'hans-kletterer', BORIS);
    render(<TeamManager gymId={GYM} userId={BORIS} />);
    const row = screen.getByTestId('team-row-admin-6aplus');
    expect(row).toHaveTextContent('Admin6APlus');
    expect(row).toHaveTextContent('Admin');
    expect(screen.getByTestId('team-row-hans-kletterer')).toHaveTextContent('Schrauber');
    expect(screen.getAllByTestId('team-row-admin-6aplus')).toHaveLength(1);
    expect(screen.queryByText('admin-6aplus')).not.toBeInTheDocument();
    expect(screen.queryByText(/Nutzer-ID/i)).not.toBeInTheDocument();
  });

  it('Person per Suche als Schrauber hinzufügen', () => {
    render(<TeamManager gymId={GYM} userId={BORIS} />);
    fireEvent.click(screen.getByTestId('add-team-member-btn'));
    fireEvent.change(screen.getByTestId('team-search-input'), { target: { value: 'hans' } });
    fireEvent.click(screen.getByTestId('team-candidate-hans-kletterer'));
    expect(screen.getByTestId('team-role-setter')).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByTestId('team-add-confirm'));
    expect(getGymTeamMembers(GYM).some(m => m.user_id === 'hans-kletterer' && m.role === 'setter')).toBe(true);
    expect(syncService.syncGymMemberToSupabase).toHaveBeenCalledWith(GYM, 'hans-kletterer', 'setter', BORIS);
    expect(screen.getByTestId('team-row-hans-kletterer')).toBeInTheDocument();
  });

  it('Rolle entziehen nur nach Rückfrage', async () => {
    appointGymSetter(GYM, 'hans-kletterer', BORIS);
    render(<TeamManager gymId={GYM} userId={BORIS} />);
    fireEvent.click(screen.getByTestId('team-row-hans-kletterer'));
    fireEvent.click(screen.getByTestId('team-revoke-setter'));
    expect(screen.getByTestId('confirm-dialog')).toHaveTextContent('Schrauber');
    expect(getGymTeamMembers(GYM).some(m => m.user_id === 'hans-kletterer')).toBe(true);
    fireEvent.click(screen.getByTestId('confirm-ok'));
    await waitFor(() => expect(screen.queryByTestId('team-row-hans-kletterer')).not.toBeInTheDocument());
    expect(getGymTeamMembers(GYM).some(m => m.user_id === 'hans-kletterer' && m.role === 'setter')).toBe(false);
  });
});

describe('AC-3 Hallen-Sheet', () => {
  it('wählt eine Halle und legt als Plattform-Admin eine neue an (nur Name + Stadt)', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const gyms = [{ id: 'gym-6a-plus', name: '6a plus' }, { id: 'gym-minimum-zh', name: 'Minimum' }] as any;
    render(
      <AdminGymSheet open onClose={onClose} gyms={gyms} activeGymId="gym-6a-plus" userId={BORIS} isPlatformAdmin onSelectGym={onSelect} />
    );
    expect(screen.getByTestId('admin-gym-row-gym-6a-plus')).toHaveAttribute('aria-current', 'true');
    fireEvent.click(screen.getByTestId('admin-gym-row-gym-minimum-zh'));
    expect(onSelect).toHaveBeenCalledWith('gym-minimum-zh');
    expect(onClose).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('admin-new-gym-btn'));
    expect(screen.getByTestId('new-gym-save')).toBeDisabled();
    fireEvent.change(screen.getByTestId('new-gym-name'), { target: { value: 'Kraftwerk' } });
    fireEvent.change(screen.getByTestId('new-gym-city'), { target: { value: 'Köln' } });
    fireEvent.click(screen.getByTestId('new-gym-save'));
    expect(onSelect).toHaveBeenLastCalledWith(expect.stringMatching(/.+/));
  });

  it('Hallen-Admins sehen keinen «Neue Halle»-Knopf', () => {
    render(
      <AdminGymSheet open onClose={vi.fn()} gyms={[{ id: 'gym-6a-plus', name: '6a' }] as any} activeGymId="gym-6a-plus" userId="admin-6aplus" isPlatformAdmin={false} onSelectGym={vi.fn()} />
    );
    expect(screen.queryByTestId('admin-new-gym-btn')).not.toBeInTheDocument();
  });
});

describe('AC-2/9/11 in der App', () => {
  it('Admin-Header: Hallenname + ein Knopf, Hallen-Sheet öffnet sich, keine verbotenen Texte', () => {
    render(<App />);
    expect(screen.queryByText(/Step 1/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Hallen-Administration/i }));

    expect(screen.getByTestId('admin-gym-button')).toBeInTheDocument();
    expect(screen.getByTestId('admin-switch-workspace-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-back-to-climber-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('admin-gym-select')).not.toBeInTheDocument();

    const text = document.body.textContent || '';
    for (const bad of ['SPEC-', 'Topo-Tafeln', 'Grade Scales', 'Gebietsführer', 'Nutzer-ID']) {
      expect(text).not.toContain(bad);
    }

    fireEvent.click(screen.getByTestId('admin-gym-button'));
    expect(screen.getByTestId('admin-gym-sheet')).toBeInTheDocument();
  }, 15000);
});
