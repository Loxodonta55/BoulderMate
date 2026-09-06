import React, { useState, useRef, useEffect } from 'react';
import {
  WALL_PRESETS,
  WallPreset,
  processUploadedImage,
  captureVideoFrame,
  isCameraSupported
} from '../lib/imageUtils';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Check,
  X,
  AlertCircle,
  SwitchCamera,
  RotateCcw,
  Smartphone,
  Crosshair
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'presets' | 'url'>('upload');
  const [selectedPhoto, setSelectedPhoto] = useState<string>(currentPhotoUrl || (WALL_PRESETS[0]?.url || ''));
  const [urlInput, setUrlInput] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Live Camera states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [shutterFlash, setShutterFlash] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
      } catch (e) {
        // Ignore track stopping errors
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async (facing: 'environment' | 'user' = cameraFacingMode) => {
    setCameraError(null);
    setIsStartingCamera(true);

    try {
      if (!isCameraSupported()) {
        throw new Error('Kamerazugriff im aktuellen Browser nicht verfügbar. Bitte nutze die System-Kamera oder lade eine Bilddatei hoch.');
      }

      // Stop previous tracks if running
      stopCamera();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      setIsCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Kamerazugriff verweigert. Bitte erlaube den Kamerazugriff in deinen Browser-Einstellungen oder nutze den Button "System-Kamera öffnen".');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Keine Kamera am Gerät gefunden. Nutze die System-Kamera oder den Datei-Upload.');
      } else {
        setCameraError(err.message || 'Kamera konnte nicht gestartet werden.');
      }
    } finally {
      setIsStartingCamera(false);
    }
  };

  // Switch camera facing mode
  const handleToggleFacingMode = () => {
    const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Capture frame from active camera stream
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    try {
      setShutterFlash(true);
      setTimeout(() => setShutterFlash(false), 180);

      const dataUrl = captureVideoFrame(videoRef.current, 1600, 0.85);
      if (!dataUrl) {
        throw new Error('Konnte kein Bild vom Live-Sucher aufnehmen.');
      }

      setSelectedPhoto(dataUrl);
      const timeStr = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setFileName(`Kamerafoto_${timeStr}.jpg`);
      stopCamera();
    } catch (err: any) {
      setErrorMessage(err.message || 'Fehler bei der Aufnahme.');
    }
  };

  // Native mobile camera input handler
  const handleCameraFileCapture = async (file: File) => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const dataUrl = await processUploadedImage(file);
      setSelectedPhoto(dataUrl);
      setFileName(`${file.name || 'Kameraaufnahme.jpg'} (${(file.size / 1024).toFixed(0)} KB)`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Fehler beim Verarbeiten des Fotos.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Lifecycle for camera stream
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera(cameraFacingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleClose = () => {
    stopCamera();
    onClose();
  };

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
      setErrorMessage('Bitte wähle zuerst ein Wandfoto aus oder nimm eines auf.');
      return;
    }
    stopCamera();
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
        <div className="p-4 border-b border-[#333333] flex items-center justify-between bg-[#121212]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-none bg-[#2A2A2A] text-[#C9A96E] border border-[#333333]">
              <Camera className="w-5 h-5" />
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
            onClick={handleClose}
            className="p-1.5 rounded-[2px] text-[#6B6358] hover:text-[#E8E0D4] hover:bg-[#2A2A2A] transition"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="p-2 border-b border-[#333333] bg-[#121212] flex flex-wrap gap-1.5">
          {/* TAB 1: Live Camera */}
          <button
            type="button"
            onClick={() => { setActiveTab('camera'); setErrorMessage(null); }}
            className={`flex-1 py-1.5 px-2.5 rounded-[2px] text-xs font-headline uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
              activeTab === 'camera'
                ? 'bg-[#F5F0E8] text-[#121212] font-bold'
                : 'text-[#A89F91] hover:text-[#E8E0D4] hover:bg-[#2A2A2A]'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-[#C9A96E]" />
            <span>Foto machen</span>
          </button>

          {/* TAB 2: File Upload */}
          <button
            type="button"
            onClick={() => { setActiveTab('upload'); setErrorMessage(null); }}
            className={`flex-1 py-1.5 px-2.5 rounded-[2px] text-xs font-headline uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
              activeTab === 'upload'
                ? 'bg-[#F5F0E8] text-[#121212] font-bold'
                : 'text-[#A89F91] hover:text-[#E8E0D4] hover:bg-[#2A2A2A]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Datei vom Computer</span>
          </button>

          {/* TAB 3: Presets */}
          <button
            type="button"
            onClick={() => { setActiveTab('presets'); setErrorMessage(null); }}
            className={`flex-1 py-1.5 px-2.5 rounded-[2px] text-xs font-headline uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
              activeTab === 'presets'
                ? 'bg-[#F5F0E8] text-[#121212] font-bold'
                : 'text-[#A89F91] hover:text-[#E8E0D4] hover:bg-[#2A2A2A]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Hallen-Wände (Presets)</span>
          </button>

          {/* TAB 4: Web URL */}
          <button
            type="button"
            onClick={() => { setActiveTab('url'); setErrorMessage(null); }}
            className={`flex-1 py-1.5 px-2.5 rounded-[2px] text-xs font-headline uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
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

          {/* TAB 1: Live Camera / Foto machen */}
          {activeTab === 'camera' && (
            <div className="space-y-4 font-mono">
              {/* Native mobile camera fallback input */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                data-testid="native-camera-input"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleCameraFileCapture(e.target.files[0]);
                  }
                }}
              />

              {isCameraActive ? (
                <div className="relative w-full h-72 sm:h-80 bg-black rounded-none overflow-hidden border border-[#333333]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    data-testid="camera-video-viewfinder"
                  />

                  {/* Shutter flash animation */}
                  {shutterFlash && (
                    <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-150 pointer-events-none" />
                  )}

                  {/* Viewfinder overlay & brackets */}
                  <div className="absolute inset-0 pointer-events-none border-2 border-[#C9A96E]/30 m-3 flex flex-col justify-between p-2">
                    <div className="flex items-center justify-between pointer-events-auto">
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-black/75 border border-[#C9A96E]/50 text-[#C9A96E] text-[10px] font-mono uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Live-Sucher
                      </span>

                      <button
                        type="button"
                        onClick={handleToggleFacingMode}
                        className="p-1.5 rounded-none bg-black/75 hover:bg-black text-[#E8E0D4] border border-[#333333] transition"
                        title="Kamera wechseln"
                      >
                        <SwitchCamera className="w-4 h-4 text-[#C9A96E]" />
                      </button>
                    </div>

                    <div className="flex items-center justify-center">
                      <Crosshair className="w-8 h-8 text-[#C9A96E]/40 stroke-[1]" />
                    </div>

                    <div className="text-center">
                      <span className="text-[10px] text-[#E8E0D4] bg-black/75 px-2.5 py-1 border border-black/50">
                        Wand im Sucher ausrichten & Auslöser drücken
                      </span>
                    </div>
                  </div>

                  {/* Shutter Capture Button */}
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center z-20">
                    <button
                      type="button"
                      onClick={handleCapturePhoto}
                      className="group flex items-center gap-2 px-5 py-2.5 rounded-none bg-[#C9A96E] hover:bg-[#F5F0E8] text-[#121212] font-headline uppercase font-bold tracking-wider text-xs shadow-lg transition border border-[#121212]"
                      data-testid="capture-photo-button"
                    >
                      <Camera className="w-4 h-4 text-[#121212] group-hover:scale-110 transition-transform" />
                      <span>Foto schießen</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Camera not active / start screen */
                <div className="border border-[#333333] bg-[#121212] p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#C9A96E] mx-auto">
                    <Camera className="w-7 h-7" />
                  </div>

                  <div>
                    <h3 className="text-sm font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
                      Direkt aus der App fotografieren
                    </h3>
                    <p className="text-xs font-sans text-[#A89F91] mt-1 max-w-sm mx-auto">
                      Nimm ein frisches Wandfoto der Boulderwand direkt mit deiner Kamera auf.
                    </p>
                  </div>

                  {cameraError && (
                    <div className="p-3 rounded-none bg-[#1E1E1E] border border-[#A0522D] text-[#A0522D] text-xs font-mono text-left flex items-start gap-2 max-w-md mx-auto">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => startCamera(cameraFacingMode)}
                      disabled={isStartingCamera}
                      className="w-full sm:w-auto px-4 py-2.5 bg-[#C9A96E] hover:bg-[#F5F0E8] text-[#121212] rounded-none font-headline font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50"
                      data-testid="start-camera-button"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isStartingCamera ? 'Kamera startet...' : 'Live-Kamera starten'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full sm:w-auto px-4 py-2.5 bg-[#2A2A2A] hover:bg-[#333333] text-[#E8E0D4] border border-[#333333] rounded-none font-mono text-xs flex items-center justify-center gap-2 transition"
                      data-testid="open-system-camera-button"
                    >
                      <Smartphone className="w-4 h-4 text-[#C9A96E]" />
                      <span>System-Kamera öffnen</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Option to retake if photo already selected */}
              {selectedPhoto && !isCameraActive && (
                <div className="flex items-center justify-between pt-1">
                  {fileName && (
                    <span className="text-xs font-mono text-[#C9A96E] bg-[#2A2A2A] border border-[#333333] px-2.5 py-1 rounded-none">
                      ✓ {fileName}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPhoto('');
                      setFileName(null);
                      startCamera(cameraFacingMode);
                    }}
                    className="text-xs font-mono text-[#C9A96E] hover:underline flex items-center gap-1.5 ml-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Foto wiederholen (Erneut fotografieren)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: File Upload from Laptop */}
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
