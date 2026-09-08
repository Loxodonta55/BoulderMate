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

  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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
      <div className="w-full max-w-md bg-[#1E1E1E] border border-[#333333] rounded-none overflow-hidden my-4 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#333333] bg-[#1E1E1E] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-mono text-[#A89F91] hover:text-[#E8E0D4] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zurück</span>
          </button>

          <h2 className="text-sm font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
            Einstellungen
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[2px] text-[#6B6358] hover:text-[#E8E0D4] hover:bg-[#2A2A2A] transition"
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
              <div className="w-20 h-20 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={nickname} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-mono font-bold text-[#F5F0E8]">
                    {nickname.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label
                htmlFor="avatar-file-input"
                className="absolute bottom-0 right-0 p-1.5 rounded-none bg-[#2A2A2A] border border-[#333333] text-[#F5F0E8] cursor-pointer hover:bg-[#333333] transition"
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
                className="text-xs font-mono text-[#C9A96E] hover:underline cursor-pointer"
              >
                {isProcessingImage ? 'Wird optimiert...' : 'Foto hochladen / ändern'}
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="block text-[10px] font-mono text-[#6B6358] hover:text-[#A0522D] mt-0.5 mx-auto"
                >
                  Foto entfernen
                </button>
              )}
            </div>
          </div>

          {/* Nickname Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A89F91] uppercase tracking-wider block">
              Nickname
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#6B6358] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="Dein Kletter-Name"
                required
                className="w-full pl-9 pr-3 py-2 rounded-none bg-[#121212] border border-[#333333] text-sm text-[#E8E0D4] placeholder-[#6B6358] focus:outline-none focus:border-[#C9A96E] transition font-mono"
                data-testid="input-nickname"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={!nickname.trim() || saveSuccess}
            className="w-full py-2.5 rounded-[2px] text-xs font-headline uppercase tracking-wider font-bold bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] transition flex items-center justify-center gap-1.5 disabled:opacity-50"
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
          <div className="border-t border-[#333333] pt-4 space-y-3">
            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2 px-3 rounded-[2px] border border-[#333333] bg-[#2A2A2A] hover:bg-[#333333] text-xs font-mono text-[#E8E0D4] transition flex items-center justify-center gap-2"
              data-testid="btn-logout"
            >
              <LogOut className="w-3.5 h-3.5 text-[#6B6358]" />
              <span>Ausloggen</span>
            </button>

            {/* Delete Account Section (AC-7) */}
            {!isDeleting ? (
              <button
                type="button"
                onClick={() => setIsDeleting(true)}
                className="w-full py-2 px-3 rounded-[2px] border border-[#A0522D]/40 hover:border-[#A0522D] bg-[#A0522D]/10 hover:bg-[#A0522D]/20 text-xs font-mono text-[#A0522D] transition flex items-center justify-center gap-2"
                data-testid="btn-delete-account-trigger"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Account löschen</span>
              </button>
            ) : (
              <div className="p-3 rounded-none bg-[#121212] border border-[#A0522D] space-y-2.5 animate-in fade-in duration-150" data-testid="delete-account-confirmation">
                <div className="flex items-start gap-2 text-xs font-mono text-[#A0522D]">
                  <AlertTriangle className="w-4 h-4 text-[#A0522D] shrink-0 mt-0.5" />
                  <span>
                    Bist du sicher? Alle deine Begehungen und Bewertungen werden unwiderruflich gelöscht.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleting(false)}
                    className="flex-1 py-1.5 rounded-[2px] bg-[#2A2A2A] border border-[#333333] text-[#A89F91] hover:text-[#E8E0D4] text-xs font-mono transition"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteAccount();
                      onClose();
                    }}
                    className="flex-1 py-1.5 rounded-[2px] bg-[#A0522D] hover:bg-[#8B4513] text-[#F5F0E8] text-xs font-mono font-bold transition"
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
