import React, { useState, useEffect } from 'react';
import { Gym, Sector } from '../types/gym';
import {
  searchGymsWithSectors,
  createGym,
  getGradeScales,
  CURRENT_USER,
  isGymAdmin
} from '../lib/gymStorage';
import { isPlatformAdmin } from '../lib/authService';
import {
  getGymTeamMembers,
  appointGymSetter,
  revokeGymSetter,
  appointGymAdmin,
  revokeGymAdmin
} from '../lib/roleService';
import { GradeScaleConfig } from './GradeScaleConfig';
import { SectorManager } from './SectorManager';
import { getProfiles } from '../lib/profileService';
import { syncGymMemberToSupabase, removeGymMemberFromSupabase } from '../lib/syncService';
import { Building2, Search, Plus, MapPin, Globe, Shield, X, Users, UserCheck, Trash2, Compass } from 'lucide-react';

interface GymManagementProps {
  activeGymId?: string;
  onSelectGym?: (gymId: string) => void;
  userId?: string;
}

export const GymManagement: React.FC<GymManagementProps> = ({
  activeGymId,
  onSelectGym,
  userId,
}) => {
  const effectiveUserId = userId || CURRENT_USER.id;
  const [searchQuery, setSearchQuery] = useState('');
  const [gymsWithSectors, setGymsWithSectors] = useState<Array<Gym & { sectors: Array<Sector & { active_boulder_count: number }> }>>([]);
  const [selectedGymId, setSelectedGymId] = useState<string | null>(activeGymId || null);
  const [activeTab, setActiveTab] = useState<'sectors' | 'grading' | 'team'>('sectors');
  const [isCreatingGym, setIsCreatingGym] = useState(false);

  // New gym form state (Clean Code: Grouped form state)
  const initialGymFormState = {
    name: '',
    city: '',
    address: '',
    website: '',
    logo: '',
    initialAdminUserId: 'user-boris',
  };
  const [gymForm, setGymForm] = useState(initialGymFormState);
  const updateGymFormField = (field: keyof typeof initialGymFormState, value: string) => {
    setGymForm(prev => ({ ...prev, [field]: value }));
  };
  const [createError, setCreateError] = useState<string | null>(null);

  // Team management state
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'setter' | 'admin'>('setter');
  const [teamMessage, setTeamMessage] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);

  const refreshData = () => {
    const list = searchGymsWithSectors(searchQuery);
    setGymsWithSectors(list);
    if (!selectedGymId && list.length > 0) {
      const targetId = activeGymId && list.some(g => g.id === activeGymId) ? activeGymId : list[0].id;
      setSelectedGymId(targetId);
      onSelectGym?.(targetId);
    }
  };

  useEffect(() => {
    if (activeGymId && activeGymId !== selectedGymId) {
      setSelectedGymId(activeGymId);
    }
  }, [activeGymId]);

  useEffect(() => {
    refreshData();
  }, [searchQuery]);

  const handleSelectGym = (id: string) => {
    setSelectedGymId(id);
    onSelectGym?.(id);
  };

  const handleCreateGymSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateError(null);
      const created = createGym({
        name: gymForm.name,
        city: gymForm.city || undefined,
        address: gymForm.address || undefined,
        website: gymForm.website || undefined,
        logo_url: gymForm.logo || undefined,
        initial_admin_user_id: gymForm.initialAdminUserId || effectiveUserId
      }, effectiveUserId);
      setIsCreatingGym(false);
      setGymForm(initialGymFormState);
      setSelectedGymId(created.id);
      onSelectGym?.(created.id);
      refreshData();
    } catch (err: any) {
      setCreateError(err.message || 'Fehler beim Anlegen der Halle.');
    }
  };

  const refreshTeam = (gymId: string) => {
    try {
      const members = getGymTeamMembers(gymId);
      setTeamMembers(members);
    } catch (e) {
      setTeamMembers([]);
    }
  };

  useEffect(() => {
    if (selectedGymId) {
      refreshTeam(selectedGymId);
    }
  }, [selectedGymId, activeTab]);

  const handleAppointMember = () => {
    if (!selectedGymId || !newMemberUserId.trim()) return;
    try {
      setTeamError(null);
      setTeamMessage(null);

      const input = newMemberUserId.trim();
      const allProfiles = getProfiles();
      const matchedProfile = allProfiles.find(
        p => p.id === input || p.nickname.toLowerCase() === input.toLowerCase()
      );
      const resolvedUserId = matchedProfile ? matchedProfile.id : input;
      const displayNickname = matchedProfile ? matchedProfile.nickname : resolvedUserId;

      if (newMemberRole === 'setter') {
        appointGymSetter(selectedGymId, resolvedUserId, effectiveUserId);
        setTeamMessage(`${displayNickname} erfolgreich als Schrauber ernannt!`);
      } else {
        appointGymAdmin(selectedGymId, resolvedUserId, effectiveUserId);
        setTeamMessage(`${displayNickname} erfolgreich als Hallen-Admin ernannt!`);
      }

      // Asynchroner Remote-Sync nach Supabase gym_members
      syncGymMemberToSupabase(selectedGymId, resolvedUserId, newMemberRole, effectiveUserId);

      setNewMemberUserId('');
      refreshTeam(selectedGymId);
    } catch (e: any) {
      setTeamError(e.message || 'Fehler beim Ernennen des Mitglieds.');
    }
  };

  const handleRevokeMember = (targetUserId: string, role: string) => {
    if (!selectedGymId) return;
    try {
      setTeamError(null);
      setTeamMessage(null);
      if (role === 'setter') {
        revokeGymSetter(selectedGymId, targetUserId, effectiveUserId);
        setTeamMessage(`Schrauber-Rechte für ${targetUserId} entzogen.`);
      } else {
        revokeGymAdmin(selectedGymId, targetUserId, effectiveUserId);
        setTeamMessage(`Hallen-Admin-Rechte für ${targetUserId} entzogen.`);
      }

      // Asynchroner Remote-Delete in Supabase gym_members
      removeGymMemberFromSupabase(selectedGymId, targetUserId, role);

      refreshTeam(selectedGymId);
    } catch (e: any) {
      setTeamError(e.message || 'Fehler beim Entziehen der Rechte.');
    }
  };

  const selectedGym = gymsWithSectors.find(g => g.id === selectedGymId);
  const isPlatformSuperAdmin = isPlatformAdmin(effectiveUserId);
  const isAdmin = selectedGym ? (isGymAdmin(selectedGym.id, effectiveUserId) || isPlatformSuperAdmin) : false;
  const gradeScales = selectedGym ? getGradeScales(selectedGym.id) : [];

  return (
    <div className="space-y-6">
      {/* Top Bar: Search & Register */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#1E1E1E] border border-[#333333] rounded-none p-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6358]" />
          <input
            type="text"
            placeholder="Gebietsführer & Halle suchen (Name, Stadt)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#121212] border border-[#333333] rounded-none text-xs md:text-sm text-[#E8E0D4] placeholder-[#6B6358] focus:outline-none focus:border-[#C9A96E] font-sans"
          />
        </div>

        {/* Create Gym Action - SPEC-000: Nur für Plattform-Admins */}
        {isPlatformSuperAdmin ? (
          <button
            onClick={() => setIsCreatingGym(true)}
            className="w-full sm:w-auto px-4 py-2 bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] font-headline uppercase tracking-wider font-bold text-xs md:text-sm rounded-[2px] transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Halle registrieren</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-none bg-[#121212] border border-[#333333] text-[11px] text-[#6B6358] font-mono">
            <Shield className="w-3.5 h-3.5 text-[#6B6358] shrink-0" />
            <span>Hallenerstellung: Plattform-Admin erforderlich</span>
          </div>
        )}
      </div>

      {/* Gym Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {gymsWithSectors.map((gym) => {
          const isSelected = gym.id === selectedGymId;
          const userIsAdmin = isGymAdmin(gym.id, CURRENT_USER.id);
          const totalActiveBoulders = gym.sectors.reduce((acc, s) => acc + s.active_boulder_count, 0);

          return (
            <button
              key={gym.id}
              onClick={() => handleSelectGym(gym.id)}
              className={`p-4 rounded-none text-left border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#2A2A2A] border-[#F5F0E8]'
                  : 'bg-[#1E1E1E] border-[#333333] hover:border-[#8B8680]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-[#E8E0D4] font-headline uppercase tracking-wide">
                    {gym.name}
                  </h4>
                  {userIsAdmin && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-none text-[10px] font-bold bg-[#121212] text-[#C9A96E] border border-[#C9A96E]/40 font-mono uppercase">
                      <Shield className="w-2.5 h-2.5" /> Admin
                    </span>
                  )}
                </div>
                {gym.city && (
                  <div className="flex items-center gap-1 text-xs text-[#A89F91] mt-1 font-sans">
                    <MapPin className="w-3.5 h-3.5 text-[#C9A96E]" />
                    {gym.city} {gym.address ? `· ${gym.address}` : ''}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#6B6358] pt-3 mt-3 border-t border-[#333333] font-mono">
                <span>{gym.sectors.length} Sektoren</span>
                <span className="font-bold text-[#C9A96E]">{totalActiveBoulders} aktive Boulder</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Gym Detail Workspace */}
      {selectedGym ? (
        <div className="space-y-4">
          {/* Gym Header Banner */}
          <div className="bg-[#1E1E1E] border border-[#333333] rounded-none p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#E8E0D4] font-bold shrink-0">
                {selectedGym.logo_url ? (
                  <img src={selectedGym.logo_url} alt="" className="w-full h-full object-cover rounded-none" />
                ) : (
                  <Building2 className="w-6 h-6 text-[#C9A96E]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-[#E8E0D4] font-headline uppercase tracking-wide">
                    {selectedGym.name}
                  </h2>
                  {isAdmin && (
                    <span className="px-2 py-0.5 rounded-none text-[10px] font-bold bg-[#2A2A2A] text-[#C9A96E] border border-[#C9A96E]/40 font-mono uppercase">
                      Hallen-Administrator
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-[#A89F91] mt-1 flex-wrap font-sans">
                  {selectedGym.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#C9A96E]" />
                      {selectedGym.city} {selectedGym.address && `(${selectedGym.address})`}
                    </span>
                  )}
                  {selectedGym.website && (
                    <a
                      href={selectedGym.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[#C9A96E] hover:underline font-mono text-[11px]"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* View Tabs */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-auto">
              <div className="flex bg-[#121212] p-1 rounded-none border border-[#333333] text-xs font-headline uppercase tracking-wider">
                <button
                  onClick={() => setActiveTab('sectors')}
                  className={`px-3.5 py-1.5 rounded-[2px] font-bold transition-all ${
                    activeTab === 'sectors' ? 'bg-[#F5F0E8] text-[#121212]' : 'text-[#A89F91] hover:text-[#E8E0D4]'
                  }`}
                >
                  Sektoren ({selectedGym.sectors.length})
                </button>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => setActiveTab('grading')}
                      className={`px-3.5 py-1.5 rounded-[2px] font-bold transition-all ${
                        activeTab === 'grading' ? 'bg-[#F5F0E8] text-[#121212]' : 'text-[#A89F91] hover:text-[#E8E0D4]'
                      }`}
                    >
                      Farbsystem ({gradeScales.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('team')}
                      className={`px-3.5 py-1.5 rounded-[2px] font-bold transition-all ${
                        activeTab === 'team' ? 'bg-[#F5F0E8] text-[#121212]' : 'text-[#A89F91] hover:text-[#E8E0D4]'
                      }`}
                    >
                      Team & Schrauber
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Active Tab View */}
          {activeTab === 'sectors' && (
            <SectorManager
              gymId={selectedGym.id}
              userId={effectiveUserId}
              isAdmin={isAdmin}
              sectors={selectedGym.sectors}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'grading' && (
            <GradeScaleConfig
              gymId={selectedGym.id}
              userId={effectiveUserId}
              initialScales={gradeScales}
              onSaved={refreshData}
            />
          )}

          {activeTab === 'team' && (
            <div className="bg-[#1E1E1E] border border-[#333333] rounded-none p-5 space-y-6 font-sans">
              <div>
                <h3 className="text-base font-bold text-[#E8E0D4] font-headline uppercase tracking-wide flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#C9A96E]" />
                  Team- & Schrauber-Verwaltung
                </h3>
                <p className="text-xs text-[#A89F91] mt-1">
                  Schrauber-Rechte gelten ausschließlich für diese Halle ({selectedGym.name}). Als Hallen-Admin oder OverAdmin kannst du Kletterer zu Schraubern oder weiteren Admins ernennen.
                </p>
              </div>

              {teamMessage && (
                <div className="p-3 rounded-none bg-[#121212] border border-[#4A5D3A] text-[#4A5D3A] text-xs font-mono">
                  {teamMessage}
                </div>
              )}
              {teamError && (
                <div className="p-3 rounded-none bg-[#121212] border border-[#A0522D] text-[#A0522D] text-xs font-mono">
                  {teamError}
                </div>
              )}

              {/* Formular: Neues Team-Mitglied ernennen */}
              <div className="p-4 rounded-none bg-[#121212] border border-[#333333] space-y-3">
                <div className="text-xs font-bold text-[#C9A96E] uppercase font-headline tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>+ Team-Mitglied ernennen (SPEC-000)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    list="registered-climbers-datalist"
                    placeholder="Nutzer-ID oder Nickname (z. B. Alex oder admin-6aplus)"
                    value={newMemberUserId}
                    onChange={(e) => setNewMemberUserId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#333333] rounded-none text-xs text-[#E8E0D4] placeholder-[#6B6358] focus:outline-none focus:border-[#C9A96E] font-mono"
                  />
                  <datalist id="registered-climbers-datalist">
                    {getProfiles().map(p => (
                      <option key={p.id} value={p.nickname}>
                        {p.nickname} ({p.id.slice(0, 8)}...)
                      </option>
                    ))}
                  </datalist>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#333333] rounded-none text-xs text-[#E8E0D4] focus:outline-none focus:border-[#C9A96E] font-mono"
                  >
                    <option value="setter">Schrauber (Routenbau in dieser Halle)</option>
                    <option value="admin">Hallen-Admin (Volle Verwaltung)</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAppointMember}
                    className="px-4 py-2 bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] font-bold text-xs rounded-[2px] transition font-headline uppercase tracking-wider"
                  >
                    Rolle zuweisen
                  </button>
                </div>

                {/* Quick-Select Buttons for Fake Personas */}
                <div className="flex flex-wrap gap-1.5 items-center pt-1">
                  <span className="text-[10px] text-[#6B6358] font-mono">Schnellauswahl:</span>
                  {[
                    { id: 'admin-6aplus', label: 'Admin6APlus' },
                    { id: 'schrauber-6aplus', label: 'Schrauber6aPlus' },
                    { id: 'admin-minimum', label: 'AdminMinimum' },
                    { id: 'schrauber-minimum', label: 'Schrauber Minimum' },
                    { id: 'hans-kletterer', label: 'Hans' },
                    { id: 'user-boris', label: 'Boris' }
                  ].map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setNewMemberUserId(u.id)}
                      className="px-2 py-0.5 rounded-none text-[10px] font-mono bg-[#1E1E1E] hover:bg-[#2A2A2A] text-[#A89F91] hover:text-[#E8E0D4] border border-[#333333] transition"
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mitglieder-Liste */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-[#A89F91] uppercase tracking-wider">
                  Aktive Mitglieder dieser Halle ({teamMembers.length})
                </div>
                {teamMembers.length === 0 ? (
                  <div className="p-4 rounded-none bg-[#121212] border border-[#333333] text-xs text-[#6B6358] text-center font-mono">
                    Noch keine spezifischen Team-Mitglieder eingetragen.
                  </div>
                ) : (
                  <div className="divide-y divide-[#333333] rounded-none border border-[#333333] bg-[#121212] overflow-hidden">
                    {teamMembers.map((m) => {
                      const profile = getProfiles().find(p => p.id === m.user_id);
                      const displayName = profile?.nickname || m.user_id;

                      return (
                        <div key={m.id} className="p-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {/* Square avatar */}
                            {profile?.avatarUrl ? (
                              <img
                                src={profile.avatarUrl}
                                alt=""
                                className="w-8 h-8 rounded-none object-cover border border-[#333333]"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-xs font-mono font-bold text-[#E8E0D4]">
                                {displayName.replace(/^user-/, '').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-[#E8E0D4] font-mono">{displayName}</span>
                                <span
                                  className={`px-2 py-0.5 rounded-none text-[10px] font-bold uppercase font-mono border ${
                                    m.role === 'admin'
                                      ? 'bg-[#2A2A2A] text-[#C9A96E] border-[#C9A96E]/40'
                                      : 'bg-[#2A2A2A] text-[#A89F91] border-[#333333]'
                                  }`}
                                >
                                  {m.role === 'admin' ? 'Hallen-Admin' : 'Schrauber'}
                                </span>
                              </div>
                              <div className="text-[10px] text-[#6B6358] font-mono">
                                ID: {m.user_id.length > 20 ? `${m.user_id.slice(0, 13)}...` : m.user_id} • Ernannt: {new Date(m.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                        <button
                          type="button"
                          onClick={() => handleRevokeMember(m.user_id, m.role)}
                          className="text-[#6B6358] hover:text-[#A0522D] p-1.5 rounded-[2px] transition"
                          title="Rolle entziehen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-[#1E1E1E] rounded-none border border-[#333333] text-[#A89F91] space-y-2">
          <Building2 className="w-10 h-10 mx-auto text-[#6B6358]" />
          <div className="text-sm font-bold font-headline uppercase tracking-wider text-[#E8E0D4]">Keine Boulderhalle registriert</div>
          <div className="text-xs text-[#6B6358] font-sans">Registriere jetzt deine Halle, um Sektoren und Farbsysteme zu verwalten.</div>
        </div>
      )}

      {/* Modal: Neue Halle anlegen (AC-1) */}
      {isCreatingGym && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1E1E1E] border border-[#333333] rounded-none w-full max-w-lg overflow-hidden space-y-4">
            <div className="p-5 border-b border-[#333333] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#C9A96E]" />
                <h3 className="text-lg font-bold text-[#E8E0D4] font-headline uppercase tracking-wider">
                  Neue Boulderhalle registrieren
                </h3>
              </div>
              <button
                onClick={() => setIsCreatingGym(false)}
                className="p-1.5 text-[#6B6358] hover:text-[#E8E0D4] rounded-[2px]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mx-5 p-3 bg-[#121212] border border-[#A0522D] rounded-none text-[#A0522D] text-xs font-mono">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateGymSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#A89F91] font-headline uppercase tracking-wider mb-1">
                  Hallenname <span className="text-[#C9A96E]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Minimum Bouldern Zürich"
                  value={gymForm.name}
                  onChange={(e) => updateGymFormField('name', e.target.value)}
                  className="w-full bg-[#121212] border border-[#333333] rounded-none px-3 py-2 text-xs text-[#E8E0D4] focus:outline-none focus:border-[#C9A96E] font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#A89F91] font-headline uppercase tracking-wider mb-1">Stadt</label>
                  <input
                    type="text"
                    placeholder="z.B. Zürich"
                    value={gymForm.city}
                    onChange={(e) => updateGymFormField('city', e.target.value)}
                    className="w-full bg-[#121212] border border-[#333333] rounded-none px-3 py-2 text-xs text-[#E8E0D4] focus:outline-none focus:border-[#C9A96E] font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#A89F91] font-headline uppercase tracking-wider mb-1">Adresse</label>
                  <input
                    type="text"
                    placeholder="z.B. Flüelastrasse 31"
                    value={gymForm.address}
                    onChange={(e) => updateGymFormField('address', e.target.value)}
                    className="w-full bg-[#121212] border border-[#333333] rounded-none px-3 py-2 text-xs text-[#E8E0D4] focus:outline-none focus:border-[#C9A96E] font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#A89F91] font-headline uppercase tracking-wider mb-1">Website URL</label>
                <input
                  type="url"
                  placeholder="https://minimum.ch"
                  value={gymForm.website}
                  onChange={(e) => updateGymFormField('website', e.target.value)}
                  className="w-full bg-[#121212] border border-[#333333] rounded-none px-3 py-2 text-xs text-[#E8E0D4] focus:outline-none focus:border-[#C9A96E] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#A89F91] font-headline uppercase tracking-wider mb-1">Logo URL</label>
                <input
                  type="url"
                  placeholder="https://.../logo.png"
                  value={gymForm.logo}
                  onChange={(e) => updateGymFormField('logo', e.target.value)}
                  className="w-full bg-[#121212] border border-[#333333] rounded-none px-3 py-2 text-xs text-[#E8E0D4] focus:outline-none focus:border-[#C9A96E] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#A89F91] font-headline uppercase tracking-wider mb-1">
                  Initialer Hallen-Admin (SPEC-000)
                </label>
                <select
                  value={gymForm.initialAdminUserId}
                  onChange={(e) => updateGymFormField('initialAdminUserId', e.target.value)}
                  className="w-full bg-[#121212] border border-[#333333] rounded-none px-3 py-2 text-xs text-[#E8E0D4] focus:outline-none focus:border-[#C9A96E] font-mono"
                >
                  <option value="user-boris">Boris (OverAdmin)</option>
                  <option value="admin-6aplus">Admin6APlus (HallenAdmin fürs 6aPlus)</option>
                  <option value="admin-minimum">AdminMinimum (Hallenadmin im Minimum)</option>
                  <option value="schrauber-6aplus">Schrauber6aPlus</option>
                  <option value="schrauber-minimum">Schrauber Minimum</option>
                  <option value="hans-kletterer">HansDereinfacheKletterer</option>
                </select>
                <p className="text-[10px] text-[#6B6358] mt-1 font-mono">
                  Als OverAdmin legst du fest, wer sofort als Administrator dieser neuen Halle eingesetzt wird.
                </p>
              </div>

              <div className="text-[11px] text-[#A89F91] bg-[#121212] p-2.5 rounded-none border border-[#333333] flex items-center gap-2 font-mono">
                <Compass className="w-4 h-4 text-[#C9A96E] shrink-0" />
                <span>Als OverAdmin erhältst du automatisch Verwaltungsrechte für alle Hallen.</span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#333333]">
                <button
                  type="button"
                  onClick={() => setIsCreatingGym(false)}
                  className="px-4 py-2 bg-[#2A2A2A] text-[#A89F91] text-xs font-headline uppercase tracking-wider rounded-[2px] hover:bg-[#333333] border border-[#333333]"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] font-bold text-xs font-headline uppercase tracking-wider rounded-[2px]"
                >
                  Halle anlegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
