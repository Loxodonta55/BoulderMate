import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, X, Check, RefreshCw, AlertCircle, Laptop, Camera } from 'lucide-react';
import { processLocalImageFile, validateImageFile, formatBytes, ProcessedImageResult } from '../lib/imageUtils';

interface SectorPhotoUploaderProps {
  value: string;
  onChange: (photoUrl: string) => void;
  label?: string;
  helperText?: string;
  required?: boolean;
}

export const SectorPhotoUploader: React.FC<SectorPhotoUploaderProps> = ({
  value,
  onChange,
  label = 'Wandfoto (Sektor-Topo)',
  helperText = 'Lade ein Foto von deinem Laptop hoch oder gib eine Bild-URL an.',
  required = false,
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState<string>(value && !value.startsWith('data:') ? value : '');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastProcessed, setLastProcessed] = useState<ProcessedImageResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Handle local file selection
  const handleFileSelect = async (file: File) => {
    setErrorMessage(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Ungültige Datei.');
      return;
    }

    try {
      setIsProcessing(true);
      const result = await processLocalImageFile(file);
      setLastProcessed(result);
      onChange(result.dataUrl);
    } catch (err) {
      console.error('Image upload failed:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Fehler beim Verarbeiten des Bildes.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // URL mode handlers
  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setErrorMessage('Bitte gib eine gültige Bild-URL ein.');
      return;
    }
    setErrorMessage(null);
    setLastProcessed(null);
    onChange(urlInput.trim());
  };

  const handleClearPhoto = () => {
    onChange('');
    setUrlInput('');
    setLastProcessed(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const isBase64 = value && value.startsWith('data:');

  return (
    <div className="space-y-3">
      {/* Hidden file & camera inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif,.HEIC,.HEIF"
        onChange={handleInputChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="text-xs font-headline text-[var(--bm-text)] flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-[var(--bm-accent)]" />
            <span>{label}</span>
            {required && <span className="text-[var(--bm-danger)]">*</span>}
          </label>
          {helperText && <p className="text-[11px] text-[var(--bm-text-3)] font-mono mt-0.5">{helperText}</p>}
        </div>

        {/* Tabs: Laptop vs URL */}
        <div className="flex bg-[var(--bm-bg)] border border-[var(--bm-line)] rounded-xl p-0.5 text-xs font-mono self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveMode('upload');
              setErrorMessage(null);
            }}
            className={`px-3 py-1 rounded-xl flex items-center gap-1.5 transition-all ${
              activeMode === 'upload'
                ? 'bg-[var(--bm-strong)] text-[var(--bm-bg)] font-bold'
                : 'text-[var(--bm-text-2)] hover:text-[var(--bm-text)]'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Vom Laptop</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('url');
              setErrorMessage(null);
            }}
            className={`px-3 py-1 rounded-xl flex items-center gap-1.5 transition-all ${
              activeMode === 'url'
                ? 'bg-[var(--bm-strong)] text-[var(--bm-bg)] font-bold'
                : 'text-[var(--bm-text-2)] hover:text-[var(--bm-text)]'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Bild-URL</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-danger)] text-[var(--bm-danger)] text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Preview if image is present */}
      {value ? (
        <div className="relative rounded-xl border border-[var(--bm-line)] bg-[var(--bm-surface)] p-3 space-y-2.5">
          <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-[var(--bm-line)] bg-black flex items-center justify-center">
            <img
              src={value}
              alt="Sektor Wandfoto Vorschau"
              className="w-full h-full object-contain"
              onError={() => setErrorMessage('Bild konnte nicht angezeigt werden. Bitte überprüfe die Datei oder URL.')}
            />
            {/* Overlay badge */}
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-line)] text-[10px] font-mono text-[var(--bm-text)] flex items-center gap-1">
              <Check className="w-3 h-3 text-[var(--bm-success)]" />
              {isBase64 ? 'Lokales Foto (Laptop)' : 'Web-URL'}
            </div>
          </div>

          {/* Details & Actions Bar */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="text-[11px] font-mono text-[var(--bm-text-2)] truncate">
              {lastProcessed ? (
                <span>
                  Optimiert: {lastProcessed.width}×{lastProcessed.height}px ({formatBytes(lastProcessed.compressedSize)})
                </span>
              ) : isBase64 ? (
                <span>Lokales Bild aktiv</span>
              ) : (
                <span className="truncate max-w-[240px] inline-block">{value}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-2.5 py-1 text-xs font-mono text-[var(--bm-text)] hover:text-[var(--bm-strong)] bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] border border-[var(--bm-line)] rounded-xl transition flex items-center gap-1"
                title="Foto direkt mit Kamera aufnehmen"
              >
                <Camera className="w-3 h-3 text-[var(--bm-accent)]" />
                <span>Kamera</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 text-xs font-mono text-[var(--bm-text)] hover:text-[var(--bm-strong)] bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] border border-[var(--bm-line)] rounded-xl transition flex items-center gap-1"
                title="Anderes Foto wählen"
              >
                <RefreshCw className="w-3 h-3 text-[var(--bm-accent)]" />
                <span>Ändern</span>
              </button>
              <button
                type="button"
                onClick={handleClearPhoto}
                className="px-2.5 py-1 text-xs font-mono text-[var(--bm-danger)] hover:text-[var(--bm-danger)] bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] border border-[var(--bm-line)] rounded-xl transition flex items-center gap-1"
                title="Foto entfernen"
              >
                <X className="w-3 h-3" />
                <span>Entfernen</span>
              </button>
            </div>
          </div>
        </div>
      ) : activeMode === 'upload' ? (
        /* Upload Mode: Dropzone & File/Camera Button */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[var(--bm-strong)] bg-[var(--bm-elevated)]'
              : 'border-[var(--bm-line)] hover:border-[var(--bm-text-2)] bg-[var(--bm-bg)] hover:bg-[var(--bm-surface)]'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2.5">
            <div className="w-12 h-12 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] flex items-center justify-center text-[var(--bm-accent)]">
              {isProcessing ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-headline text-[var(--bm-text)]">
                {isProcessing ? 'Bild wird optimiert...' : 'Foto vom Laptop hier ablegen'}
              </p>
              <p className="text-xs font-mono text-[var(--bm-text-2)]">
                oder <span className="text-[var(--bm-accent)] underline underline-offset-2">Datei auswählen</span> (JPG, PNG, WebP bis 25 MB)
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  className="px-3 py-1.5 bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] border border-[var(--bm-accent)]/40 text-xs font-mono text-[var(--bm-text)] inline-flex items-center gap-1.5 transition"
                >
                  <Camera className="w-3.5 h-3.5 text-[var(--bm-accent)]" />
                  <span>Foto direkt aufnehmen</span>
                </button>
              </div>
            </div>

            <p className="text-[10px] font-mono text-[var(--bm-text-3)]">
              Wird automatisch auf eine optimale Wandkarten-Auflösung komprimiert.
            </p>
          </div>
        </div>
      ) : (
        /* URL Mode: Manual text input */
        <div className="space-y-2 rounded-xl border border-[var(--bm-line)] bg-[var(--bm-surface)] p-3.5">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://images.unsplash.com/photo-..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyUrl();
                }
              }}
              className="flex-1 bg-[var(--bm-bg)] border border-[var(--bm-line)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--bm-text)] focus:outline-none focus:border-[var(--bm-accent)]"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="px-4 py-2 bg-[var(--bm-strong)] hover:bg-[var(--bm-text)] text-[var(--bm-bg)] font-headline font-bold text-xs rounded-xl transition"
            >
              Übernehmen
            </button>
          </div>

          <div className="pt-2 border-t border-[var(--bm-line)]">
            <span className="text-[11px] font-mono text-[var(--bm-text-3)] block mb-1.5">Schnellauswahl Demo-Fotos:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const url = 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1600&q=80';
                  setUrlInput(url);
                  onChange(url);
                }}
                className="px-2 py-1 text-[10px] font-mono rounded-xl bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] border border-[var(--bm-line)] text-[var(--bm-text)] transition"
              >
                🧗 Wettkampfwand
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?auto=format&fit=crop&w=1600&q=80';
                  setUrlInput(url);
                  onChange(url);
                }}
                className="px-2 py-1 text-[10px] font-mono rounded-xl bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] border border-[var(--bm-line)] text-[var(--bm-text)] transition"
              >
                🧗 Dach & Höhle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for when image is present and user clicks 'Ändern' */}
      {value && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp"
          onChange={handleInputChange}
          className="hidden"
        />
      )}
    </div>
  );
};
