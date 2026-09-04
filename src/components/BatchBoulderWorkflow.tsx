import React, { useState, useEffect } from 'react';
import {
  Gym,
  Sector,
  GymGradeScale,
  WallBoulder,
  GymMemberRole,
  RadarAttributes,
} from '../types/boulder';
import {
  getGyms,
  getSectors,
  getGradeScales,
  getWallBoulders,
  createDraftBoulder,
  updateBoulderPosition,
  updateBoulderDetails,
  deleteDraftBoulder,
  publishBatch,
  updateSectorPhoto,
  getLastSelectedGradeScaleId,
} from '../lib/batchBoulderService';
import { WallPhotoCanvas } from './WallPhotoCanvas';
import { BoulderBottomSheet } from './BoulderBottomSheet';
import { BatchSummaryModal } from './BatchSummaryModal';
import {
  Camera,
  Layers,
  Sparkles,
  Rocket,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface BatchBoulderWorkflowProps {
  currentRole: GymMemberRole;
  currentUserId?: string;
  onViewLiveSectors?: () => void;
}

export const BatchBoulderWorkflow: React.FC<BatchBoulderWorkflowProps> = ({
  currentRole,
  currentUserId = 'setter-1',
}) => {
  const [gym, setGym] = useState<Gym | null>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState<string>('');
  const [gradeScales, setGradeScales] = useState<GymGradeScale[]>([]);
  const [boulders, setBoulders] = useState<WallBoulder[]>([]);

  // Batch interaction state
  const [pendingArchiveIds, setPendingArchiveIds] = useState<string[]>([]);
  const [selectedBoulder, setSelectedBoulder] = useState<WallBoulder | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [hasPhotoUpdated, setHasPhotoUpdated] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Photo replacement modal
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [newPhotoUrlInput, setNewPhotoUrlInput] = useState<string>('');

  // Load gym & sector data
  useEffect(() => {
    const gyms = getGyms();
    if (gyms.length > 0) {
      const currentGym = gyms[0];
      setGym(currentGym);
      const gymSectors = getSectors(currentGym.id);
      setSectors(gymSectors);
      if (gymSectors.length > 0) {
        setSelectedSectorId(gymSectors[0].id);
      }
      const scales = getGradeScales(currentGym.id);
      setGradeScales(scales);
    }
  }, []);

  // Reload boulders when sector changes
  useEffect(() => {
    if (selectedSectorId) {
      setBoulders(getWallBoulders(selectedSectorId));
      setPendingArchiveIds([]);
      setSelectedBoulder(null);
      setIsSheetOpen(false);
      setHasPhotoUpdated(false);
    }
  }, [selectedSectorId]);

  const selectedSector = sectors.find(s => s.id === selectedSectorId) || null;

  // AC-1: Check permissions
  const isAuthorized = currentRole === 'setter' || currentRole === 'admin';

  // Wall photo click: Create a new draft boulder pin (AC-3, AC-4, AC-8)
  const handlePhotoClick = (x: number, y: number) => {
    if (!isAuthorized || !selectedSectorId) return;

    // AC-5: Retrieve last selected color as default
    const lastColorId = getLastSelectedGradeScaleId(gym?.id || 'gym-minimum-zh') || gradeScales[0]?.id;

    try {
      const newDraft = createDraftBoulder(
        {
          sectorId: selectedSectorId,
          gradeScaleId: lastColorId,
          positionX: x,
          positionY: y,
          setterId: currentUserId,
        },
        currentRole
      );

      setBoulders(prev => [...prev, newDraft]);
      setSelectedBoulder(newDraft);
      setIsSheetOpen(true);
    } catch (err: any) {
      alert(err.message || 'Fehler beim Erstellen des Boulders.');
    }
  };

  // Pin click: Open sheet to edit or archive
  const handlePinClick = (boulder: WallBoulder) => {
    setSelectedBoulder(boulder);
    setIsSheetOpen(true);
  };

  // Pin move (AC-7)
  const handlePinMove = (boulderId: string, newX: number, newY: number) => {
    updateBoulderPosition(boulderId, newX, newY);
    setBoulders(prev =>
      prev.map(b => (b.id === boulderId ? { ...b, positionX: newX, positionY: newY } : b))
    );
  };

  // Save changes from Bottom-Sheet (AC-4, AC-5)
  const handleSaveSheet = (data: {
    gradeScaleId: string;
    name?: string;
    notes?: string;
    radar: RadarAttributes;
  }) => {
    if (!selectedBoulder) return;

    updateBoulderDetails(selectedBoulder.id, data);
    setBoulders(prev =>
      prev.map(b => (b.id === selectedBoulder.id ? { ...b, ...data } : b))
    );
    setIsSheetOpen(false);
    setSelectedBoulder(null);
  };

  // Delete draft pin
  const handleDeleteDraft = (boulderId: string) => {
    deleteDraftBoulder(boulderId);
    setBoulders(prev => prev.filter(b => b.id !== boulderId));
    setIsSheetOpen(false);
    setSelectedBoulder(null);
  };

  // Toggle archive status of existing boulder (AC-6)
  const handleToggleArchive = (boulderId: string) => {
    setPendingArchiveIds(prev =>
      prev.includes(boulderId)
        ? prev.filter(id => id !== boulderId)
        : [...prev, boulderId]
    );
    setIsSheetOpen(false);
    setSelectedBoulder(null);
  };

  // Update Sector Wall Photo (AC-2)
  const handleSaveNewPhoto = () => {
    if (!selectedSectorId || !newPhotoUrlInput.trim()) return;
    try {
      const updated = updateSectorPhoto(selectedSectorId, newPhotoUrlInput);
      setSectors(prev => prev.map(s => (s.id === updated.id ? updated : s)));
      setHasPhotoUpdated(true);
      setIsPhotoModalOpen(false);
      setNewPhotoUrlInput('');
      showToast('Wandfoto erfolgreich aktualisiert!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Batch Publish Execution (AC-9)
  const handlePublishBatch = () => {
    if (!selectedSectorId) return;

    const result = publishBatch(selectedSectorId, currentUserId, pendingArchiveIds);

    // Refresh state
    setBoulders(getWallBoulders(selectedSectorId));
    setPendingArchiveIds([]);
    setIsSummaryOpen(false);

    showToast(
      `Erfolgreich veröffentlicht! +${result.publishedCount} neu aktiv, -${result.archivedCount} archiviert.`
    );
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  // Filter drafts and archives for current session
  const drafts = boulders.filter(b => b.status === 'draft');
  const markedForArchiveBoulders = boulders.filter(b => pendingArchiveIds.includes(b.id));

  // If unauthorized role (AC-1)
  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Zugriff nur für Schrauber & Admins</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Du bist aktuell als <strong>Kletterer (Member)</strong> eingeloggt.
          Der Batch-Foto-Workflow zur Routenerfassung ist Schraubern (Route Settern) und Hallen-Admins vorbehalten.
        </p>
        <p className="text-xs text-amber-400/90 font-medium">
          💡 Nutze oben rechts den Rollen-Simulator, um zur Rolle <strong>Schrauber</strong> zu wechseln.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Toast notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Sector Selection & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Batch-Schraubermodus
              </span>
              <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                {gym?.name}
              </span>
            </div>
            <h2 className="text-base font-bold text-white">
              Wand auswählen & Boulder erfassen
            </h2>
          </div>
        </div>

        {/* Sector Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {sectors.map(sector => {
            const isSelected = selectedSectorId === sector.id;
            return (
              <button
                key={sector.id}
                type="button"
                onClick={() => setSelectedSectorId(sector.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700/60'
                }`}
              >
                <span>{sector.name}</span>
              </button>
            );
          })}

          {/* Change Photo Button (AC-2) */}
          <button
            type="button"
            onClick={() => setIsPhotoModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition"
            title="Wandfoto aktualisieren (z.B. nach Neuschrauben)"
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Neues Foto</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      {selectedSector && (
        <WallPhotoCanvas
          photoUrl={selectedSector.wallPhotoUrl}
          boulders={boulders}
          gradeScales={gradeScales}
          pendingArchiveIds={pendingArchiveIds}
          selectedBoulderId={selectedBoulder?.id || null}
          onPhotoClick={handlePhotoClick}
          onPinClick={handlePinClick}
          onPinMove={handlePinMove}
          isAddingEnabled={true}
        />
      )}

      {/* Persistent Bottom Bar (Batch Status & Trigger) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 shadow-2xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                {drafts.length} neu
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold">
                {pendingArchiveIds.length} archiviert
              </span>
            </div>
            <p className="hidden md:block text-xs text-slate-400">
              Tippe ins Foto für nächsten Pin. Erst mit "Veröffentlichen" wird alles online gestellt.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSummaryOpen(true)}
            disabled={drafts.length === 0 && pendingArchiveIds.length === 0}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-400/25 flex items-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Rocket className="w-4 h-4" />
            <span>Zusammenfassung & Veröffentlichen ({drafts.length + pendingArchiveIds.length})</span>
          </button>
        </div>
      </div>

      {/* Bottom Sheet for Fast Pin Form */}
      <BoulderBottomSheet
        isOpen={isSheetOpen}
        boulder={selectedBoulder}
        gradeScales={gradeScales}
        defaultGradeScaleId={
          getLastSelectedGradeScaleId(gym?.id || 'gym-minimum-zh') || gradeScales[0]?.id
        }
        isMarkedForArchive={selectedBoulder ? pendingArchiveIds.includes(selectedBoulder.id) : false}
        onClose={() => {
          setIsSheetOpen(false);
          setSelectedBoulder(null);
        }}
        onSave={handleSaveSheet}
        onDeleteDraft={handleDeleteDraft}
        onToggleArchive={handleToggleArchive}
      />

      {/* Summary & Batch Publish Modal */}
      <BatchSummaryModal
        isOpen={isSummaryOpen}
        sector={selectedSector}
        draftBoulders={drafts}
        archivedBoulders={markedForArchiveBoulders}
        gradeScales={gradeScales}
        hasPhotoUpdated={hasPhotoUpdated}
        onClose={() => setIsSummaryOpen(false)}
        onConfirmPublish={handlePublishBatch}
      />

      {/* Update Sector Photo Dialog (AC-2) */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Neues Wandfoto für {selectedSector?.name}</h3>
            </div>
            <p className="text-xs text-slate-400">
              Gib eine neue Bild-URL ein oder wähle eines der Demo-Wandfotos. Bestehende relative Koordinaten aller Boulder bleiben exakt erhalten!
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Bild-URL eingeben:</label>
              <input
                type="text"
                value={newPhotoUrlInput}
                onChange={e => setNewPhotoUrlInput(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Quick Demo Photo Presets */}
            <div>
              <p className="text-[11px] font-semibold text-slate-400 mb-2">Oder Schnellauswahl Preset:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewPhotoUrlInput('https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1600&q=80')}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left text-xs text-slate-300"
                >
                  🧗 Neugeschraubt 45°
                </button>
                <button
                  type="button"
                  onClick={() => setNewPhotoUrlInput('https://images.unsplash.com/photo-1564769662533-4f00a87b4056?auto=format&fit=crop&w=1600&q=80')}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left text-xs text-slate-300"
                >
                  📐 Neue Wettkampf-Platte
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsPhotoModalOpen(false);
                  setNewPhotoUrlInput('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSaveNewPhoto}
                disabled={!newPhotoUrlInput.trim()}
                className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold hover:bg-amber-300 disabled:opacity-40"
              >
                Foto aktualisieren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
