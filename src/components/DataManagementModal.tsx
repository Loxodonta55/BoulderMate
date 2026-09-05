import React, { useState } from 'react';
import { Boulder } from '../types/boulder';
import { exportBouldersToJson, importBouldersFromJson } from '../lib/storage';
import { Download, Upload, Copy, Check, AlertCircle, X, Database } from 'lucide-react';

interface Props {
  boulders: Boulder[];
  onImportComplete: () => void;
  onClose: () => void;
}

export const DataManagementModal: React.FC<Props> = ({ boulders, onImportComplete, onClose }) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  const jsonString = exportBouldersToJson(boulders);

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boulder-app-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = () => {
    if (!importText.trim()) {
      setImportStatus({ success: false, message: 'Bitte füge JSON-Inhalt ein oder wähle eine Datei aus.' });
      return;
    }

    try {
      const res = importBouldersFromJson(importText, importMode);
      setImportStatus({
        success: true,
        message: `Erfolgreich ${res.count} Boulder ${importMode === 'merge' ? 'zusammengeführt' : 'importiert'}!`
      });
      setTimeout(() => {
        onImportComplete();
        onClose();
      }, 1200);
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: err.message || 'Fehler beim Importieren der Daten.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#1E1E1E] border border-[#333333] rounded-none w-full max-w-xl overflow-hidden space-y-4">
        {/* Header */}
        <div className="p-5 border-b border-[#333333] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2A2A2A] text-[#C9A96E] border border-[#333333] rounded-none">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-headline uppercase tracking-wider text-[#E8E0D4]">Datenverwaltung & Backup</h3>
              <p className="text-xs font-mono text-[#A89F91]">JSON Export und Import zur vollständigen Datenkontrolle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#6B6358] hover:text-[#E8E0D4] hover:bg-[#2A2A2A] rounded-[2px] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5">
          <div className="flex bg-[#121212] p-1 rounded-none border border-[#333333] text-xs">
            <button
              onClick={() => {
                setActiveTab('export');
                setImportStatus(null);
              }}
              className={`flex-1 py-2 rounded-[2px] font-headline uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'export' ? 'bg-[#F5F0E8] text-[#121212] font-bold' : 'text-[#A89F91] hover:text-[#E8E0D4]'
              }`}
            >
              <Download className="w-3.5 h-3.5" /> Exportieren ({boulders.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('import');
                setImportStatus(null);
              }}
              className={`flex-1 py-2 rounded-[2px] font-headline uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'import' ? 'bg-[#F5F0E8] text-[#121212] font-bold' : 'text-[#A89F91] hover:text-[#E8E0D4]'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Importieren
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5 space-y-4">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div className="text-xs text-[#A89F91] font-mono">
                Sichere alle deine erfassten Boulder ({boulders.length} Einträge) als standardisierte JSON-Datei:
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  rows={8}
                  value={jsonString}
                  className="w-full bg-[#121212] border border-[#333333] rounded-none p-3 text-xs font-mono text-[#A89F91] select-all focus:outline-none focus:border-[#C9A96E]"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 px-4 bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] font-headline uppercase font-bold tracking-wider text-xs rounded-[2px] flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" /> Datei herunterladen (.json)
                </button>
                <button
                  onClick={handleCopy}
                  className="py-2.5 px-4 bg-[#2A2A2A] hover:bg-[#333333] text-[#E8E0D4] border border-[#333333] hover:border-[#F5F0E8] font-mono text-xs rounded-[2px] flex items-center gap-2 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-[#C9A96E]" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Kopiert!' : 'Kopieren'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-[#A89F91] font-mono">
                Lade eine JSON-Sicherungsdatei hoch oder füge den JSON-Code direkt ein:
              </div>

              {/* Mode Select */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs font-mono">
                <label className="flex items-center gap-2 cursor-pointer text-[#A89F91] hover:text-[#E8E0D4]">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="accent-[#C9A96E]"
                  />
                  <span>Zusammenführen (Merge - bestehende behalten)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[#A89F91] hover:text-[#E8E0D4]">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="accent-[#C9A96E]"
                  />
                  <span>Ersetzen (Replace - alles überschreiben)</span>
                </label>
              </div>

              {/* File Upload Button */}
              <div>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-[#A89F91] font-mono file:mr-3 file:py-2 file:px-4 file:rounded-[2px] file:border-0 file:text-xs file:font-semibold file:bg-[#2A2A2A] file:text-[#E8E0D4] hover:file:bg-[#333333] cursor-pointer"
                />
              </div>

              <textarea
                rows={6}
                placeholder="Oder füge hier das JSON ein..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full bg-[#121212] border border-[#333333] rounded-none p-3 text-xs font-mono text-[#E8E0D4] placeholder-[#6B6358] focus:outline-none focus:border-[#C9A96E]"
              />

              {importStatus && (
                <div
                  className={`p-3 rounded-none border text-xs font-mono flex items-center gap-2 ${
                    importStatus.success
                      ? 'bg-[#121212] border-[#4A5D3A] text-[#4A5D3A]'
                      : 'bg-[#121212] border-[#A0522D] text-[#A0522D]'
                  }`}
                >
                  {importStatus.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{importStatus.message}</span>
                </div>
              )}

              <button
                onClick={handleImportSubmit}
                className="w-full py-2.5 px-4 bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] font-headline uppercase font-bold tracking-wider text-xs rounded-[2px] flex items-center justify-center gap-2 transition-all"
              >
                <Upload className="w-4 h-4" /> Import jetzt ausführen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
