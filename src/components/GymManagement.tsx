import React, { useEffect, useMemo, useState } from 'react';
import { Gym, Sector } from '../types/gym';
import { searchGymsWithSectors, getGradeScales, CURRENT_USER, isGymAdmin } from '../lib/gymStorage';
import { isPlatformAdmin } from '../lib/authService';
import { syncFromSupabase } from '../lib/syncService';
import { useBackHandler } from '../hooks/useBackHandler';
import { GradeScaleConfig } from './GradeScaleConfig';
import { SectorManager } from './SectorManager';
import { TeamManager } from './admin/TeamManager';
import { GymLocationEditor } from './GymLocationEditor';
import { GymTreffToggle } from './treff/GymTreffToggle';

/**
 * SPEC-023 · Admin-Konsole.
 * F1: Unter dem Header stehen direkt die Tabs Sektoren · Farben · Team · Halle (Standort aus SPEC-025 AC-8).
 * Die Halle wird nur im Header gewählt (AdminGymSheet), deshalb gibt es hier keine Hallen-Karten, keine Suche und kein Banner.
 */

export type AdminTab = 'sectors' | 'grades' | 'team' | 'gym';

interface GymManagementProps {
  activeGymId?: string;
  onSelectGym?: (gymId: string) => void;
  userId?: string;
}

type GymWithSectors = Gym & { sectors: Array<Sector & { active_boulder_count: number }> };

export const GymManagement: React.FC<GymManagementProps> = ({ activeGymId, onSelectGym, userId }) => {
  const effectiveUserId = userId || CURRENT_USER.id;
  const [gymsWithSectors, setGymsWithSectors] = useState<GymWithSectors[]>(() => searchGymsWithSectors(''));
  const [activeTab, setActiveTab] = useState<AdminTab>('sectors');

  // SPEC-015: Android-Zurück springt aus Farben/Team zurück zu Sektoren
  useBackHandler({
    id: `admin-tab-${activeTab}`,
    isOpen: activeTab !== 'sectors',
    onBack: () => setActiveTab('sectors'),
  });

  const refreshData = () => setGymsWithSectors(searchGymsWithSectors(''));

  // SPEC-019: Live-Updates aus Supabase und lokalem Cache
  useEffect(() => {
    const handleUpdate = () => refreshData();
    window.addEventListener('bouldermate:sectors_updated', handleUpdate);
    window.addEventListener('bouldermate:gyms_updated', handleUpdate);
    window.addEventListener('bouldermate:boulders_updated', handleUpdate);
    return () => {
      window.removeEventListener('bouldermate:sectors_updated', handleUpdate);
      window.removeEventListener('bouldermate:gyms_updated', handleUpdate);
      window.removeEventListener('bouldermate:boulders_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    syncFromSupabase()
      .then(synced => {
        if (synced) refreshData();
      })
      .catch(() => {});
  }, []);

  const platformAdmin = isPlatformAdmin(effectiveUserId);
  const manageableGyms = useMemo(
    () => gymsWithSectors.filter(g => platformAdmin || isGymAdmin(g.id, effectiveUserId)),
    [gymsWithSectors, platformAdmin, effectiveUserId]
  );

  const selectedGym =
    gymsWithSectors.find(g => g.id === activeGymId && (platformAdmin || isGymAdmin(g.id, effectiveUserId))) ||
    manageableGyms[0];

  // Ist im Header eine Halle aktiv, die man nicht verwaltet, auf die erste eigene wechseln
  useEffect(() => {
    if (selectedGym && selectedGym.id !== activeGymId) {
      onSelectGym?.(selectedGym.id);
    }
  }, [selectedGym?.id, activeGymId]);

  const gradeScales = useMemo(
    () => (selectedGym ? getGradeScales(selectedGym.id) : []),
    [selectedGym?.id, gymsWithSectors]
  );

  if (!selectedGym) {
    return (
      <div className="max-w-3xl mx-auto rounded-2xl bg-[var(--bm-surface)] px-4 py-10 text-center text-[15px] text-[var(--bm-text-2)]">
        Du verwaltest noch keine Halle.
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'sectors', label: 'Sektoren' },
    { id: 'grades', label: 'Farben' },
    { id: 'team', label: 'Team' },
    { id: 'gym', label: 'Halle' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <div
        role="tablist"
        data-testid="admin-tabs"
        className="flex p-0.5 rounded-[12px] bg-[var(--bm-elevated)]"
      >
        {tabs.map(t => {
          const active = t.id === activeTab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-testid={`admin-tab-${t.id}`}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 min-h-[40px] px-3 rounded-[10px] text-[15px] font-semibold transition ${
                active ? 'bg-[var(--bm-surface)] text-[var(--bm-text)] shadow-sm' : 'text-[var(--bm-text-2)]'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'sectors' && (
        <SectorManager
          gymId={selectedGym.id}
          userId={effectiveUserId}
          isAdmin={true}
          sectors={selectedGym.sectors}
          onRefresh={refreshData}
        />
      )}

      {activeTab === 'grades' && (
        <GradeScaleConfig
          gymId={selectedGym.id}
          userId={effectiveUserId}
          initialScales={gradeScales}
          onSaved={refreshData}
        />
      )}

      {activeTab === 'team' && <TeamManager gymId={selectedGym.id} userId={effectiveUserId} />}

      {activeTab === 'gym' && (
        <div className="space-y-4">
          <GymLocationEditor key={selectedGym.id} gymId={selectedGym.id} userId={effectiveUserId} onSaved={refreshData} />
          {/* SPEC-028 F16 */}
          <GymTreffToggle key={`treff-${selectedGym.id}`} gymId={selectedGym.id} userId={effectiveUserId} />
        </div>
      )}
    </div>
  );
};
