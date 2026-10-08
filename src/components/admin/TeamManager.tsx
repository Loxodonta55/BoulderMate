import React, { useEffect, useMemo, useState } from 'react';
import { getGymTeamMembers, appointGymSetter, appointGymAdmin, revokeGymSetter, revokeGymAdmin } from '../../lib/roleService';
import { getProfiles } from '../../lib/profileService';
import { syncGymMemberToSupabase, removeGymMemberFromSupabase } from '../../lib/syncService';
import { groupTeamByPerson, searchTeamCandidates, ROLE_LABEL, TeamPerson, TeamRole } from '../../lib/adminTeam';
import { Sheet } from '../ui/Sheet';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { showToast } from '../ui/Toast';
import { ChevronRight, Plus, Search } from 'lucide-react';

/**
 * SPEC-023 F6 · Team: eine Zeile pro Person mit Rollen-Chips.
 * Hinzufügen per Namenssuche, Entziehen mit Rückfrage. Keine IDs, keine Test-Personen.
 */

interface Props {
  gymId: string;
  userId: string;
}

const Avatar: React.FC<{ name: string; url?: string; size?: number }> = ({ name, url, size = 36 }) =>
  url ? (
    <img src={url} alt="" className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  ) : (
    <span
      className="rounded-full bg-[var(--bm-elevated)] text-[var(--bm-text)] font-semibold flex items-center justify-center shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {name.replace(/^user-/, '').charAt(0).toUpperCase()}
    </span>
  );

const RoleChip: React.FC<{ role: TeamRole }> = ({ role }) => (
  <span
    className={`px-2 py-0.5 rounded-full text-[12px] font-semibold ${
      role === 'admin' ? 'bg-[var(--bm-strong)] text-[var(--bm-bg)]' : 'bg-[var(--bm-elevated)] text-[var(--bm-text)]'
    }`}
  >
    {ROLE_LABEL[role]}
  </span>
);

export const TeamManager: React.FC<Props> = ({ gymId, userId }) => {
  const [version, setVersion] = useState(0);
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{ person: TeamPerson; role: TeamRole } | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<TeamRole>('setter');

  useEffect(() => {
    setOpenUserId(null);
  }, [gymId]);

  const profiles = useMemo(() => getProfiles(), [version, isAdding]);
  const team = useMemo(() => groupTeamByPerson(getGymTeamMembers(gymId), profiles), [gymId, version, profiles]);
  const candidates = useMemo(() => searchTeamCandidates(query, profiles), [query, profiles]);
  const openPerson = team.find(p => p.userId === openUserId) || null;
  const candidate = profiles.find(p => p.id === candidateId) || null;

  const refresh = () => setVersion(v => v + 1);

  const resetAdd = () => {
    setIsAdding(false);
    setQuery('');
    setCandidateId(null);
    setNewRole('setter');
  };

  const handleAdd = () => {
    if (!candidate) return;
    try {
      if (newRole === 'setter') appointGymSetter(gymId, candidate.id, userId);
      else appointGymAdmin(gymId, candidate.id, userId);
      syncGymMemberToSupabase(gymId, candidate.id, newRole, userId);
      showToast({ message: `${candidate.nickname} ist jetzt ${ROLE_LABEL[newRole]}`, durationMs: 2500 });
      resetAdd();
      refresh();
    } catch (e: any) {
      showToast({ message: e?.message || 'Rolle nicht vergeben.' });
    }
  };

  const handleRevoke = () => {
    if (!revokeTarget) return;
    const { person, role } = revokeTarget;
    setRevokeTarget(null);
    try {
      if (role === 'setter') revokeGymSetter(gymId, person.userId, userId);
      else revokeGymAdmin(gymId, person.userId, userId);
      removeGymMemberFromSupabase(gymId, person.userId, role);
      showToast({ message: `${person.name} ist nicht mehr ${ROLE_LABEL[role]}`, durationMs: 2500 });
      if (person.roles.length <= 1) setOpenUserId(null);
      refresh();
    } catch (e: any) {
      showToast({ message: e?.message || 'Rolle nicht entzogen.' });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          data-testid="add-team-member-btn"
          className="min-h-[40px] px-3.5 rounded-full text-[14px] font-semibold flex items-center gap-1.5 bg-[var(--bm-strong)] text-[var(--bm-bg)]"
        >
          <Plus className="w-4 h-4" /> Person
        </button>
      </div>

      {team.length === 0 ? (
        <div className="rounded-2xl bg-[var(--bm-surface)] px-4 py-8 text-center text-[15px] text-[var(--bm-text-2)]">
          Noch niemand im Team.
        </div>
      ) : (
        <ul className="rounded-2xl bg-[var(--bm-surface)] overflow-hidden divide-y divide-[var(--bm-line)]" data-testid="team-list">
          {team.map(person => (
            <li key={person.userId}>
              <button
                type="button"
                onClick={() => setOpenUserId(person.userId)}
                data-testid={`team-row-${person.userId}`}
                className="w-full text-left flex items-center gap-3 px-3 py-2 min-h-[56px] active:bg-[var(--bm-elevated)]"
              >
                <Avatar name={person.name} url={person.avatarUrl} />
                <span className="flex-1 min-w-0 text-[16px] text-[var(--bm-text)] truncate">{person.name}</span>
                <span className="flex items-center gap-1.5 shrink-0">
                  {person.roles.map(r => (
                    <RoleChip key={r} role={r} />
                  ))}
                </span>
                <ChevronRight className="w-4 h-4 text-[var(--bm-text-3)] shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Person: Rollen ansehen und entziehen */}
      <Sheet
        open={Boolean(openPerson) && !revokeTarget}
        onClose={() => setOpenUserId(null)}
        fitContent
        testId="team-member-sheet"
        ariaLabel={openPerson?.name}
      >
        {openPerson && (
          <div className="px-4 pb-2 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={openPerson.name} url={openPerson.avatarUrl} size={48} />
              <h2 className="text-[19px] font-semibold truncate">{openPerson.name}</h2>
            </div>
            <ul className="rounded-2xl bg-[var(--bm-bg)] overflow-hidden divide-y divide-[var(--bm-line)]">
              {openPerson.roles.map(role => (
                <li key={role} className="flex items-center justify-between gap-3 px-4 min-h-[52px]">
                  <span className="text-[16px]">{ROLE_LABEL[role]}</span>
                  <button
                    type="button"
                    onClick={() => setRevokeTarget({ person: openPerson, role })}
                    data-testid={`team-revoke-${role}`}
                    className="min-h-[40px] px-3 text-[15px] font-semibold text-[var(--bm-danger)]"
                  >
                    Entziehen
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Sheet>

      {/* Person hinzufügen */}
      <Sheet open={isAdding} onClose={resetAdd} fitContent testId="team-add-sheet" ariaLabel="Person hinzufügen">
        <div className="px-4 pb-2 space-y-4">
          <h2 className="text-[17px] font-semibold">Person hinzufügen</h2>
          <label className="relative block">
            <span className="sr-only">Name suchen</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--bm-text-3)]" />
            <input
              type="search"
              value={query}
              placeholder="Name suchen"
              onChange={(e) => {
                setQuery(e.target.value);
                setCandidateId(null);
              }}
              data-testid="team-search-input"
              className="w-full min-h-[44px] pl-9 pr-3 rounded-xl bg-[var(--bm-elevated)] text-[16px] text-[var(--bm-text)] placeholder-[var(--bm-text-3)] focus:outline-none focus:ring-2 focus:ring-[var(--bm-accent)]"
            />
          </label>

          {query.trim() && (
            candidates.length === 0 ? (
              <p className="text-[15px] text-[var(--bm-text-2)] px-1">Niemand gefunden.</p>
            ) : (
              <ul className="rounded-2xl bg-[var(--bm-bg)] overflow-hidden divide-y divide-[var(--bm-line)] max-h-[40dvh] overflow-y-auto">
                {candidates.map(p => {
                  const selected = p.id === candidateId;
                  const existing = team.find(t => t.userId === p.id);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setCandidateId(p.id)}
                        aria-pressed={selected}
                        data-testid={`team-candidate-${p.id}`}
                        className={`w-full text-left flex items-center gap-3 px-3 min-h-[52px] ${
                          selected ? 'bg-[var(--bm-elevated)]' : ''
                        }`}
                      >
                        <Avatar name={p.nickname} url={p.avatarUrl} size={32} />
                        <span className="flex-1 min-w-0 text-[16px] truncate">{p.nickname}</span>
                        {existing && existing.roles.map(r => <RoleChip key={r} role={r} />)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )
          )}

          <div className="flex p-0.5 rounded-[12px] bg-[var(--bm-elevated)]" role="radiogroup" aria-label="Rolle">
            {(['setter', 'admin'] as TeamRole[]).map(r => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={newRole === r}
                onClick={() => setNewRole(r)}
                data-testid={`team-role-${r}`}
                className={`flex-1 min-h-[40px] rounded-[10px] text-[15px] font-semibold ${
                  newRole === r ? 'bg-[var(--bm-surface)] text-[var(--bm-text)] shadow-sm' : 'text-[var(--bm-text-2)]'
                }`}
              >
                {ROLE_LABEL[r]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!candidate}
            data-testid="team-add-confirm"
            className="w-full min-h-[48px] rounded-xl bg-[var(--bm-strong)] text-[var(--bm-bg)] text-[16px] font-semibold disabled:opacity-30"
          >
            {candidate ? `${candidate.nickname} als ${ROLE_LABEL[newRole]} hinzufügen` : 'Hinzufügen'}
          </button>
        </div>
      </Sheet>

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        title={
          revokeTarget ? `${revokeTarget.person.name} die Rolle «${ROLE_LABEL[revokeTarget.role]}» entziehen?` : ''
        }
        message={
          revokeTarget?.role === 'admin'
            ? 'Die Person kann diese Halle dann nicht mehr verwalten.'
            : 'Die Person kann in dieser Halle dann keine Routen mehr setzen.'
        }
        confirmLabel="Entziehen"
        onConfirm={handleRevoke}
        onCancel={() => setRevokeTarget(null)}
      />
    </div>
  );
};
