import React from 'react';
import { AppMode, UserRoleInfo } from '../lib/roleService';
import { Mountain, Wrench, Building2, ChevronRight, X, Shield } from 'lucide-react';

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
        className="bg-[var(--bm-surface)] border border-[var(--bm-line)] rounded-xl max-w-xl w-full p-5 sm:p-8 relative my-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 min-w-[44px] min-h-[44px] p-2.5 rounded-xl text-[var(--bm-text-2)] hover:text-[var(--bm-text)] bg-[var(--bm-elevated)]/80 sm:bg-transparent hover:bg-[var(--bm-elevated)] transition flex items-center justify-center border border-[var(--bm-line)] sm:border-transparent"
            title="Schließen & Abbrechen"
            aria-label="Schließen"
            data-testid="role-gateway-close-btn"
          >
            <X className="w-5 h-5 text-[var(--bm-text)] sm:text-[var(--bm-text-3)] sm:hover:text-[var(--bm-text)]" />
          </button>
        )}

        {/* Header */}
        <div className="mb-6 text-center sm:text-left">
          <h2 className="text-2xl font-headline font-bold text-[var(--bm-text)]">
            Arbeitsbereich wählen
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[var(--bm-text-2)] mt-1">
            Hallo <span className="text-[var(--bm-text)] font-bold">{nickname}</span>!
          </p>
        </div>

        {/* Options Grid */}
        <div className="space-y-3.5">
          {/* 1. Kletterer-App */}
          <button
            type="button"
            data-testid="role-gateway-climber-btn"
            onClick={() => onSelectMode('climber')}
            className={`w-full p-4 sm:p-5 rounded-xl border text-left transition group flex items-center justify-between gap-4 ${
              currentMode === 'climber'
                ? 'bg-[var(--bm-elevated)] border-[var(--bm-strong)]'
                : 'bg-[var(--bm-bg)] border-[var(--bm-line)] hover:border-[var(--bm-text-2)] hover:bg-[var(--bm-surface)]'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[var(--bm-surface)] border border-[var(--bm-line)] text-[var(--bm-strong)] flex items-center justify-center shrink-0">
                <Mountain className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-headline font-bold text-[var(--bm-text)] group-hover:text-[var(--bm-strong)] transition">
                    Kletterer-App
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-xl bg-[var(--bm-elevated)] text-[var(--bm-text-2)] border border-[var(--bm-line)]">
                    Standard
                  </span>
                </div>
                <p className="text-xs font-sans text-[var(--bm-text-2)] mt-1 leading-relaxed">
                  Wand und Logbuch
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--bm-text-3)] group-hover:text-[var(--bm-strong)] group-hover:translate-x-0.5 transition shrink-0" />
          </button>

          {/* 2. Schrauber-Studio */}
          {roleInfo.canAccessSetterStudio ? (
            <button
              type="button"
              data-testid="role-gateway-setter-btn"
              onClick={() => onSelectMode('setter')}
              className={`w-full p-4 sm:p-5 rounded-xl border text-left transition group flex items-center justify-between gap-4 ${
                currentMode === 'setter'
                  ? 'bg-[var(--bm-elevated)] border-[var(--bm-strong)]'
                  : 'bg-[var(--bm-bg)] border-[var(--bm-line)] hover:border-[var(--bm-text-2)] hover:bg-[var(--bm-surface)]'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[var(--bm-surface)] border border-[var(--bm-line)] text-[var(--bm-accent)] flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-headline font-bold text-[var(--bm-text)] group-hover:text-[var(--bm-strong)] transition">
                      Schrauber-Studio
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-xl bg-[var(--bm-elevated)] text-[var(--bm-accent)] border border-[var(--bm-accent)]/40 font-bold">
                      Schrauber
                    </span>
                  </div>
                  <p className="text-xs font-sans text-[var(--bm-text-2)] mt-1 leading-relaxed">
                    Routen setzen und umschrauben
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--bm-text-3)] group-hover:text-[var(--bm-strong)] group-hover:translate-x-0.5 transition shrink-0" />
            </button>
          ) : (
            <div className="w-full p-4 rounded-xl border border-[var(--bm-surface)] bg-[var(--bm-bg)]/50 opacity-40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--bm-surface)] border border-[var(--bm-surface)] flex items-center justify-center text-[var(--bm-text-3)]">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-headline font-bold text-[var(--bm-text-3)]">
                    Schrauber-Studio (Gesperrt)
                  </h4>
                  <span className="text-[11px] font-mono text-[var(--bm-text-3)]">
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
              data-testid="role-gateway-admin-btn"
              className={`w-full p-4 sm:p-5 rounded-xl border text-left transition group flex items-center justify-between gap-4 ${
                currentMode === 'admin'
                  ? 'bg-[var(--bm-elevated)] border-[var(--bm-strong)]'
                  : 'bg-[var(--bm-bg)] border-[var(--bm-line)] hover:border-[var(--bm-text-2)] hover:bg-[var(--bm-surface)]'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[var(--bm-surface)] border border-[var(--bm-line)] text-[var(--bm-accent)] flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-headline font-bold text-[var(--bm-text)] group-hover:text-[var(--bm-strong)] transition">
                      Hallen-Administration
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-xl bg-[var(--bm-elevated)] text-[var(--bm-accent)] border border-[var(--bm-accent)]/40 font-bold flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  </div>
                  <p className="text-xs font-sans text-[var(--bm-text-2)] mt-1 leading-relaxed">
                    Sektoren, Farben, Team
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--bm-text-3)] group-hover:text-[var(--bm-strong)] group-hover:translate-x-0.5 transition shrink-0" />
            </button>
          ) : (
            <div className="w-full p-4 rounded-xl border border-[var(--bm-surface)] bg-[var(--bm-bg)]/50 opacity-40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--bm-surface)] border border-[var(--bm-surface)] flex items-center justify-center text-[var(--bm-text-3)]">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-headline font-bold text-[var(--bm-text-3)]">
                    Hallen-Administration (Gesperrt)
                  </h4>
                  <span className="text-[11px] font-mono text-[var(--bm-text-3)]">
                    Erfordert Administrator-Rechte für eine Halle.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-[var(--bm-line)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[var(--bm-text-3)]">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-1 rounded-xl border border-[var(--bm-line)] sm:border-transparent bg-[var(--bm-elevated)] sm:bg-transparent text-[var(--bm-text)] sm:text-[var(--bm-text-2)] hover:text-[var(--bm-text)] text-xs font-bold transition text-center"
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
