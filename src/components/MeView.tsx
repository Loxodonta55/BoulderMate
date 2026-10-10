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
import { MyProjectsSection, ForYouSection, WeeklySection, PerGymTable, VisibilityGroup } from './me/MeSections';
import { ChallengeCards } from './challenge/ChallengeCard';
import { GroupsSettings } from './me/GroupsSettings';
import { ImportRows, useImportedTicks } from './me/ImportTicks';
import { LanguageGroup } from './me/LanguageGroup';
import { t, getLang, useLang } from '../lib/i18n';
import { importedAsLogbook, mergePyramid } from '../lib/importService';
import { selectMyProjects, flashShare, recommendBoulders, buildLogbookCsv } from '../lib/meStats';
import { getUserAscent } from '../lib/ratingAndAscentService';
import { getBoulderNumber } from '../lib/boulderNumbers';
import { DEEP_DIVE_AXES, DeepDiveAxis, axisLabel } from '../lib/deepDiveService';

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

const typeIcon = (): Record<AscentType, React.ReactNode> => ({
  flash: <Zap className="w-4 h-4 text-[var(--bm-star)]" aria-label="Flash" />,
  top: <Check className="w-4 h-4 text-[var(--bm-success)]" aria-label="Top" />,
  project: <Target className="w-4 h-4 text-[var(--bm-text-2)]" aria-label={t('Projekt')} />,
});

const dateLocale = () => (getLang() === 'en' ? 'en-GB' : 'de-CH');

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return t('Heute');
  if (d.toDateString() === yesterday.toDateString()) return t('Gestern');
  return d.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' });
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
  useLang();

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

  const gymName = useMemo(() => getGyms().find(g => g.id === activeGymId)?.name || t('Diese Halle'), [activeGymId]);

  // SPEC-035 F1: Meine Projekte (nur Boulder, die noch hängen)
  const myProjects = useMemo(
    () => selectMyProjects(logbook, getWallBoulders()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [logbook, version]
  );
  const attemptsOf = (boulderId: string) => getUserAscent(currentUser.id, boulderId)?.attempts;

  // SPEC-037 F4: «Für dich» – offene Boulder der aktuellen Halle für die Baustelle
  const gymReport = useMemo(
    () => (scope === 'gym' ? report : getAthletePerformanceReport(currentUser.id, activeGymId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scope, report, currentUser.id, activeGymId, version]
  );
  const forYou = useMemo(() => {
    const axis = gymReport.isUnlocked ? (gymReport.weakness?.attribute as DeepDiveAxis | undefined) : undefined;
    if (!axis || !(DEEP_DIVE_AXES as string[]).includes(axis)) return { axis: undefined, items: [] };
    const sectors = getSectors(activeGymId);
    const sectorIds = new Set(sectors.map(sec => sec.id));
    const scales = getGradeScales(activeGymId);
    const boulders = getWallBoulders().filter(b => sectorIds.has(b.sectorId) && b.status === 'active');
    const myAscents = new Map(boulders.map(b => [b.id, getUserAscent(currentUser.id, b.id)]));
    const gymData = getProfileData(currentUser.id, activeGymId);
    const items = recommendBoulders({
      axis,
      boulders,
      scaleOf: b => scales.find(sc => sc.id === b.gradeScaleId),
      myAscents,
      bestGrade: gymData.kpis.bestTopFont || kpis.bestTopFont,
    });
    return { axis, items };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymReport, activeGymId, currentUser.id, version]);
  const sendCount = kpis.totalTops;
  const flashRate = sendCount > 0 ? Math.round((kpis.totalFlashes / sendCount) * 100) : 0;
  const bestGrade = kpis.bestTopFont || kpis.bestTop?.colorName || '–';

  // Grad-Pyramide: nur der Bereich, in dem tatsächlich etwas geklettert wurde
  // SPEC-043: importierte Ticks zählen nur in der Statistik «Alle Hallen»
  const importedTicks = useImportedTicks(currentUser.id);
  const shownImports = useMemo(() => (scope === 'all' ? importedTicks : []), [scope, importedTicks]);
  const statsLogbook = useMemo(
    () => (shownImports.length ? [...logbook, ...importedAsLogbook(shownImports)] : logbook),
    [logbook, shownImports]
  );
  const pyramid = useMemo(() => {
    // SPEC-022: nur Grade mit mindestens einem Top/Flash, schwerster oben
    return mergePyramid(gradeDistribution.filter(g => g.totalCount > 0).reverse(), shownImports);
  }, [gradeDistribution, shownImports]);
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
        { value: 'gym', label: gymName.length > 22 ? t('Diese Halle') : gymName },
        { value: 'all', label: t('Alle Hallen') },
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
      number={getBoulderNumber(selectedBoulder)}
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

  // SPEC-033 F6: Logbuch als Tabelle (CSV, Semikolon, BOM)
  const exportCsv = () => {
    const all = getProfileData(currentUser.id, 'all').logbook;
    const csv = buildLogbookCsv(all, e => ({
      number: getBoulderNumber({ id: e.boulderId, sectorId: e.sectorId }),
      attempts: getUserAscent(currentUser.id, e.boulderId)?.attempts,
    }));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bouldermate-logbuch-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveName = () => {
    const name = nameDraft.trim();
    if (!name || name === profile.nickname) return;
    updateProfile(currentUser.id, { nickname: name });
    onProfileUpdated?.(name);
    setVersion(v => v + 1);
    showToast({ message: t('Name gespeichert'), durationMs: 2000 });
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
            {t('Ich')}
          </button>
        </div>
        <h1 className="text-[28px] font-bold mb-5">{t('Einstellungen')}</h1>

        <div className="space-y-7">
          <ListGroup title={t('Profil')}>
            <div className="flex items-center gap-3 px-4 min-h-[52px]">
              <User className="w-5 h-5 text-[var(--bm-text-2)]" />
              <input
                aria-label={t('Name')}
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

          {/* SPEC-039: Sprache */}
          <LanguageGroup />

          {/* SPEC-033: Sichtbarkeit in «Wer war schon oben» */}
          <VisibilityGroup userId={currentUser.id} onChanged={() => setVersion(v => v + 1)} />

          <ListGroup title={t('Daten')}>
            <ListRow
              testId="settings-export-csv"
              icon={<Download className="w-5 h-5 text-[var(--bm-text-2)]" />}
              title={t('Als Tabelle (CSV)')}
              subtitle={t('Für Excel, Numbers, R, Python')}
              onClick={exportCsv}
            />
            <ListRow
              testId="settings-export"
              icon={<Download className="w-5 h-5 text-[var(--bm-text-2)]" />}
              title={t('Logbuch exportieren')}
              subtitle="JSON"
              onClick={exportData}
            />
            {/* SPEC-043 */}
            <ImportRows userId={currentUser.id} />
          </ListGroup>

          {/* SPEC-042: Trainings-Gruppen */}
          <GroupsSettings currentUser={currentUser} />

          {/* SPEC-028: Treff – Niveau, Ausblenden, Löschen, Meldungen */}
          <TreffSettingsGroup userId={currentUser.id} isPlatformAdmin={Boolean(roleInfo.isPlatformAdmin)} />

          {/* SPEC-026: Feedback an das App-Team */}
          <ListGroup title={t('Hilfe')}>
            <ListRow
              testId="settings-feedback"
              icon={<MessageSquareText className="w-5 h-5 text-[var(--bm-text-2)]" />}
              title={t('Feedback geben')}
              subtitle={t('Fehler, Ideen, Lob')}
              onClick={() => setIsFeedbackOpen(true)}
            />
          </ListGroup>

          <ListGroup>
            <ListRow
              testId="settings-logout"
              icon={<LogOut className="w-5 h-5 text-[var(--bm-text-2)]" />}
              title={t('Abmelden')}
              chevron={false}
              onClick={onLogout}
            />
            <ListRow
              testId="settings-delete-account"
              icon={<Trash2 className="w-5 h-5 text-[var(--bm-danger)]" />}
              title={t('Konto löschen')}
              destructive
              chevron={false}
              onClick={() => {
                if (window.confirm(t('Konto und alle Einträge endgültig löschen?'))) {
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
        <h1 className="text-[28px] font-bold">{t('Ich')}</h1>
        <button
          type="button"
          onClick={() => {
            setNameDraft(profile.nickname);
            setIsSettingsOpen(true);
          }}
          aria-label={t('Einstellungen')}
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
            {t('Dabei seit {date}', { date: new Date(profile.createdAt).toLocaleDateString(dateLocale(), { month: 'long', year: 'numeric' }) })}
          </p>
        </div>
      </div>

      {scopeControl}

      {/* Hero-Zahlen */}
      <div className="grid grid-cols-3 gap-2.5" data-testid="me-kpis">
        {[
          { label: t('Tops'), value: String(sendCount) },
          { label: t('Flash-Quote'), value: `${flashRate}%` },
          { label: t('Bester Grad'), value: bestGrade },
        ].map(k => (
          <div key={k.label} className="rounded-2xl bg-[var(--bm-surface)] p-3.5">
            <p className="text-[26px] font-semibold leading-tight tabular-nums truncate">{k.value}</p>
            <p className="text-[15px] text-[var(--bm-text-2)]">{k.label}</p>
          </div>
        ))}
      </div>

      {/* SPEC-037 F5: Pro Halle (nur «Alle Hallen») */}
      {scope === 'all' && <PerGymTable logbook={statsLogbook} />}

      {/* SPEC-038 F3: laufende Challenge der aktuellen Halle */}
      <ChallengeCards currentUser={currentUser} gymId={activeGymId} version={version} />

      {/* SPEC-035 F1: Meine Projekte */}
      <MyProjectsSection
        projects={myProjects}
        attemptsOf={attemptsOf}
        showGym={scope === 'all'}
        onOpen={openEntry}
      />

      {/* SPEC-037 F4: Für dich */}
      {forYou.axis && (
        <ForYouSection
          axisLabel={axisLabel(forYou.axis)}
          items={forYou.items}
          scaleOf={b => getGradeScales(activeGymId).find(sc => sc.id === b.gradeScaleId)}
          sectorName={b => getSectors(activeGymId).find(sec => sec.id === b.sectorId)?.name || ''}
          onOpen={b => setSelectedBoulder(b)}
        />
      )}

      {/* Grad-Pyramide */}
      <section className="space-y-2.5">
        <h2 className="text-[20px] font-semibold">{t('Grade')}</h2>
        <div className="rounded-2xl bg-[var(--bm-surface)] p-4" data-testid="grade-pyramid">
          {pyramid.length === 0 ? (
            <p className="text-[15px] text-[var(--bm-text-2)]">{t('Logge deinen ersten Top – hier entsteht deine Pyramide.')}</p>
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
                  {/* SPEC-037 F1: Anzahl und Flash-Anteil pro Grad */}
                  <span className="w-[86px] text-right text-[15px] tabular-nums shrink-0" data-testid={`pyramid-count-${item.fontGrade || item.gradeScale.id}`}>
                    <span className="font-semibold">{item.totalCount || ''}</span>
                    <span className="text-[var(--bm-text-2)]"> · {flashShare(item)} % ⚡</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {shownImports.length > 0 && (
            <p className="mt-3 text-[14px] text-[var(--bm-text-2)]" data-testid="pyramid-imported-note">
              {t('inkl. {n} importierte Ticks', { n: shownImports.length })}
            </p>
          )}
          {pyramid.length > 0 && (
            <div className="flex gap-4 mt-3 text-[14px] text-[var(--bm-text-2)]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--bm-star)]" />Flash</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--bm-accent)]" />Top</span>
            </div>
          )}
        </div>
      </section>

      {/* SPEC-037 F2: Verlauf 8 Wochen */}
      <WeeklySection logbook={statsLogbook} />

      {/* Stil (SPEC-020 AC-7.6): Radar + eine Zeile, Details auf Wunsch */}
      <section className="space-y-2.5">
        <h2 className="text-[20px] font-semibold">{t('Dein Stil')}</h2>
        {!report.isUnlocked ? (
          <div className="rounded-2xl bg-[var(--bm-surface)] p-4 space-y-2" data-testid="me-style-locked">
            <div className="h-2 rounded-full bg-[var(--bm-elevated)] overflow-hidden">
              <span
                className="block h-full bg-[var(--bm-accent)]"
                style={{ width: `${Math.min(100, Math.round((report.loggedAscentsCount / report.minRequiredAscents) * 100))}%` }}
              />
            </div>
            <p className="text-[15px] text-[var(--bm-text-2)]">
              {t('Noch {n} Tops bis zu deinem Stil-Profil', { n: Math.max(0, report.minRequiredAscents - report.loggedAscentsCount) })}
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
              {t('Weniger zeigen')}
            </button>
          </>
        ) : (
          <div className="rounded-2xl bg-[var(--bm-surface)] p-4" data-testid="me-style-summary">
            <div className="flex justify-center">
              <RadarChart data={report.userRadar} referenceData={report.gymRadar} size={220} showLabels accentColor="var(--bm-accent)" />
            </div>
            <p className="text-[15px] text-center mt-2">
              {[
                report.strength ? t('Stärke: {label}', { label: report.strength.attributeLabel }) : null,
                report.weakness ? t('Baustelle: {label}', { label: report.weakness.attributeLabel }) : null,
              ]
                .filter(Boolean)
                .join(' · ') || t('Ausgeglichen')}
            </p>
            <button
              type="button"
              onClick={() => setIsStyleExpanded(true)}
              className="w-full mt-2 min-h-[44px] text-[15px] font-medium text-[var(--bm-accent)]"
              data-testid="me-style-more"
            >
              {t('Mehr zum Stil')}
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
          subtitle={t('Was deine schwersten Routen verlangen')}
          onClick={() => setIsDeepDiveOpen(true)}
        />
      </ListGroup>

      {/* Verlauf */}
      <section className="space-y-2.5" data-testid="private-logbook-section">
        <h2 className="text-[20px] font-semibold">{t('Verlauf')}</h2>
        {grouped.length === 0 ? (
          <p className="text-[15px] text-[var(--bm-text-2)]">{t('Noch keine Einträge.')}</p>
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
                  value={typeIcon()[e.type]}
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
