import React, { useState, useEffect, useMemo } from 'react';
import { Boulder, CurrentUser, WallBoulder, LogbookEntry } from '../types/boulder';
import {
  getProfileData,
  updateProfile,
  deleteAccount,
} from '../lib/profileService';
import { getGyms, getWallBoulders, getSectors, getGradeScales } from '../lib/batchBoulderService';
import { getStoredBoulders } from '../lib/storage';
import { getRatings } from '../lib/ratingAndAscentService';
import { formatRelativeDate } from '../lib/formatUtils';
import { ProfileKPIsBar } from './ProfileKPIsBar';
import { GradeDistributionChart } from './GradeDistributionChart';
import { ProfileSettingsModal } from './ProfileSettingsModal';
import { BoulderDetailModal } from './BoulderDetailModal';
import { AthletePerformanceView } from './AthletePerformanceView';
import { LegacyLogbookView } from './LegacyLogbookView';
import { getAthletePerformanceReport } from '../lib/performanceService';
import { useBackHandler } from '../hooks/useBackHandler';
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
  Wrench,
  Star,
  BarChart3,
} from 'lucide-react';

interface UserProfileViewProps {
  currentUser: CurrentUser;
  boulders?: Boulder[];
  onDataChanged?: () => void;
  onProfileUpdated?: (newNickname: string, avatarUrl?: string) => void;
  onLogout?: () => void;
  onNavigateToWall?: () => void;
  onOpenRoleGateway?: () => void;
  initialSubTab?: 'overall' | 'deep_dive';
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUser,
  boulders,
  onDataChanged,
  onProfileUpdated,
  onLogout,
  onNavigateToWall,
  onOpenRoleGateway,
  initialSubTab = 'overall',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overall' | 'deep_dive'>(initialSubTab);
  const [localBoulders, setLocalBoulders] = useState<Boulder[]>(() => boulders || getStoredBoulders());
  const [selectedGymId, setSelectedGymId] = useState<string>('all');
  const [activeSegment, setActiveSegment] = useState<'overview' | 'performance'>('overview');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedBoulder, setSelectedBoulder] = useState<WallBoulder | null>(null);
  const [version, setVersion] = useState(0);

  // SPEC-015: Mobile-First Android Back-Button Handling in Profile
  useBackHandler({
    id: 'profile-settings-modal',
    isOpen: isSettingsOpen,
    onBack: () => setIsSettingsOpen(false),
  });

  useBackHandler({
    id: 'profile-boulder-detail-modal',
    isOpen: Boolean(selectedBoulder),
    onBack: () => setSelectedBoulder(null),
  });

  useBackHandler({
    id: 'profile-subtab-deep-dive',
    isOpen: activeSubTab === 'deep_dive',
    onBack: () => setActiveSubTab('overall'),
  });

  useBackHandler({
    id: 'profile-segment-performance',
    isOpen: activeSegment === 'performance' && activeSubTab === 'overall',
    onBack: () => setActiveSegment('overview'),
  });

  useEffect(() => {
    if (boulders) {
      setLocalBoulders(boulders);
    }
  }, [boulders]);

  useEffect(() => {
    const handleRoutesUpdated = () => {
      setLocalBoulders(getStoredBoulders());
      setVersion(v => v + 1);
    };
    window.addEventListener('bouldermate:climber_routes_updated', handleRoutesUpdated);
    return () => {
      window.removeEventListener('bouldermate:climber_routes_updated', handleRoutesUpdated);
    };
  }, []);

  const handleDataChanged = () => {
    setLocalBoulders(getStoredBoulders());
    setVersion(v => v + 1);
    onDataChanged?.();
  };

  const gyms = useMemo(() => getGyms(), []);
  const profileData = useMemo(
    () => getProfileData(currentUser.id, selectedGymId),
    [currentUser.id, selectedGymId, version]
  );
  const performanceReport = useMemo(
    () => getAthletePerformanceReport(currentUser.id, selectedGymId),
    [currentUser.id, selectedGymId, version]
  );
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

  const handleOpenBoulderById = (boulderId: string) => {
    const boulders = getWallBoulders();
    const found = boulders.find(b => b.id === boulderId);
    if (found) {
      setSelectedBoulder(found);
    }
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
        radar: {
          maximalkraft: 3,
          kraftausdauer: 3,
          technik: 3,
          balance: 3,
          koordination: 3,
          flexibilitaet: 3,
          kraft: 3,
        },
        fontGrade: entry.fontGrade,
        createdAt: entry.createdAt,
      };
      setSelectedBoulder(fallback);
    }
  };

  // Find sector and gradeScale for selected boulder if modal is open
  const allSectors = useMemo(() => {
    const gyms = getGyms();
    return gyms.flatMap(g => getSectors(g.id));
  }, []);
  const allScales = useMemo(() => {
    const gyms = getGyms();
    return gyms.flatMap(g => getGradeScales(g.id));
  }, []);
  const activeSector = selectedBoulder ? allSectors.find(s => s.id === selectedBoulder.sectorId) : undefined;
  const activeScale = selectedBoulder ? allScales.find(s => {
    if (s.id === selectedBoulder.gradeScaleId) return true;
    const colorAscii = (s.colorName || '').toLowerCase().trim() === 'weiß' ? 'weiss' : (s.colorName || '').toLowerCase().trim();
    return `scale_6a_${colorAscii}` === selectedBoulder.gradeScaleId || `scale_minimum_${colorAscii}` === selectedBoulder.gradeScaleId;
  }) : undefined;

  return (
    <div className="space-y-6 max-w-5xl mx-auto" data-testid="user-profile-view">
      {/* 1. Profile Header (AC-1) */}
      <div className="p-6 rounded-xl bg-[var(--bm-surface)] border border-[var(--bm-line)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar - SPEC-005: 0px square avatar */}
          <div className="w-16 h-16 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] flex items-center justify-center overflow-hidden shrink-0">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.nickname} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-mono font-bold text-[var(--bm-strong)]">
                {profile.nickname.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-headline font-bold text-[var(--bm-text)]" data-testid="profile-nickname">
                {profile.nickname}
              </h1>
              <span className="px-2 py-0.5 rounded-xl text-[10px] font-mono bg-[var(--bm-elevated)] border border-[var(--bm-line)] text-[var(--bm-accent)]">
                Meine Statistiken
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--bm-text-2)] mt-1">
              <Calendar className="w-3.5 h-3.5 text-[var(--bm-accent)]" />
              <span data-testid="profile-join-date">Mitglied seit {formattedJoinDate}</span>
            </div>
          </div>
        </div>

        {/* Action: Settings Gear Button (AC-1, AC-7) & Workspace Switch */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {onOpenRoleGateway && (
            <button
              type="button"
              onClick={onOpenRoleGateway}
              className="p-2.5 rounded-xl border border-[var(--bm-line)] bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] text-[var(--bm-text-2)] hover:text-[var(--bm-text)] transition flex items-center gap-1.5 text-xs font-mono"
              aria-label="Arbeitsbereich wechseln"
              data-testid="btn-profile-switch-workspace"
              title="Arbeitsbereich wählen (Schrauber-Studio / Admin)"
            >
              <Wrench className="w-4 h-4 text-[var(--bm-accent)]" />
              <span className="hidden sm:inline">Bereich wechseln</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-xl border border-[var(--bm-line)] bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] text-[var(--bm-text-2)] hover:text-[var(--bm-text)] transition flex items-center gap-2 text-xs font-mono"
            aria-label="Einstellungen"
            data-testid="btn-open-settings"
          >
            <Settings className="w-4 h-4 text-[var(--bm-accent)]" />
            <span className="hidden sm:inline">Einstellungen</span>
          </button>
        </div>
      </div>

      {/* Sub-Bereiche Umschalter: Overall Statistik vs. Deep Dive */}
      <div className="flex border-b border-[var(--bm-line)] bg-[var(--bm-surface)]">
        <button
          type="button"
          onClick={() => setActiveSubTab('overall')}
          className={`flex-1 py-3 px-4 text-xs font-headline font-bold transition-colors border-b-2 flex items-center justify-center gap-2 ${
            activeSubTab === 'overall'
              ? 'border-[var(--bm-accent)] text-[var(--bm-strong)] bg-[var(--bm-elevated)]'
              : 'border-transparent text-[var(--bm-text-2)] hover:text-[var(--bm-text)] hover:bg-[var(--bm-surface)]'
          }`}
          data-testid="subtab-overall"
        >
          <BarChart3 className="w-3.5 h-3.5 text-[var(--bm-accent)]" />
          <span>Overall Statistik</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('deep_dive')}
          className={`flex-1 py-3 px-4 text-xs font-headline font-bold transition-colors border-b-2 flex items-center justify-center gap-2 ${
            activeSubTab === 'deep_dive'
              ? 'border-[var(--bm-accent)] text-[var(--bm-strong)] bg-[var(--bm-elevated)]'
              : 'border-transparent text-[var(--bm-text-2)] hover:text-[var(--bm-text)] hover:bg-[var(--bm-surface)]'
          }`}
          data-testid="subtab-deep-dive"
        >
          <Compass className="w-3.5 h-3.5 text-[var(--bm-accent)]" />
          <span>Deep Dive</span>
        </button>
      </div>

      {/* Sub-Bereich Content */}
      {activeSubTab === 'overall' ? (
        <>
          {/* 2. Hallenfilter (AC-4) */}
      <div className="p-3.5 rounded-xl bg-[var(--bm-surface)] border border-[var(--bm-line)] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--bm-text-2)]">
          <MapPin className="w-4 h-4 text-[var(--bm-accent)]" />
          <span className="font-bold text-[var(--bm-text)]">Halle</span>
          <span className="hidden sm:inline text-[var(--bm-text-3)]">(Wirkt auf KPIs, Diagramm & Logbuch)</span>
        </div>

        <select
          value={selectedGymId}
          onChange={e => setSelectedGymId(e.target.value)}
          className="px-3.5 py-1.5 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-line)] text-xs font-mono font-bold text-[var(--bm-text)] focus:outline-none focus:border-[var(--bm-accent)] cursor-pointer"
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

      {/* 3. Segment Umschalter: Übersicht vs. Stil & Performance (SPEC-008 AC-1) */}
      <div className="flex border-b border-[var(--bm-line)] bg-[var(--bm-surface)]">
        <button
          type="button"
          onClick={() => setActiveSegment('overview')}
          className={`flex-1 py-3 px-4 text-xs font-headline font-bold transition-colors border-b-2 flex items-center justify-center gap-2 ${
            activeSegment === 'overview'
              ? 'border-[var(--bm-accent)] text-[var(--bm-strong)] bg-[var(--bm-elevated)]'
              : 'border-transparent text-[var(--bm-text-2)] hover:text-[var(--bm-text)] hover:bg-[var(--bm-surface)]'
          }`}
          data-testid="tab-segment-overview"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Übersicht & Logbuch</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSegment('performance')}
          className={`flex-1 py-3 px-4 text-xs font-headline font-bold transition-colors border-b-2 flex items-center justify-center gap-2 ${
            activeSegment === 'performance'
              ? 'border-[var(--bm-accent)] text-[var(--bm-strong)] bg-[var(--bm-elevated)]'
              : 'border-transparent text-[var(--bm-text-2)] hover:text-[var(--bm-text)] hover:bg-[var(--bm-surface)]'
          }`}
          data-testid="tab-segment-performance"
        >
          <Compass className="w-3.5 h-3.5 text-[var(--bm-accent)]" />
          <span>Stil & Performance</span>
          {performanceReport.isUnlocked && (
            <span className="w-2 h-2 rounded-full bg-[var(--bm-success)] inline-block ml-1" />
          )}
        </button>
      </div>

      {/* Content based on selected segment */}
      {activeSegment === 'overview' ? (
        <>
          {/* 4. KPI-Kacheln (AC-2) */}
          <ProfileKPIsBar kpis={kpis} />

          {/* 5. Grad-Verteilung (AC-3, AC-8) */}
          <GradeDistributionChart
            distribution={gradeDistribution}
            onNavigateToWall={onNavigateToWall}
          />

          {/* 6. Chronologisches Privates Logbuch (AC-5) */}
          <div className="p-5 sm:p-6 rounded-xl bg-[var(--bm-surface)] border border-[var(--bm-line)] space-y-4" data-testid="private-logbook-section">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-headline font-bold text-[var(--bm-text)] flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[var(--bm-accent)]" />
                  <span>Persönliches Logbuch ({logbook.length})</span>
                </h3>
                <p className="text-[11px] font-mono text-[var(--bm-text-2)]">
                  Chronologische Liste deiner Begehungen (nur für dich sichtbar)
                </p>
              </div>
              <span className="text-xs font-mono text-[var(--bm-text-3)]">
                Neueste zuerst
              </span>
            </div>

            {logbook.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-line)] text-xs font-mono text-[var(--bm-text-3)]" data-testid="empty-logbook">
                Noch keine Begehungen für diesen Filter vorhanden.
              </div>
            ) : (
              <div className="divide-y divide-[var(--bm-line)] rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-line)] overflow-hidden">
                {logbook.map(entry => {
                  const isFlash = entry.type === 'flash';
                  const isTop = entry.type === 'top';
                  const isProject = entry.type === 'project';
                  const bRatings = getRatings(entry.boulderId);
                  const avgStars = bRatings.length > 0
                    ? bRatings.reduce((acc, r) => acc + (r.qualityStars || 0), 0) / bRatings.length
                    : 0;

                  return (
                    <div
                      key={entry.id}
                      onClick={() => handleOpenLogbookBoulder(entry)}
                      className="p-3.5 sm:px-4 flex items-center justify-between hover:bg-[var(--bm-surface)] transition cursor-pointer group"
                      data-testid={`logbook-entry-${entry.id}`}
                      title="Tippen für Boulder-Detailansicht"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Grade Scale Color Badge - SPEC-005: 0px square badge */}
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center border border-black/40 shrink-0"
                          style={{ backgroundColor: entry.gradeScale.colorHex }}
                        >
                          <span className="text-xs font-mono font-bold text-black">
                            {entry.gradeScale.colorName?.[0] || 'B'}
                          </span>
                        </div>

                        {/* Route & Sector Info */}
                        <div className="min-w-0">
                          <div className="text-sm font-headline font-bold text-[var(--bm-text)] truncate group-hover:text-[var(--bm-accent)] transition flex items-center gap-2">
                            <span className="truncate">{entry.boulderName || `${entry.gradeScale.colorName}-Route`}</span>
                            {entry.fontGrade && (
                              <span className="px-1.5 py-0.5 rounded-xl text-[10px] font-mono font-bold bg-[var(--bm-elevated)] border border-[var(--bm-line)] text-[var(--bm-accent)] shrink-0" data-testid="logbook-font-grade">
                                Fb {entry.fontGrade}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--bm-text-2)] mt-0.5">
                            <span>{entry.gymName.split(' ')[0]}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Layers className="w-3 h-3 text-[var(--bm-accent)]" />
                              {entry.sectorName}
                            </span>
                            {avgStars > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-0.5 text-[var(--bm-accent)] font-bold" title={`Durchschnittliche Bewertung: ${avgStars.toFixed(1)} ★ (${bRatings.length} Wertungen)`}>
                                  <Star className="w-2.5 h-2.5 fill-[var(--bm-star)]" />
                                  <span>{avgStars.toFixed(1)}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        {/* Ascent Style Badge */}
                        <div>
                          {isFlash && (
                            <span className="px-2 py-0.5 rounded-xl text-[11px] font-mono font-bold bg-[var(--bm-elevated)] text-[var(--bm-accent)] border border-[var(--bm-accent)]/40 flex items-center gap-1">
                              <Zap className="w-3 h-3 fill-[var(--bm-star)] text-[var(--bm-accent)]" />
                              <span className="hidden xs:inline">Flash</span>
                            </span>
                          )}
                          {isTop && (
                            <span className="px-2 py-0.5 rounded-xl text-[11px] font-mono font-bold bg-[var(--bm-elevated)] text-[var(--bm-success)] border border-[var(--bm-success)]/50 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-[var(--bm-success)]" />
                              <span className="hidden xs:inline">Top</span>
                            </span>
                          )}
                          {isProject && (
                            <span className="px-2 py-0.5 rounded-xl text-[11px] font-mono font-bold bg-[var(--bm-elevated)] text-[var(--bm-text-2)] border border-[var(--bm-line)] flex items-center gap-1">
                              <Target className="w-3 h-3 text-[var(--bm-text-2)]" />
                              <span className="hidden xs:inline">Projekt</span>
                            </span>
                          )}
                        </div>

                        {/* Formatted Date */}
                        <div className="text-right">
                          <span className="text-[11px] font-mono text-[var(--bm-text-2)]">
                            {formatRelativeDate(entry.createdAt)}
                          </span>
                        </div>

                        <ChevronRight className="w-4 h-4 text-[var(--bm-text-3)] group-hover:text-[var(--bm-text)] transition" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <AthletePerformanceView
          report={performanceReport}
          onSelectBoulder={handleOpenBoulderById}
        />
      )}
    </>
  ) : (
    /* Sub-Bereich 2: Deep Dive Logbook */
    <LegacyLogbookView
      boulders={localBoulders}
      onDataChanged={handleDataChanged}
    />
  )}

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
