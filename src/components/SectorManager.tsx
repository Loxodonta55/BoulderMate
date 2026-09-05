import React, { useState } from 'react';
import { Sector } from '../types/gym';
import { createSector, reorderSectors, updateSectorWallPhoto, deleteSector } from '../lib/gymStorage';
import { WallPhotoUploadModal } from './WallPhotoUploadModal';
import { Layers, Plus, ArrowUp, ArrowDown, Trash2, AlertCircle, CheckCircle2, Upload } from 'lucide-react';

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
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    const orderedIds = copy.map(s => s.id);
    reorderSectors(gymId, userId, orderedIds);
    onRefresh();
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
          <button
            onClick={() => setIsAdding(true)}
            className="px-3.5 py-1.5 text-xs font-bold font-headline uppercase tracking-wider bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] rounded-[2px] transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Neuer Sektor
          </button>
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

      {/* Sectors Grid / Plates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sectors.map((sector, idx) => (
          <div
            key={sector.id}
            className="bg-[#1E1E1E] border border-[#333333] rounded-none overflow-hidden flex flex-col group hover:border-[#8B8680] transition-all"
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

              {/* Move Sort Order Buttons (Admin) */}
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-1 bg-[#121212]/90 p-1 rounded-none border border-[#333333]">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-1 hover:text-[#C9A96E] disabled:opacity-20 text-[#A89F91]"
                    title="Nach oben verschieben"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === sectors.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1 hover:text-[#C9A96E] disabled:opacity-20 text-[#A89F91]"
                    title="Nach unten verschieben"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Info & Actions Footer */}
            <div className="p-3.5 flex items-center justify-between border-t border-[#333333] bg-[#1E1E1E]">
              <div>
                <h4 className="font-bold text-sm text-[#E8E0D4] font-headline uppercase tracking-wide">
                  {sector.name}
                </h4>
                <div className="text-[10px] text-[#6B6358] font-mono">SECTOR #{sector.sort_order}</div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveUploadSector(sector)}
                    className="p-2 text-[#A89F91] hover:text-[#C9A96E] hover:bg-[#2A2A2A] rounded-[2px] transition-colors border border-transparent hover:border-[#333333] flex items-center gap-1 text-xs"
                    title="Wandfoto aktualisieren oder hochladen"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Foto ändern</span>
                  </button>
                  <button
                    onClick={() => handleDelete(sector.id)}
                    className="p-2 text-[#A89F91] hover:text-[#A0522D] hover:bg-[#2A2A2A] rounded-[2px] transition-colors border border-transparent hover:border-[#333333]"
                    title="Sektor löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
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
