import React, { useMemo, useState } from 'react';
import { Sector } from '../types/gym';
import { createSector, reorderSectors, updateSectorWallPhoto, deleteSector, renameSector } from '../lib/gymStorage';
import { syncSectorOrderToSupabase } from '../lib/syncService';
import { getSectors as getWallSectors, isSectorInRebuild } from '../lib/batchBoulderService';
import { WallPhotoUploadModal } from './WallPhotoUploadModal';
import { BatchSectorModal } from './BatchSectorModal';
import { Sheet } from './ui/Sheet';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { showToast } from './ui/Toast';
import { ArrowUp, ArrowDown, ChevronRight, GripVertical, ImageIcon, Images, Plus, Trash2 } from 'lucide-react';

/**
 * SPEC-023 · Sektoren im Admin-Bereich.
 * F2: kompakte Zeilen, Tippen öffnet das Sektor-Sheet (Foto, Umbenennen, Löschen).
 * F3: Sortier-Bedienelemente nur im Modus «Sortieren».
 * F4: Löschen nur nach Rückfrage.
 */

const DEFAULT_PHOTO = '/images/walls/overhang.jpg';

type SectorRow = Sector & { active_boulder_count: number };

interface Props {
  gymId: string;
  userId: string;
  isAdmin: boolean;
  sectors: SectorRow[];
  onRefresh: () => void;
}

const iconBtn =
  'min-w-[44px] min-h-[44px] rounded-xl bg-[var(--bm-elevated)] text-[var(--bm-text)] flex items-center justify-center disabled:opacity-25';
const toolBtn =
  'min-h-[40px] px-3.5 rounded-full text-[14px] font-semibold flex items-center gap-1.5 whitespace-nowrap';
const inputCls =
  'min-h-[44px] px-3 rounded-xl bg-[var(--bm-elevated)] text-[16px] text-[var(--bm-text)] placeholder-[var(--bm-text-3)] focus:outline-none focus:ring-2 focus:ring-[var(--bm-accent)]';

export const SectorManager: React.FC<Props> = ({ gymId, userId, isAdmin, sectors, onRefresh }) => {
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [openSectorId, setOpenSectorId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [photoSector, setPhotoSector] = useState<SectorRow | null>(null);
  const [deleteSectorRow, setDeleteSectorRow] = useState<SectorRow | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhoto, setNewPhoto] = useState(DEFAULT_PHOTO);
  const [isPickingNewPhoto, setIsPickingNewPhoto] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const openSector = sectors.find(s => s.id === openSectorId) || null;
  const deleteBlocked = Boolean(deleteSectorRow && deleteSectorRow.active_boulder_count > 0);

  // F12: «Im Umbau» kommt aus dem Wand-Speicher des Schrauber-Studios (SPEC-021)
  const rebuildIds = useMemo(() => {
    try {
      return new Set(getWallSectors().filter(s => isSectorInRebuild(s)).map(s => s.id));
    } catch {
      return new Set<string>();
    }
  }, [sectors]);

  const fail = (err: any, fallback: string) => showToast({ message: err?.message || fallback });

  const moveTo = (from: number, to: number) => {
    if (from === to || to < 0 || to >= sectors.length) return;
    const copy = [...sectors];
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    const orderedIds = copy.map(s => s.id);
    try {
      reorderSectors(gymId, userId, orderedIds);
      syncSectorOrderToSupabase(gymId, orderedIds).catch(() => {});
      showToast({ message: `«${moved.name}» ist jetzt Nr. ${to + 1}`, durationMs: 2000 });
      onRefresh();
    } catch (err: any) {
      fail(err, 'Reihenfolge nicht gespeichert.');
    }
  };

  const handleDrop = (targetIndex: number) => {
    const from = draggedIndex;
    setDragOverIndex(null);
    setDraggedIndex(null);
    if (from !== null) moveTo(from, targetIndex);
  };

  const openSheet = (sector: SectorRow) => {
    setOpenSectorId(sector.id);
    setRenameValue(sector.name);
  };

  const handleRename = () => {
    if (!openSector) return;
    try {
      renameSector(openSector.id, userId, renameValue);
      showToast({ message: 'Name gesichert', durationMs: 2000 });
      onRefresh();
    } catch (err: any) {
      fail(err, 'Name nicht gesichert.');
    }
  };

  const handleUpdatePhoto = (sector: SectorRow, url: string) => {
    try {
      updateSectorWallPhoto(sector.id, userId, url);
      setPhotoSector(null);
      showToast({ message: 'Wandfoto geändert', durationMs: 2000 });
      onRefresh();
    } catch (err: any) {
      fail(err, 'Wandfoto nicht geändert.');
    }
  };

  const handleDelete = () => {
    if (!deleteSectorRow) return;
    const target = deleteSectorRow;
    setDeleteSectorRow(null);
    try {
      deleteSector(target.id, userId);
      setOpenSectorId(null);
      showToast({ message: `«${target.name}» gelöscht`, durationMs: 2500 });
      onRefresh();
    } catch (err: any) {
      fail(err, 'Sektor nicht gelöscht.');
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      createSector(gymId, userId, { name: newName, wall_photo_url: newPhoto });
      showToast({ message: `«${newName.trim()}» angelegt`, durationMs: 2000 });
      setIsAdding(false);
      setNewName('');
      setNewPhoto(DEFAULT_PHOTO);
      onRefresh();
    } catch (err: any) {
      fail(err, 'Sektor nicht angelegt.');
    }
  };

  const startAdding = () => {
    setIsReorderMode(false);
    setIsAdding(true);
  };

  const addButtons = (prefix: '' | 'empty-') => (
    <>
      <button
        type="button"
        onClick={() => setIsBatchModalOpen(true)}
        data-testid={`${prefix}batch-add-sector-btn`}
        className={`${toolBtn} bg-[var(--bm-elevated)] text-[var(--bm-text)]`}
      >
        <Images className="w-4 h-4" /> Mehrere
      </button>
      <button
        type="button"
        onClick={startAdding}
        data-testid={`${prefix}add-sector-btn`}
        className={`${toolBtn} bg-[var(--bm-strong)] text-[var(--bm-bg)]`}
      >
        <Plus className="w-4 h-4" /> Sektor
      </button>
    </>
  );

  const rowContent = (sector: SectorRow) => (
    <>
      <span className="w-14 h-10 rounded-lg overflow-hidden bg-[var(--bm-elevated)] shrink-0 flex items-center justify-center">
        {sector.wall_photo_url ? (
          <img
            src={sector.wall_photo_url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <ImageIcon className="w-4 h-4 text-[var(--bm-text-3)]" />
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[16px] text-[var(--bm-text)] truncate">{sector.name}</span>
        <span className="flex items-center gap-2 text-[13px] text-[var(--bm-text-2)]">
          <span>{sector.active_boulder_count} Boulder</span>
          {rebuildIds.has(sector.id) && (
            <span
              data-testid={`sector-rebuild-chip-${sector.id}`}
              className="px-1.5 rounded-md bg-[var(--bm-elevated)] text-[var(--bm-warning)] text-[12px] font-semibold"
            >
              Im Umbau
            </span>
          )}
        </span>
      </span>
    </>
  );

  return (
    <div className="space-y-3">
      {/* Werkzeugleiste */}
      {isAdmin && sectors.length > 0 && (
        <div className="flex items-center justify-end gap-2">
          {sectors.length > 1 && (
            <button
              type="button"
              onClick={() => setIsReorderMode(!isReorderMode)}
              data-testid="toggle-reorder-mode-btn"
              aria-pressed={isReorderMode}
              className={`${toolBtn} ${
                isReorderMode ? 'bg-[var(--bm-strong)] text-[var(--bm-bg)]' : 'bg-[var(--bm-elevated)] text-[var(--bm-text)]'
              }`}
            >
              {isReorderMode ? 'Fertig' : 'Sortieren'}
            </button>
          )}
          {!isReorderMode && addButtons('')}
        </div>
      )}

      {/* Sektor-Liste */}
      {sectors.length > 0 ? (
        <ol className="rounded-2xl bg-[var(--bm-surface)] overflow-hidden divide-y divide-[var(--bm-line)]" data-testid="sector-list">
          {sectors.map((sector, idx) =>
            isReorderMode && isAdmin ? (
              <li
                key={sector.id}
                draggable
                onDragStart={(e) => {
                  setDraggedIndex(idx);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', sector.id);
                }}
                onDragOver={(e) => {
                  if (draggedIndex === null) return;
                  e.preventDefault();
                  if (dragOverIndex !== idx) setDragOverIndex(idx);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(idx);
                }}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                data-testid={`sector-row-${sector.id}`}
                className={`flex items-center gap-2 pl-1.5 pr-2 py-1.5 ${draggedIndex === idx ? 'opacity-40' : ''} ${
                  dragOverIndex === idx && draggedIndex !== idx ? 'bg-[var(--bm-elevated)]' : ''
                }`}
              >
                <span
                  className="p-1.5 text-[var(--bm-text-3)] cursor-grab active:cursor-grabbing"
                  data-testid={`drag-handle-${sector.id}`}
                  aria-label="Ziehen zum Sortieren"
                >
                  <GripVertical className="w-5 h-5" />
                </span>
                {rowContent(sector)}
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveTo(idx, idx - 1)}
                  className={iconBtn}
                  aria-label={`${sector.name} nach oben`}
                  data-testid={`move-up-${sector.id}`}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === sectors.length - 1}
                  onClick={() => moveTo(idx, idx + 1)}
                  className={iconBtn}
                  aria-label={`${sector.name} nach unten`}
                  data-testid={`move-down-${sector.id}`}
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </li>
            ) : (
              <li key={sector.id}>
                <button
                  type="button"
                  onClick={() => openSheet(sector)}
                  disabled={!isAdmin}
                  data-testid={`sector-row-${sector.id}`}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 min-h-[56px] enabled:active:bg-[var(--bm-elevated)]"
                >
                  {rowContent(sector)}
                  {isAdmin && <ChevronRight className="w-4 h-4 text-[var(--bm-text-3)] shrink-0" />}
                </button>
              </li>
            )
          )}
        </ol>
      ) : (
        <div className="rounded-2xl bg-[var(--bm-surface)] px-4 py-8 text-center space-y-4">
          <p className="text-[15px] text-[var(--bm-text-2)]">Noch keine Sektoren.</p>
          {isAdmin && <div className="flex flex-wrap items-center justify-center gap-2">{addButtons('empty-')}</div>}
        </div>
      )}

      {/* Sektor-Sheet: Foto, Umbenennen, Löschen */}
      <Sheet
        open={Boolean(openSector) && !photoSector}
        onClose={() => setOpenSectorId(null)}
        fitContent
        testId="sector-sheet"
        ariaLabel={openSector?.name}
      >
        {openSector && (
          <div className="px-4 pb-2 space-y-4">
            <div className="aspect-video max-h-48 w-full rounded-xl overflow-hidden bg-[var(--bm-elevated)]">
              <img src={openSector.wall_photo_url} alt={openSector.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                aria-label="Name"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                data-testid="sector-rename-input"
                className={`flex-1 min-w-0 ${inputCls}`}
              />
              <button
                type="button"
                onClick={handleRename}
                disabled={!renameValue.trim() || renameValue.trim() === openSector.name}
                data-testid="sector-rename-save"
                className="min-h-[44px] px-4 rounded-xl bg-[var(--bm-strong)] text-[var(--bm-bg)] text-[15px] font-semibold disabled:opacity-30"
              >
                Sichern
              </button>
            </div>
            <div className="rounded-2xl bg-[var(--bm-bg)] overflow-hidden divide-y divide-[var(--bm-line)]">
              <button
                type="button"
                onClick={() => setPhotoSector(openSector)}
                data-testid="sector-photo-btn"
                className="w-full flex items-center gap-3 px-4 min-h-[52px] text-[16px] text-[var(--bm-text)]"
              >
                <ImageIcon className="w-5 h-5 text-[var(--bm-text-2)]" /> Wandfoto ändern
              </button>
              <button
                type="button"
                onClick={() => setDeleteSectorRow(openSector)}
                data-testid="sector-delete-btn"
                className="w-full flex items-center gap-3 px-4 min-h-[52px] text-[16px] text-[var(--bm-danger)]"
              >
                <Trash2 className="w-5 h-5" /> Sektor löschen
              </button>
            </div>
          </div>
        )}
      </Sheet>

      {/* Neuer Sektor */}
      <Sheet
        open={isAdding && !isPickingNewPhoto}
        onClose={() => setIsAdding(false)}
        fitContent
        testId="add-sector-sheet"
        ariaLabel="Neuer Sektor"
      >
        <form onSubmit={handleAdd} className="px-4 pb-2 space-y-4">
          <h2 className="text-[17px] font-semibold">Neuer Sektor</h2>
          <input
            type="text"
            required
            placeholder="Name, z. B. Dach"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            data-testid="new-sector-name"
            className={`w-full ${inputCls}`}
          />
          <button
            type="button"
            onClick={() => setIsPickingNewPhoto(true)}
            data-testid="new-sector-photo-btn"
            className="w-full flex items-center gap-3 p-2 rounded-xl bg-[var(--bm-elevated)] text-left"
          >
            <img src={newPhoto} alt="" className="w-16 h-11 rounded-lg object-cover bg-[var(--bm-bg)]" />
            <span className="flex-1 text-[15px] text-[var(--bm-text)]">Wandfoto wählen</span>
            <ChevronRight className="w-4 h-4 text-[var(--bm-text-3)]" />
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex-1 min-h-[44px] rounded-xl bg-[var(--bm-elevated)] text-[15px] font-semibold"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!newName.trim()}
              data-testid="new-sector-save"
              className="flex-1 min-h-[44px] rounded-xl bg-[var(--bm-strong)] text-[var(--bm-bg)] text-[15px] font-semibold disabled:opacity-30"
            >
              Anlegen
            </button>
          </div>
        </form>
      </Sheet>

      {/* F4: Rückfrage; mit aktiven Bouldern ist Löschen gesperrt (SPEC-001 AC-6) */}
      <ConfirmDialog
        open={Boolean(deleteSectorRow)}
        title={
          deleteBlocked
            ? `«${deleteSectorRow?.name}» hat noch ${deleteSectorRow?.active_boulder_count} Boulder`
            : `Sektor «${deleteSectorRow?.name ?? ''}» löschen?`
        }
        message={
          deleteBlocked
            ? deleteSectorRow?.active_boulder_count === 1
              ? 'Erst den Boulder im Schrauber-Studio abschrauben.'
              : `Erst die ${deleteSectorRow?.active_boulder_count} Boulder im Schrauber-Studio abschrauben.`
            : 'Wandfoto und Position gehen verloren.'
        }
        onConfirm={deleteBlocked ? undefined : handleDelete}
        onCancel={() => setDeleteSectorRow(null)}
      />

      {photoSector && (
        <WallPhotoUploadModal
          isOpen={true}
          sectorName={photoSector.name}
          currentPhotoUrl={photoSector.wall_photo_url}
          onClose={() => setPhotoSector(null)}
          onPhotoSelected={(url) => handleUpdatePhoto(photoSector, url)}
        />
      )}

      {isPickingNewPhoto && (
        <WallPhotoUploadModal
          isOpen={true}
          sectorName={newName || 'Neuer Sektor'}
          currentPhotoUrl={newPhoto}
          onClose={() => setIsPickingNewPhoto(false)}
          onPhotoSelected={(url) => {
            setNewPhoto(url);
            setIsPickingNewPhoto(false);
          }}
        />
      )}

      {/* SPEC-018: mehrere Sektoren per Foto-Upload */}
      <BatchSectorModal
        isOpen={isBatchModalOpen}
        gymId={gymId}
        userId={userId}
        existingSectorCount={sectors.length}
        onClose={() => setIsBatchModalOpen(false)}
        onSuccess={(count) => {
          showToast({ message: `${count} ${count === 1 ? 'Sektor' : 'Sektoren'} angelegt`, durationMs: 2500 });
          onRefresh();
        }}
      />
    </div>
  );
};
