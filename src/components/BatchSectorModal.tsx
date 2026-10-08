import React, { useState, useRef } from 'react';
import {
  WALL_PRESETS,
  processLocalImageFile,
  readFileAsDataUrl,
  validateImageFile,
  formatBytes,
  cleanFileNameToSectorName,
  dataUrlToBlob
} from '../lib/imageUtils';
import { createSectorsBatch } from '../lib/gymStorage';
import { uploadSectorPhoto } from '../lib/supabase';
import {
  Layers,
  Upload,
  Plus,
  Trash2,
  Check,
  X,
  AlertCircle,
  Hash,
  Images,
  Loader2,
} from 'lucide-react';

export interface DraftSectorItem {
  id: string;
  name: string;
  photoUrl: string;
  file?: File;
  originalFileName?: string;
  sizeFormatted?: string;
  isPreset?: boolean;
}

interface BatchSectorModalProps {
  isOpen: boolean;
  gymId: string;
  userId: string;
  existingSectorCount?: number;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export const BatchSectorModal: React.FC<BatchSectorModalProps> = ({
  isOpen,
  gymId,
  userId,
  existingSectorCount = 0,
  onClose,
  onSuccess,
}) => {
  const [items, setItems] = useState<DraftSectorItem[]>([]);
  const [activeTab, setActiveTab] = useState<'files' | 'presets'>('files');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [numberingPrefix, setNumberingPrefix] = useState<string>('Sektor ');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    const newItems: DraftSectorItem[] = [];
    const fileArray = Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(`Datei "${file.name}" abgelehnt: ${validation.error}`);
        continue;
      }

      try {
        const previewUrl = await readFileAsDataUrl(file);
        const itemIndex = existingSectorCount + items.length + newItems.length + 1;
        const suggestedName = cleanFileNameToSectorName(file.name, itemIndex);

        newItems.push({
          id: 'draft_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          name: suggestedName,
          photoUrl: previewUrl,
          file,
          originalFileName: file.name,
          sizeFormatted: formatBytes(file.size),
          isPreset: false,
        });
      } catch (err: any) {
        setError(`Fehler beim Laden von "${file.name}": ${err.message}`);
      }
    }

    if (newItems.length > 0) {
      setItems(prev => [...prev, ...newItems]);
    }

    // Reset input so re-selecting same files triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleTogglePreset = (preset: typeof WALL_PRESETS[0]) => {
    const existingIndex = items.findIndex(item => item.photoUrl === preset.url);
    if (existingIndex >= 0) {
      setItems(prev => prev.filter((_, idx) => idx !== existingIndex));
    } else {
      const itemIndex = existingSectorCount + items.length + 1;
      setItems(prev => [
        ...prev,
        {
          id: 'draft_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          name: preset.name.replace(/\s*\([^)]*\)/, '').trim() || `Sektor ${itemIndex}`,
          photoUrl: preset.url,
          originalFileName: preset.name,
          isPreset: true,
          sizeFormatted: 'Vorlage',
        }
      ]);
    }
  };

  const handleNameChange = (id: string, newName: string) => {
    setItems(prev => prev.map(item => (item.id === id ? { ...item, name: newName } : item)));
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAutoNumberAll = () => {
    setItems(prev =>
      prev.map((item, idx) => ({
        ...item,
        name: `${numberingPrefix.trim()} ${existingSectorCount + idx + 1}`.trim(),
      }))
    );
  };

  const handleSaveBatch = async () => {
    if (items.length === 0) {
      setError('Bitte wähle mindestens ein Wandfoto aus.');
      return;
    }

    // Validate names
    for (let i = 0; i < items.length; i++) {
      if (!items[i].name || items[i].name.trim().length === 0) {
        setError(`Sektor #${i + 1} benötigt einen Namen.`);
        return;
      }
    }

    try {
      setIsProcessing(true);
      setError(null);
      const batchPayload: Array<{ name: string; wall_photo_url: string }> = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setProgressText(`Verarbeite Foto ${i + 1} von ${items.length}...`);

        let finalPhotoUrl = item.photoUrl;

        // If it's a raw user file, compress client-side and upload to Supabase Storage
        if (item.file) {
          try {
            const processed = await processLocalImageFile(item.file);
            try {
              const blob = dataUrlToBlob(processed.dataUrl);
              const uploadedUrl = await uploadSectorPhoto(
                blob,
                item.file.name || `${item.name}.jpg`,
                processed.dataUrl
              );
              finalPhotoUrl = uploadedUrl;
            } catch {
              finalPhotoUrl = processed.dataUrl;
            }
          } catch (compressErr) {
            // Fallback to raw dataUrl if canvas compression fails
            finalPhotoUrl = item.photoUrl;
          }
        }

        batchPayload.push({
          name: item.name.trim(),
          wall_photo_url: finalPhotoUrl,
        });
      }

      setProgressText(`Speichere ${batchPayload.length} Sektoren...`);
      createSectorsBatch(gymId, userId, batchPayload);

      onSuccess(batchPayload.length);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Anlegen der Sektoren.');
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      data-testid="batch-sector-modal"
    >
      <div className="bg-[var(--bm-surface)] border border-[var(--bm-line)] w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--bm-line)] flex items-center justify-between bg-[var(--bm-bg)]">
          <div className="flex items-center gap-2.5">
            <Images className="w-5 h-5 text-[var(--bm-accent)]" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--bm-text)] font-headline">
                Mehrere Sektoren auf einmal anlegen
              </h3>
              <p className="text-[11px] font-mono text-[var(--bm-text-2)]">
                Wähle mehrere Wandfotos aus deiner Galerie oder Festplatte für das schnelle Hallen-Setup
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 text-[var(--bm-text-2)] hover:text-[var(--bm-text)] hover:bg-[var(--bm-elevated)] rounded-xl transition-colors"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-4 p-3 bg-[var(--bm-bg)] border border-[var(--bm-danger)] text-[var(--bm-danger)] text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-4 sm:px-5 pt-3 border-b border-[var(--bm-line)] flex gap-2 bg-[var(--bm-bg)]">
          <button
            type="button"
            onClick={() => setActiveTab('files')}
            data-testid="tab-files-btn"
            className={`px-3 py-2 text-xs font-headline font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'files'
                ? 'border-[var(--bm-accent)] text-[var(--bm-text)]'
                : 'border-transparent text-[var(--bm-text-2)] hover:text-[var(--bm-text)]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Fotos auswählen (Mehrfachauswahl)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            data-testid="tab-presets-btn"
            className={`px-3 py-2 text-xs font-headline font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'border-[var(--bm-accent)] text-[var(--bm-text)]'
                : 'border-transparent text-[var(--bm-text-2)] hover:text-[var(--bm-text)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Wandvorlagen ({WALL_PRESETS.length})</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Tab 1: File Dropzone & Selector */}
          {activeTab === 'files' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.heic,.heif,.HEIC,.HEIF"
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
                id="multi-sector-file-input"
                data-testid="multi-sector-file-input"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  isDragOver
                    ? 'border-[var(--bm-accent)] bg-[var(--bm-accent)]/10'
                    : 'border-[var(--bm-line)] hover:border-[var(--bm-text-2)] bg-[var(--bm-bg)]'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[var(--bm-elevated)] border border-[var(--bm-line)] flex items-center justify-center text-[var(--bm-accent)]">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="font-headline font-bold text-sm text-[var(--bm-text)]">
                  Mehrere Fotos auswählen oder hier ablegen
                </div>
                <p className="text-xs text-[var(--bm-text-2)] font-mono max-w-md">
                  Wähle beliebig viele Wandfotos aus deiner Galerie (z.B. iPhone / Android Mehrfachauswahl) oder Festplatte (JPG, PNG, WebP).
                </p>
                <button
                  type="button"
                  className="mt-2 px-4 py-2 bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] text-[var(--bm-text)] border border-[var(--bm-line)] rounded-xl text-xs font-headline flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-[var(--bm-accent)]" />
                  <span>Fotos von Gerät wählen</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Wall Presets Selection */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--bm-text-2)] font-mono">
                Wähle die gewünschten Wandvorlagen aus, um sie als Sektoren hinzuzufügen:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1">
                {WALL_PRESETS.map((preset) => {
                  const isSelected = items.some(item => item.photoUrl === preset.url);
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleTogglePreset(preset)}
                      data-testid={`preset-item-${preset.id}`}
                      className={`border p-2 cursor-pointer transition-all flex flex-col gap-1.5 relative ${
                        isSelected
                          ? 'border-[var(--bm-accent)] bg-[var(--bm-accent)]/10'
                          : 'border-[var(--bm-line)] hover:border-[var(--bm-text-2)] bg-[var(--bm-bg)]'
                      }`}
                    >
                      <div className="relative aspect-video bg-black overflow-hidden">
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-[var(--bm-accent)] text-[var(--bm-bg)] p-0.5 rounded-full">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-[var(--bm-text)] truncate font-headline">
                        {preset.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Sectors List */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--bm-elevated)] pb-2">
              <div className="flex items-center gap-2">
                <span className="font-headline font-bold text-xs text-[var(--bm-text)]">
                  Ausgewählte Sektoren ({items.length})
                </span>
                {items.length > 0 && (
                  <span className="text-[10px] font-mono bg-[var(--bm-elevated)] px-2 py-0.5 text-[var(--bm-accent)] border border-[var(--bm-line)]">
                    Bereit zum Speichern
                  </span>
                )}
              </div>

              {items.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={numberingPrefix}
                    onChange={(e) => setNumberingPrefix(e.target.value)}
                    placeholder="Präfix"
                    className="w-24 bg-[var(--bm-bg)] border border-[var(--bm-line)] px-2 py-1 text-xs text-[var(--bm-text)] font-mono"
                    title="Präfix für automatische Nummerierung"
                  />
                  <button
                    type="button"
                    onClick={handleAutoNumberAll}
                    className="px-2.5 py-1 bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] text-[var(--bm-text-2)] hover:text-[var(--bm-text)] border border-[var(--bm-line)] rounded-xl text-[11px] font-headline flex items-center gap-1"
                    title="Alle Sektoren durchnummerieren (z.B. Sektor 1, Sektor 2...)"
                  >
                    <Hash className="w-3 h-3 text-[var(--bm-accent)]" />
                    <span>Durchnummerieren</span>
                  </button>
                </div>
              )}
            </div>

            {items.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[var(--bm-elevated)] bg-[var(--bm-bg)] text-xs font-mono text-[var(--bm-text-2)]">
                Noch keine Fotos ausgewählt. Wähle oben mehrere Dateien aus oder klicke auf Wandvorlagen.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-[var(--bm-bg)] border border-[var(--bm-line)] flex items-center justify-between gap-3"
                    data-testid={`draft-sector-item-${idx}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] text-[11px] font-mono font-bold text-[var(--bm-accent)] flex items-center justify-center shrink-0">
                        #{existingSectorCount + idx + 1}
                      </span>
                      <div className="w-14 h-10 bg-black shrink-0 border border-[var(--bm-line)] overflow-hidden">
                        <img src={item.photoUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleNameChange(item.id, e.target.value)}
                          placeholder="Sektorname eingeben"
                          className="w-full bg-[var(--bm-surface)] border border-[var(--bm-line)] px-2.5 py-1 text-xs text-[var(--bm-text)] font-sans focus:outline-none focus:border-[var(--bm-accent)]"
                          aria-label={`Sektorname für Bild ${idx + 1}`}
                        />
                        {item.sizeFormatted && (
                          <span className="text-[9px] font-mono text-[var(--bm-text-2)] block mt-0.5 truncate">
                            {item.originalFileName ? `${item.originalFileName} (${item.sizeFormatted})` : item.sizeFormatted}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 text-[var(--bm-text-2)] hover:text-[var(--bm-danger)] hover:bg-[var(--bm-elevated)] rounded-xl transition-colors border border-transparent hover:border-[var(--bm-line)] shrink-0"
                      title="Aus Liste entfernen"
                      aria-label={`Entferne Sektor ${idx + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 sm:p-5 border-t border-[var(--bm-line)] bg-[var(--bm-bg)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-mono text-[var(--bm-text-2)] w-full sm:w-auto">
            {isProcessing ? (
              <div className="flex items-center gap-2 text-[var(--bm-accent)]">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>{progressText}</span>
              </div>
            ) : items.length > 0 ? (
              <span>
                {items.length} {items.length === 1 ? 'Sektor' : 'Sektoren'} bereit zur Erstellung
              </span>
            ) : (
              <span>Wähle Fotos aus, um fortzufahren</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 sm:flex-none px-4 py-2 bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] text-[var(--bm-text-2)] hover:text-[var(--bm-text)] border border-[var(--bm-line)] text-xs font-headline rounded-xl"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSaveBatch}
              disabled={isProcessing || items.length === 0}
              data-testid="batch-save-submit-btn"
              className="flex-1 sm:flex-none px-5 py-2 bg-[var(--bm-strong)] hover:bg-[var(--bm-text)] disabled:opacity-30 text-[var(--bm-bg)] font-bold text-xs font-headline rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Speichere...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>
                    {items.length > 0
                      ? `Alle ${items.length} Sektoren anlegen`
                      : 'Sektoren anlegen'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
