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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-[#1E1E1E] border border-[#333333] rounded-none overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#333333] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-none bg-[#2A2A2A] text-[#C9A96E] border border-[#333333]">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
                Wandfoto auswählen oder hochladen
              </h2>
              <p className="text-xs font-mono text-[#A89F91]">Sektor: {sectorName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[2px] text-[#6B6358] hover:text-[#E8E0D4] hover:bg-[#2A2A2A] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="p-2 border-b border-[#333333] bg-[#121212] flex gap-1.5">
          <button
            type="button"
            onClick={() => { setActiveTab('upload'); setErrorMessage(null); }}
            className={`flex-1 py-1.5 px-3 rounded-[2px] text-xs font-headline uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
              activeTab === 'upload'
                ? 'bg-[#F5F0E8] text-[#121212] font-bold'
                : 'text-[#A89F91] hover:text-[#E8E0D4] hover:bg-[#2A2A2A]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Datei vom Computer</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('presets'); setErrorMessage(null); }}
            className={`flex-1 py-1.5 px-3 rounded-[2px] text-xs font-headline uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
              activeTab === 'presets'
                ? 'bg-[#F5F0E8] text-[#121212] font-bold'
                : 'text-[#A89F91] hover:text-[#E8E0D4] hover:bg-[#2A2A2A]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Hallen-Wände (Presets)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('url'); setErrorMessage(null); }}
            className={`flex-1 py-1.5 px-3 rounded-[2px] text-xs font-headline uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
              activeTab === 'url'
                ? 'bg-[#F5F0E8] text-[#121212] font-bold'
                : 'text-[#A89F91] hover:text-[#E8E0D4] hover:bg-[#2A2A2A]'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Web-URL</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-none bg-[#121212] border border-[#A0522D] text-[#A0522D] text-xs font-mono flex items-center gap-2">
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
                className={`border-2 border-dashed rounded-none p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-[#F5F0E8] bg-[#2A2A2A]'
                    : 'border-[#333333] hover:border-[#8B8680] bg-[#121212] hover:bg-[#1E1E1E]'
                }`}
              >
                <div className="w-12 h-12 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#C9A96E]">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
                    Wandfoto vom Laptop auswählen
                  </p>
                  <p className="text-xs font-sans text-[#A89F91] mt-1">
                    Klicken zum Durchsuchen oder Bild hierher ziehen (JPG, PNG, WebP)
                  </p>
                </div>
                {fileName && (
                  <span className="text-xs font-mono text-[#C9A96E] bg-[#2A2A2A] border border-[#333333] px-3 py-1 rounded-none">
                    ✓ {fileName}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Wall Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs font-mono text-[#A89F91]">
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
                      className={`group relative rounded-none overflow-hidden border text-left transition-all flex flex-col ${
                        isSelected
                          ? 'border-[#F5F0E8]'
                          : 'border-[#333333] hover:border-[#8B8680] opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="h-28 w-full overflow-hidden bg-black">
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        />
                      </div>
                      <div className="p-2.5 bg-[#1E1E1E] flex-1 flex flex-col justify-between">
                        <p className="text-xs font-headline font-bold uppercase tracking-wide text-[#E8E0D4] leading-snug">{preset.name}</p>
                        <p className="text-[10px] font-mono text-[#6B6358] mt-0.5 line-clamp-2">{preset.description}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-none bg-[#F5F0E8] text-[#121212] flex items-center justify-center font-bold text-xs">
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
              <label className="block text-xs font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
                Öffentliche Bild-URL eingeben:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 bg-[#121212] border border-[#333333] rounded-none text-[#E8E0D4] text-xs font-mono placeholder:text-[#6B6358] focus:outline-none focus:border-[#C9A96E]"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-[#2A2A2A] hover:bg-[#333333] text-[#E8E0D4] rounded-[2px] text-xs font-mono border border-[#333333]"
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
                <span className="text-[11px] font-headline font-bold uppercase tracking-wider text-[#A89F91]">
                  Aktuelle Bildvorschau:
                </span>
                <span className="text-[10px] font-mono text-[#4A5D3A] flex items-center gap-1">
                  <Check className="w-3 h-3" /> Ausgewählt
                </span>
              </div>
              <div className="relative rounded-none overflow-hidden border border-[#333333] bg-black max-h-48">
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
        <div className="p-4 border-t border-[#333333] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[2px] bg-[#2A2A2A] text-[#E8E0D4] text-xs font-headline uppercase tracking-wider hover:bg-[#333333] transition border border-[#333333]"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedPhoto || isProcessing}
            className="px-5 py-2 rounded-[2px] bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] font-headline uppercase font-bold tracking-wider text-xs flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
            <span>Wandfoto übernehmen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
