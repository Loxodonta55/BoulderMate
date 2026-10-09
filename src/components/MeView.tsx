import React, { useEffect, useMemo, useState } from 'react';
import { Settings, Zap, Check, Target, ChevronLeft, Wrench, Building2, Download, LogOut, Trash2, User, Microscope, MessageSquareText } from 'lucide-react';
import { CurrentUser, WallBoulder, LogbookEntry, AscentType } from '../types/boulder';
import { getProfileData, updateProfile, deleteAccount } from '../lib/profileService';
import { getAthletePerformanceReport } from '../lib/performanceService';
import { getGyms, getWallBoulders, getSectors, getGradeScales } from '../lib/batchBoulderService';
import { UserRoleInfo, AppMode } from '../lib/roleService';
import { AthletePerformanceView } from './AthletePerformanceView';
import { RadarChart } from './RadarChart';
import { BoulderSheet } from './BoulderSheet';
import { DeepDiveView } from './DeepDiveView';
import { SegmentedControl, ListGroup, ListRow } from './ui/primitives';
import { showToast } from './ui/Toast';
import { useBackHandler } from '../hooks/useBackHandler';
import { FeedbackSheet } from './FeedbackSheet';
import { getCurrentAuthUser } from '../lib/authService';
import { TreffSettingsGroup } from './treff/TreffSettingsGroup';

/**
 * SPEC-020 §5.3/§5.4 · «Ich» – eine Seite ohne Sub-Tabs + Einstellungen (iOS-Settings-Stil).
 * Einziger Ort für Arbeitsbereich-Wechsel (Schrauber-Studio / Hallen-Admin), Konto & Daten.
 */
export interface MeViewProps {
  currentUser: CurrentUser;
  activeGymId: string;
  roleInfo: UserRoleInfo;
  onSwitchMode: (mode: AppMode) => void;
  onProfileUpdated?: (nickname: string, avatarUrl?: string) => void;
  onLogout: () => void;
}

const TYPE_ICON: Record<AscentType, React.ReactNode> = {
  flash: <Zap className="w-4 h-4 text-[var(--bm-star)]" aria-label="Flash" />,
  top: <Check className="w-4 h-4 text-[var(--bm-success)]" aria-label="Top" />,
  project: <Target className="w-4 h-4 text-[var(--bm-text-2)]" aria-label="Projekt" />,
};

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Heute';
  if (d.toDateString() === yesterday.toDateString()) return 'Gestern';
  return d.toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' });
}

export const MeView: React.FC<MeViewProps> = ({
  currentUser,
  activeGymId,
  roleInfo,
  onSwitchMode,
  onProfileUpdated,
  onLogout,
}) => {
  const [scope, setScope] = useState<'gym' | 'all'>('all');
  const [version, setVersion] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedBoulder, setSelectedBoulder] = useState<WallBoulder | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [isStyleExpanded, setIsStyleExpanded] = useState(false);
  const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useBackHandler({ id: 'me-settings', isOpen: isSettingsOpen, onBack: () => setIsSettingsOpen(false) });
  useBackHandler({ id: 'me-feedback', isOpen: isFeedbackOpen, onBack: () => setIsFeedbackOpen(false) });
  useBackHandler({ id: 'me-deep-dive', isOpen: isDeepDiveOpen, onBack: () => setIsDeepDiveOpen(false) });

  useEffect(() => {
    const bump = () => setVersion(v => v + 1);
    window.addEventListener('bouldermate:ascents_updated', bump);
    window.addEventListener('bouldermate:ratings_updated', bump);
    window.addEventListener('bouldermate:boulders_updated', bump);
    return () => {
      window.removeEventListener('bouldermate:ascents_updated', bump);
      window.removeEventListener('bouldermate:ratings_updated', bump);
      window.removeEventListener('bouldermate:boulders_updated', bump);
    };
  }, []);

  const gymFilter = scope === 'gym' ? activeGymId : 'all';
  const { profile, kpis, gradeDistribution, logbook } = useMemo(
    () => getProfileData(currentUser.id, gymFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser.id, gymFilter, version]
  );
  const report = useMemo(
    () => getAthletePerformanceReport(currentUser.id, gymFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser.id, gymFilter, version]
  );

  const gymName = useMemo(() => getGyms().find(g => g.id === activeGymId)?.name || 'Diese Halle', [activeGymId]);
  const sendCount = kpis.totalTops;
  const flashRate = sendCount > 0 ? Math.round((kpis.totalFlashes / sendCount) * 100) : 0;
  const bestGrade = kpis.bestTopFont || kpis.bestTop?.colorName || '–';

  // Grad-Pyramide: nur der Bereich, in dem tatsächlich etwas geklettert wurde
  const pyramid = useMemo(() => {
    // SPEC-022: nur Grade mit mindestens einem Top/Flash, schwerster oben
    return gradeDistribution.filter(g => g.totalCount > 0).reverse();
  }, [gradeDistribution]);
  const maxCount = Math.max(1, ...pyramid.map(p => p.totalCount));

  const grouped = useMemo(() => {
    const map = new Map<string, LogbookEntry[]>();
    for (const e of logbook) {
      const key = new Date(e.createdAt).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.values());
  }, [logbook]);

  // Ein Filter für «Ich» und Deep Dive (SPEC-004 Deep Dive v2)
  const scopeControl = (
    <SegmentedControl
      testId="me-scope"
      value={scope}
      onChange={setScope}
      options={[
        { value: 'gym', label: gymName.length > 22 ? 'Diese Halle' : gymName },
        { value: 'all', label: 'Alle Hallen' },
      ]}
    />
  );

  const openBoulderById = (id: string) => {
    const found = getWallBoulders().find(b => b.id === id);
    if (found) setSelectedBoulder(found);
  };

  const openEntry = (entry: LogbookEntry) => {
    const found = getWallBoulders().find(b => b.id === entry.boulderId);
    if (found) setSelectedBoulder(found);
  };

  const selectedSector = useMemo(() => {
    if (!selectedBoulder) return undefined;
    return getGyms().flatMap(g => getSectors(g.id)).find(s => s.id === selectedBoulder.sectorId);
  }, [selectedBoulder]);
  const selectedScale = useMemo(() => {
    if (!selectedBoulder) return undefined;
    return getGyms().flatMap(g => getGradeScales(g.id)).find(s => s.id === selectedBoulder.gradeScaleId);
  }, [selectedBoulder]);

  const boulderSheet = selectedBoulder && (
    <BoulderSheet
      boulder={selectedBoulder}
      sector={selectedSector}
      gradeScale={selectedScale}
      currentUser={currentUser}
      onClose={() => setSelectedBoulder(null)}
    />
  );

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ profile, logbook }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bouldermate-logbuch-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveName = () => {
    const name = nameDraft.trim();
    if (!name || name === profile.nickname) return;
    updateProfile(currentUser.id, { nickname: name });
    onProfileUpdated?.(name);
    setVersion(v => v + 1);
    showToast({ message: 'Name gespeichert', durationMs: 2000 });
  };

  // ---------------------------------------------------------------------------
  // Einstellungen (gepushter Screen)
  // ---------------------------------------------------------------------------
  if (isSettingsOpen) {
    return (
      <div className="max-w-xl mx-auto px-4 pb-8" data-testid="settings-view">
        <div className="h-12 flex items-center -ml-2">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="flex items-center text-[17px] text-[var(--bm-accent)] min-h-[44px] pr-3"
            data-testid="settings-back"
          >
            <ChevronLeft className="w-6 h-6" />
            Ich
          </button>
        </div>
        <h1 className="text-[28px] font-bold mb-5">Einstellungen</h1>

        <div className="space-y-7">
          <ListGroup title="Profil">
            <div className="flex items-center gap-3 px-4 min-h-[52px]">
              <User className="w-5 h-5 text-[var(--bm-text-2)]" />
              <input
                aria-label="Name"
                data-testid="settings-name-input"
                defaultValue={profile.nickname}
                onChange={e => setNameDraft(e.target.value)}
                onBlur={saveName}
                onKeyDown={e => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
                className="flex-1 bg-transparent text-[16px] outline-none min-h-[44px]"
              />
            </div>
          </ListGroup>

          {(roleInfo.canAccessSetterStudio || roleInfo.canAccessAdminConsole) && (
            <ListGroup title="Arbeitsbereich" footer={`Gilt für ${gymName}.`}>
              {roleInfo.canAccessSetterStudio && (
                <ListRow
                  testId="settings-open-studio"
                  icon={<span className="w-8 h-8 rounded-lg bg-[var(--bm-warning)] flex items-center justify-center"><Wrench className="w-4 h-4 text-white" /></span>}
                  title="Schrauber-Studio"
                  subtitle="Boulder erfassen & archivieren"
                  onClick={() => onSwitchMode('setter')}
                />
              )}
              {roleInfo.canAccessAdminConsole && (
                <ListRow
                  testId="settings-open-admin"
                  icon={<span className="w-8 h-8 rounded-lg bg-[var(--bm-accent)] flex items-center justify-center"><Building2 className="w-4 h-4 text-[var(--bm-on-accent)]" /></span>}
                  title="Hallen-Admin"
                  subtitle="Sektoren, Farben & Team"
                  onClick={() => onSwitchMode('admin')}
                />
              )}
            </ListGroup>
          )}

          <ListGroup title="Daten">
            <ListRow
              testId="settings-export"
              icon={<Download className="w-5 h-5 text-[var(--bm-text-2)]" />}
              title="Logbuch exportieren"
              onClick={exportData}
            />
          </ListGroup>

          {/* SPEC-028: Treff – Niveau, Ausblenden, Löschen, Meldungen */}
          <TreffSettingsGroup userId={currentUser.id} isPlatformAdmin={Boolean(roleInfo.isPlatformAdmin)} />

          {/* SPEC-026: Feedback an das App-Team */}
          <ListGroup title="Hilfe">
            <ListRow
              testId="settings-feedback"
              icon={<MessageSquareText className="w-5 h-5 text-[var(--bm-text-2)]" />}
              title="Feedback geben"
              subtitle="Fehler, Ideen, Lob"
              onClick={() => setIsFeedbackOpen(true)}
            />
          </ListGroup>

          <ListGroup>
            <ListRow
              testId="settings-logout"
              icon={<LogOut className="w-5 h-5 text-[var(--bm-text-2)]" />}
              title="Abmelden"
              chevron={false}
              onClick={onLogout}
            />
            <ListRow
              testId="settings-delete-account"
              icon={<Trash2 className="w-5 h-5 text-[var(--bm-danger)]" />}
              title="Konto löschen"
              destructive
              chevron={false}
              onClick={() => {
                if (window.confirm('Konto und alle Einträge endgültig löschen?')) {
                  deleteAccount(currentUser.id);
                  onLogout();
                }
              }}
            />
          </ListGroup>
        </div>
        <FeedbackSheet
          open={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          userId={currentUser.id}
          nickname={profile.nickname}
          email={getCurrentAuthUser()?.email}
          gymId={activeGymId}
          gymName={getGyms().find(g => g.id === activeGymId)?.name}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Deep Dive (gepushter Screen, gleicher Hallenfilter wie «Ich»)
  // ---------------------------------------------------------------------------
  if (isDeepDiveOpen) {
    return (
      <>
        <DeepDiveView
          userId={currentUser.id}
          gymId={gymFilter}
          version={version}
          filter={scopeControl}
          onBack={() => setIsDeepDiveOpen(false)}
          onSelectBoulder={openBoulderById}
        />
        {boulderSheet}
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Ich
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-xl mx-auto px-4 pb-8 space-y-7" data-testid="user-profile-view">
      <div className="flex items-center justify-between pt-3">
        <h1 className="text-[28px] font-bold">Ich</h1>
        <button
          type="button"
          onClick={() => {
            setNameDraft(profile.nickname);
            setIsSettingsOpen(true);
          }}
          aria-label="Einstellungen"
          data-testid="open-settings-btn"
          className="w-10 h-10 rounded-full bg-[var(--bm-surface)] flex items-center justify-center"
        >
          <Settings className="w-5 h-5 text-[var(--bm-text-2)]" />
        </button>
      </div>

      {/* Profil-Kopf */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[var(--bm-accent)] text-[var(--bm-on-accent)] flex items-center justify-center text-[26px] font-semibold overflow-hidden shrink-0">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            profile.nickname.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[20px] font-semibold truncate" data-testid="profile-nickname">{profile.nickname}</p>
          <p className="text-[14px] text-[var(--bm-text-2)]">
            Dabei seit {new Date(profile.createdAt).toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {scopeControl}

      {/* Hero-Zahlen */}
      <div className="grid grid-cols-3 gap-2.5" data-testid="me-kpis">
        {[
          { label: 'Tops', value: String(sendCount) },
          { label: 'Flash-Quote', value: `${flashRate}%` },
          { label: 'Bester Grad', value: bestGrade },
        ].map(k => (
          <div key={k.label} className="rounded-2xl bg-[var(--bm-surface)] p-3.5">
            <p className="text-[26px] font-semibold leading-tight tabular-nums truncate">{k.value}</p>
            <p className="text-[13px] text-[var(--bm-text-2)]">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Grad-Pyramide */}
      <section className="space-y-2.5">
        <h2 className="text-[20px] font-semibold">Grade</h2>
        <div className="rounded-2xl bg-[var(--bm-surface)] p-4" data-testid="grade-pyramid">
          {pyramid.length === 0 ? (
            <p className="text-[15px] text-[var(--bm-text-2)]">Logge deinen ersten Top – hier entsteht deine Pyramide.</p>
          ) : (
            <ul className="space-y-2">
              {pyramid.map(item => (
                <li key={item.fontGrade || item.gradeScale.id} className="flex items-center gap-3">
                  <span className="w-10 text-[14px] font-medium tabular-nums">{item.fontGrade || item.gradeScale.colorName}</span>
                  <div className="flex-1 h-5 rounded-md bg-[var(--bm-elevated)] overflow-hidden flex">
                    <span
                      className="h-full bg-[var(--bm-star)]"
                      style={{ width: `${(item.flashCount / maxCount) * 100}%` }}
                    />
                    <span
                      className="h-full bg-[var(--bm-accent)]"
                      style={{ width: `${(item.topCount / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-[14px] text-[var(--bm-text-2)] tabular-nums">{item.totalCount || ''}</span>
                </li>
              ))}
            </ul>
          )}
          {pyramid.length > 0 && (
            <div className="flex gap-4 mt-3 text-[12px] text-[var(--bm-text-2)]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--bm-star)]" />Flash</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--bm-accent)]" />Top</span>
            </div>
          )}
        </div>
      </section>

      {/* Stil (SPEC-020 AC-7.6): Radar + eine Zeile, Details auf Wunsch */}
      <section className="space-y-2.5">
        <h2 className="text-[20px] font-semibold">Dein Stil</h2>
        {!report.isUnlocked ? (
          <div className="rounded-2xl bg-[var(--bm-surface)] p-4 space-y-2" data-testid="me-style-locked">
            <div className="h-2 rounded-full bg-[var(--bm-elevated)] overflow-hidden">
              <span
                className="block h-full bg-[var(--bm-accent)]"
                style={{ width: `${Math.min(100, Math.round((report.loggedAscentsCount / report.minRequiredAscents) * 100))}%` }}
              />
            </div>
            <p className="text-[15px] text-[var(--bm-text-2)]">
              Noch {Math.max(0, report.minRequiredAscents - report.loggedAscentsCount)} Tops bis zu deinem Stil-Profil
            </p>
          </div>
        ) : isStyleExpanded ? (
          <>
            <AthletePerformanceView report={report} onSelectBoulder={openBoulderById} />
            <button
              type="button"
              onClick={() => setIsStyleExpanded(false)}
              className="w-full min-h-[44px] text-[15px] font-medium text-[var(--bm-accent)]"
              data-testid="me-style-less"
            >
              Weniger zeigen
            </button>
          </>
        ) : (
          <div className="rounded-2xl bg-[var(--bm-surface)] p-4" data-testid="me-style-summary">
            <div className="flex justify-center">
              <RadarChart data={report.userRadar} referenceData={report.gymRadar} size={220} showLabels accentColor="var(--bm-accent)" />
            </div>
            <p className="text-[15px] text-center mt-2">
              {[
                report.strength ? `Stärke: ${report.strength.attributeLabel}` : null,
                report.weakness ? `Baustelle: ${report.weakness.attributeLabel}` : null,
              ]
                .filter(Boolean)
                .join(' · ') || 'Ausgeglichen'}
            </p>
            <button
              type="button"
              onClick={() => setIsStyleExpanded(true)}
              className="w-full mt-2 min-h-[44px] text-[15px] font-medium text-[var(--bm-accent)]"
              data-testid="me-style-more"
            >
              Mehr zum Stil
            </button>
          </div>
        )}
      </section>

      {/* Deep Dive: schwerste Routen und was sie verlangen */}
      <ListGroup>
        <ListRow
          testId="me-open-deep-dive"
          icon={<Microscope className="w-5 h-5 text-[var(--bm-accent)]" />}
          title="Deep Dive"
          subtitle="Was deine schwersten Routen verlangen"
          onClick={() => setIsDeepDiveOpen(true)}
        />
      </ListGroup>

      {/* Verlauf */}
      <section className="space-y-2.5" data-testid="private-logbook-section">
        <h2 className="text-[20px] font-semibold">Verlauf</h2>
        {grouped.length === 0 ? (
          <p className="text-[15px] text-[var(--bm-text-2)]">Noch keine Einträge.</p>
        ) : (
          grouped.map(entries => (
            <ListGroup key={entries[0].createdAt} title={dayLabel(entries[0].createdAt)}>
              {entries.map(e => (
                <ListRow
                  key={e.id}
                  testId={`logbook-entry-${e.boulderId}`}
                  icon={<span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: e.gradeScale.colorHex }} />}
                  title={e.boulderName || e.gradeScale.colorName}
                  subtitle={[e.fontGrade, e.sectorName && !/unbekannt/i.test(e.sectorName) ? e.sectorName : null].filter(Boolean).join(' · ')}
                  value={TYPE_ICON[e.type]}
                  onClick={() => openEntry(e)}
                />
              ))}
            </ListGroup>
          ))
        )}
      </section>

      {boulderSheet}
    </div>
  );
};
