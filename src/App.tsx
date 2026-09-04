import React, { useState, useEffect, useMemo } from 'react';
import { Boulder, BoulderInput, BoulderFilterOptions } from './types/boulder';
import {
  getStoredBoulders,
  createBoulder,
  updateBoulder,
  deleteBoulder,
  filterAndSortBoulders,
  computeStats
} from './lib/storage';
import { BoulderStatsBar } from './components/BoulderStatsBar';
import { BoulderFilter } from './components/BoulderFilter';
import { BoulderList } from './components/BoulderList';
import { BoulderForm } from './components/BoulderForm';
import { DataManagementModal } from './components/DataManagementModal';
import { BatchBoulderWorkflow } from './components/BatchBoulderWorkflow';
import { GymManagement } from './components/GymManagement';
import { ensureInitialGymData } from './lib/gymStorage';
import { GymMemberRole } from './types/boulder';
import { Mountain, Plus, Database, Sparkles, Wrench, Compass, UserCheck, Building2 } from 'lucide-react';

const SEED_DATA: BoulderInput[] = [
  {
    name: 'Rainbow Rocket',
    location: 'Fontainebleau',
    sector: 'Cuvier Rempart',
    date: '2026-09-02',
    gradeScale: 'font',
    grade: '8A',
    ascentStyle: 'top',
    attempts: 14,
    wallAngle: 'vertical',
    holdTypes: ['sloper', 'crimp'],
    perceivedDifficulty: 'fair',
    rating: 5,
    cruxDescription: 'Dynamischer Weitsprung von der Untergriff-Leiste auf die abgerundete Sloper-Kante. Volle Körperspannung beim Abfangen.',
    notes: 'Klassischer Weltklasse-Dyno. Perfektes Reibungswetter bei 12°C.',
    tags: ['dyno', 'highball', 'classic']
  },
  {
    name: 'Karma',
    location: 'Fontainebleau',
    sector: 'Cuvier Rempart',
    date: '2026-09-02',
    gradeScale: 'font',
    grade: '7A+',
    ascentStyle: 'flash',
    attempts: 1,
    wallAngle: 'vertical',
    holdTypes: ['sloper', 'pinch'],
    perceivedDifficulty: 'soft',
    rating: 5,
    cruxDescription: 'Präziser Schulterzug und anschließender Mantle.',
    notes: 'Flash gelungen dank perfekter Beta von Jonas!',
    tags: ['sloper', 'mantle']
  },
  {
    name: 'Dach-Projekt 42',
    location: 'Minimum Zürich',
    sector: 'Wettkampf-Dach',
    date: '2026-09-04',
    gradeScale: 'font',
    grade: '7C',
    ascentStyle: 'project',
    attempts: 7,
    wallAngle: 'roof',
    holdTypes: ['pinch', 'crimp', 'volume'],
    perceivedDifficulty: 'hard',
    rating: 4,
    cruxDescription: 'Toe-Hook halten während weitem Zug auf die linke Zange. Beim Hook-Release nicht von der Wand abreißen.',
    notes: 'Sequenz bis Zug 5 steht stabil. Nächstes Mal Ausstieg probieren.',
    tags: ['roof', 'toehook', 'project']
  }
];

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'gym_management' | 'batch_setter' | 'climber'>('gym_management');
  const [userRole, setUserRole] = useState<GymMemberRole>('setter');
  const [boulders, setBoulders] = useState<Boulder[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBoulder, setEditingBoulder] = useState<Boulder | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [filters, setFilters] = useState<BoulderFilterOptions>({
    searchQuery: '',
    ascentStyle: 'all',
    wallAngle: 'all',
    holdType: 'all',
    location: '',
    sortBy: 'date_desc'
  });

  // Load boulders & initial gym data on mount
  useEffect(() => {
    ensureInitialGymData();
    const loaded = getStoredBoulders();
    if (loaded.length === 0) {
      for (const item of SEED_DATA) {
        createBoulder(item);
      }
      setBoulders(getStoredBoulders());
    } else {
      setBoulders(loaded);
    }
  }, []);

  const refreshData = () => {
    setBoulders(getStoredBoulders());
  };

  const handleSaveBoulder = (data: BoulderInput) => {
    if (editingBoulder) {
      updateBoulder(editingBoulder.id, data);
    } else {
      createBoulder(data);
    }
    refreshData();
    setIsFormOpen(false);
    setEditingBoulder(null);
  };

  const handleEditBoulder = (boulder: Boulder) => {
    setEditingBoulder(boulder);
    setIsFormOpen(true);
  };

  const handleDeleteBoulder = (id: string) => {
    deleteBoulder(id);
    refreshData();
  };

  const availableLocations = useMemo(() => {
    const locSet = new Set<string>();
    boulders.forEach(b => {
      if (b.location) locSet.add(b.location);
    });
    return Array.from(locSet).sort();
  }, [boulders]);

  const filteredBoulders = useMemo(() => {
    return filterAndSortBoulders(boulders, filters);
  }, [boulders, filters]);

  const stats = useMemo(() => {
    return computeStats(boulders);
  }, [boulders]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
                <Mountain className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-tight text-white">BoulderApp</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    SPEC-002
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Batch-Foto-Boulder-Erfassung</p>
              </div>
            </div>
          </div>

          {/* Mode Switch & Role Simulator Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('gym_management')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  viewMode === 'gym_management'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Hallen & Sektoren (SPEC-001)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('batch_setter')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  viewMode === 'batch_setter'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Schrauber-Batch</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('climber')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  viewMode === 'climber'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Kletterer-Logbuch</span>
              </button>
            </div>

            {/* Role Simulator Pill (AC-1) */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 text-[10px] uppercase font-semibold">Rolle:</span>
              <select
                value={userRole}
                onChange={e => setUserRole(e.target.value as GymMemberRole)}
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer text-xs"
                title="Rolle für AC-1 Berechtigungstest wechseln"
              >
                <option value="setter" className="bg-slate-900 text-white">Schrauber (Setter)</option>
                <option value="admin" className="bg-slate-900 text-white">Hallen-Admin</option>
                <option value="member" className="bg-slate-900 text-white">Kletterer (Member)</option>
              </select>
            </div>

            {viewMode === 'climber' && (
              <>
                <button
                  onClick={() => setIsDataModalOpen(true)}
                  className="p-2 text-xs font-semibold text-slate-300 hover:text-slate-100 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition flex items-center gap-1.5"
                  title="Datenverwaltung / Backup"
                >
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Backup</span>
                </button>

                <button
                  onClick={() => {
                    setEditingBoulder(null);
                    setIsFormOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition shadow-md shadow-emerald-500/20 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Loggen</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {viewMode === 'gym_management' ? (
          /* Feature 1: Hallen- & Sektor-Verwaltung (SPEC-001) */
          <GymManagement />
        ) : viewMode === 'batch_setter' ? (
          /* Feature 2: Batch-Foto-Boulder-Erfassung */
          <BatchBoulderWorkflow currentRole={userRole} />
        ) : (
          /* Climber Logbuch & Dashboard */
          <div className="space-y-6">
            <BoulderStatsBar stats={stats} />

            {isFormOpen && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <div className="w-full max-w-2xl my-8">
                  <BoulderForm
                    initialData={editingBoulder}
                    onSave={handleSaveBoulder}
                    onCancel={() => {
                      setIsFormOpen(false);
                      setEditingBoulder(null);
                    }}
                  />
                </div>
              </div>
            )}

            <BoulderFilter
              filters={filters}
              onChange={setFilters}
              availableLocations={availableLocations}
            />

            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <span>Erfasste Routen</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
                    {filteredBoulders.length} von {boulders.length}
                  </span>
                </h2>
              </div>

              <BoulderList
                boulders={filteredBoulders}
                onEdit={handleEditBoulder}
                onDelete={handleDeleteBoulder}
              />
            </section>
          </div>
        )}
      </main>

      {/* Data Management Modal (Export/Import) */}
      {isDataModalOpen && (
        <DataManagementModal
          boulders={boulders}
          onImportComplete={refreshData}
          onClose={() => setIsDataModalOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>BoulderApp — Feature 2 (SPEC-002: Batch-Foto-Boulder-Erfassung) implementiert</span>
        </div>
      </footer>
    </div>
  );
};

export default App;

