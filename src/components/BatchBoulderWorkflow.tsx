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
  Building2
} from 'lucide-react';

interface BatchBoulderWorkflowProps {
  currentRole: GymMemberRole;
  currentUserId?: string;
  onViewLiveSectors?: () => void;
  activeGymId?: string;
  onSelectGym?: (gymId: string) => void;
}

export const BatchBoulderWorkflow: React.FC<BatchBoulderWorkflowProps> = ({
  currentRole,
  currentUserId = 'setter-1',
  activeGymId,
  onSelectGym,
}) => {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [gym, setGym] = useState<Gym | null>(null);
  const [selectedGymId, setSelectedGymId] = useState<string>(activeGymId || '');
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

  const loadGymData = (gymIdToLoad: string, allGymsList: Gym[]) => {
    const currentGym = allGymsList.find(g => g.id === gymIdToLoad) || allGymsList[0] || null;
    setGym(currentGym);
    if (currentGym) {
      setSelectedGymId(currentGym.id);
      const gymSectors = getSectors(currentGym.id);
      setSectors(gymSectors);
      if (gymSectors.length > 0) {
        setSelectedSectorId(gymSectors[0].id);
      } else {
        setSelectedSectorId('');
      }
      const scales = getGradeScales(currentGym.id);
      setGradeScales(scales);
    }
  };

  // Load gym & sector data
  useEffect(() => {
    const all = getGyms();
    setGyms(all);
    if (all.length > 0) {
      const targetId = activeGymId && all.some(g => g.id === activeGymId)
        ? activeGymId
        : (selectedGymId && all.some(g => g.id === selectedGymId) ? selectedGymId : all[0].id);
      loadGymData(targetId, all);
    }
  }, [activeGymId]);

  const handleGymChange = (newGymId: string) => {
    setSelectedGymId(newGymId);
    onSelectGym?.(newGymId);
    loadGymData(newGymId, gyms);
  };

  // Reload boulders when sector changes
  useEffect(() => {
    if (selectedSectorId) {
      setBoulders(getWallBoulders(selectedSectorId));
      setPendingArchiveIds([]);
      setSelectedBoulder(null);
      setIsSheetOpen(false);
      setHasPhotoUpdated(false);
    } else {
      setBoulders([]);
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
      <div className="p-8 max-w-xl mx-auto my-12 text-center rounded-none space-y-4 bg-[#1E1E1E] border border-[#333333]">
        <div className="w-12 h-12 rounded-none bg-[#A0522D]/20 text-[#A0522D] border border-[#A0522D]/40 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">Zugriff nur für Schrauber & Admins</h2>
        <p className="text-xs font-sans text-[#A89F91] leading-relaxed">
          Du bist aktuell als <strong>Kletterer (Member)</strong> eingeloggt.
          Der Batch-Foto-Workflow zur Routenerfassung ist Schraubern (Route Settern) und Hallen-Admins vorbehalten.
        </p>
        <p className="text-xs font-mono text-[#C9A96E] font-medium">
          💡 Nutze oben rechts den Rollen-Simulator, um zur Rolle <strong>Schrauber</strong> zu wechseln.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Toast notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-none bg-[#1E1E1E] border border-[#C9A96E] text-[#E8E0D4] font-mono text-xs flex items-center gap-2 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#C9A96E]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Sector Selection & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1E1E1E] p-4 rounded-none border border-[#333333]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-none bg-[#2A2A2A] text-[#C9A96E] border border-[#333333]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-[#C9A96E] uppercase tracking-widest">
                Batch-Schraubermodus
              </span>
              {/* Gym Selector Dropdown */}
              <div className="flex items-center gap-1.5 bg-[#121212] border border-[#333333] rounded-none px-2 py-0.5">
                <Building2 className="w-3 h-3 text-[#C9A96E]" />
                <span className="text-[10px] font-mono text-[#6B6358] uppercase hidden sm:inline">Halle:</span>
                <select
                  value={selectedGymId}
                  onChange={e => handleGymChange(e.target.value)}
                  className="bg-transparent text-xs font-mono font-bold text-[#E8E0D4] focus:outline-none cursor-pointer"
                  title="Halle für Routensetzung wechseln"
                >
                  {gyms.map(g => (
                    <option key={g.id} value={g.id} className="bg-[#1E1E1E] text-[#E8E0D4]">
                      {g.name} {g.city ? `(${g.city})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <h2 className="text-lg font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
              Wand auswählen & Boulder erfassen
            </h2>
          </div>
        </div>

        {/* Sector Tabs (if sectors exist) */}
        {sectors.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {sectors.map(sector => {
              const isSelected = selectedSectorId === sector.id;
              return (
                <button
                  key={sector.id}
                  type="button"
                  onClick={() => setSelectedSectorId(sector.id)}
                  className={`px-3.5 py-1.5 rounded-[2px] text-xs font-headline uppercase tracking-wider transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#F5F0E8] text-[#121212] font-bold'
                      : 'bg-[#2A2A2A] text-[#A89F91] hover:text-[#E8E0D4] border border-[#333333]'
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
              className="px-3.5 py-1.5 rounded-[2px] bg-[#2A2A2A] hover:bg-[#333333] text-[#E8E0D4] text-xs font-mono border border-[#333333] flex items-center gap-1.5 transition"
              title="Wandfoto aktualisieren (z.B. nach Neuschrauben)"
            >
              <Camera className="w-3.5 h-3.5 text-[#C9A96E]" />
              <span className="hidden sm:inline">Neues Foto</span>
            </button>
          </div>
        )}
      </div>

      {/* When no sectors exist in this gym */}
      {sectors.length === 0 ? (
        <div className="p-8 md:p-12 rounded-none bg-[#1E1E1E] border border-[#333333] text-center space-y-4 my-6">
          <div className="w-14 h-14 rounded-none bg-[#2A2A2A] border border-[#333333] text-[#C9A96E] flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
              Keine Sektoren in „{gym?.name || 'dieser Halle'}“ vorhanden
            </h3>
            <p className="text-xs font-sans text-[#A89F91] max-w-md mx-auto leading-relaxed">
              In dieser Halle sind noch keine Sektoren mit Wandfotos vorhanden. Das Anlegen von Sektoren und Wandtafeln ist eine administrative Aufgabe und erfolgt exklusiv in der Hallen-Administration.
            </p>
          </div>
        </div>
      ) : (
        /* Main Interactive Canvas */
        selectedSector && (
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
        )
      )}

      {/* Persistent Bottom Bar (Batch Status & Trigger) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-[#1E1E1E] border-t border-[#333333]">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-none bg-[#121212] border border-[#4A5D3A] text-[#4A5D3A] text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#4A5D3A]" />
                {drafts.length} neu
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-none bg-[#121212] border border-[#A0522D] text-[#A0522D] text-xs font-mono font-bold">
                {pendingArchiveIds.length} archiviert
              </span>
            </div>
            <p className="hidden md:block text-xs font-mono text-[#A89F91]">
              Tippe ins Foto für nächsten Pin. Erst mit "Veröffentlichen" wird alles online gestellt.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSummaryOpen(true)}
            disabled={drafts.length === 0 && pendingArchiveIds.length === 0}
            className="px-5 py-2.5 rounded-[2px] bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] font-headline uppercase font-bold tracking-wider text-xs flex items-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
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
