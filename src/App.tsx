import React, { useState, useEffect, useMemo } from 'react';
import { Boulder, BoulderInput, BoulderFilterOptions, GymMemberRole } from './types/boulder';
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
import { ClimberSectorView } from './components/ClimberSectorView';
import { Mountain, Plus, Database, Wrench, Compass, Layers, ArrowLeft, User } from 'lucide-react';

export const AVAILABLE_CLIMBERS: { id: string; nickname: string }[] = [
  { id: 'user-boris', nickname: 'Boris' },
  { id: 'climber-1', nickname: 'Alex' },
  { id: 'user-jonas', nickname: 'Jonas' },
  { id: 'user-lena', nickname: 'Lena' },
  { id: 'user-sophie', nickname: 'Sophie' },
];

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
  const [activeTab, setActiveTab] = useState<'wall' | 'logbook'>('wall');
  const [isSetterAreaOpen, setIsSetterAreaOpen] = useState(false);
  const [setterTab, setSetterTab] = useState<'batch_setter' | 'gym_management'>('batch_setter');
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

  const [climberId, setClimberId] = useState<string>('user-boris');
  const currentClimber = AVAILABLE_CLIMBERS.find(c => c.id === climberId) || AVAILABLE_CLIMBERS[0];

  const currentUser = useMemo(() => ({
    id: currentClimber.id,
    nickname: currentClimber.nickname,
    role: userRole
  }), [currentClimber, userRole]);

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
    <div className="min-h-screen bg-[#121110] text-[#f4efe6] flex flex-col font-sans rock-grain">
      {/* Sleek, Clean Navigation Header */}
      <header className="border-b border-[#2a2622] bg-[#161412]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d97706] to-[#92400e] flex items-center justify-center text-[#121110] shadow-sm">
              <Mountain className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-headline uppercase tracking-wider text-[#f4efe6]">BoulderApp</span>
                <span className="text-[10px] font-mono text-[#78716c] hidden sm:inline">• Minimum Zürich</span>
              </div>
            </div>
          </div>

          {/* Primary Focused Navigation (Kletterer-Fokus) */}
          <nav className="flex items-center p-1 rounded-xl bg-[#121110] border border-[#2a2622]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('wall');
                setIsSetterAreaOpen(false);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-headline uppercase tracking-wider flex items-center gap-1.5 transition ${
                !isSetterAreaOpen && activeTab === 'wall'
                  ? 'bg-[#2a2520] text-[#f59e0b] border border-[#d97706]/40 shadow-sm font-bold'
                  : 'text-[#a89f91] hover:text-[#f4efe6]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Wand & Sektoren</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('logbook');
                setIsSetterAreaOpen(false);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-headline uppercase tracking-wider flex items-center gap-1.5 transition ${
                !isSetterAreaOpen && activeTab === 'logbook'
                  ? 'bg-[#2a2520] text-[#f59e0b] border border-[#d97706]/40 shadow-sm font-bold'
                  : 'text-[#a89f91] hover:text-[#f4efe6]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Kletterer-Logbuch</span>
            </button>
          </nav>

          {/* Header Actions & Discreet Setter Area Toggle */}
          <div className="flex items-center gap-2">
            {!isSetterAreaOpen && (
              <>
                {/* Active Climber Switcher */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#121110] border border-[#2a2622] text-xs">
                  <User className="w-3.5 h-3.5 text-[#d97706]" />
                  <span className="text-[#78716c] text-[10px] uppercase font-mono hidden md:inline">Kletterer:</span>
                  <select
                    value={climberId}
                    onChange={e => setClimberId(e.target.value)}
                    className="bg-transparent text-[#f4efe6] font-mono font-bold focus:outline-none cursor-pointer text-xs"
                    title="Aktiven Kletterer wechseln für Multi-User-Bewertungen & Logbuch"
                  >
                    {AVAILABLE_CLIMBERS.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#181614] text-[#f4efe6]">
                        {c.nickname}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    setEditingBoulder(null);
                    setIsFormOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-headline uppercase font-bold tracking-wider bg-[#d97706] hover:bg-[#b45309] text-[#121110] rounded-lg transition shadow flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Loggen</span>
                </button>
              </>
            )}

            {/* Unprominent Setter/Admin Switch */}
            <button
              type="button"
              onClick={() => setIsSetterAreaOpen(!isSetterAreaOpen)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 border ${
                isSetterAreaOpen
                  ? 'bg-[#2a2520] text-[#f59e0b] border-[#d97706]/50 font-bold'
                  : 'bg-[#121110] text-[#78716c] hover:text-[#d4cdc3] border-[#2a2622]'
              }`}
              title="Schrauber- und Hallen-Adminbereich einblenden"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Schrauber</span>
            </button>
          </div>
        </div>
      </header>

      {/* Discreet Secondary Setter/Admin Bar (Only visible when toggled) */}
      {isSetterAreaOpen && (
        <div className="bg-[#181614] border-b border-[#2a2622] py-2 px-4 shadow-md animate-in slide-in-from-top-1 duration-150">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-[#d97706] uppercase tracking-widest flex items-center gap-1">
                <Wrench className="w-3 h-3" /> Schrauber-Modus:
              </span>
              <div className="flex items-center p-0.5 rounded-lg bg-[#121110] border border-[#2a2622]">
                <button
                  type="button"
                  onClick={() => setSetterTab('batch_setter')}
                  className={`px-3 py-1 rounded text-xs font-headline uppercase tracking-wider transition ${
                    setterTab === 'batch_setter'
                      ? 'bg-[#d97706] text-[#121110] font-bold shadow'
                      : 'text-[#a89f91] hover:text-[#f4efe6]'
                  }`}
                >
                  Schrauber-Batch
                </button>
                <button
                  type="button"
                  onClick={() => setSetterTab('gym_management')}
                  className={`px-3 py-1 rounded text-xs font-headline uppercase tracking-wider transition ${
                    setterTab === 'gym_management'
                      ? 'bg-[#d97706] text-[#121110] font-bold shadow'
                      : 'text-[#a89f91] hover:text-[#f4efe6]'
                  }`}
                >
                  Hallen & Sektoren (SPEC-001)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Role Simulator Pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#121110] border border-[#2a2622] text-xs">
                <span className="text-[#78716c] text-[10px] uppercase font-mono">Rolle:</span>
                <select
                  value={userRole}
                  onChange={e => setUserRole(e.target.value as GymMemberRole)}
                  className="bg-transparent text-[#f4efe6] font-mono font-bold focus:outline-none cursor-pointer text-xs"
                  title="Rolle für AC-1 Berechtigungstest wechseln"
                >
                  <option value="setter" className="bg-[#181614] text-[#f4efe6]">Schrauber (Setter)</option>
                  <option value="admin" className="bg-[#181614] text-[#f4efe6]">Hallen-Admin</option>
                  <option value="member" className="bg-[#181614] text-[#f4efe6]">Kletterer (Member)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsSetterAreaOpen(false)}
                className="text-[#a89f91] hover:text-[#f4efe6] font-mono text-[11px] flex items-center gap-1 transition"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Kletterer-Ansicht</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {isSetterAreaOpen ? (
          /* Schrauber- / Admin-Bereich */
          setterTab === 'gym_management' ? (
            <GymManagement />
          ) : (
            <BatchBoulderWorkflow currentRole={userRole} />
          )
        ) : activeTab === 'wall' ? (
          /* Feature 1: Wand & Sektoren (Kletterer-Wandansicht) */
          <ClimberSectorView currentUser={currentUser} />
        ) : (
          /* Feature 2: Persönliches Kletterer-Logbuch & Dashboard */
          <div className="space-y-6">
            <BoulderStatsBar stats={stats} />

            {isFormOpen && (
              <div className="fixed inset-0 z-50 bg-[#121110]/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
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
                <h2 className="text-base font-headline uppercase tracking-wider text-[#f4efe6] flex items-center gap-2">
                  <span>Erfasste Routen</span>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-[#221f1c] border border-[#38332e] text-[#a89f91]">
                    {filteredBoulders.length} von {boulders.length}
                  </span>
                </h2>

                <button
                  onClick={() => setIsDataModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-mono text-[#a89f91] hover:text-[#f4efe6] bg-[#1a1715] hover:bg-[#24201c] border border-[#2a2622] rounded-lg transition flex items-center gap-1.5"
                  title="Datenverwaltung / Backup"
                >
                  <Database className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>Backup</span>
                </button>
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

      {/* Clean, quiet Footer */}
      <footer className="border-t border-[#2a2622] bg-[#141210] py-5 text-center text-xs text-[#78716c] font-mono">
        <div className="flex items-center justify-center gap-1.5">
          <Mountain className="w-3.5 h-3.5 text-[#d97706]" />
          <span>BOULDERAPP // SPEC-003: DETAILANSICHT, BEWERTUNGEN & LOGGING AKTIV</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
