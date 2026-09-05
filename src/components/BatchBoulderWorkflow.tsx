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
import { WallPhotoUploadModal } from './WallPhotoUploadModal';
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
  const handlePhotoSelected = (photoUrl: string) => {
    if (!selectedSectorId || !photoUrl.trim()) return;
    try {
      const updated = updateSectorPhoto(selectedSectorId, photoUrl);
      setSectors(prev => prev.map(s => (s.id === updated.id ? updated : s)));
      setHasPhotoUpdated(true);
      setIsPhotoModalOpen(false);
      showToast('Wandfoto erfolgreich aktualisiert!');
    } catch (err: any) {
      alert(err.message || 'Fehler beim Aktualisieren des Wandfotos.');
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
      <div className="topo-plate p-8 max-w-xl mx-auto my-12 text-center rounded-2xl space-y-4 border border-[#38332e]">
        <div className="w-12 h-12 rounded-full bg-red-950/40 text-red-400 border border-red-800/60 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-headline uppercase tracking-wider text-[#f4efe6]">Zugriff nur für Schrauber & Admins</h2>
        <p className="text-xs font-mono text-[#a89f91] leading-relaxed">
          Du bist aktuell als <strong>Kletterer (Member)</strong> eingeloggt.
          Der Batch-Foto-Workflow zur Routenerfassung ist Schraubern (Route Settern) und Hallen-Admins vorbehalten.
        </p>
        <p className="text-xs font-mono text-[#d97706] font-medium">
          💡 Nutze oben rechts den Rollen-Simulator, um zur Rolle <strong>Schrauber</strong> zu wechseln.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Toast notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-[#181614] border border-[#d97706] text-[#f4efe6] font-mono text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#d97706]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Sector Selection & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#181614] p-4 rounded-2xl border border-[#38332e] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#221f1c] text-[#d97706] border border-[#38332e]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-[#d97706] uppercase tracking-widest">
                Batch-Schraubermodus
              </span>
              <span className="bg-[#221f1c] text-[#a89f91] text-[10px] font-mono px-2 py-0.5 rounded border border-[#38332e]">
                {gym?.name}
              </span>
            </div>
            <h2 className="text-lg font-headline uppercase tracking-wider text-[#f4efe6]">
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-headline uppercase tracking-wider transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#d97706] text-[#121110] font-bold shadow'
                    : 'bg-[#221f1c] text-[#a89f91] hover:text-[#f4efe6] border border-[#38332e]'
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
            className="px-3.5 py-1.5 rounded-xl bg-[#221f1c] hover:bg-[#2a2622] text-[#d4cdc3] hover:text-[#f4efe6] text-xs font-mono border border-[#38332e] hover:border-[#d97706] flex items-center gap-1.5 transition"
            title="Wandfoto aktualisieren (z.B. nach Neuschrauben)"
          >
            <Camera className="w-3.5 h-3.5 text-[#d97706]" />
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
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-[#181614]/95 backdrop-blur-xl border-t border-[#38332e] shadow-2xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#221f1c] border border-emerald-600/40 text-emerald-400 text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {drafts.length} neu
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#221f1c] border border-red-800/40 text-red-400 text-xs font-mono font-bold">
                {pendingArchiveIds.length} archiviert
              </span>
            </div>
            <p className="hidden md:block text-xs font-mono text-[#a89f91]">
              Tippe ins Foto für nächsten Pin. Erst mit "Veröffentlichen" wird alles online gestellt.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSummaryOpen(true)}
            disabled={drafts.length === 0 && pendingArchiveIds.length === 0}
            className="px-5 py-2.5 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-[#121110] font-headline uppercase font-bold tracking-wider text-xs shadow-lg flex items-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
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

      {/* Update Sector Photo Dialog with File Upload & Presets (AC-2) */}
      <WallPhotoUploadModal
        isOpen={isPhotoModalOpen}
        sectorName={selectedSector?.name || ''}
        currentPhotoUrl={selectedSector?.wallPhotoUrl}
        onClose={() => setIsPhotoModalOpen(false)}
        onPhotoSelected={handlePhotoSelected}
      />
    </div>
  );
};
