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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl space-y-4">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Datenverwaltung & Backup</h3>
              <p className="text-xs text-slate-400">JSON Export und Import zur vollständigen Datenkontrolle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setActiveTab('export');
                setImportStatus(null);
              }}
              className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'export' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" /> Exportieren ({boulders.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('import');
                setImportStatus(null);
              }}
              className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'import' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
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
              <div className="text-xs text-slate-300">
                Sichere alle deine erfassten Boulder ({boulders.length} Einträge) als standardisierte JSON-Datei.
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  rows={8}
                  value={jsonString}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-400 select-all focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
                >
                  <Download className="w-4 h-4" /> Datei herunterladen (.json)
                </button>
                <button
                  onClick={handleCopy}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl flex items-center gap-2 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Kopiert!' : 'Kopieren'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-slate-300">
                Lade eine JSON-Sicherungsdatei hoch oder füge den JSON-Code direkt ein:
              </div>

              {/* Mode Select */}
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="accent-emerald-500"
                  />
                  <span>Zusammenführen (Merge - bestehende behalten)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="accent-emerald-500"
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
                  className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              <textarea
                rows={6}
                placeholder="Oder füge hier das JSON ein..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />

              {importStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    importStatus.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {importStatus.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{importStatus.message}</span>
                </div>
              )}

              <button
                onClick={handleImportSubmit}
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
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
