import React, { useState } from 'react';
import { Sector } from '../types/gym';
import { createSector, reorderSectors, updateSectorWallPhoto, deleteSector } from '../lib/gymStorage';
import { WallPhotoUploadModal } from './WallPhotoUploadModal';
import {
  Layers,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Upload,
  GripVertical,
  ArrowUpDown,
  Check,
} from 'lucide-react';

interface Props {
  gymId: string;
  userId: string;
  isAdmin: boolean;
  sectors: (Sector & { active_boulder_count: number })[];
  onRefresh: () => void;
}

export const SectorManager: React.FC<Props> = ({ gymId, userId, isAdmin, sectors, onRefresh }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newSectorName, setNewSectorName] = useState('');
  const [newSectorPhoto, setNewSectorPhoto] = useState('/images/walls/overhang.jpg');
  const [activeUploadSector, setActiveUploadSector] = useState<Sector | null>(null);
  const [isUploadForNewSector, setIsUploadForNewSector] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const successTimerRef = React.useRef<any>(null);

  React.useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // Drag & Drop / Touch Reorder State (Requirement 5)
  const [draggedSectorIndex, setDraggedSectorIndex] = useState<number | null>(null);
  const [dragOverSectorIndex, setDragOverSectorIndex] = useState<number | null>(null);
  const [isReorderMode, setIsReorderMode] = useState<boolean>(false);

  const handleAddSector = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      createSector(gymId, userId, {
        name: newSectorName,
        wall_photo_url: newSectorPhoto
      });
      setNewSectorName('');
      setNewSectorPhoto('/images/walls/overhang.jpg');
      setIsAdding(false);
      setSuccessMsg('Sektor erfolgreich hinzugefügt!');
      setTimeout(() => setSuccessMsg(null), 2500);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Anlegen des Sektors.');
    }
  };

  const handleUpdatePhoto = (sectorId: string, photoUrl: string) => {
    try {
      setError(null);
      updateSectorWallPhoto(sectorId, userId, photoUrl);
      setActiveUploadSector(null);
      setSuccessMsg('Wandfoto aktualisiert. Boulder-Koordinaten wurden unberührt beibehalten!');
      setTimeout(() => setSuccessMsg(null), 3000);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Aktualisieren des Wandfotos.');
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sectors.length - 1)) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const copy = [...sectors];
    const [movedItem] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, movedItem);

    const orderedIds = copy.map(s => s.id);
    try {
      reorderSectors(gymId, userId, orderedIds);
      setSuccessMsg(`Sektor "${movedItem.name}" ist jetzt Sektor #${targetIndex + 1}`);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => {
        try { setSuccessMsg(null); } catch (_) {}
      }, 2500);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Ändern der Sektor-Reihenfolge.');
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isAdmin) return;
    setDraggedSectorIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sectors[index].id);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!isAdmin || draggedSectorIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSectorIndex !== index) {
      setDragOverSectorIndex(index);
    }
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    if (!isAdmin || draggedSectorIndex === null) return;
    e.preventDefault();
    setDragOverSectorIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverSectorIndex === index) {
      setDragOverSectorIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverSectorIndex(null);
    if (!isAdmin || draggedSectorIndex === null || draggedSectorIndex === targetIndex) {
      setDraggedSectorIndex(null);
      return;
    }

    const reordered = [...sectors];
    const [movedItem] = reordered.splice(draggedSectorIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    setDraggedSectorIndex(null);

    const orderedIds = reordered.map(s => s.id);
    try {
      reorderSectors(gymId, userId, orderedIds);
      setSuccessMsg(`Reihenfolge geändert: "${movedItem.name}" ist jetzt Sektor #${targetIndex + 1}`);
      setTimeout(() => setSuccessMsg(null), 2500);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Ändern der Sektor-Reihenfolge.');
    }
  };

  const handleDragEnd = () => {
    setDraggedSectorIndex(null);
    setDragOverSectorIndex(null);
  };

  const handleDelete = (sectorId: string) => {
    try {
      setError(null);
      deleteSector(sectorId, userId);
      setSuccessMsg('Sektor gelöscht.');
      setTimeout(() => setSuccessMsg(null), 2500);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-[#1E1E1E] border border-[#333333] rounded-none p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#333333] pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#C9A96E]" />
          <h3 className="text-base font-bold text-[#E8E0D4] font-headline uppercase tracking-wider">
            Sektoren & Wandbereiche (Topo-Tafeln)
          </h3>
        </div>
        {isAdmin && !isAdding && (
          <div className="flex items-center gap-2">
            {sectors.length > 1 && (
              <button
                type="button"
                onClick={() => setIsReorderMode(!isReorderMode)}
                data-testid="toggle-reorder-mode-btn"
                className={`px-3 py-1.5 text-xs font-headline uppercase tracking-wider rounded-[2px] transition-all flex items-center gap-1.5 border ${
                  isReorderMode
                    ? 'bg-[#C9A96E] text-[#121212] border-[#C9A96E] font-bold shadow-sm'
                    : 'bg-[#2A2A2A] hover:bg-[#333333] text-[#A89F91] hover:text-[#E8E0D4] border-[#333333]'
                }`}
                title="Sektor-Reihenfolge auf Smartphone oder Desktop anpassen"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>{isReorderMode ? 'Kartenansicht' : 'Reihenfolge anpassen'}</span>
              </button>
            )}
            <button
              onClick={() => setIsAdding(true)}
              className="px-3.5 py-1.5 text-xs font-bold font-headline uppercase tracking-wider bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] rounded-[2px] transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Neuer Sektor
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-[#121212] border border-[#A0522D] rounded-none text-[#A0522D] text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-[#121212] border border-[#4A5D3A] rounded-none text-[#4A5D3A] text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Add Sector Form */}
      {isAdding && (
        <form onSubmit={handleAddSector} className="p-4 bg-[#121212] border border-[#333333] rounded-none space-y-3">
          <div className="font-bold text-xs text-[#E8E0D4] font-headline uppercase tracking-wider">
            Neuen Sektor im Topo anlegen
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#A89F91] font-headline uppercase tracking-wider mb-1">
                Sektorname *
              </label>
              <input
                type="text"
                required
                placeholder="z.B. Wettkampfwand, Höhle, Dach"
                value={newSectorName}
                onChange={(e) => setNewSectorName(e.target.value)}
                className="w-full bg-[#1E1E1E] border border-[#333333] rounded-none px-3 py-1.5 text-xs text-[#E8E0D4] focus:outline-none focus:border-[#C9A96E] font-sans"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#A89F91] font-headline uppercase tracking-wider mb-1">
                Wandfoto *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="URL oder Bilddatei auswählen"
                  value={newSectorPhoto}
                  onChange={(e) => setNewSectorPhoto(e.target.value)}
                  className="flex-1 bg-[#1E1E1E] border border-[#333333] rounded-none px-3 py-1.5 text-xs text-[#E8E0D4] focus:outline-none focus:border-[#C9A96E] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setIsUploadForNewSector(true)}
                  className="px-3 py-1.5 bg-[#2A2A2A] hover:bg-[#333333] border border-[#333333] text-[#C9A96E] rounded-[2px] text-xs font-headline uppercase tracking-wider flex items-center gap-1.5 shrink-0"
                  title="Datei vom Computer hochladen oder Wandpreset wählen"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Foto wählen</span>
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 bg-[#2A2A2A] hover:bg-[#333333] border border-[#333333] text-[#A89F91] rounded-[2px] text-xs font-headline uppercase tracking-wider"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] font-bold font-headline uppercase tracking-wider rounded-[2px] text-xs"
            >
              Sektor speichern
            </button>
          </div>
        </form>
      )}

      {/* Mobile Touch Reorder Mode (Requirement 5) */}
      {isReorderMode && isAdmin && sectors.length > 1 && (
        <div
          className="space-y-3 bg-[#141414] border border-[#333333] p-4 rounded-none animate-in fade-in duration-150"
          data-testid="mobile-touch-reorder-view"
        >
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2.5">
            <div>
              <h4 className="text-xs font-headline font-bold uppercase tracking-wider text-[#E8E0D4] flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-[#C9A96E]" />
                <span>Mobile Sektor-Sortierung</span>
              </h4>
              <p className="text-[11px] font-mono text-[#A89F91]">
                Tippe auf Hoch/Runter, um die Reihenfolge der Sektoren anzupassen.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsReorderMode(false)}
              className="px-3 py-1.5 rounded-[2px] bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] text-xs font-headline font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Fertig</span>
            </button>
          </div>

          <div className="space-y-2">
            {sectors.map((sector, idx) => (
              <div
                key={sector.id}
                className="p-3 bg-[#1E1E1E] border border-[#333333] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-none bg-[#2A2A2A] border border-[#333333] text-xs font-mono font-bold text-[#C9A96E] flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-headline font-bold uppercase tracking-wider text-[#E8E0D4] truncate">
                      {sector.name}
                    </p>
                    <p className="text-[10px] font-mono text-[#A89F91]">
                      {sector.active_boulder_count} {sector.active_boulder_count === 1 ? 'Route' : 'Routen'} aktiv
                    </p>
                  </div>
                </div>

                {/* Generous Touch Targets for Up/Down Reorder (42px min) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-2.5 rounded-[2px] bg-[#2A2A2A] hover:bg-[#333333] disabled:opacity-20 text-[#E8E0D4] border border-[#333333] min-w-[42px] min-h-[42px] flex items-center justify-center transition cursor-pointer"
                    title="Nach oben verschieben"
                    aria-label="Nach oben verschieben"
                    data-testid={`touch-move-up-${sector.id}`}
                  >
                    <ArrowUp className="w-4 h-4 text-[#C9A96E]" />
                  </button>

                  <button
                    type="button"
                    disabled={idx === sectors.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-2.5 rounded-[2px] bg-[#2A2A2A] hover:bg-[#333333] disabled:opacity-20 text-[#E8E0D4] border border-[#333333] min-w-[42px] min-h-[42px] flex items-center justify-center transition cursor-pointer"
                    title="Nach unten verschieben"
                    aria-label="Nach unten verschieben"
                    data-testid={`touch-move-down-${sector.id}`}
                  >
                    <ArrowDown className="w-4 h-4 text-[#C9A96E]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sector ordering guide for Admins */}
      {isAdmin && sectors.length > 1 && !isReorderMode && (
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#141210] border border-[#2e2a25] text-xs font-mono text-[#a89f91]">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-[#C9A96E] shrink-0" />
            <span>
              <strong className="text-[#f4efe6]">Drag & Drop Sortierung:</strong> Ziehe Karten an den Griffen oder nutze die Pfeile, um den Hallenrundgang logisch anzuordnen.
            </span>
          </div>
          <span className="text-[10px] text-[#78716c] hidden md:inline">
            {sectors.length} Sektoren
          </span>
        </div>
      )}

      {/* Sectors Grid / Plates */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isReorderMode ? 'hidden sm:grid' : ''}`}>
        {sectors.map((sector, idx) => {
          const isDragging = draggedSectorIndex === idx;
          const isDragOver = dragOverSectorIndex === idx && draggedSectorIndex !== idx;

          return (
            <div
              key={sector.id}
              draggable={isAdmin}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnter={(e) => handleDragEnter(e, idx)}
              onDragLeave={(e) => handleDragLeave(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              className={`bg-[#1E1E1E] border rounded-none overflow-hidden flex flex-col group transition-all duration-150 ${
                isDragging
                  ? 'opacity-40 border-dashed border-[#C9A96E] scale-[0.98]'
                  : isDragOver
                  ? 'border-[#C9A96E] ring-2 ring-[#C9A96E] bg-[#24211e] scale-[1.01]'
                  : 'border-[#333333] hover:border-[#8B8680]'
              }`}
              data-testid={`sector-card-${sector.id}`}
            >
              {/* Wall Photo Plate */}
              <div className="relative aspect-video bg-black overflow-hidden">
                <img
                  src={sector.wall_photo_url}
                  alt={sector.name}
                  className="w-full h-full object-cover transition-transform duration-200"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />

                {/* Status Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#121212]/90 px-2 py-0.5 rounded-none border border-[#333333] text-[11px] font-mono text-[#E8E0D4]">
                  <span className="w-1.5 h-1.5 rounded-none bg-[#4A5D3A]" />
                  {sector.active_boulder_count} {sector.active_boulder_count === 1 ? 'Route' : 'Routen'} aktiv
                </div>

                {/* Drag Handle & Reorder Buttons (Admin) */}
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#121212]/95 p-1 rounded-none border border-[#333333] shadow-md">
                    {/* Drag Handle */}
                    <div
                      className="flex items-center gap-1 px-1.5 py-0.5 hover:bg-[#2A2A2A] text-[#A89F91] hover:text-[#C9A96E] cursor-grab active:cursor-grabbing transition-colors select-none"
                      title="Per Drag & Drop verschieben (Reihenfolge anpassen)"
                      data-testid={`drag-handle-${sector.id}`}
                    >
                      <GripVertical className="w-3.5 h-3.5 text-[#C9A96E]" />
                      <span className="text-[10px] font-mono font-bold text-[#E8E0D4]">#{idx + 1}</span>
                    </div>

                    <div className="w-[1px] h-3.5 bg-[#333333]" />

                    {/* Up / Down Arrows as Accessible Alternative */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMove(idx, 'up');
                      }}
                      className="p-1 hover:text-[#C9A96E] disabled:opacity-20 text-[#A89F91] transition-colors"
                      title="Nach oben verschieben"
                      aria-label="Nach oben verschieben"
                      data-testid={`move-up-${sector.id}`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sectors.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMove(idx, 'down');
                      }}
                      className="p-1 hover:text-[#C9A96E] disabled:opacity-20 text-[#A89F91] transition-colors"
                      title="Nach unten verschieben"
                      aria-label="Nach unten verschieben"
                      data-testid={`move-down-${sector.id}`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Info & Actions Footer */}
              <div className="p-3.5 flex flex-col gap-2.5 border-t border-[#333333] bg-[#1E1E1E]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <div
                        className="cursor-grab active:cursor-grabbing p-1 text-[#6B6358] hover:text-[#C9A96E] transition-colors hidden sm:block"
                        title="Drag & Drop Anfasser"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-[#E8E0D4] font-headline uppercase tracking-wide">
                        {sector.name}
                      </h4>
                      <div className="text-[10px] text-[#6B6358] font-mono">
                        SECTOR #{sector.sort_order} {sector.sort_order !== idx + 1 && `(Anzeige: #${idx + 1})`}
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setActiveUploadSector(sector)}
                        className="p-2 text-[#A89F91] hover:text-[#C9A96E] hover:bg-[#2A2A2A] rounded-[2px] transition-colors border border-transparent hover:border-[#333333] flex items-center gap-1 text-xs"
                        title="Wandfoto aktualisieren oder hochladen"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Foto ändern</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(sector.id)}
                        className="p-2 text-[#A89F91] hover:text-[#A0522D] hover:bg-[#2A2A2A] rounded-[2px] transition-colors border border-transparent hover:border-[#333333]"
                        title="Sektor löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Direct Reorder Bar (Requirement 5: Prominente Touch-Buttons auf Smartphone) */}
                {isAdmin && sectors.length > 1 && (
                  <div className="sm:hidden flex items-center justify-between pt-2 border-t border-[#2A2A2A]">
                    <span className="text-[11px] font-mono text-[#A89F91]">
                      Position: <strong className="text-[#E8E0D4]">#{idx + 1}</strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(idx, 'up');
                        }}
                        className="px-3 py-1.5 rounded-[2px] bg-[#2A2A2A] hover:bg-[#333333] disabled:opacity-20 text-xs font-mono text-[#E8E0D4] border border-[#333333] flex items-center gap-1 min-h-[38px] transition cursor-pointer"
                        title="Sektor nach oben verschieben"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-[#C9A96E]" />
                        <span>Hoch</span>
                      </button>
                      <button
                        type="button"
                        disabled={idx === sectors.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(idx, 'down');
                        }}
                        className="px-3 py-1.5 rounded-[2px] bg-[#2A2A2A] hover:bg-[#333333] disabled:opacity-20 text-xs font-mono text-[#E8E0D4] border border-[#333333] flex items-center gap-1 min-h-[38px] transition cursor-pointer"
                        title="Sektor nach unten verschieben"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-[#C9A96E]" />
                        <span>Runter</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {sectors.length === 0 && (
        <div className="text-center py-8 text-stone-500 text-xs font-mono italic">
          Noch keine Sektoren angelegt. Lege jetzt den ersten Wandbereich an!
        </div>
      )}

      {/* Upload Modal for Editing Existing Sector Photo */}
      {activeUploadSector && (
        <WallPhotoUploadModal
          isOpen={true}
          sectorName={activeUploadSector.name}
          currentPhotoUrl={activeUploadSector.wall_photo_url}
          onClose={() => setActiveUploadSector(null)}
          onPhotoSelected={(url) => handleUpdatePhoto(activeUploadSector.id, url)}
        />
      )}

      {/* Upload Modal for Creating New Sector */}
      {isUploadForNewSector && (
        <WallPhotoUploadModal
          isOpen={true}
          sectorName={newSectorName || 'Neuer Sektor'}
          currentPhotoUrl={newSectorPhoto}
          onClose={() => setIsUploadForNewSector(false)}
          onPhotoSelected={(url) => {
            setNewSectorPhoto(url);
            setIsUploadForNewSector(false);
          }}
        />
      )}
    </div>
  );
};
