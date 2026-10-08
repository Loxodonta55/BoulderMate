import React, { useState, useEffect } from 'react';
import {
  WallBoulder,
  GymMemberRole,
  RadarAttributes,
} from '../types/boulder';
import {
  getWallBoulders,
  createDraftBoulder,
  updateBoulderPosition,
  updateBoulderDetails,
  deleteDraftBoulder,
  deleteWallBoulder,
  publishBatch,
  updateSectorPhoto,
  getLastSelectedGradeScaleId,
  setLastSelectedGradeScaleId,
  isSectorInRebuild,
  setRebuildPhoto,
  completeSectorRebuild,
  discardSectorRebuild,
} from '../lib/batchBoulderService';
import { useGymSectorData } from '../hooks/useGymSectorData';
import { WallPhotoCanvas } from './WallPhotoCanvas';
import { BoulderBottomSheet } from './BoulderBottomSheet';
import { BatchSummaryModal } from './BatchSummaryModal';
import { WallPhotoUploadModal } from './WallPhotoUploadModal';
import { useBackHandler } from '../hooks/useBackHandler';
import {
  Camera,
  Layers,
  Sparkles,
  Rocket,
  ShieldAlert,
  CheckCircle2,
  Building2,
  BoxSelect,
  Trash2,
  X,
  Edit3,
  Save,
  Archive,
  RefreshCw,
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
  const {
    gyms,
    gym,
    selectedGymId,
    sectors,
    setSectors,
    selectedSectorId,
    selectedSector,
    gradeScales,
    setSelectedSectorId,
    handleGymChange,
  } = useGymSectorData(activeGymId, onSelectGym);

  const [boulders, setBoulders] = useState<WallBoulder[]>([]);

  // Batch interaction state
  const [pendingArchiveIds, setPendingArchiveIds] = useState<string[]>([]);
  const [pendingModifiedIds, setPendingModifiedIds] = useState<string[]>([]);
  const [selectedBoulder, setSelectedBoulder] = useState<WallBoulder | null>(null);
  const [selectedBoulderIds, setSelectedBoulderIds] = useState<string[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [hasPhotoUpdated, setHasPhotoUpdated] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Photo replacement modal
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  // SPEC-021: Foto für Live-Wand oder für einen Umbau (Entwurfsfoto)
  const [photoPurpose, setPhotoPurpose] = useState<'live' | 'rebuild'>('live');
  const inRebuild = isSectorInRebuild(selectedSector);

  // SPEC-015: Mobile-First Android Back-Button Handling in Setter Studio
  useBackHandler({
    id: 'setter-photo-modal',
    isOpen: isPhotoModalOpen,
    onBack: () => setIsPhotoModalOpen(false),
  });

  useBackHandler({
    id: 'setter-summary-modal',
    isOpen: isSummaryOpen,
    onBack: () => setIsSummaryOpen(false),
  });

  useBackHandler({
    id: 'setter-boulder-sheet',
    isOpen: isSheetOpen,
    onBack: () => {
      setIsSheetOpen(false);
      setSelectedBoulder(null);
    },
  });

  // Reload boulders when sector changes
  useEffect(() => {
    if (selectedSectorId) {
      setBoulders(getWallBoulders(selectedSectorId));
      setPendingArchiveIds([]);
      setPendingModifiedIds([]);
      setSelectedBoulder(null);
      setSelectedBoulderIds([]);
      setIsSheetOpen(false);
      setHasPhotoUpdated(false);
    } else {
      setBoulders([]);
      setSelectedBoulderIds([]);
    }
  }, [selectedSectorId]);

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

  // Pin move (AC-7, SPEC-013, AC-14)
  const handlePinMove = (boulderId: string, newX: number, newY: number) => {
    setBoulders(prev =>
      prev.map(b => (b.id === boulderId ? { ...b, positionX: newX, positionY: newY } : b))
    );
    const target = boulders.find(b => b.id === boulderId);
    if (target && target.status !== 'draft') {
      setPendingModifiedIds(prev => prev.includes(boulderId) ? prev : [...prev, boulderId]);
    } else {
      updateBoulderPosition(boulderId, newX, newY);
    }
  };

  // Save changes from Bottom-Sheet (AC-4, AC-5, SPEC-013, AC-14, AC-15)
  const handleSaveSheet = (data: {
    gradeScaleId: string;
    name?: string;
    notes?: string;
    radar: RadarAttributes;
  }) => {
    if (!selectedBoulder) return;

    // AC-14 & AC-15: Immediately persist to storage & cloud (works for both draft and active boulders!)
    try {
      updateBoulderDetails(selectedBoulder.id, data);
    } catch (err) {
      console.warn('Fehler beim Aktualisieren der Boulder-Details:', err);
    }

    // AC-5 & AC-14: Update last selected color for the current gym
    const targetGymId = gym?.id || selectedGymId || 'gym-minimum-zh';
    setLastSelectedGradeScaleId(targetGymId, data.gradeScaleId);

    setBoulders(prev =>
      prev.map(b => (b.id === selectedBoulder.id ? { ...b, ...data } : b))
    );
    if (selectedBoulder.status !== 'draft') {
      setPendingModifiedIds(prev => prev.includes(selectedBoulder.id) ? prev : [...prev, selectedBoulder.id]);
      showToast('Änderung vorgemerkt! Mit "Speichern" unten final bestätigen.');
    } else {
      showToast('Pin aktualisiert!');
    }
    setIsSheetOpen(false);
    setSelectedBoulder(null);
  };

  // Delete draft pin
  const handleDeleteDraft = (boulderId: string) => {
    deleteDraftBoulder(boulderId);
    setBoulders(prev => prev.filter(b => b.id !== boulderId));
    setPendingModifiedIds(prev => prev.filter(id => id !== boulderId));
    setIsSheetOpen(false);
    setSelectedBoulder(null);
  };

  // AC-13: Permanently delete an individual boulder (draft or active)
  const handleDeleteBoulder = (boulderId: string) => {
    deleteWallBoulder(boulderId);
    setBoulders(prev => prev.filter(b => b.id !== boulderId));
    if (selectedSectorId) {
      setBoulders(getWallBoulders(selectedSectorId));
    }
    setPendingArchiveIds(prev => prev.filter(id => id !== boulderId));
    setSelectedBoulderIds(prev => prev.filter(id => id !== boulderId));
    setIsSheetOpen(false);
    setSelectedBoulder(null);
    showToast('Route erfolgreich gelöscht!');
  };

  // Listen to cross-component boulder events (e.g. deletion from Climber area)
  useEffect(() => {
    const handleBouldersUpdated = () => {
      if (selectedSectorId) {
        setBoulders(getWallBoulders(selectedSectorId));
      }
    };

    window.addEventListener('bouldermate:boulders_updated', handleBouldersUpdated);
    return () => window.removeEventListener('bouldermate:boulders_updated', handleBouldersUpdated);
  }, [selectedSectorId]);

  // AC-12: Delete multi-selected boulders (drafts and active)
  const handleDeleteMultiSelection = () => {
    if (selectedBoulderIds.length === 0) return;
    const count = selectedBoulderIds.length;
    selectedBoulderIds.forEach(id => {
      deleteWallBoulder(id);
    });
    setBoulders(prev => prev.filter(b => !selectedBoulderIds.includes(b.id)));
    if (selectedSectorId) {
      setBoulders(getWallBoulders(selectedSectorId));
    }
    setPendingArchiveIds(prev => prev.filter(id => !selectedBoulderIds.includes(id)));
    setSelectedBoulderIds([]);
    showToast(`${count} Boulder erfolgreich gelöscht!`);
  };

  // AC-12: Keyboard shortcut Delete / Backspace / Escape for multi-selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedBoulderIds.length === 0) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteMultiSelection();
      } else if (e.key === 'Escape') {
        setSelectedBoulderIds([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBoulderIds, selectedSectorId]);

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

    // SPEC-021 AC-2: Umbau starten oder Entwurfsfoto tauschen, Live-Foto bleibt
    if (photoPurpose === 'rebuild' || inRebuild) {
      try {
        const updated = setRebuildPhoto(selectedSectorId, photoUrl);
        setSectors(prev => prev.map(s => (s.id === updated.id ? updated : s)));
        setPendingArchiveIds([]);
        setPendingModifiedIds([]);
        setIsPhotoModalOpen(false);
        setPhotoPurpose('live');
        showToast(inRebuild ? 'Foto aktualisiert.' : 'Umbau gestartet.');
      } catch (err: any) {
        alert(err.message || 'Fehler beim Speichern des Fotos.');
      }
      return;
    }

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

  // SPEC-021 AC-2: «Wand neu schrauben» startet mit einem neuen Foto
  const handleStartRebuild = () => {
    setPhotoPurpose('rebuild');
    setIsPhotoModalOpen(true);
  };

  // SPEC-021 AC-6: «Wand fertig»
  const handleCompleteRebuild = () => {
    if (!selectedSectorId) return;
    try {
      const result = completeSectorRebuild(selectedSectorId);
      setBoulders(getWallBoulders(selectedSectorId));
      setIsSummaryOpen(false);
      showToast(`Wand ist live: ${result.publishedCount} neu, ${result.archivedCount} abgeschraubt.`);
    } catch (err: any) {
      alert(err.message || 'Fehler beim Abschließen des Umbaus.');
    }
  };

  // SPEC-021 AC-7: «Umbau verwerfen»
  const handleDiscardRebuild = () => {
    if (!selectedSectorId) return;
    if (!window.confirm('Umbau verwerfen? Alle neuen Entwürfe werden gelöscht.')) return;
    discardSectorRebuild(selectedSectorId);
    setBoulders(getWallBoulders(selectedSectorId));
    showToast('Umbau verworfen.');
  };

  // SPEC-021 AC-9: «Neu geschraubt» – alte Route abschrauben, neuer Entwurf an derselben Stelle
  const handleResetBoulder = (boulderId: string) => {
    const old = boulders.find(b => b.id === boulderId);
    if (!old || !selectedSectorId) return;
    try {
      const draft = createDraftBoulder(
        {
          sectorId: old.sectorId || selectedSectorId,
          gradeScaleId: old.gradeScaleId,
          positionX: old.positionX,
          positionY: old.positionY,
          setterId: currentUserId,
          fontGrade: old.fontGrade,
        },
        currentRole
      );
      setPendingArchiveIds(prev => (prev.includes(boulderId) ? prev : [...prev, boulderId]));
      setBoulders(prev => [...prev, draft]);
      setIsSheetOpen(false);
      setSelectedBoulder(null);
      showToast('Neu geschraubt vorgemerkt.');
    } catch (err: any) {
      alert(err.message || 'Fehler beim Anlegen der neuen Route.');
    }
  };

  // Batch Publish Execution (AC-9, SPEC-013)
  const handlePublishBatch = () => {
    if (!selectedSectorId) return;

    // Persist all staged modifications to storage / sync
    for (const modId of pendingModifiedIds) {
      const b = boulders.find(x => x.id === modId);
      if (b) {
        updateBoulderDetails(b.id, {
          gradeScaleId: b.gradeScaleId,
          name: b.name,
          notes: b.notes,
          radar: b.radar,
        });
        updateBoulderPosition(b.id, b.positionX, b.positionY);
      }
    }

    const modCount = pendingModifiedIds.length;
    const result = publishBatch(selectedSectorId, currentUserId, pendingArchiveIds);

    // Refresh state
    setBoulders(getWallBoulders(selectedSectorId));
    setPendingArchiveIds([]);
    setPendingModifiedIds([]);
    setIsSummaryOpen(false);

    const message = drafts.length === 0 && pendingArchiveIds.length === 0
      ? `Erfolgreich gespeichert! ${modCount} Route${modCount === 1 ? '' : 'n'} aktualisiert.`
      : `Erfolgreich gespeichert! +${result.publishedCount} neu aktiv, ${modCount} geändert, -${result.archivedCount} archiviert.`;

    showToast(message);
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  // Filter drafts, archives, and modifications for current session
  const drafts = boulders.filter(b => b.status === 'draft');
  const markedForArchiveBoulders = boulders.filter(b => pendingArchiveIds.includes(b.id));
  const modifiedBoulders = boulders.filter(b => pendingModifiedIds.includes(b.id) && b.status !== 'draft');
  const totalChanges = drafts.length + markedForArchiveBoulders.length + modifiedBoulders.length;
  // SPEC-021: Im Umbau zeigt das Studio nur die Entwürfe; alle aktiven Routen werden bei «Wand fertig» abgeschraubt
  const rebuildOldBoulders = inRebuild ? boulders.filter(b => b.status === 'active') : [];
  const canvasBoulders = inRebuild ? drafts : boulders;

  // If unauthorized role (AC-1)
  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 text-center rounded-xl space-y-4 bg-[var(--bm-surface)] border border-[var(--bm-line)]">
        <div className="w-12 h-12 rounded-xl bg-[var(--bm-danger)]/20 text-[var(--bm-danger)] border border-[var(--bm-danger)]/40 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-headline font-bold text-[var(--bm-text)]">Zugriff nur für Schrauber & Admins</h2>
        <p className="text-xs font-sans text-[var(--bm-text-2)] leading-relaxed">
          Du bist aktuell als <strong>Kletterer (Member)</strong> eingeloggt.
          Der Batch-Foto-Workflow zur Routenerfassung ist Schraubern (Route Settern) und Hallen-Admins vorbehalten.
        </p>
        <p className="text-xs font-mono text-[var(--bm-accent)] font-medium">
          💡 Nutze oben rechts den Rollen-Simulator, um zur Rolle <strong>Schrauber</strong> zu wechseln.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Toast notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-[var(--bm-surface)] border border-[var(--bm-accent)] text-[var(--bm-text)] font-mono text-xs flex items-center gap-2 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-[var(--bm-accent)]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Sector Selection & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bm-surface)] p-4 rounded-xl border border-[var(--bm-line)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--bm-elevated)] text-[var(--bm-accent)] border border-[var(--bm-line)]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-[var(--bm-accent)]">
                Batch-Schraubermodus
              </span>
              {/* Gym Selector Dropdown */}
              <div className="flex items-center gap-1.5 bg-[var(--bm-bg)] border border-[var(--bm-line)] rounded-xl px-2 py-0.5">
                <Building2 className="w-3 h-3 text-[var(--bm-accent)]" />
                <span className="text-[10px] font-mono text-[var(--bm-text-3)] hidden sm:inline">Halle:</span>
                <select
                  value={selectedGymId}
                  onChange={e => handleGymChange(e.target.value)}
                  className="bg-transparent text-xs font-mono font-bold text-[var(--bm-text)] focus:outline-none cursor-pointer max-w-[120px] sm:max-w-[200px] truncate"
                  title="Halle für Routensetzung wechseln"
                >
                  {gyms.map(g => (
                    <option key={g.id} value={g.id} className="bg-[var(--bm-surface)] text-[var(--bm-text)]">
                      {g.name} {g.city ? `(${g.city})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <h2 className="text-lg font-headline font-bold text-[var(--bm-text)]">
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-headline transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[var(--bm-strong)] text-[var(--bm-bg)] font-bold'
                      : 'bg-[var(--bm-elevated)] text-[var(--bm-text-2)] hover:text-[var(--bm-text)] border border-[var(--bm-line)]'
                  }`}
                >
                  <span>{sector.name}</span>
                </button>
              );
            })}

            {/* SPEC-021: Umbau starten / laufender Umbau */}
            {inRebuild ? (
              <>
                <span
                  data-testid="rebuild-badge"
                  className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold bg-[var(--bm-accent)]/20 text-[var(--bm-accent)] border border-[var(--bm-accent)]/40"
                >
                  Im Umbau
                </span>
                <button
                  type="button"
                  data-testid="discard-rebuild-btn"
                  onClick={handleDiscardRebuild}
                  className="px-3.5 py-1.5 rounded-xl bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] text-[var(--bm-danger)] text-xs font-mono border border-[var(--bm-line)] flex items-center gap-1.5 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Umbau verwerfen</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                data-testid="start-rebuild-btn"
                onClick={handleStartRebuild}
                className="px-3.5 py-1.5 rounded-xl bg-[var(--bm-strong)] hover:bg-[var(--bm-text)] text-[var(--bm-bg)] text-xs font-headline font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Wand neu schrauben</span>
              </button>
            )}

            {/* Change Photo Button (AC-2) */}
            <button
              type="button"
              onClick={() => {
                setPhotoPurpose('live');
                setIsPhotoModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] text-[var(--bm-text)] text-xs font-mono border border-[var(--bm-line)] flex items-center gap-1.5 transition"
              title="Wandfoto aktualisieren oder direkt mit Kamera aufnehmen"
              data-testid="sector-new-photo-btn"
            >
              <Camera className="w-3.5 h-3.5 text-[var(--bm-accent)]" />
              <span className="hidden sm:inline">Foto aufnehmen / hochladen</span>
              <span className="sm:hidden">Foto</span>
            </button>
          </div>
        )}
      </div>

      {/* When no sectors exist in this gym */}
      {sectors.length === 0 ? (
        <div className="p-8 md:p-12 rounded-xl bg-[var(--bm-surface)] border border-[var(--bm-line)] text-center space-y-4 my-6">
          <div className="w-14 h-14 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] text-[var(--bm-accent)] flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-headline font-bold text-[var(--bm-text)]">
              Keine Sektoren in „{gym?.name || 'dieser Halle'}“ vorhanden
            </h3>
            <p className="text-xs font-sans text-[var(--bm-text-2)] max-w-md mx-auto leading-relaxed">
              In dieser Halle sind noch keine Sektoren mit Wandfotos vorhanden. Das Anlegen von Sektoren und Wandtafeln ist eine administrative Aufgabe und erfolgt exklusiv in der Hallen-Administration.
            </p>
          </div>
        </div>
      ) : (
        /* Main Interactive Canvas */
        selectedSector && (
          <WallPhotoCanvas
            mode="setter"
            photoUrl={(inRebuild && selectedSector.draftPhotoUrl) || selectedSector.wallPhotoUrl}
            sectorName={selectedSector.name}
            boulders={canvasBoulders}
            gradeScales={gradeScales}
            pendingArchiveIds={pendingArchiveIds}
            pendingModifiedIds={pendingModifiedIds}
            selectedBoulderId={selectedBoulder?.id || null}
            selectedBoulderIds={selectedBoulderIds}
            onSelectionChange={setSelectedBoulderIds}
            onPhotoClick={handlePhotoClick}
            onPinClick={handlePinClick}
            onPinMove={handlePinMove}
            isAddingEnabled={true}
            onChangePhoto={() => setIsPhotoModalOpen(true)}
          />
        )
      )}

      {/* Floating Multi-Selection Action Bar (AC-12) */}
      {selectedBoulderIds.length > 0 && (
        <div
          data-testid="multi-selection-bar"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[var(--bm-surface)] px-4 py-2.5 border border-[var(--bm-accent)] shadow-2xl animate-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--bm-text)]">
            <BoxSelect className="w-4 h-4 text-[var(--bm-accent)]" />
            <span className="font-bold text-[var(--bm-strong)]">{selectedBoulderIds.length}</span>
            <span>Boulder ausgewählt</span>
          </div>

          <div className="h-4 w-px bg-[var(--bm-line)]" />

          <button
            type="button"
            data-testid="btn-delete-multi-selection"
            onClick={handleDeleteMultiSelection}
            className="px-3 py-1.5 bg-[var(--bm-danger)] hover:bg-[var(--bm-danger)] text-[var(--bm-on-accent)] text-xs font-mono font-bold flex items-center gap-1.5 transition rounded-xl cursor-pointer"
            title="Ausgewählte Boulder löschen (Entf / Backspace)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Löschen ({selectedBoulderIds.length})</span>
          </button>

          <button
            type="button"
            data-testid="btn-cancel-multi-selection"
            onClick={() => setSelectedBoulderIds([])}
            className="p-1.5 text-[var(--bm-text-2)] hover:text-[var(--bm-text)] hover:bg-[var(--bm-elevated)] transition rounded-xl cursor-pointer"
            title="Auswahl aufheben (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SPEC-021: Bottom Bar während eines Umbaus */}
      {inRebuild ? (
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-[var(--bm-surface)] border-t border-[var(--bm-line)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-success)] text-[var(--bm-success)] text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              {drafts.length} neu
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-danger)] text-[var(--bm-danger)] text-xs font-mono font-bold">
              <Archive className="w-3.5 h-3.5" />
              {rebuildOldBoulders.length} abgeschraubt
            </span>
          </div>
          <button
            type="button"
            data-testid="complete-rebuild-btn"
            onClick={() => setIsSummaryOpen(true)}
            disabled={drafts.length === 0}
            className="px-5 py-2.5 rounded-xl bg-[var(--bm-strong)] hover:bg-[var(--bm-text)] text-[var(--bm-bg)] font-headline font-bold text-xs flex items-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Wand fertig</span>
          </button>
        </div>
      </div>
      ) : (
      /* Persistent Bottom Bar (Batch Status & Trigger) */
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-[var(--bm-surface)] border-t border-[var(--bm-line)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-success)] text-[var(--bm-success)] text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[var(--bm-success)]" />
                {drafts.length} neu
              </span>
              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--bm-bg)] border text-xs font-mono font-bold ${
                modifiedBoulders.length > 0 ? 'border-[var(--bm-accent)] text-[var(--bm-accent)]' : 'border-[var(--bm-line)] text-[var(--bm-text-3)]'
              }`}>
                <Edit3 className="w-3.5 h-3.5" />
                {modifiedBoulders.length} geändert
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-danger)] text-[var(--bm-danger)] text-xs font-mono font-bold">
                <Archive className="w-3.5 h-3.5 text-[var(--bm-danger)]" />
                {markedForArchiveBoulders.length} archiviert
              </span>
            </div>
            <p className="hidden md:block text-xs font-mono text-[var(--bm-text-2)]">
              {totalChanges > 0
                ? 'Änderungen vorgemerkt. Klicke auf "Speichern", um sie final zu schalten.'
                : 'Tippe ins Foto für nächsten Pin oder wähle bestehende Boulder zum Bearbeiten.'}
            </p>
          </div>

          <button
            type="button"
            data-testid="publish-batch-btn"
            onClick={() => setIsSummaryOpen(true)}
            disabled={totalChanges === 0}
            className="px-5 py-2.5 rounded-xl bg-[var(--bm-strong)] hover:bg-[var(--bm-text)] text-[var(--bm-bg)] font-headline font-bold text-xs flex items-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer"
          >
            {drafts.length === 0 && markedForArchiveBoulders.length === 0 ? (
              <Save className="w-4 h-4" />
            ) : (
              <Rocket className="w-4 h-4" />
            )}
            <span>
              {drafts.length === 0 && markedForArchiveBoulders.length === 0 && modifiedBoulders.length > 0
                ? `Änderungen speichern (${modifiedBoulders.length})`
                : drafts.length > 0 && modifiedBoulders.length === 0 && markedForArchiveBoulders.length === 0
                ? `Zusammenfassung & Veröffentlichen (${drafts.length})`
                : `Speichern & Veröffentlichen (${totalChanges})`}
            </span>
          </button>
        </div>
      </div>
      )}

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
        onDeleteBoulder={handleDeleteBoulder}
        onResetBoulder={inRebuild ? undefined : handleResetBoulder}
      />

      {/* Summary & Batch Publish Modal */}
      <BatchSummaryModal
        isOpen={isSummaryOpen}
        sector={selectedSector}
        draftBoulders={drafts}
        archivedBoulders={inRebuild ? rebuildOldBoulders : markedForArchiveBoulders}
        modifiedBoulders={inRebuild ? [] : modifiedBoulders}
        gradeScales={gradeScales}
        hasPhotoUpdated={inRebuild || hasPhotoUpdated}
        onClose={() => setIsSummaryOpen(false)}
        onConfirmPublish={inRebuild ? handleCompleteRebuild : handlePublishBatch}
      />

      {/* Update Sector Photo Dialog with File Upload & Presets (AC-2, SPEC-017) */}
      <WallPhotoUploadModal
        isOpen={isPhotoModalOpen}
        sectorName={selectedSector?.name || ''}
        currentPhotoUrl={(inRebuild && selectedSector?.draftPhotoUrl) || selectedSector?.wallPhotoUrl}
        initialTab="camera"
        onClose={() => {
          setIsPhotoModalOpen(false);
          setPhotoPurpose('live');
        }}
        onPhotoSelected={handlePhotoSelected}
      />
    </div>
  );
};
