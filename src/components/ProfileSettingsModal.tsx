import React, { useState } from 'react';
import { UserProfile } from '../types/boulder';
import { X, ArrowLeft, Camera, User, LogOut, Trash2, Check, AlertTriangle } from 'lucide-react';
import { processLocalImageFile } from '../lib/imageUtils';

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
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121110]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#181614] border border-[#38332e] rounded-2xl shadow-2xl overflow-hidden my-4 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#38332e] bg-[#141210] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-mono text-[#a89f91] hover:text-[#f4efe6] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zurück</span>
          </button>

          <h2 className="text-sm font-headline uppercase tracking-wider text-[#f4efe6]">
            Einstellungen
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#78716c] hover:text-[#f4efe6] hover:bg-[#221f1c] transition"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-[#221f1c] border-2 border-[#d97706]/60 flex items-center justify-center overflow-hidden shadow-md">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={nickname} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-headline font-bold text-[#f59e0b]">
                    {nickname.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label
                htmlFor="avatar-file-input"
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#d97706] text-[#121110] cursor-pointer hover:bg-[#b45309] transition shadow"
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
                className="text-xs font-mono text-[#d97706] hover:underline cursor-pointer"
              >
                {isProcessingImage ? 'Wird optimiert...' : 'Foto hochladen / ändern'}
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="block text-[10px] font-mono text-[#78716c] hover:text-red-400 mt-0.5 mx-auto"
                >
                  Foto entfernen
                </button>
              )}
            </div>
          </div>

          {/* Nickname Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#a89f91] uppercase tracking-wider block">
              Nickname
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#78716c] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="Dein Kletter-Name"
                required
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121110] border border-[#38332e] text-sm text-[#f4efe6] placeholder-[#78716c] focus:outline-none focus:border-[#d97706] transition"
                data-testid="input-nickname"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={!nickname.trim() || saveSuccess}
            className="w-full py-2.5 rounded-xl text-xs font-headline uppercase tracking-wider font-bold bg-[#d97706] hover:bg-[#b45309] text-[#121110] transition shadow flex items-center justify-center gap-1.5 disabled:opacity-50"
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
          <div className="border-t border-[#2a2622] pt-4 space-y-3">
            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2 px-3 rounded-xl border border-[#38332e] bg-[#141210] hover:bg-[#221f1c] text-xs font-mono text-[#d4cdc3] hover:text-[#f4efe6] transition flex items-center justify-center gap-2"
              data-testid="btn-logout"
            >
              <LogOut className="w-3.5 h-3.5 text-[#78716c]" />
              <span>Ausloggen</span>
            </button>

            {/* Delete Account Section (AC-7) */}
            {!isDeleting ? (
              <button
                type="button"
                onClick={() => setIsDeleting(true)}
                className="w-full py-2 px-3 rounded-xl border border-red-900/30 hover:border-red-600/50 bg-red-950/10 hover:bg-red-950/25 text-xs font-mono text-red-400 hover:text-red-300 transition flex items-center justify-center gap-2"
                data-testid="btn-delete-account-trigger"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Account löschen</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-red-950/20 border border-red-800/50 space-y-2.5 animate-in fade-in duration-150" data-testid="delete-account-confirmation">
                <div className="flex items-start gap-2 text-xs font-mono text-red-300">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>
                    Bist du sicher? Alle deine Begehungen und Bewertungen werden unwiderruflich gelöscht.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleting(false)}
                    className="flex-1 py-1.5 rounded-lg bg-[#221f1c] text-[#a89f91] hover:text-[#f4efe6] text-xs font-mono transition"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteAccount();
                      onClose();
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold transition shadow"
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
