import React from 'react';
import { AppMode, UserRoleInfo } from '../lib/roleService';
import { Mountain, Wrench, Building2, ChevronRight, X, Shield, Sparkles } from 'lucide-react';

interface RoleGatewayModalProps {
  isOpen: boolean;
  nickname: string;
  roleInfo: UserRoleInfo;
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  onClose?: () => void;
}

export const RoleGatewayModal: React.FC<RoleGatewayModalProps> = ({
  isOpen,
  nickname,
  roleInfo,
  currentMode,
  onSelectMode,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 overflow-y-auto p-3 sm:p-6 flex items-start sm:items-center justify-center animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div
        className="bg-[#1E1E1E] border border-[#333333] rounded-none max-w-xl w-full p-5 sm:p-8 relative my-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 min-w-[44px] min-h-[44px] p-2.5 rounded-[2px] text-[#A89F91] hover:text-[#E8E0D4] bg-[#2A2A2A]/80 sm:bg-transparent hover:bg-[#2A2A2A] transition flex items-center justify-center border border-[#333333] sm:border-transparent"
            title="Schließen & Abbrechen"
            aria-label="Schließen"
            data-testid="role-gateway-close-btn"
          >
            <X className="w-5 h-5 text-[#E8E0D4] sm:text-[#6B6358] sm:hover:text-[#E8E0D4]" />
          </button>
        )}

        {/* Header */}
        <div className="mb-6 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-[#2A2A2A] border border-[#333333] text-[#C9A96E] text-xs font-mono uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Berechtigter Zugang • Step 1</span>
          </div>
          <h2 className="text-2xl font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
            Arbeitsbereich wählen
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#A89F91] mt-1">
            Hallo <span className="text-[#E8E0D4] font-bold">{nickname}</span>! In welcher Rolle möchtest du BoulderMate heute nutzen?
          </p>
        </div>

        {/* Options Grid */}
        <div className="space-y-3.5">
          {/* 1. Kletterer-App */}
          <button
            type="button"
            onClick={() => onSelectMode('climber')}
            className={`w-full p-4 sm:p-5 rounded-none border text-left transition group flex items-center justify-between gap-4 ${
              currentMode === 'climber'
                ? 'bg-[#2A2A2A] border-[#F5F0E8]'
                : 'bg-[#121212] border-[#333333] hover:border-[#8B8680] hover:bg-[#1E1E1E]'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-none bg-[#1E1E1E] border border-[#333333] text-[#F5F0E8] flex items-center justify-center shrink-0">
                <Mountain className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-headline font-bold uppercase tracking-wider text-[#E8E0D4] group-hover:text-[#F5F0E8] transition">
                    Kletterer-App
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#2A2A2A] text-[#A89F91] border border-[#333333]">
                    Standard
                  </span>
                </div>
                <p className="text-xs font-sans text-[#A89F91] mt-1 leading-relaxed">
                  Wandansicht & Sektoren erkunden, Boulder-Pins antippen, Begehungen loggen und persönliches Profil einsehen.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6B6358] group-hover:text-[#F5F0E8] group-hover:translate-x-0.5 transition shrink-0" />
          </button>

          {/* 2. Schrauber-Studio */}
          {roleInfo.canAccessSetterStudio ? (
            <button
              type="button"
              onClick={() => onSelectMode('setter')}
              className={`w-full p-4 sm:p-5 rounded-none border text-left transition group flex items-center justify-between gap-4 ${
                currentMode === 'setter'
                  ? 'bg-[#2A2A2A] border-[#F5F0E8]'
                  : 'bg-[#121212] border-[#333333] hover:border-[#8B8680] hover:bg-[#1E1E1E]'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-none bg-[#1E1E1E] border border-[#333333] text-[#C9A96E] flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-headline font-bold uppercase tracking-wider text-[#E8E0D4] group-hover:text-[#F5F0E8] transition">
                      Schrauber-Studio
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#2A2A2A] text-[#C9A96E] border border-[#C9A96E]/40 font-bold">
                      Schrauber
                    </span>
                  </div>
                  <p className="text-xs font-sans text-[#A89F91] mt-1 leading-relaxed">
                    Visuelles Setzen von Routen auf Wandfotos, Farben zuweisen, 5-Achsen-Radar und Batch-Veröffentlichung.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#6B6358] group-hover:text-[#F5F0E8] group-hover:translate-x-0.5 transition shrink-0" />
            </button>
          ) : (
            <div className="w-full p-4 rounded-none border border-[#222222] bg-[#121212]/50 opacity-40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-[#1E1E1E] border border-[#222222] flex items-center justify-center text-[#6B6358]">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-headline font-bold uppercase tracking-wider text-[#6B6358]">
                    Schrauber-Studio (Gesperrt)
                  </h4>
                  <span className="text-[11px] font-mono text-[#6B6358]">
                    Erfordert Schrauber-Rolle in mindestens einer Halle.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3. Hallen-Administration */}
          {roleInfo.canAccessAdminConsole ? (
            <button
              type="button"
              onClick={() => onSelectMode('admin')}
              className={`w-full p-4 sm:p-5 rounded-none border text-left transition group flex items-center justify-between gap-4 ${
                currentMode === 'admin'
                  ? 'bg-[#2A2A2A] border-[#F5F0E8]'
                  : 'bg-[#121212] border-[#333333] hover:border-[#8B8680] hover:bg-[#1E1E1E]'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-none bg-[#1E1E1E] border border-[#333333] text-[#C9A96E] flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-headline font-bold uppercase tracking-wider text-[#E8E0D4] group-hover:text-[#F5F0E8] transition">
                      Hallen-Administration
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#2A2A2A] text-[#C9A96E] border border-[#C9A96E]/40 font-bold flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  </div>
                  <p className="text-xs font-sans text-[#A89F91] mt-1 leading-relaxed">
                    Hallenstammdaten, hallenspezifische Farbsysteme / Font-Bänder und Sektoren mit Wandfotos anlegen.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#6B6358] group-hover:text-[#F5F0E8] group-hover:translate-x-0.5 transition shrink-0" />
            </button>
          ) : (
            <div className="w-full p-4 rounded-none border border-[#222222] bg-[#121212]/50 opacity-40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-[#1E1E1E] border border-[#222222] flex items-center justify-center text-[#6B6358]">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-headline font-bold uppercase tracking-wider text-[#6B6358]">
                    Hallen-Administration (Gesperrt)
                  </h4>
                  <span className="text-[11px] font-mono text-[#6B6358]">
                    Erfordert Administrator-Rechte für eine Halle.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-[#333333] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#6B6358]">
          <span className="text-center sm:text-left text-[11px]">
            Du kannst deinen Arbeitsbereich jederzeit oben rechts wechseln.
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-1 rounded-none border border-[#444444] sm:border-transparent bg-[#2A2A2A] sm:bg-transparent text-[#E8E0D4] sm:text-[#A89F91] hover:text-[#E8E0D4] uppercase tracking-wider text-xs font-bold transition text-center"
              data-testid="role-gateway-cancel-btn"
            >
              Abbrechen & Zurück
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
