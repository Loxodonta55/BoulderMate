import React, { useState } from 'react';
import { UserProfile } from '../types/boulder';
import { X, ArrowLeft, Camera, User, LogOut, Trash2, Check, AlertTriangle, RotateCcw } from 'lucide-react';
import { processLocalImageFile } from '../lib/imageUtils';
import { clearAppCacheAndReload } from '../lib/syncService';

interface ProfileSettingsModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: { nickname?: string; avatarUrl?: string }) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSave,
  onLogout,
  onDeleteAccount,
}) => {
  const [nickname, setNickname] = useState(profile.nickname);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      const result = await processLocalImageFile(file, 400, 0.85);
      setAvatarUrl(result.dataUrl);
    } catch (err) {
      console.error('Error processing avatar image:', err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    onSave({
      nickname: nickname.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
    });
    setSaveSuccess(true);
    timeoutRef.current = setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[var(--bm-surface)] border border-[var(--bm-line)] rounded-xl overflow-hidden my-4 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--bm-line)] bg-[var(--bm-surface)] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-mono text-[var(--bm-text-2)] hover:text-[var(--bm-text)] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zurück</span>
          </button>

          <h2 className="text-sm font-headline font-bold text-[var(--bm-text)]">
            Einstellungen
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-[var(--bm-text-3)] hover:text-[var(--bm-text)] hover:bg-[var(--bm-elevated)] transition"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-6">
          {/* Avatar Section - SPEC-005: square 0px avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="w-20 h-20 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={nickname} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-mono font-bold text-[var(--bm-strong)]">
                    {nickname.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label
                htmlFor="avatar-file-input"
                className="absolute bottom-0 right-0 p-1.5 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] text-[var(--bm-strong)] cursor-pointer hover:bg-[var(--bm-line)] transition"
                title="Profilbild ändern"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  id="avatar-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
            </div>
            <div className="text-center">
              <label
                htmlFor="avatar-file-input"
                className="text-xs font-mono text-[var(--bm-accent)] hover:underline cursor-pointer"
              >
                {isProcessingImage ? 'Wird optimiert...' : 'Foto hochladen / ändern'}
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="block text-[10px] font-mono text-[var(--bm-text-3)] hover:text-[var(--bm-danger)] mt-0.5 mx-auto"
                >
                  Foto entfernen
                </button>
              )}
            </div>
          </div>

          {/* Nickname Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[var(--bm-text-2)] block">
              Nickname
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[var(--bm-text-3)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="Dein Kletter-Name"
                required
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-line)] text-sm text-[var(--bm-text)] placeholder-[var(--bm-text-3)] focus:outline-none focus:border-[var(--bm-accent)] transition font-mono"
                data-testid="input-nickname"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={!nickname.trim() || saveSuccess}
            className="w-full py-2.5 rounded-xl text-xs font-headline font-bold bg-[var(--bm-strong)] hover:bg-[var(--bm-text)] text-[var(--bm-bg)] transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            data-testid="btn-save-profile"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Gespeichert!</span>
              </>
            ) : (
              <span>Speichern</span>
            )}
          </button>

          {/* Divider */}
          <div className="border-t border-[var(--bm-line)] pt-4 space-y-3">
            {/* Cache leeren & Cloud-Stand laden */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Möchtest du den lokalen Gerätespeicher leeren und alle Daten frisch von der Cloud laden?')) {
                  clearAppCacheAndReload();
                }
              }}
              className="w-full py-2 px-3 rounded-xl border border-[var(--bm-line)] hover:border-[var(--bm-accent)]/50 bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] text-xs font-mono text-[var(--bm-accent)] hover:text-[var(--bm-strong)] transition flex items-center justify-center gap-2 cursor-pointer"
              title="Lokalen Speicher leeren und alle Daten frisch von Supabase laden"
              data-testid="btn-clear-cache"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cache leeren & neu laden</span>
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2 px-3 rounded-xl border border-[var(--bm-line)] bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] text-xs font-mono text-[var(--bm-text)] transition flex items-center justify-center gap-2"
              data-testid="btn-logout"
            >
              <LogOut className="w-3.5 h-3.5 text-[var(--bm-text-3)]" />
              <span>Ausloggen</span>
            </button>

            {/* Delete Account Section (AC-7) */}
            {!isDeleting ? (
              <button
                type="button"
                onClick={() => setIsDeleting(true)}
                className="w-full py-2 px-3 rounded-xl border border-[var(--bm-danger)]/40 hover:border-[var(--bm-danger)] bg-[var(--bm-danger)]/10 hover:bg-[var(--bm-danger)]/20 text-xs font-mono text-[var(--bm-danger)] transition flex items-center justify-center gap-2"
                data-testid="btn-delete-account-trigger"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Account löschen</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-danger)] space-y-2.5 animate-in fade-in duration-150" data-testid="delete-account-confirmation">
                <div className="flex items-start gap-2 text-xs font-mono text-[var(--bm-danger)]">
                  <AlertTriangle className="w-4 h-4 text-[var(--bm-danger)] shrink-0 mt-0.5" />
                  <span>
                    Bist du sicher? Alle deine Begehungen und Bewertungen werden unwiderruflich gelöscht.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleting(false)}
                    className="flex-1 py-1.5 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] text-[var(--bm-text-2)] hover:text-[var(--bm-text)] text-xs font-mono transition"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteAccount();
                      onClose();
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-[var(--bm-danger)] hover:bg-[var(--bm-danger)] text-[var(--bm-on-accent)] text-xs font-mono font-bold transition"
                    data-testid="btn-confirm-delete-account"
                  >
                    Ja, unwiderruflich löschen
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
