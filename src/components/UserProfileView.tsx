import React, { useState } from 'react';
import { CurrentUser, WallBoulder, LogbookEntry } from '../types/boulder';
import {
  getProfileData,
  updateProfile,
  deleteAccount,
} from '../lib/profileService';
import { getGyms, getWallBoulders, getSectors, getGradeScales } from '../lib/batchBoulderService';
import { ProfileKPIsBar } from './ProfileKPIsBar';
import { GradeDistributionChart } from './GradeDistributionChart';
import { ProfileSettingsModal } from './ProfileSettingsModal';
import { BoulderDetailModal } from './BoulderDetailModal';
import {
  Settings,
  Calendar,
  MapPin,
  Zap,
  CheckCircle2,
  Target,
  ChevronRight,
  Compass,
  Layers,
} from 'lucide-react';

interface UserProfileViewProps {
  currentUser: CurrentUser;
  onProfileUpdated?: (newNickname: string, avatarUrl?: string) => void;
  onLogout?: () => void;
  onNavigateToWall?: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUser,
  onProfileUpdated,
  onLogout,
  onNavigateToWall,
}) => {
  const [selectedGymId, setSelectedGymId] = useState<string>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedBoulder, setSelectedBoulder] = useState<WallBoulder | null>(null);
  const [, setVersion] = useState(0);

  const gyms = getGyms();
  const profileData = getProfileData(currentUser.id, selectedGymId);
  const { profile, kpis, gradeDistribution, logbook } = profileData;

  const formattedJoinDate = new Date(profile.createdAt).toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  });

  const handleSaveSettings = (updates: { nickname?: string; avatarUrl?: string }) => {
    updateProfile(currentUser.id, updates);
    if (updates.nickname) {
      onProfileUpdated?.(updates.nickname, updates.avatarUrl);
    }
    setVersion(v => v + 1);
  };

  const handleDeleteAccount = () => {
    deleteAccount(currentUser.id);
    onProfileUpdated?.('Kletterer');
    setVersion(v => v + 1);
  };

  const handleOpenLogbookBoulder = (entry: LogbookEntry) => {
    const boulders = getWallBoulders();
    const found = boulders.find(b => b.id === entry.boulderId);
    if (found) {
      setSelectedBoulder(found);
    } else {
      // Fallback virtual boulder if historical entry
      const fallback: WallBoulder = {
        id: entry.boulderId,
        sectorId: entry.sectorId,
        gradeScaleId: entry.gradeScale.id,
        positionX: 0.5,
        positionY: 0.5,
        name: entry.boulderName || `${entry.gradeScale.colorName} #${entry.boulderId.slice(-4)}`,
        setterId: 'setter-1',
        status: 'active',
        radar: { kraft: 3, technik: 3, balance: 3, koordination: 3, flexibilitaet: 3 },
        createdAt: entry.createdAt,
      };
      setSelectedBoulder(fallback);
    }
  };

  // Helper to format logbook timestamps human-friendly
  const formatLogbookDate = (isoString: string) => {
    const d = new Date(isoString);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isToday) return 'Heute';
    if (isYesterday) return 'Gestern';

    return d.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Find sector and gradeScale for selected boulder if modal is open
  const allSectors = getSectors('gym-minimum-zh');
  const allScales = getGradeScales('gym-minimum-zh');
  const activeSector = selectedBoulder ? allSectors.find(s => s.id === selectedBoulder.sectorId) : undefined;
  const activeScale = selectedBoulder ? allScales.find(s => s.id === selectedBoulder.gradeScaleId) : undefined;

  return (
    <div className="space-y-6 max-w-5xl mx-auto" data-testid="user-profile-view">
      {/* 1. Profile Header (AC-1) */}
      <div className="p-6 rounded-2xl bg-[#181614] border border-[#38332e] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-[#221f1c] border-2 border-[#d97706]/70 flex items-center justify-center overflow-hidden shadow-lg shrink-0">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.nickname} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-headline font-bold text-[#f59e0b]">
                {profile.nickname.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-headline uppercase tracking-wider text-[#f4efe6]" data-testid="profile-nickname">
                {profile.nickname}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#221f1c] border border-[#38332e] text-[#a89f91]">
                Mein Profil
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#a89f91] mt-1">
              <Calendar className="w-3.5 h-3.5 text-[#d97706]" />
              <span data-testid="profile-join-date">Mitglied seit {formattedJoinDate}</span>
            </div>
          </div>
        </div>

        {/* Action: Settings Gear Button (AC-1, AC-7) */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-xl border border-[#38332e] bg-[#141210] hover:bg-[#221f1c] text-[#a89f91] hover:text-[#f4efe6] transition flex items-center gap-2 text-xs font-mono"
            aria-label="Einstellungen"
            data-testid="btn-open-settings"
          >
            <Settings className="w-4 h-4 text-[#d97706]" />
            <span className="hidden sm:inline">Einstellungen</span>
          </button>
        </div>
      </div>

      {/* 2. Hallenfilter (AC-4) */}
      <div className="p-3.5 rounded-xl bg-[#141210] border border-[#2a2622] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-mono text-[#a89f91]">
          <MapPin className="w-4 h-4 text-[#d97706]" />
          <span className="font-bold text-[#d4cdc3]">Hallenfilter:</span>
          <span className="hidden sm:inline text-[#78716c]">(Wirkt auf KPIs, Diagramm & Logbuch)</span>
        </div>

        <select
          value={selectedGymId}
          onChange={e => setSelectedGymId(e.target.value)}
          className="px-3.5 py-1.5 rounded-xl bg-[#181614] border border-[#38332e] text-xs font-mono font-bold text-[#f4efe6] focus:outline-none focus:border-[#d97706] cursor-pointer shadow-sm"
          data-testid="select-gym-filter"
        >
          <option value="all">Alle Hallen (Gesamtüberblick)</option>
          {gyms.map(gym => (
            <option key={gym.id} value={gym.id}>
              {gym.name}
            </option>
          ))}
        </select>
      </div>

      {/* 3. KPI-Kacheln (AC-2) */}
      <ProfileKPIsBar kpis={kpis} />

      {/* 4. Grad-Verteilung (AC-3, AC-8) */}
      <GradeDistributionChart
        distribution={gradeDistribution}
        onNavigateToWall={onNavigateToWall}
      />

      {/* 5. Chronologisches Privates Logbuch (AC-5) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#181614] border border-[#38332e] shadow-sm space-y-4" data-testid="private-logbook-section">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-headline uppercase tracking-wider text-[#f4efe6] flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#d97706]" />
              <span>Persönliches Logbuch ({logbook.length})</span>
            </h3>
            <p className="text-[11px] font-mono text-[#a89f91]">
              Chronologische Liste deiner Begehungen (nur für dich sichtbar)
            </p>
          </div>
          <span className="text-xs font-mono text-[#78716c]">
            Neueste zuerst
          </span>
        </div>

        {logbook.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-xl bg-[#121110] border border-[#2a2622] text-xs font-mono text-[#78716c]" data-testid="empty-logbook">
            Noch keine Begehungen für diesen Filter vorhanden.
          </div>
        ) : (
          <div className="divide-y divide-[#2a2622] rounded-xl bg-[#121110] border border-[#2a2622] overflow-hidden">
            {logbook.map(entry => {
              const isFlash = entry.type === 'flash';
              const isTop = entry.type === 'top';
              const isProject = entry.type === 'project';

              return (
                <div
                  key={entry.id}
                  onClick={() => handleOpenLogbookBoulder(entry)}
                  className="p-3.5 sm:px-4 flex items-center justify-between hover:bg-[#181614] transition cursor-pointer group"
                  data-testid={`logbook-entry-${entry.id}`}
                  title="Tippen für Boulder-Detailansicht"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Grade Scale Color Badge */}
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center border border-black/40 shadow shrink-0"
                      style={{ backgroundColor: entry.gradeScale.colorHex }}
                    >
                      <span className="text-xs font-headline font-bold text-black drop-shadow-sm">
                        {entry.gradeScale.colorName?.[0] || 'B'}
                      </span>
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#f4efe6] group-hover:text-[#f59e0b] transition truncate">
                          {entry.boulderName || `${entry.gradeScale.colorName} #${entry.boulderId.slice(-4)}`}
                        </span>
                        <span className="text-[10px] font-mono text-[#78716c] hidden sm:inline">
                          ({entry.gradeScale.difficultyLabel})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-[#a89f91] mt-0.5 truncate">
                        <span>{entry.gymName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Layers className="w-3 h-3 text-[#d97706]" />
                          {entry.sectorName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    {/* Ascent Style Badge */}
                    <div>
                      {isFlash && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#221f1c] text-[#f59e0b] border border-[#d97706]/40 flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-[#f59e0b] text-[#f59e0b]" />
                          <span className="hidden xs:inline">Flash</span>
                        </span>
                      )}
                      {isTop && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#221f1c] text-emerald-400 border border-emerald-600/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="hidden xs:inline">Top</span>
                        </span>
                      )}
                      {isProject && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#221f1c] text-sky-400 border border-sky-600/40 flex items-center gap-1">
                          <Target className="w-3 h-3 text-sky-400" />
                          <span className="hidden xs:inline">Projekt</span>
                        </span>
                      )}
                    </div>

                    {/* Formatted Date */}
                    <div className="text-right">
                      <span className="text-[11px] font-mono text-[#a89f91]">
                        {formatLogbookDate(entry.createdAt)}
                      </span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-[#78716c] group-hover:text-[#f4efe6] transition" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settings Modal (AC-7) */}
      <ProfileSettingsModal
        profile={profile}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        onLogout={() => {
          setIsSettingsOpen(false);
          onLogout?.();
        }}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* Boulder Detail Modal on Logbook Tap (AC-5) */}
      {selectedBoulder && (
        <BoulderDetailModal
          boulder={selectedBoulder}
          sector={activeSector}
          gradeScale={activeScale}
          currentUser={currentUser}
          isOpen={!!selectedBoulder}
          onClose={() => setSelectedBoulder(null)}
          onDataChanged={() => setVersion(v => v + 1)}
        />
      )}
    </div>
  );
};
