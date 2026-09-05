import React, { useState, useRef } from 'react';
import { WALL_PRESETS, WallPreset, processUploadedImage } from '../lib/imageUtils';
import { Upload, Image as ImageIcon, Link as LinkIcon, Check, X, AlertCircle, Laptop } from 'lucide-react';

interface WallPhotoUploadModalProps {
  isOpen: boolean;
  sectorName: string;
  currentPhotoUrl?: string;
  onClose: () => void;
  onPhotoSelected: (photoUrl: string) => void;
}

export const WallPhotoUploadModal: React.FC<WallPhotoUploadModalProps> = ({
  isOpen,
  sectorName,
  currentPhotoUrl,
  onClose,
  onPhotoSelected,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [selectedPhoto, setSelectedPhoto] = useState<string>(currentPhotoUrl || (WALL_PRESETS[0]?.url || ''));
  const [urlInput, setUrlInput] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const dataUrl = await processUploadedImage(file);
      setSelectedPhoto(dataUrl);
      setFileName(`${file.name} (${(file.size / 1024).toFixed(0)} KB)`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Fehler beim Laden des Bildes.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setErrorMessage('Bitte gib eine gültige Bild-URL ein.');
      return;
    }
    setSelectedPhoto(urlInput.trim());
    setErrorMessage(null);
  };

  const handleConfirm = () => {
    if (!selectedPhoto) {
      setErrorMessage('Bitte wähle zuerst ein Wandfoto aus.');
      return;
    }
    onPhotoSelected(selectedPhoto);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121110]/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-[#181614] border border-[#38332e] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#2a2622] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#221f1c] text-[#d97706] border border-[#38332e]">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-headline uppercase tracking-wider text-[#f4efe6]">
                Wandfoto auswählen oder hochladen
              </h2>
              <p className="text-xs font-mono text-[#a89f91]">Sektor: {sectorName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#a89f91] hover:text-[#f4efe6] hover:bg-[#221f1c] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="p-2 border-b border-[#2a2622] bg-[#121110] flex gap-1.5">
          <button
            type="button"
            onClick={() => { setActiveTab('upload'); setErrorMessage(null); }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-headline uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
              activeTab === 'upload'
                ? 'bg-[#d97706] text-[#121110] font-bold shadow'
                : 'text-[#a89f91] hover:text-[#f4efe6] hover:bg-[#1a1715]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Datei vom Computer</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('presets'); setErrorMessage(null); }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-headline uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
              activeTab === 'presets'
                ? 'bg-[#d97706] text-[#121110] font-bold shadow'
                : 'text-[#a89f91] hover:text-[#f4efe6] hover:bg-[#1a1715]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Hallen-Wände (Presets)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('url'); setErrorMessage(null); }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-headline uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
              activeTab === 'url'
                ? 'bg-[#d97706] text-[#121110] font-bold shadow'
                : 'text-[#a89f91] hover:text-[#f4efe6] hover:bg-[#1a1715]'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Web-URL</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-[#ea580c]/10 border border-[#ea580c]/30 text-[#ea580c] text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: File Upload from Laptop */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp"
                className="hidden"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-[#d97706] bg-[#d97706]/10'
                    : 'border-[#38332e] hover:border-[#a89f91] bg-[#121110]/70 hover:bg-[#1f1c19]'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#221f1c] border border-[#38332e] flex items-center justify-center text-[#d97706] shadow">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-headline uppercase tracking-wider text-[#f4efe6]">
                    Wandfoto vom Laptop auswählen
                  </p>
                  <p className="text-xs font-mono text-[#a89f91] mt-1">
                    Klicken zum Durchsuchen oder Bild hierher ziehen (JPG, PNG, WebP)
                  </p>
                </div>
                {fileName && (
                  <span className="text-xs font-mono text-[#d97706] bg-[#d97706]/10 border border-[#d97706]/30 px-3 py-1 rounded-lg">
                    ✓ {fileName}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Wall Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs font-mono text-[#a89f91]">
                Wähle eine der realistischen Boulderhallen-Wände aus:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {WALL_PRESETS.map((preset: WallPreset) => {
                  const isSelected = selectedPhoto === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedPhoto(preset.url);
                        setFileName(null);
                        setErrorMessage(null);
                      }}
                      className={`group relative rounded-xl overflow-hidden border text-left transition-all flex flex-col ${
                        isSelected
                          ? 'border-[#d97706] shadow-[0_0_12px_rgba(217,119,6,0.3)]'
                          : 'border-[#38332e] hover:border-[#575046] opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="h-28 w-full overflow-hidden bg-[#121110]">
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                      <div className="p-2.5 bg-[#141210] flex-1 flex flex-col justify-between">
                        <p className="text-xs font-headline uppercase tracking-wide text-[#f4efe6] leading-snug">{preset.name}</p>
                        <p className="text-[10px] font-mono text-[#78716c] mt-0.5 line-clamp-2">{preset.description}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded bg-[#d97706] text-[#121110] flex items-center justify-center font-bold text-xs shadow">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Web-URL */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <label className="block text-xs font-headline uppercase tracking-wider text-[#d4cdc3]">
                Öffentliche Bild-URL eingeben:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 bg-[#121110] border border-[#38332e] rounded-lg text-[#f4efe6] text-xs font-mono placeholder:text-[#575046] focus:outline-none focus:border-[#d97706]"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-[#221f1c] hover:bg-[#2a2622] text-[#f4efe6] rounded-lg text-xs font-mono border border-[#38332e]"
                >
                  Vorschau
                </button>
              </div>
            </div>
          )}

          {/* Live Preview */}
          {selectedPhoto && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-headline uppercase tracking-wider text-[#a89f91]">
                  Aktuelle Bildvorschau:
                </span>
                <span className="text-[10px] font-mono text-[#d97706] flex items-center gap-1">
                  <Check className="w-3 h-3" /> Ausgewählt
                </span>
              </div>
              <div className="relative rounded-xl overflow-hidden border border-[#38332e] bg-[#121110] max-h-48">
                <img
                  src={selectedPhoto}
                  alt="Wandvorschau"
                  className="w-full h-48 object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#2a2622] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#221f1c] text-[#d4cdc3] text-xs font-headline uppercase tracking-wider hover:bg-[#2a2622] transition border border-[#38332e]"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedPhoto || isProcessing}
            className="px-5 py-2 rounded-lg bg-[#d97706] hover:bg-[#b45309] text-[#121110] font-headline uppercase font-bold tracking-wider text-xs shadow-md flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
            <span>Wandfoto übernehmen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
