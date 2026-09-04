import React, { useState } from 'react';
import { Sector } from '../types/gym';
import { createSector, reorderSectors, updateSectorWallPhoto, deleteSector } from '../lib/gymStorage';
import { Layers, Plus, ArrowUp, ArrowDown, Image, Trash2, Edit, AlertCircle, CheckCircle2 } from 'lucide-react';

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
  const [newSectorPhoto, setNewSectorPhoto] = useState('');
  const [editingPhotoSectorId, setEditingPhotoSectorId] = useState<string | null>(null);
  const [updatedPhotoUrl, setUpdatedPhotoUrl] = useState('');
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
      setNewSectorPhoto('');
      setIsAdding(false);
      setSuccessMsg('Sektor erfolgreich hinzugefügt!');
      setTimeout(() => setSuccessMsg(null), 2500);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Anlegen des Sektors.');
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

  const handleUpdatePhoto = (sectorId: string) => {
    try {
      setError(null);
      updateSectorWallPhoto(sectorId, userId, updatedPhotoUrl);
      setEditingPhotoSectorId(null);
      setUpdatedPhotoUrl('');
      setSuccessMsg('Wandfoto aktualisiert. Boulder-Koordinaten wurden unberührt beibehalten!');
      setTimeout(() => setSuccessMsg(null), 3000);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Aktualisieren des Wandfotos.');
    }
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-slate-100">Sektoren & Wandbereiche</h3>
        </div>
        {isAdmin && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all flex items-center gap-1.5 shadow"
          >
            <Plus className="w-3.5 h-3.5" /> Neuer Sektor
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Add Sector Form */}
      {isAdding && (
        <form onSubmit={handleAddSector} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
          <div className="font-semibold text-xs text-slate-200">Neuen Sektor anlegen</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Sektorname *</label>
              <input
                type="text"
                required
                placeholder="z.B. Wettkampfwand, Höhle, Dach"
                value={newSectorName}
                onChange={(e) => setNewSectorName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Wandfoto URL *</label>
              <input
                type="url"
                required
                placeholder="https://... oder /images/wall.jpg"
                value={newSectorPhoto}
                onChange={(e) => setNewSectorPhoto(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs"
            >
              Sektor erstellen
            </button>
          </div>
        </form>
      )}

      {/* Sectors Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sectors.map((sector, idx) => (
          <div
            key={sector.id}
            className="bg-slate-950/70 border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col group hover:border-slate-700 transition-all shadow-sm"
          >
            {/* Wall Photo Thumbnail */}
            <div className="relative aspect-video bg-slate-900 overflow-hidden">
              <img
                src={sector.wall_photo_url}
                alt={sector.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              {/* Badge Active Boulders */}
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                {sector.active_boulder_count} aktive Boulder
              </div>

              {/* Reorder Buttons (Admin) */}
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-1 hover:text-emerald-400 disabled:opacity-20 text-slate-400"
                    title="Nach oben verschieben"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === sectors.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1 hover:text-emerald-400 disabled:opacity-20 text-slate-400"
                    title="Nach unten verschieben"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Info & Actions Footer */}
            <div className="p-3.5 flex items-center justify-between border-t border-slate-800/60 bg-slate-900/40">
              <div>
                <h4 className="font-bold text-sm text-slate-100">{sector.name}</h4>
                <div className="text-[10px] text-slate-500">Reihenfolge: #{sector.sort_order}</div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingPhotoSectorId(sector.id);
                      setUpdatedPhotoUrl(sector.wall_photo_url);
                    }}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Wandfoto aktualisieren"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(sector.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Sektor löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Edit Photo Input Area */}
            {editingPhotoSectorId === sector.id && (
              <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <Image className="w-3.5 h-3.5 text-emerald-400" />
                  Neues Wandfoto für "{sector.name}"
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={updatedPhotoUrl}
                    onChange={(e) => setUpdatedPhotoUrl(e.target.value)}
                    placeholder="https://... URL"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100"
                  />
                  <button
                    onClick={() => handleUpdatePhoto(sector.id)}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg"
                  >
                    Speichern
                  </button>
                  <button
                    onClick={() => setEditingPhotoSectorId(null)}
                    className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg"
                  >
                    X
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 italic">
                  Hinweis (AC-5): Bestehende Boulder-Positionen bleiben millimetergenau erhalten.
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {sectors.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-xs italic">
          Noch keine Sektoren angelegt. Lege jetzt den ersten Wandbereich an!
        </div>
      )}
    </div>
  );
};
