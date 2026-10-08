import React, { useEffect, useState } from 'react';
import { GradeScale } from '../types/gym';
import { setGymGradeScales } from '../lib/gymStorage';
import { syncGradeScalesToSupabase } from '../lib/syncService';
import { isValidUuid, stringToUuid } from '../lib/storageUtils';
import { Sheet } from './ui/Sheet';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { showToast } from './ui/Toast';
import { ArrowDown, ArrowUp, ChevronRight, Plus, Trash2 } from 'lucide-react';

/**
 * SPEC-023 F5 · Farben der Halle: Liste + Sheet.
 * Jede Änderung wird sofort gespeichert (lokal + Supabase), es gibt keinen globalen Speichern-Knopf.
 */

interface Props {
  gymId: string;
  userId: string;
  initialScales: GradeScale[];
  onSaved: () => void;
}

type Draft = Pick<GradeScale, 'color_name' | 'color_hex' | 'difficulty_label' | 'font_range_min' | 'font_range_max'>;

const EMPTY_DRAFT: Draft = {
  color_name: '',
  color_hex: '#8b5cf6',
  difficulty_label: '',
  font_range_min: '',
  font_range_max: '',
};

const newId = (gymId: string, salt: string) =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : stringToUuid(`scale_${gymId}_${salt}_${Date.now()}`);

export function formatFontRange(min?: string, max?: string): string {
  const a = (min || '').trim();
  const b = (max || '').trim();
  if (!a && !b) return '';
  if (!b || a === b) return `Font ${a || b}`;
  if (!a) return `Font ${b}`;
  return `Font ${a}–${b}`;
}

const inputCls =
  'w-full min-h-[44px] px-3 rounded-xl bg-[var(--bm-elevated)] text-[16px] text-[var(--bm-text)] placeholder-[var(--bm-text-3)] focus:outline-none focus:ring-2 focus:ring-[var(--bm-accent)]';
const toolBtn =
  'min-h-[40px] px-3.5 rounded-full text-[14px] font-semibold flex items-center gap-1.5 whitespace-nowrap';
const iconBtn =
  'min-w-[44px] min-h-[44px] rounded-xl bg-[var(--bm-elevated)] text-[var(--bm-text)] flex items-center justify-center disabled:opacity-25';

export const GradeScaleConfig: React.FC<Props> = ({ gymId, userId, initialScales, onSaved }) => {
  const [scales, setScales] = useState<GradeScale[]>(initialScales);
  const [isReorderMode, setIsReorderMode] = useState(false);
  // null = Sheet zu, -1 = neue Farbe, sonst Index
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setScales(initialScales);
  }, [initialScales]);

  const persist = async (next: GradeScale[], message: string): Promise<boolean> => {
    setIsSaving(true);
    try {
      const withIds: GradeScale[] = next.map((s, idx) => ({
        ...s,
        id: s.id && isValidUuid(s.id) ? s.id : newId(gymId, `${s.color_name}_${idx}`),
        sort_order: idx + 1,
      }));
      const validated = setGymGradeScales(gymId, userId, withIds);
      setScales(validated);
      // SPEC-001 AC-2.3: erst nach dem Supabase-Abgleich als gesichert melden
      await syncGradeScalesToSupabase(gymId, validated);
      showToast({ message, durationMs: 2000 });
      onSaved();
      return true;
    } catch (e: any) {
      showToast({ message: e?.message || 'Farben nicht gesichert.' });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (index: number) => {
    const s = scales[index];
    setDraft({
      color_name: s.color_name,
      color_hex: s.color_hex,
      difficulty_label: s.difficulty_label,
      font_range_min: s.font_range_min,
      font_range_max: s.font_range_max,
    });
    setEditIndex(index);
  };

  const openNew = () => {
    setIsReorderMode(false);
    setDraft(EMPTY_DRAFT);
    setEditIndex(-1);
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editIndex === null) return;
    const cleaned: Draft = {
      color_name: draft.color_name.trim(),
      color_hex: draft.color_hex,
      difficulty_label: draft.difficulty_label.trim(),
      font_range_min: draft.font_range_min.trim(),
      font_range_max: draft.font_range_max.trim(),
    };
    let next: GradeScale[];
    if (editIndex === -1) {
      next = [
        ...scales,
        {
          ...cleaned,
          id: newId(gymId, cleaned.color_name),
          gym_id: gymId,
          sort_order: scales.length + 1,
          created_at: new Date().toISOString(),
        },
      ];
    } else {
      next = scales.map((s, i) => (i === editIndex ? { ...s, ...cleaned } : s));
    }
    const ok = await persist(next, `${cleaned.color_name} gesichert`);
    if (ok) setEditIndex(null);
  };

  const handleDelete = async () => {
    if (deleteIndex === null) return;
    const removed = scales[deleteIndex];
    const next = scales.filter((_, i) => i !== deleteIndex);
    setDeleteIndex(null);
    const ok = await persist(next, `${removed.color_name} gelöscht`);
    if (ok) setEditIndex(null);
  };

  const move = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= scales.length) return;
    const next = [...scales];
    [next[index], next[target]] = [next[target], next[index]];
    persist(next, 'Reihenfolge gesichert');
  };

  const canSave = draft.color_name.trim().length > 0 && draft.difficulty_label.trim().length > 0 && !isSaving;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        {scales.length > 1 && (
          <button
            type="button"
            onClick={() => setIsReorderMode(!isReorderMode)}
            data-testid="toggle-grade-reorder-btn"
            aria-pressed={isReorderMode}
            className={`${toolBtn} ${
              isReorderMode ? 'bg-[var(--bm-strong)] text-[var(--bm-bg)]' : 'bg-[var(--bm-elevated)] text-[var(--bm-text)]'
            }`}
          >
            {isReorderMode ? 'Fertig' : 'Sortieren'}
          </button>
        )}
        {!isReorderMode && (
          <button
            type="button"
            onClick={openNew}
            data-testid="add-grade-btn"
            className={`${toolBtn} bg-[var(--bm-strong)] text-[var(--bm-bg)]`}
          >
            <Plus className="w-4 h-4" /> Farbe
          </button>
        )}
      </div>

      {scales.length === 0 ? (
        <div className="rounded-2xl bg-[var(--bm-surface)] px-4 py-8 text-center text-[15px] text-[var(--bm-text-2)]">
          Noch keine Farben.
        </div>
      ) : (
        <ol className="rounded-2xl bg-[var(--bm-surface)] overflow-hidden divide-y divide-[var(--bm-line)]" data-testid="grade-list">
          {scales.map((scale, idx) => {
            const content = (
              <>
                <span
                  className="w-7 h-7 rounded-full shrink-0 ring-1 ring-inset ring-black/20"
                  style={{ backgroundColor: scale.color_hex }}
                  aria-hidden="true"
                />
                <span className="flex-1 min-w-0">
                  <span className="block text-[16px] text-[var(--bm-text)] truncate">
                    {scale.color_name}
                    {scale.difficulty_label && <span className="text-[var(--bm-text-2)]"> · {scale.difficulty_label}</span>}
                  </span>
                  <span className="block text-[13px] text-[var(--bm-text-2)]">
                    {formatFontRange(scale.font_range_min, scale.font_range_max)}
                  </span>
                </span>
              </>
            );
            return isReorderMode ? (
              <li key={scale.id || idx} data-testid={`grade-row-${idx}`} className="flex items-center gap-3 px-3 py-1.5">
                {content}
                <button
                  type="button"
                  disabled={idx === 0 || isSaving}
                  onClick={() => move(idx, 'up')}
                  className={iconBtn}
                  aria-label={`${scale.color_name} nach oben`}
                  data-testid={`move-grade-up-${idx}`}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === scales.length - 1 || isSaving}
                  onClick={() => move(idx, 'down')}
                  className={iconBtn}
                  aria-label={`${scale.color_name} nach unten`}
                  data-testid={`move-grade-down-${idx}`}
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </li>
            ) : (
              <li key={scale.id || idx}>
                <button
                  type="button"
                  onClick={() => openEdit(idx)}
                  data-testid={`grade-row-${idx}`}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 min-h-[56px] active:bg-[var(--bm-elevated)]"
                >
                  {content}
                  <ChevronRight className="w-4 h-4 text-[var(--bm-text-3)] shrink-0" />
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <Sheet
        open={editIndex !== null && deleteIndex === null}
        onClose={() => setEditIndex(null)}
        fitContent
        testId="grade-sheet"
        ariaLabel={editIndex === -1 ? 'Neue Farbe' : draft.color_name}
      >
        <form onSubmit={handleSaveDraft} className="px-4 pb-2 space-y-4">
          <div className="flex items-center gap-3">
            <label
              className="relative w-12 h-12 rounded-full shrink-0 ring-1 ring-inset ring-black/20 cursor-pointer overflow-hidden"
              style={{ backgroundColor: draft.color_hex }}
            >
              <span className="sr-only">Farbe wählen</span>
              <input
                type="color"
                value={draft.color_hex}
                onChange={(e) => setDraft({ ...draft, color_hex: e.target.value })}
                data-testid="grade-color-input"
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </label>
            <h2 className="text-[17px] font-semibold">{editIndex === -1 ? 'Neue Farbe' : draft.color_name || 'Farbe'}</h2>
          </div>

          <label className="block space-y-1">
            <span className="text-[13px] text-[var(--bm-text-2)]">Name</span>
            <input
              type="text"
              value={draft.color_name}
              placeholder="z. B. Blau"
              onChange={(e) => setDraft({ ...draft, color_name: e.target.value })}
              data-testid="grade-name-input"
              className={inputCls}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[13px] text-[var(--bm-text-2)]">Hallengrad</span>
            <input
              type="text"
              value={draft.difficulty_label}
              placeholder="z. B. Leicht"
              onChange={(e) => setDraft({ ...draft, difficulty_label: e.target.value })}
              data-testid="grade-label-input"
              className={inputCls}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-[13px] text-[var(--bm-text-2)]">Font von</span>
              <input
                type="text"
                value={draft.font_range_min}
                placeholder="6a"
                onChange={(e) => setDraft({ ...draft, font_range_min: e.target.value })}
                data-testid="grade-font-min-input"
                className={inputCls}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[13px] text-[var(--bm-text-2)]">Font bis</span>
              <input
                type="text"
                value={draft.font_range_max}
                placeholder="6b"
                onChange={(e) => setDraft({ ...draft, font_range_max: e.target.value })}
                data-testid="grade-font-max-input"
                className={inputCls}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={!canSave}
            data-testid="grade-save-btn"
            className="w-full min-h-[48px] rounded-xl bg-[var(--bm-strong)] text-[var(--bm-bg)] text-[16px] font-semibold disabled:opacity-30"
          >
            {isSaving ? 'Wird gesichert …' : 'Sichern'}
          </button>
          {editIndex !== null && editIndex >= 0 && (
            <button
              type="button"
              onClick={() => setDeleteIndex(editIndex)}
              data-testid="grade-delete-btn"
              className="w-full min-h-[44px] rounded-xl text-[15px] font-semibold text-[var(--bm-danger)] flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Farbe löschen
            </button>
          )}
        </form>
      </Sheet>

      <ConfirmDialog
        open={deleteIndex !== null}
        title={`Farbe «${deleteIndex !== null ? scales[deleteIndex]?.color_name : ''}» löschen?`}
        message="Sie fehlt dann in der Farbauswahl der Schrauber."
        onConfirm={handleDelete}
        onCancel={() => setDeleteIndex(null)}
      />
    </div>
  );
};
